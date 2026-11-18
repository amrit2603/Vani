param([int]$Port = 8787)
$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
$python = Join-Path $PSScriptRoot '.venv\Scripts\python.exe'
if (-not (Test-Path -LiteralPath $python)) {
    throw 'Run .\setup.ps1 first.'
}
Write-Host "Vani: http://127.0.0.1:$Port (Ctrl+C to stop)"
& $python -m uvicorn app:app --host 127.0.0.1 --port $Port --workers 1 --limit-concurrency 8 --timeout-keep-alive 5 --no-access-log
exit $LASTEXITCODE
