# Script de Vérification Variables d'Environnement Préprod
# Vérifie que toutes les variables nécessaires sont configurées

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "VERIFICATION ENV PREPROD - MalocAuto" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Continue"
$warnings = @()
$errors = @()

# Fonction pour vérifier un fichier .env
function Check-EnvFile {
    param(
        [string]$EnvPath,
        [string]$EnvName,
        [string[]]$RequiredVars,
        [string[]]$RecommendedVars = @()
    )
    
    Write-Host "----------------------------------------" -ForegroundColor Yellow
    Write-Host "Checking: $EnvName" -ForegroundColor Yellow
    Write-Host "Path: $EnvPath" -ForegroundColor Gray
    Write-Host ""
    
    if (-not (Test-Path $EnvPath)) {
        Write-Host "  WARNING: File not found" -ForegroundColor Yellow
        $script:warnings += "${EnvName}: File not found (may be normal if using .env.example)"
        return
    }
    
    # Lire le fichier .env
    $envContent = Get-Content $EnvPath -Raw
    
    # Vérifier les variables requises
    Write-Host "  Required variables:" -ForegroundColor Cyan
    foreach ($var in $RequiredVars) {
        if ($envContent -match "$var\s*=") {
            $value = ($envContent | Select-String -Pattern "$var\s*=\s*(.+)" | ForEach-Object { $_.Matches.Groups[1].Value })
            if ($value -and $value -notmatch "^(your-|change-|localhost|example)" -and $value.Trim() -ne "") {
                Write-Host "    ${var}: OK" -ForegroundColor Green
            } else {
                Write-Host "    ${var}: WARNING (default/example value)" -ForegroundColor Yellow
                $script:warnings += "${EnvName}: ${var} has default/example value"
            }
        } else {
            Write-Host "    ${var}: MISSING" -ForegroundColor Red
            $script:errors += "${EnvName}: ${var} is missing"
        }
    }
    
    # Vérifier les variables recommandées
    if ($RecommendedVars.Count -gt 0) {
        Write-Host "  Recommended variables:" -ForegroundColor Cyan
        foreach ($var in $RecommendedVars) {
            if ($envContent -match "$var\s*=") {
                Write-Host "    ${var}: OK" -ForegroundColor Green
            } else {
                Write-Host "    ${var}: Not set (optional)" -ForegroundColor Gray
            }
        }
    }
}

# Fonction pour vérifier .gitignore
function Check-GitIgnore {
    Write-Host "----------------------------------------" -ForegroundColor Yellow
    Write-Host "Checking .gitignore" -ForegroundColor Yellow
    Write-Host ""
    
    if (-not (Test-Path ".gitignore")) {
        Write-Host "  ERROR: .gitignore not found" -ForegroundColor Red
        $script:errors += ".gitignore: File not found"
        return
    }
    
    $gitignoreContent = Get-Content ".gitignore" -Raw
    
    $envPatterns = @(".env", ".env.local", ".env.production", ".env.production.local")
    $allFound = $true
    
    foreach ($pattern in $envPatterns) {
        if ($gitignoreContent -match [regex]::Escape($pattern)) {
            Write-Host "  ${pattern}: OK (in .gitignore)" -ForegroundColor Green
        } else {
            Write-Host "  ${pattern}: WARNING (not in .gitignore)" -ForegroundColor Yellow
            $script:warnings += ".gitignore: ${pattern} not found"
            $allFound = $false
        }
    }
    
    if ($allFound) {
        Write-Host "  All .env patterns are in .gitignore" -ForegroundColor Green
    }
}

# Fonction pour vérifier que .env n'est pas commité
function Check-EnvNotCommitted {
    Write-Host "----------------------------------------" -ForegroundColor Yellow
    Write-Host "Checking if .env files are committed" -ForegroundColor Yellow
    Write-Host ""
    
    $envFiles = @(
        "backend/.env",
        "frontend-web/.env.local",
        "frontend-agency/.env",
        "frontend-admin/.env"
    )
    
    foreach ($envFile in $envFiles) {
        if (Test-Path $envFile) {
            # Vérifier si le fichier est tracké par git
            $gitStatus = git ls-files --error-unmatch $envFile 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-Host "  ${envFile}: ERROR (committed in git!)" -ForegroundColor Red
                $script:errors += "${envFile}: File is committed in git (security risk!)"
            } else {
                Write-Host "  ${envFile}: OK (not committed)" -ForegroundColor Green
            }
        } else {
            Write-Host "  ${envFile}: OK (not found, using .env.example)" -ForegroundColor Gray
        }
    }
}

# 1. Vérifier .gitignore
Check-GitIgnore
Write-Host ""

# 2. Vérifier que .env n'est pas commité
Check-EnvNotCommitted
Write-Host ""

# 3. Vérifier backend/.env
Check-EnvFile -EnvPath "backend/.env" -EnvName "Backend .env" `
    -RequiredVars @(
        "DATABASE_URL",
        "JWT_SECRET",
        "JWT_REFRESH_SECRET",
        "NODE_ENV"
    ) `
    -RecommendedVars @(
        "FRONTEND_URL",
        "FRONTEND_AGENCY_URL",
        "SMTP_HOST",
        "SMTP_USER",
        "SMTP_PASS"
    )
Write-Host ""

# 4. Vérifier backend/env.example
Check-EnvFile -EnvPath "backend/env.example" -EnvName "Backend env.example" `
    -RequiredVars @(
        "DATABASE_URL",
        "JWT_SECRET",
        "JWT_REFRESH_SECRET"
    )
Write-Host ""

# Résumé
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "RESUME VERIFICATION" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if ($errors.Count -eq 0 -and $warnings.Count -eq 0) {
    Write-Host "  All checks passed!" -ForegroundColor Green
} else {
    if ($errors.Count -gt 0) {
        Write-Host "  ERRORS ($($errors.Count)):" -ForegroundColor Red
        foreach ($error in $errors) {
            Write-Host "    - $error" -ForegroundColor Red
        }
        Write-Host ""
    }
    
    if ($warnings.Count -gt 0) {
        Write-Host "  WARNINGS ($($warnings.Count)):" -ForegroundColor Yellow
        foreach ($warning in $warnings) {
            Write-Host "    - $warning" -ForegroundColor Yellow
        }
    }
}

Write-Host ""
Write-Host "CRITICAL: Before deploying to preprod:" -ForegroundColor Red
Write-Host "  1. Generate JWT_SECRET: node -e `"console.log(require('crypto').randomBytes(64).toString('hex'))`"" -ForegroundColor Yellow
Write-Host "  2. Set JWT_SECRET in backend/.env (production)" -ForegroundColor Yellow
Write-Host "  3. Set NODE_ENV=production" -ForegroundColor Yellow
Write-Host "  4. Configure all API keys (SMTP, OpenAI, etc.)" -ForegroundColor Yellow
Write-Host "  5. Verify CORS URLs for preprod" -ForegroundColor Yellow

if ($errors.Count -gt 0) {
    exit 1
}



