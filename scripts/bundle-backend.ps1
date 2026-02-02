# bundle-backend.ps1 - Bundles Python runtime and backend for Windows

$ErrorActionPreference = "Stop"

Write-Host "Python Bundling Python backend for Windows..." -ForegroundColor Cyan

$PYTHON_VERSION = "3.12.9"
$PYTHON_MAJOR_MINOR = "312"
$BACKEND_DIR = "src/backend"
$RESOURCES_DIR = "resources/python-runtime"

# Get project root (parent of scripts folder)
$PROJECT_ROOT = Split-Path -Parent $PSScriptRoot

# Clean previous builds
Write-Host "Cleaning previous builds..." -ForegroundColor Yellow
$FULL_RESOURCES_PATH = Join-Path $PROJECT_ROOT $RESOURCES_DIR
if (Test-Path $FULL_RESOURCES_PATH) {
    Remove-Item -Recurse -Force $FULL_RESOURCES_PATH
}
New-Item -ItemType Directory -Force -Path $FULL_RESOURCES_PATH | Out-Null

# Download Python embeddable package for Windows
Write-Host "Downloading Python embeddable package..." -ForegroundColor Cyan
$PYTHON_URL = "https://www.python.org/ftp/python/$PYTHON_VERSION/python-$PYTHON_VERSION-embed-amd64.zip"
$PYTHON_ZIP = Join-Path $FULL_RESOURCES_PATH "python.zip"

Write-Host "URL: $PYTHON_URL" -ForegroundColor Gray
Write-Host "Destination: $PYTHON_ZIP" -ForegroundColor Gray

