const { spawn } = require('child_process');
const dns = require('dns');
const fs = require('fs');
const http = require('http');
const net = require('net');
const path = require('path');
const { app } = require('electron');

const ERROR_IDS = {
  NONE: null,
  NO_INTERNET: 'NO_INTERNET',
  NO_FREE_PORT: 'NO_FREE_PORT',
  BACKEND_START_FAILED: 'BACKEND_START_FAILED',
  BACKEND_CRASHED: 'BACKEND_CRASHED',
  BACKEND_TIMEOUT: 'BACKEND_TIMEOUT',
  BACKEND_FILES_MISSING: 'BACKEND_FILES_MISSING',
  PYTHON_RUNTIME_MISSING: 'PYTHON_RUNTIME_MISSING',
};

const STARTUP_TIMEOUT_MS = 30_000;
const STOP_TIMEOUT_MS = 5_000;
const HEALTH_PATH = '/api/health';
const MAX_LOG_LINES = 50;

class BackendManager {
  constructor({ store, log }) {
    this.store = store;
    this.log = log;

    this.process = null;
    this.port = null;
    this.running = false;
    this.stopping = false;
    this.lastError = null;
    this.stdoutBuffer = [];
    this.stderrBuffer = [];
  }

  isDev() {
    return !app.isPackaged || process.env.NODE_ENV === 'development';
  }

  getLogsPath() {
    return app.getPath('logs');
  }

  createError(id, message, details = {}) {
    const error = new Error(message);
    error.id = id;
    error.details = details;
    return error;
  }

  rememberOutput(target, chunk) {
    const lines = chunk
      .toString()
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (!lines.length) {
      return;
    }

    target.push(...lines);
    if (target.length > MAX_LOG_LINES) {
      target.splice(0, target.length - MAX_LOG_LINES);
    }
  }

  resolvePythonExecutable() {
    if (this.isDev()) {
      return process.env.JOBHIVE_PYTHON_PATH || (process.platform === 'win32' ? 'python' : 'python3');
    }

    const runtimeRoot = path.join(process.resourcesPath, 'python-runtime', 'python');
    return process.platform === 'win32'
      ? path.join(runtimeRoot, 'python.exe')
      : path.join(runtimeRoot, 'bin', 'python3');
  }

  getPaths() {
    const backendDir = this.isDev()
      ? path.join(app.getAppPath(), 'src', 'backend')
      : path.join(process.resourcesPath, 'backend');
    const mainScript = path.join(backendDir, 'main.py');
    const pythonExe = this.resolvePythonExecutable();

    if (!fs.existsSync(backendDir)) {
      throw this.createError(ERROR_IDS.BACKEND_FILES_MISSING, 'Backend directory is missing.', {
        backendDir,
      });
    }

    if (!fs.existsSync(mainScript)) {
      throw this.createError(ERROR_IDS.BACKEND_FILES_MISSING, 'Backend entrypoint main.py is missing.', {
        mainScript,
      });
    }

    if (!this.isDev() && !fs.existsSync(pythonExe)) {
      throw this.createError(ERROR_IDS.PYTHON_RUNTIME_MISSING, 'Bundled Python runtime is missing.', {
        pythonExe,
      });
    }

    return { pythonExe, backendDir, mainScript };
  }

  getBackendCommand() {
    const { pythonExe, backendDir, mainScript } = this.getPaths();

    return {
      cmd: pythonExe,
      args: [mainScript],
      cwd: backendDir,
    };
  }

  checkInternet() {
    return new Promise((resolve) => {
      dns.lookup('google.com', (error) => resolve(!error));
    });
  }

  checkPortFree(port) {
    return new Promise((resolve) => {
      const server = net.createServer();
      server.once('error', () => resolve(false));
      server.once('listening', () => {
        server.close(() => resolve(true));
      });
      server.listen(port, '127.0.0.1');
    });
  }

  async findFreePort(start = 48000, end = 48100) {
    for (let port = start; port <= end; port += 1) {
      if (await this.checkPortFree(port)) {
        return port;
      }
    }

    throw this.createError(ERROR_IDS.NO_FREE_PORT, 'No free backend port was found.');
  }

  async probeHealth(port) {
    return new Promise((resolve) => {
      const request = http.get(
        {
          host: '127.0.0.1',
          port,
          path: HEALTH_PATH,
          timeout: 1500,
        },
        (response) => {
          response.resume();
          resolve(response.statusCode === 200);
        }
      );

      request.once('error', () => resolve(false));
      request.once('timeout', () => {
        request.destroy();
        resolve(false);
      });
    });
  }

  waitForBackendReady(port, timeoutMs) {
    const startedAt = Date.now();

    return new Promise((resolve, reject) => {
      const probe = async () => {
        const ready = await this.probeHealth(port);
        if (ready) {
          resolve(true);
          return;
        }

        if (Date.now() - startedAt >= timeoutMs) {
          reject(
            this.createError(ERROR_IDS.BACKEND_TIMEOUT, 'Backend did not become healthy in time.', {
              port,
              stdout: [...this.stdoutBuffer],
              stderr: [...this.stderrBuffer],
            })
          );
          return;
        }

        setTimeout(probe, 500);
      };

      probe();
    });
  }

