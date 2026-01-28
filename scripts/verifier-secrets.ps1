# Script pour verifier les secrets hardcodes detectes

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "VERIFICATION DES SECRETS HARDCODES" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$secretsFiles = @(
    "backend/prisma/seed.ts",
    "backend/src/common/services/ai-vision.service.ts",
    "backend/src/modules/ai/chatbot.service.ts",
    "backend/src/modules/ai/damage-detection.service.ts",
    "backend/src/modules/auth/auth.service.spec.ts",
    "backend/src/modules/client/client.service.ts",
    "backend/src/modules/company/company.service.ts",
    "backend/src/modules/notification/whatsapp.service.ts",
    "backend/src/modules/payment/cmi.service.ts",
    "backend/src/modules/user/user.service.ts",
    "backend/src/utils/jwt.ts",
    "backend/test/business-rules.e2e-spec.ts",
    "backend/test/mobile-agent.e2e-spec.ts",
    "backend/test/saas.e2e-spec.ts"
)

Write-Host "Verification des fichiers suspects..." -ForegroundColor Yellow
Write-Host ""

$issuesFound = 0

foreach ($file in $secretsFiles) {
    $parentDir = Split-Path $PSScriptRoot -Parent
    $fullPath = Join-Path $parentDir $file
    $fullPath = Resolve-Path $fullPath -ErrorAction SilentlyContinue
    
    if ($fullPath -and (Test-Path $fullPath)) {
        Write-Host "Fichier: $file" -ForegroundColor Cyan
        $content = Get-Content $fullPath -Raw -ErrorAction SilentlyContinue
        
        if ($content) {
            # Verifier les patterns suspects
            $patterns = @(
                @{Pattern="password\s*=\s*['`"](.*?)['`"]"; Name="Password hardcode"},
                @{Pattern="secret\s*=\s*['`"](.*?)['`"]"; Name="Secret hardcode"},
                @{Pattern="api[_-]?key\s*=\s*['`"](.*?)['`"]"; Name="API key hardcode"},
                @{Pattern="token\s*=\s*['`"](.*?)['`"]"; Name="Token hardcode"}
            )
            
            $fileIssues = 0
            foreach ($patternInfo in $patterns) {
                if ($content -match $patternInfo.Pattern) {
                    $fileIssues++
                    $issuesFound++
                    Write-Host "  ATTENTION: $($patternInfo.Name) detecte" -ForegroundColor Yellow
                    # Ne pas afficher la valeur pour securite
                }
            }
            
            if ($fileIssues -eq 0) {
                Write-Host "  OK: Aucun secret hardcode detecte" -ForegroundColor Green
            }
        }
        Write-Host ""
    }
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "RESUME" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if ($issuesFound -eq 0) {
    Write-Host "OK: Aucun secret hardcode critique detecte" -ForegroundColor Green
    Write-Host ""
    Write-Host "Note: Les patterns detectes peuvent etre:" -ForegroundColor Yellow
    Write-Host "  - Des mots de passe de test (seed.ts, tests)" -ForegroundColor Gray
    Write-Host "  - Des valeurs par defaut (non critiques)" -ForegroundColor Gray
    Write-Host "  - Des commentaires ou documentation" -ForegroundColor Gray
} else {
    Write-Host "ATTENTION: $issuesFound pattern(s) suspect(s) detecte(s)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Actions recommandees:" -ForegroundColor Yellow
    Write-Host "  1. Verifier chaque fichier manuellement" -ForegroundColor Gray
    Write-Host "  2. Deplacer les secrets vers variables d'environnement" -ForegroundColor Gray
    Write-Host "  3. Utiliser un gestionnaire de secrets (AWS Secrets Manager, etc.)" -ForegroundColor Gray
}

Write-Host ""

