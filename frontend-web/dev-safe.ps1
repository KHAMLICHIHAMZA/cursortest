param(
  [int]$Port = 3100
)

$ErrorActionPreference = "Stop"

$projectPath = (Resolve-Path (Join-Path $PSScriptRoot ".")).Path
$escapedProjectPath = [Regex]::Escape($projectPath)

Write-Host "[dev:safe] Project: $projectPath"

# Kill only Next.js dev node processes that belong to this frontend project.
$nodeProcesses = Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" |
  Where-Object {
    $_.CommandLine -and
    $_.CommandLine -match "next" -and
    $_.CommandLine -match "dev" -and
    $_.CommandLine -match $escapedProjectPath
  }

foreach ($proc in $nodeProcesses) {
  try {
    Write-Host "[dev:safe] Stopping PID $($proc.ProcessId)"
    Stop-Process -Id $proc.ProcessId -Force -ErrorAction Stop
  }
  catch {
    Write-Host "[dev:safe] Could not stop PID $($proc.ProcessId): $($_.Exception.Message)"
  }
}

Start-Sleep -Seconds 1

if (-not $env:NEXT_DIST_DIR -or [string]::IsNullOrWhiteSpace($env:NEXT_DIST_DIR)) {
  $env:NEXT_DIST_DIR = ".next-dev-$Port"
}

$distPath = Join-Path $projectPath $env:NEXT_DIST_DIR
if (Test-Path $distPath) {
  Write-Host "[dev:safe] Removing $distPath"
  Remove-Item -Recurse -Force $distPath
}

Write-Host "[dev:safe] NEXT_DIST_DIR=$($env:NEXT_DIST_DIR)"
Write-Host "[dev:safe] Starting Next dev on port $Port"

Push-Location $projectPath
try {
  npm run dev -- -p $Port
}
finally {
  Pop-Location
}