  buildResult({ ok, error = null } = {}) {
    return {
      ok,
      running: this.running,
      port: this.port,
      errorId: error?.id || null,
      message: error?.message || null,
      details: error?.details || null,
      logsPath: this.getLogsPath(),
      diagnostics: {
        stdout: [...this.stdoutBuffer],
        stderr: [...this.stderrBuffer],
      },
    };
  }

  async start() {
    if (this.running && this.port && (await this.probeHealth(this.port))) {
      this.log.info('Backend already healthy on port', this.port);
      return this.buildResult({ ok: true });
    }

    if (this.process) {
      await this.stop();
    }

    this.lastError = null;
    this.stdoutBuffer = [];
    this.stderrBuffer = [];
    this.stopping = false;

    try {
      this.port = await this.findFreePort();
      const { cmd, args, cwd } = this.getBackendCommand();

      this.log.info('Starting backend', {
        cmd,
        args,
        cwd,
        packaged: app.isPackaged,
        resourcesPath: process.resourcesPath,
      });

      const proc = spawn(cmd, args, {
        cwd,
        windowsHide: true,
        env: {
          ...process.env,
          ENV: this.isDev() ? 'development' : 'production',
          BACKEND_PORT: String(this.port),
          DATA_DIR: app.getPath('userData'),
          PYTHONPATH: cwd,
          PYTHONUNBUFFERED: '1',
          PYTHONIOENCODING: 'utf-8',
          PLAYWRIGHT_BROWSERS_PATH: '0',
        },
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      this.process = proc;

      proc.stdout.on('data', (chunk) => {
        this.rememberOutput(this.stdoutBuffer, chunk);
        this.log.info('[BACKEND STDOUT]', chunk.toString().trim());
      });

      proc.stderr.on('data', (chunk) => {
        this.rememberOutput(this.stderrBuffer, chunk);
        this.log.error('[BACKEND STDERR]', chunk.toString().trim());
      });

      proc.on('exit', (code, signal) => {
        this.log.warn(`Backend process exited with code ${code}, signal ${signal}`);

        if (!this.stopping) {
          this.lastError = this.createError(
            ERROR_IDS.BACKEND_CRASHED,
            'Backend process exited unexpectedly.',
            {
              code,
              signal,
              stdout: [...this.stdoutBuffer],
              stderr: [...this.stderrBuffer],
            }
          );
        }

        this.running = false;
        this.process = null;
        this.port = null;
      });

      proc.on('error', (error) => {
        this.log.error('Backend spawn error', error);
        this.lastError = this.createError(
          ERROR_IDS.BACKEND_START_FAILED,
          `Failed to spawn backend: ${error.message}`,
          { cause: error.message }
        );
      });

      await new Promise((resolve, reject) => {
        let settled = false;

        const finish = (callback) => (value) => {
          if (settled) {
            return;
          }

          settled = true;
          callback(value);
        };

        const resolveOnce = finish(resolve);
        const rejectOnce = finish(reject);

        const onExit = (code, signal) => {
          rejectOnce(
            this.createError(
              ERROR_IDS.BACKEND_START_FAILED,
              'Backend exited before it became ready.',
              {
                code,
                signal,
                stdout: [...this.stdoutBuffer],
                stderr: [...this.stderrBuffer],
              }
            )
          );
        };

        const onError = (error) => {
          rejectOnce(
            this.createError(
              ERROR_IDS.BACKEND_START_FAILED,
              `Backend failed to start: ${error.message}`,
              { cause: error.message }
            )
          );
        };

        proc.once('exit', onExit);
        proc.once('error', onError);

        this.waitForBackendReady(this.port, STARTUP_TIMEOUT_MS)
          .then(() => {
            proc.off('exit', onExit);
            proc.off('error', onError);
            resolveOnce(true);
          })
          .catch((error) => {
            proc.off('exit', onExit);
            proc.off('error', onError);
            rejectOnce(error);
          });
      });

      this.running = true;
      this.store.set('backend.port', this.port);
      this.store.set('backend.lastStartedAt', new Date().toISOString());
      this.log.info('Backend started successfully on port', this.port);

      return this.buildResult({ ok: true });
    } catch (error) {
      const normalizedError =
        error instanceof Error ? error : this.createError(ERROR_IDS.BACKEND_START_FAILED, String(error));

      this.lastError = normalizedError;
      this.running = false;

      if (this.process) {
        await this.stop();
      }

      return this.buildResult({ ok: false, error: normalizedError });
    }
  }

  async stop() {
    if (!this.process) {
      this.running = false;
      this.port = null;
      return;
    }

    const proc = this.process;
    this.process = null;
    this.running = false;
    this.stopping = true;

    await new Promise((resolve) => {
      let settled = false;
      const done = () => {
        if (settled) {
          return;
        }

        settled = true;
        resolve(true);
      };

      proc.once('exit', () => {
        done();
      });

      try {
        proc.kill('SIGTERM');
      } catch (error) {
        this.log.warn('Failed to send SIGTERM to backend', error);
        done();
      }

      setTimeout(() => {
        if (settled) {
          return;
        }

        try {
          proc.kill('SIGKILL');
        } catch (error) {
          this.log.warn('Failed to force kill backend', error);
        }

        done();
      }, STOP_TIMEOUT_MS);
    });

    this.port = null;
    this.stopping = false;
    this.log.info('Backend stopped');
  }

  getStatus() {
    return this.buildResult({ ok: this.running, error: this.lastError });
  }
}

module.exports = BackendManager;
module.exports.ERROR_IDS = ERROR_IDS;
