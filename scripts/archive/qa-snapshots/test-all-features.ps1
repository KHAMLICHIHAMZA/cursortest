# Script de Test Automatisé - MalocAuto SaaS
# PowerShell Script pour tester toutes les fonctionnalités

Write-Host "=== TESTS AUTOMATISES MALOCAUTO SAAS ===" -ForegroundColor Cyan
Write-Host ""

# Configuration
$BACKEND_URL = "http://localhost:3000/api/v1"
$AGENCY_URL = "http://localhost:8080"
$ADMIN_URL = "http://localhost:5173"

# Comptes de test
$SUPER_ADMIN_EMAIL = "admin@malocauto.com"
$SUPER_ADMIN_PASS = "admin123"
$MANAGER_EMAIL = "manager1@autolocation.fr"
$MANAGER_PASS = "manager123"
$AGENT_EMAIL = "agent1@autolocation.fr"
$AGENT_PASS = "agent123"

$testResults = @()
$passedTests = 0
$failedTests = 0

function Test-API {
    param(
        [string]$Name,
        [string]$Method,
        [string]$Endpoint,
        [hashtable]$Headers = @{},
        [object]$Body = $null,
        [int]$ExpectedStatus = 200
    )
    
    Write-Host "  Testing: $Name" -ForegroundColor Yellow
    
    try {
        $params = @{
            Uri = "$BACKEND_URL$Endpoint"
            Method = $Method
            Headers = $Headers
            ContentType = "application/json"
            ErrorAction = "Stop"
        }

        if ($Body) {
            $params.Body = ($Body | ConvertTo-Json -Depth 10)
        }

        $webResponse = Invoke-WebRequest @params
        $statusCode = $webResponse.StatusCode
        $responseBody = $null
        if ($webResponse.Content) {
            $responseBody = $webResponse.Content | ConvertFrom-Json
        }

        if ($statusCode -eq $ExpectedStatus) {
            Write-Host "    PASSED" -ForegroundColor Green
            $script:passedTests++
            return @{ Success = $true; Response = $responseBody }
        } else {
            Write-Host "    FAILED - Expected $ExpectedStatus, got $statusCode" -ForegroundColor Red
            $script:failedTests++
            return @{ Success = $false; StatusCode = $statusCode }
        }
    } catch {
        $statusCode = $null
        if ($_.Exception.Response -and $_.Exception.Response.StatusCode) {
            $statusCode = $_.Exception.Response.StatusCode.value__
        }
        if ($statusCode -eq $ExpectedStatus) {
            Write-Host "    PASSED (Expected error)" -ForegroundColor Green
            $script:passedTests++
            return @{ Success = $true; StatusCode = $statusCode }
        } else {
            Write-Host "    FAILED - $($_.Exception.Message)" -ForegroundColor Red
            $script:failedTests++
            return @{ Success = $false; Error = $_.Exception.Message }
        }
    }
}

