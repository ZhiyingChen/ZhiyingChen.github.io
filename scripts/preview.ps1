param([int]$Port = 1313)
$ErrorActionPreference = 'Stop'
$SiteRoot = Split-Path -Parent $PSScriptRoot
$LocalHugo = Join-Path $SiteRoot '.tools\hugo\hugo.exe'
$HugoCommand = if (Test-Path -LiteralPath $LocalHugo) { $LocalHugo } else { (Get-Command hugo -ErrorAction Stop).Source }
Push-Location $SiteRoot
try {
    & $HugoCommand server --bind 127.0.0.1 --port $Port --baseURL "http://localhost:$Port/" --disableFastRender
    if ($LASTEXITCODE -ne 0) { throw "Hugo exited with code $LASTEXITCODE" }
} finally {
    Pop-Location
}
