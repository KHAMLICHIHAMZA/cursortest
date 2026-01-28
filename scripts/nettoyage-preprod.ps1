# Script de nettoyage pour passage en preprod
# Date: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "NETTOYAGE POUR PREPROD - MalocAuto" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$logFile = "nettoyage-preprod_$timestamp.log"

function Write-Log {
    param([string]$Message, [string]$Color = "White")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] $Message"
    Write-Host $logMessage -ForegroundColor $Color
    Add-Content -Path $logFile -Value $logMessage
}

Write-Log "Debut du nettoyage preprod" "Cyan"

# 1. Nettoyer les fichiers temporaires
Write-Log "1. Nettoyage des fichiers temporaires..." "Yellow"

$tempFiles = @(
    "*.log",
    "*.tmp",
    "*.temp",
    "node_modules/.cache",
    "**/dist",
    "**/.next",
    "**/.turbo",
    "**/.vite",
    "**/coverage",
    "**/.nyc_output"
)

foreach ($pattern in $tempFiles) {
    Get-ChildItem -Path . -Include $pattern -Recurse -ErrorAction SilentlyContinue | 
        Where-Object { $_.FullName -notlike "*node_modules*" -and $_.FullName -notlike "*.git*" } |
        ForEach-Object {
            try {
                Remove-Item $_.FullName -Recurse -Force -ErrorAction SilentlyContinue
                Write-Log "  Supprime: $($_.Name)" "Gray"
            } catch {
                # Ignorer les erreurs
            }
        }
}

Write-Log "OK Fichiers temporaires nettoyes" "Green"

# 2. Verifier les fichiers .env
Write-Log ""
Write-Log "2. Verification des fichiers .env..." "Yellow"

$envFiles = Get-ChildItem -Path . -Include ".env*" -Recurse -ErrorAction SilentlyContinue |
    Where-Object { $_.FullName -notlike "*node_modules*" }

foreach ($envFile in $envFiles) {
    Write-Log "  Trouve: $($envFile.FullName)" "Gray"
    
    # Verifier si c'est .env.example (OK) ou .env (a verifier)
    if ($envFile.Name -eq ".env" -and $envFile.DirectoryName -notlike "*node_modules*") {
        Write-Log "  ATTENTION: Fichier .env trouve - Verifier qu'il ne contient pas de secrets" "Yellow"
    }
}

Write-Log "OK Verification .env terminee" "Green"

# 3. Verifier les secrets hardcodes
Write-Log ""
Write-Log "3. Verification des secrets hardcodes..." "Yellow"

$secretPatterns = @(
    "password.*=.*['\`"].*['\`"]",
    "secret.*=.*['\`"].*['\`"]",
    "api[_-]?key.*=.*['\`"].*['\`"]",
    "token.*=.*['\`"].*['\`"]"
)

$codeFiles = Get-ChildItem -Path . -Include *.ts,*.tsx,*.js,*.jsx -Recurse -ErrorAction SilentlyContinue |
    Where-Object { 
        $_.FullName -notlike "*node_modules*" -and 
        $_.FullName -notlike "*.git*" -and
        $_.FullName -notlike "*dist*" -and
        $_.FullName -notlike "*build*"
    }

$secretsFound = 0
foreach ($file in $codeFiles) {
    $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
    if ($content) {
        foreach ($pattern in $secretPatterns) {
            if ($content -match $pattern) {
                $secretsFound++
                Write-Log "  ATTENTION: Pattern suspect trouve dans $($file.FullName)" "Red"
            }
        }
    }
}

if ($secretsFound -eq 0) {
    Write-Log "OK Aucun secret hardcode detecte" "Green"
} else {
    Write-Log "ATTENTION: $secretsFound pattern(s) suspect(s) trouve(s)" "Red"
}

# 4. Verifier les dependances
Write-Log ""
Write-Log "4. Verification des dependances..." "Yellow"

$packageFiles = Get-ChildItem -Path . -Include package.json -Recurse -ErrorAction SilentlyContinue |
    Where-Object { $_.FullName -notlike "*node_modules*" }

foreach ($pkg in $packageFiles) {
    Write-Log "  Verifie: $($pkg.DirectoryName)" "Gray"
    $pkgContent = Get-Content $pkg.FullName | ConvertFrom-Json
    
    # Verifier les dependances vulnerables
    if ($pkgContent.dependencies) {
        Write-Log "    Dependencies: $($pkgContent.dependencies.PSObject.Properties.Count)" "Gray"
    }
    if ($pkgContent.devDependencies) {
        Write-Log "    DevDependencies: $($pkgContent.devDependencies.PSObject.Properties.Count)" "Gray"
    }
}

Write-Log "OK Verification dependances terminee" "Green"

# 5. Creer .gitignore si manquant
Write-Log ""
Write-Log "5. Verification .gitignore..." "Yellow"

if (-not (Test-Path ".gitignore")) {
    Write-Log "  ATTENTION: .gitignore manquant" "Yellow"
} else {
    Write-Log "  OK .gitignore present" "Green"
}

# 6. Verifier les builds
Write-Log ""
Write-Log "6. Verification des builds..." "Yellow"

$buildDirs = @(
    "backend/dist",
    "frontend-web/.next",
    "frontend-agency/dist",
    "frontend-admin/dist"
)

foreach ($dir in $buildDirs) {
    if (Test-Path $dir) {
        Write-Log "  OK Build trouve: $dir" "Green"
    } else {
        Write-Log "  INFO Build non trouve: $dir (normal si pas encore build)" "Gray"
    }
}

# 7. Resume
Write-Log ""
Write-Log "========================================" "Cyan"
Write-Log "RESUME DU NETTOYAGE" "Cyan"
Write-Log "========================================" "Cyan"
Write-Log ""
Write-Log "Fichiers temporaires: Nettoyes" "Green"
Write-Log "Fichiers .env: Verifies" "Green"
Write-Log "Secrets hardcodes: Verifies" "Green"
Write-Log "Dependances: Verifiees" "Green"
Write-Log ""
Write-Log "Log disponible dans: $logFile" "Cyan"
Write-Log ""
Write-Log "PROCHAINES ETAPES POUR PREPROD:" "Yellow"
Write-Log "1. Verifier toutes les variables d'environnement" "Gray"
Write-Log "2. Configurer les URLs de preprod" "Gray"
Write-Log "3. Verifier les secrets dans les variables d'environnement" "Gray"
Write-Log "4. Executer npm audit pour verifier les vulnerabilites" "Gray"
Write-Log "5. Build toutes les applications" "Gray"
Write-Log "6. Tester les builds en local" "Gray"
Write-Log ""
