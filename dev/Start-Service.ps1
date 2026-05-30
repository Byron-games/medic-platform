<#
.SYNOPSIS
    Start a M.E.D.I.C. microservice locally with .env variables loaded.

.DESCRIPTION
    Reads the root .env file, exports all variables into the current
    PowerShell session, waits for Postgres to be ready, then runs
    the specified Spring Boot service with mvn spring-boot:run.

.EXAMPLE
    .\dev\Start-Service.ps1 auth-service
    .\dev\Start-Service.ps1 patient-identity-service
    .\dev\Start-Service.ps1 emr-service

.NOTES
    Run from the medic-platform root directory.
    Docker must be running with: docker compose up -d postgres redis
#>

param(
    [Parameter(Mandatory=$true)]
    [string]$ServiceName
)

$ErrorActionPreference = "Stop"
$RootDir = Split-Path -Parent $PSScriptRoot

# ── 1. Validate service directory exists ─────────────────────
$ServiceDir = Join-Path $RootDir $ServiceName
if (-not (Test-Path $ServiceDir)) {
    Write-Error "Service directory not found: $ServiceDir"
    exit 1
}

# ── 2. Load .env file ─────────────────────────────────────────
$EnvFile = Join-Path $RootDir ".env"
if (-not (Test-Path $EnvFile)) {
    Write-Error ".env file not found at $EnvFile`nRun: cp .env.example .env"
    exit 1
}

Write-Host "Loading .env..." -ForegroundColor Cyan
Get-Content $EnvFile | ForEach-Object {
    # Skip blank lines and comments
    if ($_ -match '^\s*$' -or $_ -match '^\s*#') { return }
    # Parse KEY=VALUE (handles values with = signs)
    if ($_ -match '^([^=]+)=(.*)$') {
        $key   = $Matches[1].Trim()
        $value = $Matches[2].Trim().Trim('"').Trim("'")
        [System.Environment]::SetEnvironmentVariable($key, $value, "Process")
        Write-Host "  $key = $value" -ForegroundColor DarkGray
    }
}

# ── 3. Wait for Postgres to be ready ──────────────────────────
Write-Host ""
Write-Host "Waiting for Postgres to be ready..." -ForegroundColor Yellow
$maxWait  = 60   # seconds
$elapsed  = 0
$interval = 2

while ($elapsed -lt $maxWait) {
    try {
        $result = docker exec medic-postgres pg_isready -U medic -d medic_auth 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Postgres is ready!" -ForegroundColor Green
            break
        }
    } catch {}

    Write-Host "  Still waiting... ($elapsed/$maxWait s)" -ForegroundColor DarkGray
    Start-Sleep -Seconds $interval
    $elapsed += $interval
}

if ($elapsed -ge $maxWait) {
    Write-Error "Postgres did not become ready within $maxWait seconds.`nMake sure Docker is running: docker compose up -d postgres redis"
    exit 1
}

# ── 4. Run the service ────────────────────────────────────────
Write-Host ""
Write-Host "Starting $ServiceName on port..." -ForegroundColor Cyan

Set-Location $ServiceDir

# Clean old .env variable from session that might conflict
Remove-Item Env:\SPRING_PROFILES_ACTIVE -ErrorAction SilentlyContinue

mvn spring-boot:run
