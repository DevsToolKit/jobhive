const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

function getPythonExecutable() {
  if (process.env.JOBHIVE_PYTHON_PATH) {
    return process.env.JOBHIVE_PYTHON_PATH;
  }

  const venvPython =
    process.platform === 'win32'
      ? path.join(__dirname, '..', '.venv', 'Scripts', 'python.exe')
      : path.join(__dirname, '..', '.venv', 'bin', 'python');

  if (fs.existsSync(venvPython)) {
    return venvPython;
  }

  return process.platform === 'win32' ? 'python' : 'python3';
}

const pythonExe = getPythonExecutable();
const args = process.argv.slice(2);

const child = spawn(pythonExe, args, {
  stdio: 'inherit',
  shell: false,
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
  } else {
    process.exit(code ?? 0);
  }
});