try {
    Invoke-WebRequest -Uri $PYTHON_URL -OutFile $PYTHON_ZIP -UseBasicParsing
    Write-Host "Download complete!" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Failed to download Python" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

# Verify download
if (-not (Test-Path $PYTHON_ZIP)) {
    Write-Host "ERROR: Python zip file not found after download" -ForegroundColor Red
    exit 1
}

$zipSize = (Get-Item $PYTHON_ZIP).Length / 1MB
Write-Host "Downloaded file size: $([math]::Round($zipSize, 2)) MB" -ForegroundColor Gray

# Extract Python
Write-Host "Extracting Python runtime..." -ForegroundColor Cyan
$PYTHON_DIR = Join-Path $FULL_RESOURCES_PATH "python"
try {
    Expand-Archive -Path $PYTHON_ZIP -DestinationPath $PYTHON_DIR -Force
    Remove-Item $PYTHON_ZIP
    Write-Host "Extraction complete!" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Failed to extract Python" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

# List extracted files to debug
Write-Host "`nExtracted files:" -ForegroundColor Gray
Get-ChildItem $PYTHON_DIR | Select-Object Name | Format-Table -AutoSize

# Enable site-packages by uncommenting import site in python3xx._pth
Write-Host "Configuring Python runtime..." -ForegroundColor Cyan
$PTH_FILE = Join-Path $PYTHON_DIR "python$PYTHON_MAJOR_MINOR._pth"
Write-Host "Looking for: $PTH_FILE" -ForegroundColor Gray

if (Test-Path $PTH_FILE) {
    Write-Host "Found _pth file, enabling site-packages..." -ForegroundColor Green
    $content = Get-Content $PTH_FILE
    Write-Host "Original content:" -ForegroundColor Gray
    $content | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
    
    $content = $content -replace '#import site', 'import site'
    $content = $content -replace '# import site', 'import site'
    
    Set-Content -Path $PTH_FILE -Value $content
    
    Write-Host "Modified content:" -ForegroundColor Gray
    Get-Content $PTH_FILE | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
    Write-Host "Enabled site-packages support" -ForegroundColor Green
} else {
    Write-Host "WARNING: python$PYTHON_MAJOR_MINOR._pth not found" -ForegroundColor Yellow
    Write-Host "Creating new _pth file..." -ForegroundColor Yellow
    
    # Create a basic _pth file
    $pthContent = @"
python$PYTHON_MAJOR_MINOR.zip
.

# Uncomment to run site.main() automatically
import site
"@
    Set-Content -Path $PTH_FILE -Value $pthContent
    Write-Host "Created _pth file with site-packages enabled" -ForegroundColor Green
}

# Download get-pip.py
Write-Host "`nInstalling pip..." -ForegroundColor Cyan
$GET_PIP_URL = "https://bootstrap.pypa.io/get-pip.py"
$GET_PIP_PATH = Join-Path $PYTHON_DIR "get-pip.py"

try {
    Invoke-WebRequest -Uri $GET_PIP_URL -OutFile $GET_PIP_PATH -UseBasicParsing
    Write-Host "get-pip.py downloaded" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Failed to download get-pip.py" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

# Install pip
Push-Location $PYTHON_DIR
Write-Host "Running get-pip.py..." -ForegroundColor Cyan

$pythonExe = Join-Path (Get-Location) "python.exe"
& $pythonExe get-pip.py --no-warn-script-location

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: pip installation failed with exit code $LASTEXITCODE" -ForegroundColor Red
    Pop-Location
    exit 1
}
Write-Host "pip installed successfully" -ForegroundColor Green
Remove-Item get-pip.py

# Verify pip
Write-Host "`nVerifying pip installation..." -ForegroundColor Cyan
Write-Host "Checking pip module..." -ForegroundColor Gray
& $pythonExe -c "import pip; print('pip ' + pip.__version__)"

if ($LASTEXITCODE -eq 0) {
    Write-Host "pip module verified!" -ForegroundColor Green
} else {
    Write-Host "WARNING: pip module check failed" -ForegroundColor Yellow
}

Pop-Location

# Install backend dependencies
Write-Host "`nInstalling backend dependencies..." -ForegroundColor Cyan
$REQUIREMENTS_PATH = Join-Path $PROJECT_ROOT "$BACKEND_DIR\requirements.txt"

if (-not (Test-Path $REQUIREMENTS_PATH)) {
    Write-Host "ERROR: requirements.txt not found at $REQUIREMENTS_PATH" -ForegroundColor Red
    Write-Host "Project root: $PROJECT_ROOT" -ForegroundColor Gray
    Write-Host "Backend dir: $BACKEND_DIR" -ForegroundColor Gray
    exit 1
}

Write-Host "Requirements file: $REQUIREMENTS_PATH" -ForegroundColor Gray

Push-Location $PYTHON_DIR
$pythonExe = Join-Path (Get-Location) "python.exe"

& $pythonExe -m pip install -r $REQUIREMENTS_PATH --no-warn-script-location

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to install dependencies with exit code $LASTEXITCODE" -ForegroundColor Red
    Pop-Location
    exit 1
}

Write-Host "Dependencies installed successfully!" -ForegroundColor Green

Pop-Location

# Final verification
Write-Host "`n=== VERIFICATION ===" -ForegroundColor Cyan
Push-Location $PYTHON_DIR

Write-Host "`nPython version:" -ForegroundColor Yellow
& .\python.exe --version

Write-Host "`nPython executable location:" -ForegroundColor Yellow
Write-Host (Resolve-Path ".\python.exe")

Write-Host "`nInstalled packages:" -ForegroundColor Yellow
& .\python.exe -m pip list

Write-Host "`nChecking critical packages:" -ForegroundColor Yellow
$criticalPackages = @("uvicorn", "fastapi", "pydantic")
foreach ($pkg in $criticalPackages) {
    $checkScript = "import $pkg; print('OK: $pkg version ' + $pkg.__version__)"
    $result = & .\python.exe -c $checkScript 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host $result -ForegroundColor Green
    } else {
        Write-Host "MISSING: $pkg" -ForegroundColor Red
    }
}

Pop-Location

Write-Host "`n=== BUNDLE COMPLETE ===" -ForegroundColor Green
Write-Host "Python runtime bundled at: $FULL_RESOURCES_PATH\python" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "  1. Run: npm run build:win" -ForegroundColor White
Write-Host "  2. Test the bundled app from dist/" -ForegroundColor White