# Focused adapter diagnostics tests; no host messages or production runtime writes.
[CmdletBinding()]
param()
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
. (Join-Path $PSScriptRoot 'windows-validator-runtime.ps1')
$tokens=$null; $errors=$null
$ast=[System.Management.Automation.Language.Parser]::ParseFile((Join-Path $PSScriptRoot 'stop-gate.ps1'),[ref]$tokens,[ref]$errors)
foreach($name in @('Invoke-TerminalValidator','Add-ValidatorAudit')) {
    $function=$ast.Find({param($node) $node -is [System.Management.Automation.Language.FunctionDefinitionAst] -and $node.Name -eq $name},$true)
    Invoke-Expression $function.Extent.Text
}
$work=Join-Path ([System.IO.Path]::GetTempPath()) ('ace-validator-diagnostics-' + [guid]::NewGuid().ToString('N'))
[void][System.IO.Directory]::CreateDirectory($work)
$passed=0; $failed=0
function Assert-Diagnostic {
    param([string] $Name,[bool] $Condition)
    if($Condition){$script:passed++;Write-Output "PASS $Name"}else{$script:failed++;Write-Output "FAIL $Name"}
}
try {
    $fixtures=@{
        console="[Console]::Error.WriteLine('terminal: controlled error'); exit 7"
        powershell="Write-Error 'controlled PowerShell error' -ErrorAction Continue; exit 7"
        exception="throw 'controlled exception containing private input'"
        silent='exit 9009'
        no_exit='return'
    }
    foreach($name in $fixtures.Keys) {
        $fixture=Join-Path $work "$name.ps1"
        $header="param([string] `$InputJson,[Alias('ExecutionContext')][switch] `$ContextMode,[string] `$PythonExecutable)`n"
        [System.IO.File]::WriteAllText($fixture,$header+$fixtures[$name],[System.Text.UTF8Encoding]::new($true))
        $result=Invoke-TerminalValidator -ValidatorPath $fixture -TerminalJson '{}'
        Assert-Diagnostic $name ($result.exitCode -ne 0 -and @($result.diagnostics).Count -gt 0)
        if($name -eq 'silent'){Assert-Diagnostic 'silent-exit-code' ($result.exitCode -eq 9009 -and ($result.diagnostics -join ' ') -match '9009')}
        if($name -eq 'exception'){Assert-Diagnostic 'exception-redacted' ($result.exception_type -eq 'RuntimeException' -and ($result.diagnostics -join ' ') -notmatch 'private input')}
    }
    $validatorAudit=[System.Collections.Generic.List[object]]::new()
    $synthetic=@{exitCode=7;diagnostics=@('terminal: tool_results: private-input-123');interpreter='<user>/python.exe';exception_type=''}
    Add-ValidatorAudit -Phase 'TERMINAL' -Result $synthetic
    $audit=$validatorAudit.ToArray() | ConvertTo-Json -Depth 8 -Compress
    Assert-Diagnostic 'audit-redacted' ($audit -notmatch 'private-input-123' -and $audit -match 'terminal:tool_results' -and $audit -match 'exit_code')
    $identity=Get-ValidatorInterpreterIdentity 'C:\Users\someone\AppData\Local\Programs\Python\python.exe'
    Assert-Diagnostic 'interpreter-redacted' ($identity -notmatch 'someone' -and $identity -match '<user>')
    $powerShell=Join-Path $env:SystemRoot 'System32/WindowsPowerShell/v1.0/powershell.exe'
    $launcher=Join-Path $PSScriptRoot 'zcode-stop-launcher.ps1'
    $payload='{"last_assistant_message":"中文载荷"}'
    $bodies=@{
        pass='exit 0'
        block="Write-Output '{`"decision`":`"block`",`"reason`":`"controlled block`"}'; exit 0"
        contaminated="Write-Output 'unexpected banner'; exit 0"
        failure='exit 9009'
    }
    foreach($name in $bodies.Keys){
        $fixture=Join-Path $work "launcher-$name.ps1"
        [System.IO.File]::WriteAllText($fixture,$bodies[$name],[System.Text.UTF8Encoding]::new($true))
        $arguments=@('-NoProfile','-NonInteractive','-ExecutionPolicy','Bypass','-File',$launcher,'-GateScript',$fixture,'-RuntimeRoot',(Join-Path $work "runtime-$name"))
        $result=Invoke-GovernanceProcess -Executable $powerShell -Arguments $arguments -InputText $payload -TimeoutMs 12000
        $valid=$result.exitCode -eq 0 -and -not $result.failure
        if($name -eq 'pass'){$valid=$valid -and -not $result.stdout -and -not $result.stderr}
        else{try{$output=$result.stdout | ConvertFrom-Json;$valid=$valid -and $output.decision -eq 'block' -and $result.stdout -notmatch 'unexpected banner'}catch{$valid=$false}}
        Assert-Diagnostic "launcher-$name" $valid
    }
    $counter=Join-Path $work 'retry-payload.txt'
    $fixture=Join-Path $work 'launcher-retry.ps1'
    $body=@'
$reader=[System.IO.StreamReader]::new([Console]::OpenStandardInput(),[System.Text.UTF8Encoding]::new($false),$true)
$body=$reader.ReadToEnd();$reader.Dispose()
$path=Join-Path $PSScriptRoot 'retry-payload.txt'
if(-not(Test-Path -LiteralPath $path)){[System.IO.File]::WriteAllText($path,$body,[System.Text.UTF8Encoding]::new($false));exit 9}
if([System.IO.File]::ReadAllText($path) -ne $body){exit 8}
Write-Output '{"decision":"block","reason":"same payload on retry"}'
exit 0
'@
    [System.IO.File]::WriteAllText($fixture,$body,[System.Text.UTF8Encoding]::new($true))
    $result=Invoke-GovernanceProcess -Executable $powerShell -Arguments @('-NoProfile','-NonInteractive','-ExecutionPolicy','Bypass','-File',$launcher,'-GateScript',$fixture,'-RuntimeRoot',(Join-Path $work 'runtime-retry')) -InputText $payload -TimeoutMs 12000
    Assert-Diagnostic 'launcher-retry' ($result.exitCode -eq 0 -and $result.stdout -match 'same payload on retry' -and [System.IO.File]::ReadAllText($counter) -eq $payload)
} finally {
    $resolved=[System.IO.Path]::GetFullPath($work)
    $temporary=[System.IO.Path]::GetFullPath([System.IO.Path]::GetTempPath())
    if(-not $resolved.StartsWith($temporary,[System.StringComparison]::OrdinalIgnoreCase)){throw 'cleanup path outside own temp workspace'}
    Remove-Item -LiteralPath $resolved -Recurse -Force
}
Write-Output "windows-validator-diagnostics cases=$($passed+$failed) passed=$passed failed=$failed"
if($failed){exit 1}
exit 0
