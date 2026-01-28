# Script de test d'integration API Backend
# Date: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TESTS D'INTEGRATION API - Backend" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:3000/api/v1"
$results = @()
$passed = 0
$failed = 0

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Method,
        [string]$Url,
        [hashtable]$Headers = @{},
        [object]$Body = $null,
        [int]$ExpectedStatus = 200
    )
    
    try {
        $params = @{
            Uri = $Url
            Method = $Method
            Headers = $Headers
            TimeoutSec = 5
            UseBasicParsing = $true
            ErrorAction = "Stop"
        }
        
        if ($Body) {
            $params.Body = ($Body | ConvertTo-Json -Depth 10)
            $params.ContentType = "application/json"
        }
        
        $response = Invoke-WebRequest @params
        $statusCode = $response.StatusCode
        
        if ($statusCode -eq $ExpectedStatus) {
            Write-Host "OK $Name" -ForegroundColor Green
            $script:passed++
            return @{Success = $true; Status = $statusCode; Response = $response}
        } else {
            Write-Host "ERREUR $Name - Status: $statusCode (attendu: $ExpectedStatus)" -ForegroundColor Yellow
            $script:failed++
            return @{Success = $false; Status = $statusCode; Expected = $ExpectedStatus}
        }
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq $ExpectedStatus) {
            Write-Host "OK $Name (Status: $statusCode)" -ForegroundColor Green
            $script:passed++
            return @{Success = $true; Status = $statusCode}
        } else {
            Write-Host "ERREUR $Name - Status: $statusCode (attendu: $ExpectedStatus)" -ForegroundColor Red
            $script:failed++
            return @{Success = $false; Status = $statusCode; Expected = $ExpectedStatus; Error = $_.Exception.Message}
        }
    }
}

# Phase 1: Authentification
Write-Host "Phase 1: Authentification" -ForegroundColor Cyan
Write-Host "------------------------" -ForegroundColor Cyan

$loginResult = Test-Endpoint -Name "Login SUPER_ADMIN" -Method "POST" -Url "$baseUrl/auth/login" -Body @{
    email = "admin@malocauto.com"
    password = "admin123"
} -ExpectedStatus 201

$accessToken = $null
if ($loginResult.Success -and $loginResult.Response) {
    try {
        $responseData = $loginResult.Response.Content | ConvertFrom-Json
        $accessToken = $responseData.access_token
        if ($accessToken) {
            Write-Host "  Token obtenu" -ForegroundColor Green
        }
    } catch {
        Write-Host "  Impossible de parser la reponse" -ForegroundColor Yellow
    }
}

Test-Endpoint -Name "Login COMPANY_ADMIN" -Method "POST" -Url "$baseUrl/auth/login" -Body @{
    email = "admin@autolocation.fr"
    password = "admin123"
} -ExpectedStatus 201

Test-Endpoint -Name "Login AGENCY_MANAGER" -Method "POST" -Url "$baseUrl/auth/login" -Body @{
    email = "manager1@autolocation.fr"
    password = "manager123"
} -ExpectedStatus 201

Test-Endpoint -Name "Login AGENT" -Method "POST" -Url "$baseUrl/auth/login" -Body @{
    email = "agent1@autolocation.fr"
    password = "agent123"
} -ExpectedStatus 201

Test-Endpoint -Name "Login avec mauvais mot de passe" -Method "POST" -Url "$baseUrl/auth/login" -Body @{
    email = "admin@malocauto.com"
    password = "wrongpassword"
} -ExpectedStatus 401

if ($accessToken) {
    Test-Endpoint -Name "GET /auth/me avec token" -Method "GET" -Url "$baseUrl/auth/me" -Headers @{
        Authorization = "Bearer $accessToken"
    } -ExpectedStatus 200
    
    Test-Endpoint -Name "GET /auth/me sans token" -Method "GET" -Url "$baseUrl/auth/me" -ExpectedStatus 401
}

Write-Host ""

# Phase 2: Endpoints avec authentification
if ($accessToken) {
    Write-Host "Phase 2: Endpoints Authentifies" -ForegroundColor Cyan
    Write-Host "-------------------------------" -ForegroundColor Cyan
    
    $headers = @{
        Authorization = "Bearer $accessToken"
    }
    
    Test-Endpoint -Name "GET /agencies" -Method "GET" -Url "$baseUrl/agencies" -Headers $headers -ExpectedStatus 200
    Test-Endpoint -Name "GET /vehicles" -Method "GET" -Url "$baseUrl/vehicles" -Headers $headers -ExpectedStatus 200
    Test-Endpoint -Name "GET /clients" -Method "GET" -Url "$baseUrl/clients" -Headers $headers -ExpectedStatus 200
    Test-Endpoint -Name "GET /bookings" -Method "GET" -Url "$baseUrl/bookings" -Headers $headers -ExpectedStatus 200
    Test-Endpoint -Name "GET /incidents" -Method "GET" -Url "$baseUrl/incidents" -Headers $headers -ExpectedStatus 200
    Test-Endpoint -Name "GET /invoices" -Method "GET" -Url "$baseUrl/invoices" -Headers $headers -ExpectedStatus 200
    
    Write-Host ""
}

# Résumé
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "RESUME DES TESTS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Tests reussis: $passed" -ForegroundColor Green
Write-Host "Tests echoues: $failed" -ForegroundColor $(if ($failed -eq 0) { "Green" } else { "Red" })
Write-Host "Total: $($passed + $failed)" -ForegroundColor Cyan
Write-Host ""

if ($failed -eq 0) {
    Write-Host "TOUS LES TESTS SONT PASSES!" -ForegroundColor Green
} else {
    Write-Host "Certains tests ont echoue. Verifiez les details ci-dessus." -ForegroundColor Yellow
}

Write-Host ""

