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

function Remove-IfExists {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path
    )

    if (Test-Path $Path) {
        Remove-Item -LiteralPath $Path -Recurse -Force
    }
}

function Remove-ChildrenByPattern {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Parent,
        [Parameter(Mandatory = $true)]
        [string[]]$Patterns
    )

    if (-not (Test-Path $Parent)) {
        return
    }

    foreach ($pattern in $Patterns) {
        Get-ChildItem -Path $Parent -Filter $pattern -Force -ErrorAction SilentlyContinue |
            ForEach-Object { Remove-Item -LiteralPath $_.FullName -Recurse -Force }
    }
}

function Remove-MatchingDirectories {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Parent,
        [Parameter(Mandatory = $true)]
        [string[]]$Names
    )

    if (-not (Test-Path $Parent)) {
        return
    }

    Get-ChildItem -Path $Parent -Directory -Recurse -Force -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -in $Names } |
        ForEach-Object { Remove-Item -LiteralPath $_.FullName -Recurse -Force }
}

function Optimize-PackagedRuntime {
    param(
        [Parameter(Mandatory = $true)]
        [string]$PythonDir
    )

    $sitePackagesDir = Join-Path $PythonDir 'Lib\site-packages'
    $scriptsDir = Join-Path $PythonDir 'Scripts'
    $tlsClientDependenciesDir = Join-Path $sitePackagesDir 'tls_client\dependencies'

    Write-Host 'Pruning unused packaging files from bundled runtime...' -ForegroundColor Cyan

    Remove-IfExists $scriptsDir
    Remove-IfExists (Join-Path $sitePackagesDir 'pip')
    Remove-IfExists (Join-Path $sitePackagesDir 'setuptools')
    Remove-IfExists (Join-Path $sitePackagesDir 'wheel')
    Remove-IfExists (Join-Path $sitePackagesDir 'pkg_resources')

    Remove-ChildrenByPattern -Parent $sitePackagesDir -Patterns @(
        'pip-*.dist-info',
        'setuptools-*.dist-info',
        'wheel-*.dist-info'
    )

    Remove-MatchingDirectories -Parent $sitePackagesDir -Names @('__pycache__', 'tests', 'test')

    Get-ChildItem -Path $sitePackagesDir -Recurse -File -Filter '*.pyc' -Force -ErrorAction SilentlyContinue |
        ForEach-Object { Remove-Item -LiteralPath $_.FullName -Force }

    if (Test-Path $tlsClientDependenciesDir) {
        @(
            'tls-client-32.dll',
            'tls-client-amd64.so',
            'tls-client-x86.so',
            'tls-client-arm64.so',
            'tls-client-x86.dylib',
            'tls-client-arm64.dylib'
        ) | ForEach-Object {
            Remove-IfExists (Join-Path $tlsClientDependenciesDir $_)
        }
    }
}

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
    Set-Content -Path $PTH_FILE -Value $content -Encoding ASCII
} else {
    @"
python$PYTHON_MAJOR_MINOR.zip
.
import site
"@ | Set-Content -Path $PTH_FILE -Encoding ASCII
}

$pythonExe = Join-Path $PYTHON_DIR 'python.exe'
$GET_PIP_PATH = Join-Path $PYTHON_DIR 'get-pip.py'
$env:PYTHONNOUSERSITE = '1'

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
& $pythonExe -m pip install --upgrade pip setuptools wheel --ignore-installed --no-warn-script-location --no-cache-dir --no-compile
if ($LASTEXITCODE -ne 0) {
    throw "pip tooling upgrade failed with exit code $LASTEXITCODE"
}

Write-Host 'Installing backend dependencies...' -ForegroundColor Cyan
& $pythonExe -m pip install -r $REQUIREMENTS_PATH --ignore-installed --no-warn-script-location --no-cache-dir --no-compile
if ($LASTEXITCODE -ne 0) {
    throw "backend dependency installation failed with exit code $LASTEXITCODE"
}

Write-Host 'Verifying packaged runtime...' -ForegroundColor Cyan
& $pythonExe --version
& $pythonExe -m pip list
& $pythonExe -c "import colorama, fastapi, pandas, tls_client, uvicorn; print('fastapi', fastapi.__version__); print('uvicorn', uvicorn.__version__); print('runtime imports verified')"
if ($LASTEXITCODE -ne 0) {
    throw 'Python package verification failed'
}

& $pythonExe -c "import tls_client; session = tls_client.Session(client_identifier='chrome120'); session.close(); print('tls-client verified')"
if ($LASTEXITCODE -ne 0) {
    throw 'TLS client verification failed'
}

Optimize-PackagedRuntime -PythonDir $PYTHON_DIR

Write-Host 'Verifying optimized runtime...' -ForegroundColor Cyan
& $pythonExe -c "import colorama, fastapi, pandas, tls_client, uvicorn; session = tls_client.Session(client_identifier='chrome120'); session.close(); print('optimized runtime imports verified')"
if ($LASTEXITCODE -ne 0) {
    throw 'Optimized runtime verification failed'
}

Write-Host ''
Write-Host 'Bundle complete.' -ForegroundColor Green
Write-Host "Python runtime bundled at: $PYTHON_DIR" -ForegroundColor Green
Write-Host 'Next step: run npm run build:win' -ForegroundColor White
