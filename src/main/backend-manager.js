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

const STARTUP_TIMEOUT_MS = 12_000;

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

  getBackendCommand() {
    if (this.isDev()) {
      return {
        cmd: 'python',
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
        cwd: path.join(__dirname, '../backend'),
      };
    }
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

        socket.once('connect', () => {
          socket.destroy();
          resolve(true);
        });

        socket.once('error', () => {
          socket.destroy();
          if (Date.now() - start > timeoutMs) {
            reject(new Error(ERROR_IDS.BACKEND_TIMEOUT));
          } else {
            setTimeout(tryConnect, 300);
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
      return {
        ok: true,
        running: true,
        port: this.port,
        errorId: null,
      };
    }

    const online = await this.checkInternet();
    if (!online) {
      return {
        ok: false,
        running: false,
        port: null,
        errorId: ERROR_IDS.NO_INTERNET,
      };
    }

    try {
      this.port = await this.findFreePort();

      const { cmd, args, cwd } = this.getBackendCommand();

      this.log.info('Starting backend:', cmd);

      const proc = spawn(cmd, args, {
        cwd,
        env: {
          ...process.env,
          ENV: this.isDev() ? 'development' : 'production',
          BACKEND_PORT: String(this.port),
          DATA_DIR: app.getPath('userData'),
        },
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      this.process = proc;

      proc.stdout.on('data', (data) => {
        this.log.info('[BACKEND]', data.toString().trim());
      });

      proc.stderr.on('data', (err) => {
        this.log.error('[BACKEND ERROR]', err.toString());
      });

      proc.on('exit', (code) => {
        this.log.error('Backend exited', code);
        this.running = false;
        this.process = null;
      });

      // 🔒 WAIT UNTIL SERVER IS ACTUALLY READY
      await this.waitForBackendReady(this.port, STARTUP_TIMEOUT_MS);

      this.running = true;
      this.store.set('backend.port', this.port);

      return {
        ok: true,
        running: true,
        port: this.port,
        errorId: null,
      };
    } catch (err) {
      this.log.error('Backend start failed', err);

      this.running = false;
      this.port = null;

      if (this.process) {
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
      this.process.kill();
      this.process = null;
    }

    this.running = false;
    this.port = null;
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
