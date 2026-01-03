# PowerShell script to run mobile agent E2E tests
# Usage: .\run-mobile-tests.ps1

Write-Host "🧪 Starting Mobile Agent E2E Tests..." -ForegroundColor Cyan
Write-Host ""

# Check if backend is running
Write-Host "📡 Checking if backend is running..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/docs" -Method Get -TimeoutSec 2 -ErrorAction Stop
    Write-Host "✅ Backend is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend is not running on port 3000" -ForegroundColor Red
    Write-Host "Please start the backend first: npm run start:dev" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# Run tests
Write-Host "🚀 Running E2E tests..." -ForegroundColor Cyan
npm run test:e2e -- mobile-agent.e2e-spec.ts

# Check exit code
if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ All tests passed!" -ForegroundColor Green
    exit 0
} else {
    Write-Host ""
    Write-Host "❌ Some tests failed" -ForegroundColor Red
    exit 1
}

