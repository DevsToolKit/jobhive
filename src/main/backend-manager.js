const { spawn } = require('child_process');
const path = require('path');
const net = require('net');
const { app } = require('electron');
const log = require('electron-log');

class BackendManager {
  constructor() {
    this.backendProcess = null;
    this.port = null;
    this.isReady = false;
    this.retryCount = 0;
    this.maxRetries = 3;
  }

  /**
   * Get path to Python executable
   */
  getPythonPath() {
    const isDev = !app.isPackaged;

    if (isDev) {
      // In development, use system Python
      return process.platform === 'win32' ? 'python' : 'python3';
    }

    // In production, use bundled Python
    const platform = process.platform;
    let execName;

    if (platform === 'win32') {
      execName = 'python-runtime-win.exe';
    } else if (platform === 'darwin') {
      execName = 'python-runtime-mac';
    } else {
      execName = 'python-runtime-linux';
    }

    return path.join(process.resourcesPath, 'python-runtime', execName);
  }

  /**
   * Get path to backend script
   */
  getBackendPath() {
    const isDev = !app.isPackaged;

    if (isDev) {
      return path.join(__dirname, '../backend/main.py');
    }

    return path.join(process.resourcesPath, 'backend', 'main.py');
  }

  /**
   * Find an available port
   */
  async findAvailablePort(startPort = 8765) {
    return new Promise((resolve, reject) => {
      const server = net.createServer();

      server.listen(startPort, () => {
        const { port } = server.address();
        server.close(() => resolve(port));
      });

      server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          resolve(this.findAvailablePort(startPort + 1));
        } else {
          reject(err);
        }
      });
    });
  }

  /**
   * Start the Python backend
   */
  async start() {
    try {
      // Find available port
      this.port = await this.findAvailablePort(8765);

      log.info(`Starting backend on port ${this.port}`);

      const pythonPath = this.getPythonPath();
      const backendPath = this.getBackendPath();

      log.info(`Python path: ${pythonPath}`);
      log.info(`Backend path: ${backendPath}`);

      // Spawn Python process
      this.backendProcess = spawn(pythonPath, [backendPath], {
        env: {
          ...process.env,
          BACKEND_PORT: this.port.toString(),
          PYTHONUNBUFFERED: '1',
          DATA_DIR: app.isPackaged
            ? path.join(app.getPath('userData'), 'data')
            : path.join(__dirname, '../data'),
          ENV: app.isPackaged ? 'production' : 'development',
        },
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      // Handle stdout
      this.backendProcess.stdout.on('data', (data) => {
        const output = data.toString();
        log.info(`[Backend] ${output}`);

        if (output.includes('Server started on')) {
          this.isReady = true;
          log.info('Backend is ready!');
        }
      });

      // Handle stderr
      this.backendProcess.stderr.on('data', (data) => {
        log.error(`[Backend Error] ${data.toString()}`);
      });

      // Handle process exit
      this.backendProcess.on('close', (code) => {
        log.warn(`Backend process exited with code ${code}`);
        this.isReady = false;

        // Auto-restart on crash (with limit)
        if (code !== 0 && this.retryCount < this.maxRetries) {
          this.retryCount++;
          log.info(`Attempting to restart backend (${this.retryCount}/${this.maxRetries})...`);
          setTimeout(() => this.start(), 2000);
        }
      });

      // Wait for backend to be ready
      await this.waitForReady(15000);

      log.info('Backend started successfully');

      return {
        port: this.port,
        baseUrl: `http://localhost:${this.port}`,
      };
    } catch (error) {
      log.error('Failed to start backend:', error);
      throw error;
    }
  }

  /**
   * Wait for backend to be ready
   */
  async waitForReady(timeout = 10000) {
    const startTime = Date.now();

    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(() => {
        if (this.isReady) {
          clearInterval(checkInterval);
          resolve();
        }

        if (Date.now() - startTime > timeout) {
          clearInterval(checkInterval);
          reject(new Error('Backend startup timeout'));
        }
      }, 100);
    });
  }

  /**
   * Stop the Python backend
   */
  async stop() {
    if (this.backendProcess) {
      log.info('Stopping backend...');
      this.backendProcess.kill();
      this.backendProcess = null;
      this.isReady = false;
    }
  }

  /**
   * Health check
   */
  async healthCheck() {
    if (!this.isReady) {
      return false;
    }

    try {
      const response = await fetch(`http://localhost:${this.port}/health`);
      return response.ok;
    } catch (error) {
      log.error('Health check failed:', error);
      return false;
    }
  }

  /**
   * Get backend info
   */
  getInfo() {
    return {
      isReady: this.isReady,
      port: this.port,
      baseUrl: this.port ? `http://localhost:${this.port}` : null,
    };
  }
}

module.exports = BackendManager;
