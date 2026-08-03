# InterviewForge Development Startup Script
Write-Host "`n⚡ InterviewForge - Starting Development Environment`n" -ForegroundColor Cyan

$root = $PSScriptRoot
$apiDir = Join-Path $root "apps\api"
$webDir = Join-Path $root "apps\web"

# Check for GROQ API key
$groqKey = $env:GROQ_API_KEY
if (-not $groqKey) {
    $envFile = Join-Path $apiDir ".env"
    if (Test-Path $envFile) {
        $content = Get-Content $envFile
        $keyLine = $content | Where-Object { $_ -match "^GROQ_API_KEY=" }
        if ($keyLine) { $groqKey = ($keyLine -split "=", 2)[1] }
    }
}

if (-not $groqKey) {
    Write-Host "⚠  GROQ_API_KEY not set in apps\api\.env" -ForegroundColor Yellow
    Write-Host "   Get a free key at: https://console.groq.com" -ForegroundColor Gray
    Write-Host "   Add it to apps\api\.env as: GROQ_API_KEY=your_key`n" -ForegroundColor Gray
}

Write-Host "Starting FastAPI backend on http://localhost:8000 ..." -ForegroundColor Green
$apiJob = Start-Process powershell -ArgumentList "-NoExit", "-Command", @"
  Set-Location '$apiDir'
  Write-Host 'FastAPI backend starting...' -ForegroundColor Green
  & '.\venv\Scripts\uvicorn.exe' main:app --reload --port 8000
"@ -PassThru

Start-Sleep -Seconds 2

Write-Host "Starting Next.js frontend on http://localhost:3000 ..." -ForegroundColor Blue
$webJob = Start-Process powershell -ArgumentList "-NoExit", "-Command", @"
  Set-Location '$webDir'
  Write-Host 'Next.js frontend starting...' -ForegroundColor Blue
  npm run dev
"@ -PassThru

Write-Host "`n✅ Both servers starting in separate windows" -ForegroundColor Cyan
Write-Host "   Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "   Backend:  http://localhost:8000" -ForegroundColor White
Write-Host "   API Docs: http://localhost:8000/docs`n" -ForegroundColor White
