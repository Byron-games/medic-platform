<#
.SYNOPSIS
    Load .env file variables into the current PowerShell session.

.DESCRIPTION
    Dot-source this file to export all .env variables before running Maven:

        . .\dev\Load-Env.ps1
        cd auth-service
        mvn spring-boot:run

.NOTES
    Run from the medic-platform root directory.
#>

$EnvFile = Join-Path $PSScriptRoot ".." ".env"
$EnvFile = (Resolve-Path $EnvFile).Path

if (-not (Test-Path $EnvFile)) {
    Write-Error ".env not found at $EnvFile. Run: Copy-Item .env.example .env"
    return
}

$count = 0
Get-Content $EnvFile | ForEach-Object {
    if ($_ -match '^\s*$' -or $_ -match '^\s*#') { return }
    if ($_ -match '^([^=]+)=(.*)$') {
        $key   = $Matches[1].Trim()
        $value = $Matches[2].Trim().Trim('"').Trim("'")
        # Skip empty values
        if ($value -eq '') { return }
        [System.Environment]::SetEnvironmentVariable($key, $value, "Process")
        Set-Item -Path "Env:\$key" -Value $value
        $count++
    }
}

Write-Host "Loaded $count variables from .env" -ForegroundColor Green
Write-Host ""
Write-Host "You can now run:" -ForegroundColor Cyan
Write-Host "  cd auth-service" -ForegroundColor White
Write-Host "  mvn spring-boot:run" -ForegroundColor White
