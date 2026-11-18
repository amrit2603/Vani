$ErrorActionPreference = 'Stop'
$project = Split-Path $PSScriptRoot -Parent
$port = 8788
if (Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue) {
    throw "Test needs unused port $port; no existing process was stopped."
}
$serverPid = $null
try {
    & (Join-Path $project 'open.ps1') -Port $port -NoBrowser
    $listener = Get-NetTCPConnection -LocalPort $port -State Listen
    $serverPid = $listener.OwningProcess
    if ($listener.LocalAddress -ne '127.0.0.1') { throw 'Server must stay on localhost.' }
    & (Join-Path $project 'open.ps1') -Port $port -NoBrowser
    if ((Get-NetTCPConnection -LocalPort $port -State Listen).OwningProcess -ne $serverPid) {
        throw 'Launcher started a duplicate server.'
    }
    Write-Host 'Cold start, health check, localhost binding and existing-server reuse passed.'
} finally {
    if ($serverPid) { Stop-Process -Id $serverPid }
}
