[CmdletBinding()]
param(
    [switch]$SeedDemo
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path

function Test-Port([int]$Port) {
    try {
        $c = New-Object System.Net.Sockets.TcpClient
        $a = $c.BeginConnect("127.0.0.1", $Port, $null, $null)
        $ok = $a.AsyncWaitHandle.WaitOne(300)
        if ($ok) { $c.EndConnect($a) }
        $c.Dispose()
        return $ok
    } catch { return $false }
}

# ── Database (local PostgreSQL on 5433) ──
if (Test-Port 5433) {
    Write-Host "[OK] PostgreSQL running on port 5433" -ForegroundColor Green
} else {
    Write-Host "[FAIL] PostgreSQL not found on port 5433. Please start it manually." -ForegroundColor Red
    exit 1
}

# ── Migrations ──
Write-Host "[..] Running Alembic migrations..." -ForegroundColor Cyan
Push-Location (Join-Path $root "backend")
try { uv run alembic upgrade head } finally { Pop-Location }
Write-Host "[OK] Migrations applied" -ForegroundColor Green

# ── Optional seed ──
if ($SeedDemo) {
    Write-Host "[..] Seeding demo data..." -ForegroundColor Cyan
    Push-Location (Join-Path $root "backend")
    try { uv run python scripts/seed_demo.py } finally { Pop-Location }
}

# ── Services ──
function Start-Service([string]$Name, [string]$Dir, [string]$Cmd, [int]$Port) {
    if (Test-Port $Port) {
        Write-Host "[OK] $Name already on port $Port" -ForegroundColor Green
        return
    }
    Write-Host "[..] Starting $Name..." -ForegroundColor Cyan
    $escaped = $Dir.Replace("'", "''")
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$escaped'; $Cmd" | Out-Null
}

Start-Service "Backend"    (Join-Path $root "backend")        "uv run uvicorn app.main:app --reload --port 8001" 8001
Start-Service "Frontend"   (Join-Path $root "frontend")       "npm.cmd run dev"                                  5175
Start-Service "Backoffice" (Join-Path $root "admin-frontend") "npm.cmd run dev"                                  5176

# ── Wait for all ──
Write-Host ""
Write-Host "Waiting for services to come up..." -ForegroundColor Cyan
for ($i = 0; $i -lt 60; $i++) {
    $up = @(8001, 5175, 5176) | Where-Object { Test-Port $_ }
    if ($up.Count -eq 3) { break }
    Start-Sleep -Seconds 1
}

Write-Host ""
Write-Host "=== DentaCare (Local) ===" -ForegroundColor Green
Write-Host "  PostgreSQL  localhost:5433"
Write-Host "  Backend     http://localhost:8001/docs"
Write-Host "  Frontend    http://localhost:5175"
Write-Host "  Backoffice  http://localhost:5176"
Write-Host ""
Write-Host "  Admin:   admin / admin12345" -ForegroundColor Yellow
Write-Host "  Doctor:  doctor_demo / doctor12345" -ForegroundColor Yellow
Write-Host "  Patient: patient_demo / patient12345" -ForegroundColor Yellow
Write-Host ""
