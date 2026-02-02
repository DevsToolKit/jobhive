// backend-manager.js
const { spawn } = require('child_process');
const net = require('net');
const dns = require('dns');
const path = require('path');
const fs = require('fs');
const { app } = require('electron');

const ERROR_IDS = {
  NONE: null,
  NO_INTERNET: 'NO_INTERNET',
  NO_FREE_PORT: 'NO_FREE_PORT',
  BACKEND_START_FAILED: 'BACKEND_START_FAILED',
  BACKEND_CRASHED: 'BACKEND_CRASHED',
  BACKEND_TIMEOUT: 'BACKEND_TIMEOUT',
};

const STARTUP_TIMEOUT_MS = 15_000;

class BackendManager {
  constructor({ store, log }) {
    this.store = store;
    this.log = log;

    this.process = null;
    this.port = null;
    this.running = false;
  }

  /* ---------------- Environment ---------------- */

  isDev() {
    return !app.isPackaged;
  }

  /**
   * Get paths to Python runtime and backend
   */
  getPaths() {
    if (this.isDev()) {
      return {
        pythonExe: 'python', // Use system Python in dev
        backendDir: path.join(__dirname, '../../backend'),
        mainScript: path.join(__dirname, '../../backend/main.py'),
      };
    }

    // Production: use bundled Python
    const resourcesPath = process.resourcesPath;
    const pythonExe = path.join(resourcesPath, 'python-runtime', 'python', 'python.exe');
    const backendDir = path.join(resourcesPath, 'backend');
    const mainScript = path.join(backendDir, 'main.py');

    this.log.info('Python executable:', pythonExe);
    this.log.info('Backend directory:', backendDir);
    this.log.info('Main script:', mainScript);

    // Verify paths exist
    if (!fs.existsSync(pythonExe)) {
      this.log.error('Python executable not found:', pythonExe);
      throw new Error('Python runtime not found');
    }
    if (!fs.existsSync(backendDir)) {
      this.log.error('Backend directory not found:', backendDir);
      throw new Error('Backend not found');
    }
    if (!fs.existsSync(mainScript)) {
      this.log.error('main.py not found:', mainScript);
      throw new Error('Backend main.py not found');
    }

    return { pythonExe, backendDir, mainScript };
  }

  getBackendCommand() {
    const { pythonExe, backendDir, mainScript } = this.getPaths();

    if (this.isDev()) {
      // Development: use uvicorn directly
      return {
        cmd: pythonExe,
        args: [
          '-m',
          'uvicorn',
          'app:app',
          '--host',
          '127.0.0.1',
          '--port',
          String(this.port),
          '--log-level',
          'info',
        ],
        cwd: backendDir,
      };
    }

    // Production: use main.py as entry point
    return {
      cmd: pythonExe,
      args: [mainScript],
      cwd: backendDir,
    };
  }

  /* ---------------- Utilities ---------------- */

