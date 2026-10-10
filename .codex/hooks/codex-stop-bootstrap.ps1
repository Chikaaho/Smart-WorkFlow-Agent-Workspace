# Source of the Windows EncodedCommand in .codex/hooks.json.
# EncodedCommand prevents the host's selected shell from expanding PowerShell
# variables before the child starts. Do not consume the hook's stdin here.
$ProgressPreference = 'SilentlyContinue'
$root = (Get-Location).Path
for ($index = 0; $index -lt 16 -and $root; $index++) {
    $adapter = Join-Path $root '.codex/hooks/codex-stop-adapter.ps1'
    if (Test-Path -LiteralPath $adapter -PathType Leaf) {
        & $adapter
        exit $LASTEXITCODE
    }
    $root = Split-Path -Parent $root
}
[Console]::Error.WriteLine('Codex Stop Gate: governance root unavailable')
exit 2
