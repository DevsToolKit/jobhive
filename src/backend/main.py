import os
import signal
import subprocess
import sys
from pathlib import Path


def require_env(name: str) -> str:
    value = os.getenv(name)
    if not value:
        print(f"ERROR: Required env var '{name}' not set by Electron", file=sys.stderr, flush=True)
        sys.exit(1)
    return value


def terminate_process(process: subprocess.Popen) -> int:
    if process.poll() is not None:
        return process.returncode or 0

    process.terminate()
    try:
        return process.wait(timeout=10)
    except subprocess.TimeoutExpired:
        process.kill()
        return process.wait(timeout=5)


def main() -> None:
    env_type = require_env('ENV')
    port = require_env('BACKEND_PORT')
    data_dir = require_env('DATA_DIR')

    print(f'Starting JobHive Backend in {env_type} mode', flush=True)
    print(f'Data directory: {data_dir}', flush=True)

    backend_root = Path(__file__).parent.resolve()
    env = os.environ.copy()
    env['PYTHONPATH'] = str(backend_root)

    cmd = [
        sys.executable,
        '-m',
        'uvicorn',
        'app:app',
        '--host',
        '127.0.0.1',
        '--port',
        port,
        '--log-level',
        'info',
        '--no-access-log',
    ]

    process = subprocess.Popen(cmd, cwd=str(backend_root), env=env)
    print(f'Server starting on http://127.0.0.1:{port}', flush=True)

    def signal_handler(signum, _frame):
        print(f'Received shutdown signal ({signum}), stopping backend...', flush=True)
        exit_code = terminate_process(process)
        sys.exit(exit_code)

    signal.signal(signal.SIGTERM, signal_handler)
    signal.signal(signal.SIGINT, signal_handler)

    try:
        sys.exit(process.wait())
    except KeyboardInterrupt:
        print('Keyboard interrupt received, stopping backend...', flush=True)
        sys.exit(terminate_process(process))


if __name__ == '__main__':
    main()
