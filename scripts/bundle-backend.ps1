$ErrorActionPreference = 'Stop'

Write-Host 'Bundling Python backend for Windows...' -ForegroundColor Cyan

$PYTHON_VERSION = '3.12.9'
$PYTHON_MAJOR_MINOR = '312'
$BACKEND_DIR = 'src/backend'
$RUNTIME_DIR = 'resources/python-runtime'
$PROJECT_ROOT = Split-Path -Parent $PSScriptRoot
$FULL_RUNTIME_PATH = Join-Path $PROJECT_ROOT $RUNTIME_DIR
$PYTHON_DIR = Join-Path $FULL_RUNTIME_PATH 'python'
$PYTHON_ZIP = Join-Path $FULL_RUNTIME_PATH 'python.zip'
$REQUIREMENTS_PATH = Join-Path $PROJECT_ROOT "$BACKEND_DIR\requirements.txt"

if (-not (Test-Path $REQUIREMENTS_PATH)) {
    throw "requirements.txt not found at $REQUIREMENTS_PATH"
}

Write-Host 'Cleaning previous runtime...' -ForegroundColor Yellow
if (Test-Path $FULL_RUNTIME_PATH) {
    Remove-Item -LiteralPath $FULL_RUNTIME_PATH -Recurse -Force
}
New-Item -ItemType Directory -Force -Path $FULL_RUNTIME_PATH | Out-Null

$PYTHON_URL = "https://www.python.org/ftp/python/$PYTHON_VERSION/python-$PYTHON_VERSION-embed-amd64.zip"
Write-Host "Downloading embeddable Python from $PYTHON_URL" -ForegroundColor Cyan
Invoke-WebRequest -Uri $PYTHON_URL -OutFile $PYTHON_ZIP -UseBasicParsing

Write-Host 'Extracting Python runtime...' -ForegroundColor Cyan
Expand-Archive -Path $PYTHON_ZIP -DestinationPath $PYTHON_DIR -Force
Remove-Item -LiteralPath $PYTHON_ZIP -Force

$PTH_FILE = Join-Path $PYTHON_DIR "python$PYTHON_MAJOR_MINOR._pth"
if (Test-Path $PTH_FILE) {
    $content = Get-Content $PTH_FILE
    $content = $content -replace '#import site', 'import site'
    $content = $content -replace '# import site', 'import site'
    Set-Content -Path $PTH_FILE -Value $content -Encoding UTF8
} else {
    @"
python$PYTHON_MAJOR_MINOR.zip
.
import site
"@ | Set-Content -Path $PTH_FILE -Encoding UTF8
}

$pythonExe = Join-Path $PYTHON_DIR 'python.exe'
$GET_PIP_PATH = Join-Path $PYTHON_DIR 'get-pip.py'

Write-Host 'Installing pip...' -ForegroundColor Cyan
Invoke-WebRequest -Uri 'https://bootstrap.pypa.io/get-pip.py' -OutFile $GET_PIP_PATH -UseBasicParsing
Push-Location $PYTHON_DIR
& $pythonExe get-pip.py --no-warn-script-location
if ($LASTEXITCODE -ne 0) {
    Pop-Location
    throw "pip installation failed with exit code $LASTEXITCODE"
}
Remove-Item -LiteralPath $GET_PIP_PATH -Force
Pop-Location

Write-Host 'Upgrading packaging tooling...' -ForegroundColor Cyan
& $pythonExe -m pip install --upgrade pip setuptools wheel --no-warn-script-location
if ($LASTEXITCODE -ne 0) {
    throw "pip tooling upgrade failed with exit code $LASTEXITCODE"
}

Write-Host 'Installing backend dependencies...' -ForegroundColor Cyan
& $pythonExe -m pip install -r $REQUIREMENTS_PATH --no-warn-script-location
if ($LASTEXITCODE -ne 0) {
    throw "backend dependency installation failed with exit code $LASTEXITCODE"
}

Write-Host 'Installing Playwright Chromium bundle for offline packaging...' -ForegroundColor Cyan
$previousPlaywrightPath = $env:PLAYWRIGHT_BROWSERS_PATH
$env:PLAYWRIGHT_BROWSERS_PATH = '0'
& $pythonExe -m playwright install chromium
if ($LASTEXITCODE -ne 0) {
    if ($null -eq $previousPlaywrightPath) {
        Remove-Item Env:PLAYWRIGHT_BROWSERS_PATH -ErrorAction SilentlyContinue
    } else {
        $env:PLAYWRIGHT_BROWSERS_PATH = $previousPlaywrightPath
    }
    throw "Playwright browser installation failed with exit code $LASTEXITCODE"
}

Write-Host 'Verifying packaged runtime...' -ForegroundColor Cyan
& $pythonExe --version
& $pythonExe -m pip list
& $pythonExe -c "import fastapi, uvicorn, playwright; print('fastapi', fastapi.__version__); print('uvicorn', uvicorn.__version__); print('playwright', playwright.__version__)"
if ($LASTEXITCODE -ne 0) {
    if ($null -eq $previousPlaywrightPath) {
        Remove-Item Env:PLAYWRIGHT_BROWSERS_PATH -ErrorAction SilentlyContinue
    } else {
        $env:PLAYWRIGHT_BROWSERS_PATH = $previousPlaywrightPath
    }
    throw 'Python package verification failed'
}

& $pythonExe -c "from playwright.sync_api import sync_playwright; p = sync_playwright().start(); browser = p.chromium.launch(headless=True); browser.close(); p.stop(); print('playwright browser verified')"
if ($LASTEXITCODE -ne 0) {
    if ($null -eq $previousPlaywrightPath) {
        Remove-Item Env:PLAYWRIGHT_BROWSERS_PATH -ErrorAction SilentlyContinue
    } else {
        $env:PLAYWRIGHT_BROWSERS_PATH = $previousPlaywrightPath
    }
    throw 'Playwright browser verification failed'
}

if ($null -eq $previousPlaywrightPath) {
    Remove-Item Env:PLAYWRIGHT_BROWSERS_PATH -ErrorAction SilentlyContinue
} else {
    $env:PLAYWRIGHT_BROWSERS_PATH = $previousPlaywrightPath
}

Write-Host ''
Write-Host 'Bundle complete.' -ForegroundColor Green
Write-Host "Python runtime bundled at: $PYTHON_DIR" -ForegroundColor Green
Write-Host 'Next step: run npm run build:win' -ForegroundColor White