  checkInternet() {
    return new Promise((resolve) => {
      dns.lookup('google.com', (err) => resolve(!err));
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
    for (let p = start; p <= end; p++) {
      if (await this.checkPortFree(p)) return p;
    }
    throw new Error(ERROR_IDS.NO_FREE_PORT);
  }

  waitForBackendReady(port, timeoutMs) {
    const start = Date.now();

    return new Promise((resolve, reject) => {
      const tryConnect = () => {
        const socket = new net.Socket();

        socket.setTimeout(1000);

        socket.once('connect', () => {
          socket.destroy();
          this.log.info('Backend is ready!');
          resolve(true);
        });

        socket.once('error', () => {
          socket.destroy();
          if (Date.now() - start > timeoutMs) {
            this.log.error('Backend startup timeout');
            reject(new Error(ERROR_IDS.BACKEND_TIMEOUT));
          } else {
            setTimeout(tryConnect, 500);
          }
        });

        socket.once('timeout', () => {
          socket.destroy();
          if (Date.now() - start > timeoutMs) {
            this.log.error('Backend startup timeout');
            reject(new Error(ERROR_IDS.BACKEND_TIMEOUT));
          } else {
            setTimeout(tryConnect, 500);
          }
        });

        socket.connect(port, '127.0.0.1');
      };

      tryConnect();
    });
  }

  /* ---------------- Public API ---------------- */

  async start() {
    if (this.running) {
      this.log.info('Backend already running on port', this.port);
      return {
        ok: true,
        running: true,
        port: this.port,
        errorId: null,
      };
    }

    this.log.info('=== STARTING BACKEND ===');
    this.log.info('App is packaged:', !this.isDev());
    this.log.info('Resources path:', process.resourcesPath);
    this.log.info('User data path:', app.getPath('userData'));

    const online = await this.checkInternet();
    this.log.info('Internet check:', online);

    if (!online) {
      this.log.warn('No internet connection detected');
      return {
        ok: false,
        running: false,
        port: null,
        errorId: ERROR_IDS.NO_INTERNET,
      };
    }

    try {
      this.port = await this.findFreePort();
      this.log.info('Found free port:', this.port);

      // Get paths and verify they exist
      let paths;
      try {
        paths = this.getPaths();
        this.log.info('Python paths:', JSON.stringify(paths, null, 2));
      } catch (err) {
        this.log.error('Failed to get paths:', err);
        throw err;
      }

      const { cmd, args, cwd } = this.getBackendCommand();

      this.log.info('=== SPAWN DETAILS ===');
      this.log.info('Command:', cmd);
      this.log.info('Args:', JSON.stringify(args));
      this.log.info('CWD:', cwd);

      const proc = spawn(cmd, args, {
        cwd,
        env: {
          ...process.env,
          ENV: this.isDev() ? 'development' : 'production',
          BACKEND_PORT: String(this.port),
          DATA_DIR: app.getPath('userData'),
          PYTHONPATH: cwd,
          PYTHONUNBUFFERED: '1',
        },
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      this.process = proc;
      let startupMessageReceived = false;

      proc.stdout.on('data', (data) => {
        const output = data.toString().trim();
        this.log.info('[BACKEND STDOUT]', output);

        if (output.includes('Server started on')) {
          startupMessageReceived = true;
          this.log.info('✓ Backend startup message received');
        }
      });

      proc.stderr.on('data', (err) => {
        const errOutput = err.toString().trim();
        this.log.error('[BACKEND STDERR]', errOutput);
      });

      proc.on('exit', (code, signal) => {
        this.log.error(`Backend process exited with code ${code}, signal ${signal}`);
        this.running = false;
        this.process = null;
      });

      proc.on('error', (err) => {
        this.log.error('Backend spawn error:', err);
        this.running = false;
        this.process = null;
      });

      // Wait for backend to be ready
      this.log.info('Waiting for backend to be ready on port', this.port);
      await this.waitForBackendReady(this.port, STARTUP_TIMEOUT_MS);

      this.running = true;
      this.store.set('backend.port', this.port);

      this.log.info('✓ Backend started successfully on port', this.port);

      return {
        ok: true,
        running: true,
        port: this.port,
        errorId: null,
      };
    } catch (err) {
      this.log.error('=== BACKEND START FAILED ===');
      this.log.error('Error:', err.message);
      this.log.error('Stack:', err.stack);

      this.running = false;
      this.port = null;

      if (this.process) {
        this.log.info('Killing failed backend process');
        this.process.kill();
        this.process = null;
      }

      return {
        ok: false,
        running: false,
        port: null,
        errorId:
          err.message === ERROR_IDS.NO_FREE_PORT
            ? ERROR_IDS.NO_FREE_PORT
            : err.message === ERROR_IDS.BACKEND_TIMEOUT
              ? ERROR_IDS.BACKEND_TIMEOUT
              : ERROR_IDS.BACKEND_START_FAILED,
      };
    }
  }

  async stop() {
    if (this.process) {
      this.log.info('Stopping backend...');
      this.process.kill('SIGTERM');

      // Force kill after 5 seconds if still running
      setTimeout(() => {
        if (this.process) {
          this.log.warn('Force killing backend process');
          this.process.kill('SIGKILL');
        }
      }, 5000);

      this.process = null;
    }

    this.running = false;
    this.port = null;
    this.log.info('Backend stopped');
  }

  getStatus() {
    return {
      ok: this.running,
      running: this.running,
      port: this.port,
      errorId: this.running ? null : ERROR_IDS.BACKEND_CRASHED,
    };
  }
}

module.exports = BackendManager;
