# Script PowerShell pour lancer tous les tests automatiques
# Usage: .\scripts\lancer-tous-tests-automatiques.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Lancement Tests Automatiques - MalocAuto" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$rootPath = $PWD
$results = @{}

# 1. Tests Backend - Unitaires
Write-Host "----------------------------------------" -ForegroundColor Gray
Write-Host "1. Tests Backend - Unitaires" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray
Write-Host ""
Set-Location "$rootPath\backend"
try {
    $output = npm test 2>&1 | Out-String
    Write-Host $output
    if ($LASTEXITCODE -eq 0) {
        $results['backend-unit'] = 'PASS'
        Write-Host "[OK] Tests unitaires backend reussis" -ForegroundColor Green
    } else {
        $results['backend-unit'] = 'FAIL'
        Write-Host "[ERREUR] Tests unitaires backend echoues" -ForegroundColor Red
    }
} catch {
    $results['backend-unit'] = 'ERROR'
    Write-Host "[ERREUR] Erreur lors des tests unitaires backend" -ForegroundColor Red
}
Write-Host ""

# 2. Tests Backend - E2E Business Rules
Write-Host "----------------------------------------" -ForegroundColor Gray
Write-Host "2. Tests Backend - E2E Business Rules" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray
Write-Host ""
Set-Location "$rootPath\backend"
try {
    $output = npm run test:e2e -- --testPathPattern=business-rules 2>&1 | Out-String
    Write-Host $output
    if ($LASTEXITCODE -eq 0) {
        $results['backend-e2e-rules'] = 'PASS'
        Write-Host "[OK] Tests E2E regles metier reussis" -ForegroundColor Green
    } else {
        $results['backend-e2e-rules'] = 'FAIL'
        Write-Host "[ERREUR] Tests E2E regles metier echoues" -ForegroundColor Red
    }
} catch {
    $results['backend-e2e-rules'] = 'ERROR'
    Write-Host "[ERREUR] Erreur lors des tests E2E regles metier" -ForegroundColor Red
}
Write-Host ""

# 3. Tests Backend - E2E Mobile Agent
Write-Host "----------------------------------------" -ForegroundColor Gray
Write-Host "3. Tests Backend - E2E Mobile Agent" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray
Write-Host ""
Set-Location "$rootPath\backend"
try {
    $output = npm run test:e2e -- --testPathPattern=mobile-agent 2>&1 | Out-String
    Write-Host $output
    if ($LASTEXITCODE -eq 0) {
        $results['backend-e2e-mobile'] = 'PASS'
        Write-Host "[OK] Tests E2E mobile agent reussis" -ForegroundColor Green
    } else {
        $results['backend-e2e-mobile'] = 'FAIL'
        Write-Host "[ERREUR] Tests E2E mobile agent echoues" -ForegroundColor Red
    }
} catch {
    $results['backend-e2e-mobile'] = 'ERROR'
    Write-Host "[ERREUR] Erreur lors des tests E2E mobile agent" -ForegroundColor Red
}
Write-Host ""

# 4. Tests Backend - E2E SaaS
Write-Host "----------------------------------------" -ForegroundColor Gray
Write-Host "4. Tests Backend - E2E SaaS" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray
Write-Host ""
Set-Location "$rootPath\backend"
try {
    $output = npm run test:e2e:saas 2>&1 | Out-String
    Write-Host $output
    if ($LASTEXITCODE -eq 0) {
        $results['backend-e2e-saas'] = 'PASS'
        Write-Host "[OK] Tests E2E SaaS reussis" -ForegroundColor Green
    } else {
        $results['backend-e2e-saas'] = 'FAIL'
        Write-Host "[ERREUR] Tests E2E SaaS echoues" -ForegroundColor Red
    }
} catch {
    $results['backend-e2e-saas'] = 'ERROR'
    Write-Host "[ERREUR] Erreur lors des tests E2E SaaS" -ForegroundColor Red
}
Write-Host ""

# Retour au répertoire racine
Set-Location $rootPath

# Résumé
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "RESUME DES TESTS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$total = $results.Count
$passed = ($results.Values | Where-Object { $_ -eq 'PASS' }).Count
$failed = ($results.Values | Where-Object { $_ -eq 'FAIL' }).Count
$errors = ($results.Values | Where-Object { $_ -eq 'ERROR' }).Count

Write-Host "Total tests: $total" -ForegroundColor White
Write-Host "Reussis: $passed" -ForegroundColor Green
Write-Host "Echoues: $failed" -ForegroundColor Red
Write-Host "Erreurs: $errors" -ForegroundColor Red
Write-Host ""

foreach ($key in $results.Keys) {
    $status = $results[$key]
    $color = if ($status -eq 'PASS') { 'Green' } else { 'Red' }
    Write-Host "  $key : $status" -ForegroundColor $color
}

Write-Host ""

if ($failed -eq 0 -and $errors -eq 0) {
    Write-Host "[OK] Tous les tests sont passes !" -ForegroundColor Green
    exit 0
} else {
    Write-Host "[ERREUR] Certains tests ont echoue" -ForegroundColor Red
    exit 1
}