function Get-AuthToken {
    param([string]$Email, [string]$Password)
    
    try {
        $body = @{
            email = $Email
            password = $Password
        } | ConvertTo-Json
        
        $response = Invoke-RestMethod -Uri "$BACKEND_URL/auth/login" -Method POST -Body $body -ContentType "application/json"
        if ($response.access_token) {
            return $response.access_token
        }
        if ($response.accessToken) {
            return $response.accessToken
        }
        return $null
    } catch {
        Write-Host "    Login failed: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

Write-Host "=== 1. TESTS D'AUTHENTIFICATION ===" -ForegroundColor Cyan
Write-Host ""

# Test 1.1: Login Super Admin
Write-Host "1.1 Login Super Admin" -ForegroundColor White
$superAdminToken = Get-AuthToken -Email $SUPER_ADMIN_EMAIL -Password $SUPER_ADMIN_PASS
if ($superAdminToken) {
    Write-Host "  Token obtenu" -ForegroundColor Green
    $passedTests++
} else {
    Write-Host "  Echec login" -ForegroundColor Red
    $failedTests++
}

# Test 1.2: Login Agency Manager
Write-Host "1.2 Login Agency Manager" -ForegroundColor White
$managerToken = Get-AuthToken -Email $MANAGER_EMAIL -Password $MANAGER_PASS
if ($managerToken) {
    Write-Host "  Token obtenu" -ForegroundColor Green
    $passedTests++
} else {
    Write-Host "  Echec login" -ForegroundColor Red
    $failedTests++
}

# Test 1.3: Login Agent
Write-Host "1.3 Login Agent" -ForegroundColor White
$agentToken = Get-AuthToken -Email $AGENT_EMAIL -Password $AGENT_PASS
if ($agentToken) {
    Write-Host "  Token obtenu" -ForegroundColor Green
    $passedTests++
} else {
    Write-Host "  Echec login" -ForegroundColor Red
    $failedTests++
}

Write-Host ""
Write-Host "=== 2. TESTS API VERSIONING ===" -ForegroundColor Cyan
Write-Host ""

# Test 2.1: Endpoint /api/v1/companies
Test-API -Name "GET /api/v1/companies" -Method "GET" -Endpoint "/companies" -Headers @{ Authorization = "Bearer $superAdminToken" }

# Test 2.2: Endpoint /api/v1/agencies
Test-API -Name "GET /api/v1/agencies" -Method "GET" -Endpoint "/agencies" -Headers @{ Authorization = "Bearer $superAdminToken" }

# Test 2.3: Endpoint /api/v1/users
Test-API -Name "GET /api/v1/users" -Method "GET" -Endpoint "/users" -Headers @{ Authorization = "Bearer $superAdminToken" }

Write-Host ""
Write-Host "=== 3. TESTS AUDIT FIELDS ===" -ForegroundColor Cyan
Write-Host ""

# Test 3.1: Créer Company et vérifier audit fields
Write-Host "3.1 Créer Company" -ForegroundColor White
$companyData = @{
    name = "Test Company $(Get-Date -Format 'yyyyMMddHHmmss')"
    phone = "+33123456789"
    address = "Test Address"
}
$result = Test-API -Name "POST /api/v1/companies" -Method "POST" -Endpoint "/companies" -Headers @{ Authorization = "Bearer $superAdminToken" } -Body $companyData -ExpectedStatus 201
if ($result.Success -and $result.Response) {
    $companyId = $result.Response.id
    Write-Host "  Company creee: $companyId" -ForegroundColor Green
    
    # Vérifier que les champs d'audit ne sont pas dans la réponse
    if (-not $result.Response.createdByUserId) {
        Write-Host "  Audit fields exclus de la reponse publique" -ForegroundColor Green
        $passedTests++
    } else {
        Write-Host "  Audit fields presents dans la reponse" -ForegroundColor Red
        $failedTests++
    }
}

Write-Host ""
Write-Host "=== 4. TESTS RBAC PERMISSIONS ===" -ForegroundColor Cyan
Write-Host ""

# Test 4.1: Agent ne peut pas créer Vehicle
Write-Host "4.1 Agent ne peut pas créer Vehicle" -ForegroundColor White
$vehicleData = @{
    agencyId = "test-agency-id"
    registrationNumber = "TEST-123"
    brand = "Test"
    model = "Model"
    year = 2024
    mileage = 0
    dailyRate = 50
    depositAmount = 500
    status = "AVAILABLE"
}
Test-API -Name "POST /api/v1/vehicles (Agent)" -Method "POST" -Endpoint "/vehicles" -Headers @{ Authorization = "Bearer $agentToken" } -Body $vehicleData -ExpectedStatus 403

# Test 4.2: Manager peut créer Vehicle
Write-Host "4.2 Manager peut créer Vehicle" -ForegroundColor White
# Note: Nécessite un agencyId valide, donc on teste juste l'accès
Test-API -Name "GET /api/v1/vehicles (Manager)" -Method "GET" -Endpoint "/vehicles" -Headers @{ Authorization = "Bearer $managerToken" }

Write-Host ""
Write-Host "=== 5. TESTS BUSINESS EVENT LOGGING ===" -ForegroundColor Cyan
Write-Host ""

# Test 5.1: Vérifier que les events sont loggés
Write-Host "5.1 Vérifier BusinessEventLog" -ForegroundColor White
Write-Host "  ATTENTION: Test manuel requis - Verifier dans la base de donnees" -ForegroundColor Yellow
Write-Host "  SQL: SELECT * FROM BusinessEventLog ORDER BY createdAt DESC LIMIT 10;" -ForegroundColor Gray

Write-Host ""
Write-Host "=== 6. TESTS READ-ONLY MODE ===" -ForegroundColor Cyan
Write-Host ""

# Test 6.1: Vérifier read-only mode
Write-Host "6.1 Read-Only Mode" -ForegroundColor White
Write-Host "  ATTENTION: Test manuel requis - Definir READ_ONLY_MODE=true dans .env" -ForegroundColor Yellow

Write-Host ""
Write-Host "=== RESUME DES TESTS ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Tests réussis: $passedTests" -ForegroundColor Green
Write-Host "Tests échoués: $failedTests" -ForegroundColor $(if ($failedTests -eq 0) { "Green" } else { "Red" })
Write-Host ""
Write-Host "Tests automatises termines!" -ForegroundColor Cyan
Write-Host ""
Write-Host "Tests manuels requis:" -ForegroundColor Yellow
Write-Host "  - Tests frontend (UI/UX)" -ForegroundColor Gray
Write-Host "  - Tests BusinessEventLog dans la base" -ForegroundColor Gray
Write-Host "  - Tests Read-Only Mode" -ForegroundColor Gray
Write-Host "  - Tests Analytics" -ForegroundColor Gray



