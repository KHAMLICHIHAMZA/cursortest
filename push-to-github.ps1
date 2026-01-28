# Script pour pousser le code sur GitHub
# Usage: .\push-to-github.ps1 -GitHubUrl "https://github.com/VOTRE_USERNAME/NOM_DU_REPO.git"

param(
    [Parameter(Mandatory=$false)]
    [string]$GitHubUrl = ""
)

Write-Host "🚀 Configuration du push vers GitHub" -ForegroundColor Cyan
Write-Host ""

# Vérifier si un remote existe déjà
$existingRemote = git remote get-url origin 2>$null
if ($existingRemote) {
    Write-Host "📍 Remote existant détecté: $existingRemote" -ForegroundColor Yellow
    $continue = Read-Host "Voulez-vous le remplacer? (o/N)"
    if ($continue -ne "o" -and $continue -ne "O") {
        Write-Host "❌ Opération annulée" -ForegroundColor Red
        exit 1
    }
    git remote remove origin
    Write-Host "✅ Remote supprimé" -ForegroundColor Green
}

# Demander l'URL si non fournie
if ([string]::IsNullOrEmpty($GitHubUrl)) {
    Write-Host "📝 Veuillez créer un dépôt sur GitHub si vous ne l'avez pas déjà fait:" -ForegroundColor Yellow
    Write-Host "   https://github.com/new" -ForegroundColor Cyan
    Write-Host ""
    $GitHubUrl = Read-Host "Entrez l'URL de votre dépôt GitHub (ex: https://github.com/username/repo.git)"
}

if ([string]::IsNullOrEmpty($GitHubUrl)) {
    Write-Host "❌ URL GitHub requise!" -ForegroundColor Red
    exit 1
}

# Ajouter le remote
Write-Host ""
Write-Host "🔗 Ajout du remote GitHub..." -ForegroundColor Cyan
git remote add origin $GitHubUrl

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erreur lors de l'ajout du remote" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Remote ajouté: $GitHubUrl" -ForegroundColor Green

# Vérifier le statut
Write-Host ""
Write-Host "📊 Vérification du statut Git..." -ForegroundColor Cyan
git status --short

# Pousser le code
Write-Host ""
Write-Host "📤 Poussage du code vers GitHub (branche main)..." -ForegroundColor Cyan
git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Code poussé avec succès vers GitHub!" -ForegroundColor Green
    Write-Host "🌐 Votre dépôt est maintenant disponible sur: $GitHubUrl" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "❌ Erreur lors du push. Vérifiez:" -ForegroundColor Red
    Write-Host "   - Que le dépôt GitHub existe" -ForegroundColor Yellow
    Write-Host "   - Que vous avez les permissions d'écriture" -ForegroundColor Yellow
    Write-Host "   - Que vous êtes authentifié (gh auth login ou credentials Git)" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "🎉 Terminé!" -ForegroundColor Green

