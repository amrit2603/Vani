param([ValidateRange(1024, 65535)][int]$Port = 8787, [switch]$NoBrowser)
$ErrorActionPreference = 'Stop'
$url = "http://127.0.0.1:$Port"
function Test-Vani {
    try {
        $health = Invoke-RestMethod "$url/api/health" -TimeoutSec 2
        return $health.status -eq 'ok' -and $health.model -eq 'Qwen/Qwen3-ASR-0.6B'
    } catch { return $false }
}
if (-not (Test-Vani)) {
    $connection = New-Object System.Net.Sockets.TcpClient
    try {
        $connect = $connection.ConnectAsync('127.0.0.1', $Port)
        if ($connect.Wait(500) -and $connection.Connected) {
            throw "Port $Port is in use by a different or unresponsive app. Close it or use .\open.ps1 -Port 8788."
        }
    } catch [System.AggregateException] {
        # A refused connection means this port is available.
    } finally { $connection.Dispose() }
    $python = Join-Path $PSScriptRoot '.venv\Scripts\python.exe'
    if (-not (Test-Path -LiteralPath $python)) { throw 'First run setup.ps1 in this folder, then open Vani again.' }
    $logs = Join-Path $PSScriptRoot '.cache'
    New-Item -ItemType Directory -Force -Path $logs | Out-Null
    $server = Start-Process -FilePath $python -ArgumentList @(
        '-m', 'uvicorn', 'app:app', '--host', '127.0.0.1', '--port', $Port,
        '--workers', '1', '--limit-concurrency', '32', '--timeout-keep-alive', '5', '--no-access-log'
    ) -WorkingDirectory $PSScriptRoot -WindowStyle Hidden -PassThru `
      -RedirectStandardOutput (Join-Path $logs "server-$Port.out.log") `
      -RedirectStandardError (Join-Path $logs "server-$Port.err.log")
    $ready = $false
    for ($attempt = 0; $attempt -lt 20; $attempt++) {
        if ($server.HasExited) { throw "Vani could not start. See .cache\server-$Port.err.log." }
        if (Test-Vani) { $ready = $true; break }
        Start-Sleep -Milliseconds 250
    }
    if (-not $ready) { throw "Vani is not responding yet. See .cache\server-$Port.err.log, then try again." }
}
Write-Host "Vani is ready: $url"
if (-not $NoBrowser) { Start-Process -FilePath "$url/#dictate" }
