# ZCode 门禁契约测试：Stop Gate 与 UserPromptSubmit 角色绑定
#
# 只测宿主接入与门禁接线；终态字段规则由 test-terminal-contract.ps1/.sh 覆盖。

[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
# 与 ZCode 宿主一致：按 UTF-8 解码被测 hook 的 stdout/stderr。
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)

$rootDir = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
. (Join-Path $PSScriptRoot 'zcode-gate-common.ps1')
$gatePath = Join-Path $rootDir '.codex/governance/stop-gate.ps1'
$rolePath = Join-Path $rootDir '.codex/governance/session-role.ps1'
$powerShellExe = (Get-Process -Id $PID).Path
$workDir = Join-Path ([System.IO.Path]::GetTempPath()) ("ace-zcode-gate-test-{0}" -f [guid]::NewGuid().ToString('N'))
$runtime = Join-Path $workDir 'runtime'
$sessions = Join-Path $runtime 'sessions'
New-Item -ItemType Directory -Path $sessions -Force | Out-Null
$passed = 0
$failed = 0

function Write-JsonFile {
    param(
        [Parameter(Mandatory = $true)] [string] $Path,
        [Parameter(Mandatory = $true)] [object] $Value
    )

    $json = $Value | ConvertTo-Json -Depth 12 -Compress
    [System.IO.File]::WriteAllText($Path, $json, [System.Text.UTF8Encoding]::new($false))
    return $Path
}

function New-RoleFile {
    param(
        [string] $Session = 'sess_test_0001',
        [string] $Role = 'executor'
    )

    return Write-JsonFile -Path (Join-Path $sessions "$Session.role.json") -Value ([ordered] @{
        schema            = 'agent-coding-engine.zcode-session-role.v1'
        session_id_digest = 'test'
        role              = $Role
        source            = 'test'
    })
}

function New-ObservationFile {
    param(
        [int] $Open = 0,
        [string] $FirstItem = 'EV-02b：采集可见浏览器证据',
        [string] $Status = 'in_progress',
        [int] $ContextTokens = 0,
        [int] $ContextLimit = 0,
        [bool] $ContextExceeded = $false
    )

    $items = @()
    if ($Open -gt 0) { $items = @([ordered] @{ position = 0; status = $Status; content = $FirstItem }) }
    $context = [ordered] @{ available = $false; error = 'context-not-injected' }
    if ($ContextLimit -gt 0) {
        $context = [ordered] @{
            available        = $true
            tokens           = $ContextTokens
            limit            = $ContextLimit
            percent          = [Math]::Round($ContextTokens / $ContextLimit * 100, 1)
            model            = 'GLM-5.3-Flash'
            context_exceeded = $ContextExceeded
        }
    }
    $path = Join-Path $workDir ("observation-{0}.json" -f [guid]::NewGuid().ToString('N'))
    return Write-JsonFile -Path $path -Value ([ordered] @{
        schema     = 'agent-coding-engine.zcode-session-observation.v1'
        session_id = 'sess_test_0001'
        todo       = [ordered] @{ available = $true; open = $Open; open_items = $items }
        context    = $context
    })
}

function New-StopPayloadFile {
    param(
        [string] $Message,
        [int] $ToolCount = 3,
        [bool] $Active = $false,
        [string] $Session = 'sess_test_0001'
    )

    $path = Join-Path $workDir ("payload-{0}.json" -f [guid]::NewGuid().ToString('N'))
    return Write-JsonFile -Path $path -Value ([ordered] @{
        hook_event_name        = 'Stop'
        session_id             = $Session
        cwd                    = $rootDir
        agentName              = 'main'
        mode                   = 'yolo'
        toolCallCount          = $ToolCount
        stop_hook_active       = $Active
        transcript_path        = $path
        responsePreview        = $Message
        last_assistant_message = $Message
        traceId                = 'trace-test'
        turnId                 = 'turn-test'
    })
}

function Invoke-Gate {
    param(
        [Parameter(Mandatory = $true)] [string] $PayloadFile,
        [string] $ObservationFile = '',
        [switch] $Audit
    )

    $arguments = @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $gatePath, '-InputFile', $PayloadFile, '-EngineRoot', $rootDir, '-RuntimeRoot', $runtime)
    if (-not $Audit) { $arguments += '-NoAudit' }
    if (-not [string]::IsNullOrWhiteSpace($ObservationFile)) { $arguments += @('-ObservationFile', $ObservationFile) }
    # fail-closed 用例会在 stderr 输出诊断；此处必须允许非终止错误，否则测试会被中止。
    $previousPreference = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        $raw = & $powerShellExe @arguments 2>&1 | Out-String
        $exitCode = $LASTEXITCODE
    } finally {
        $ErrorActionPreference = $previousPreference
    }
    return @{ exitCode = $exitCode; output = $raw.Trim() }
}

function Test-GateCase {
    param(
        [Parameter(Mandatory = $true)] [string] $Name,
        [Parameter(Mandatory = $true)] [string] $PayloadFile,
        [ValidateSet('pass', 'block')] [string] $Expected,
        [string] $ExpectedText = '',
        [string] $ObservationFile = '',
        [int] $ExpectedExit = 0,
        [switch] $Audit
    )

    $result = Invoke-Gate -PayloadFile $PayloadFile -ObservationFile $ObservationFile -Audit:$Audit
    $problems = @()
    if ($result.exitCode -ne $ExpectedExit) { $problems += "exit=$($result.exitCode) expected=$ExpectedExit" }
    $parsed = $null
    if ($Expected -eq 'pass') {
        if (-not [string]::IsNullOrWhiteSpace($result.output)) { $problems += "expected-empty-output got=$($result.output)" }
    } else {
        $parsed = $null
        try { $parsed = $result.output | ConvertFrom-Json } catch { $problems += 'output-is-not-json' }
        if ($null -ne $parsed) {
            $keys = @($parsed.PSObject.Properties.Name | Sort-Object)
            if (($keys -join ',') -ne 'decision,reason') { $problems += "keys=$($keys -join ',')" }
            if ($parsed.decision -ne 'block') { $problems += "decision=$($parsed.decision)" }
            if ([string]::IsNullOrWhiteSpace($parsed.reason)) { $problems += 'reason-empty' }
        }
    }
    if (-not [string]::IsNullOrWhiteSpace($ExpectedText)) {
        $compact = ($result.output -replace '\s', '')
        $compactExpected = ($ExpectedText -replace '\s', '')
        if (-not $compact.Contains($compactExpected)) { $problems += "missing-text=$ExpectedText" }
    }
    if ($problems.Count -eq 0) {
        $script:passed++
    } else {
        $script:failed++
        Write-Output "FAIL $Name :: $($problems -join ' | ') :: output=$($result.output)"
    }
}

function Test-RoleCase {
    param(
        [Parameter(Mandatory = $true)] [string] $Name,
        [Parameter(Mandatory = $true)] [string] $Prompt,
        [string] $Session = 'sess_role_case',
        [string] $ExpectedRole = ''
    )

    $payloadFile = Join-Path $workDir ("role-{0}.json" -f [guid]::NewGuid().ToString('N'))
    Write-JsonFile -Path $payloadFile -Value ([ordered] @{
        hook_event_name = 'UserPromptSubmit'
        session_id      = $Session
        cwd             = $rootDir
        prompt          = $Prompt
    }) | Out-Null
    $roleFile = Join-Path $sessions "$Session.role.json"
    if (Test-Path -LiteralPath $roleFile) { Remove-Item -LiteralPath $roleFile -Force }
    $previousPreference = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        $output = & $powerShellExe -NoProfile -ExecutionPolicy Bypass -File $rolePath -InputFile $payloadFile -EngineRoot $rootDir -RuntimeRoot $runtime -NoAudit 2>&1 | Out-String
    } finally {
        $ErrorActionPreference = $previousPreference
    }
    $actualRole = ''
    if (Test-Path -LiteralPath $roleFile) {
        $actualRole = (Get-Content -LiteralPath $roleFile -Raw | ConvertFrom-Json).role
    }
    if ($actualRole -eq $ExpectedRole -and [string]::IsNullOrWhiteSpace($output)) {
        $script:passed++
    } else {
        $script:failed++
        Write-Output "FAIL $Name :: role='$actualRole' expected='$ExpectedRole' output=$output"
    }
}

$completedS = '{"schema":"agent-coding-engine.executor-terminal.v2","role":"executor","state":"TASK_COMPLETED","task_level":"S","evidence":["focused-check:0"]}'
$blockedL = '{"schema":"agent-coding-engine.executor-terminal.v2","role":"executor","state":"BLOCKED","task_level":"L","receipt":"product/demo/receipts/blocked.md","evidence":["error"],"block_type":"EXTERNAL","attempted":["retry"],"release_condition":"user secret supplied","work_items":[{"id":"browser-login","status":"BLOCKED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"等待用户提供秘密"}],"remaining_actionable_count":0,"independent_work_exhausted":true,"next_action":"等待用户提供秘密","next_action_type":"WAIT_EXTERNAL","progress_fingerprint":"fp-blocked-1","progress_basis":{"files_changed":["login-check"],"tool_actions":["browser.login"],"new_evidence":["error"],"closed_work_items":[]},"stop_reason":"EXTERNAL_DEPENDENCY","tool_results":[{"tool":"browser.login","outcome":"REQUIRES_SECRET","detail":"受支持会话要求用户秘密，当前未提供"}],"browser_status":"REQUIRES_SECRET"}'
$executionMissingFields = '{"schema":"agent-coding-engine.executor-terminal.v2","role":"executor","state":"EXECUTION_SUBMITTED","task_level":"L","evidence":["x"],"feature_status":"VERIFYING"}'

$noObservation = New-ObservationFile -Open 0

# --- 角色绑定 -------------------------------------------------------------
New-RoleFile -Role 'executor' | Out-Null
Test-GateCase -Name 'executor_no_marker_blocks' -PayloadFile (New-StopPayloadFile -Message '已完成一部分，接下来继续处理剩余项。') -Expected block -ExpectedText '契约终态行' -ObservationFile $noObservation
Test-GateCase -Name 'executor_marker_ok_without_open_items' -PayloadFile (New-StopPayloadFile -Message ("聚焦检查通过。`nENGINE_TERMINAL " + $completedS)) -Expected pass -ObservationFile $noObservation
Test-GateCase -Name 'executor_two_markers_block' -PayloadFile (New-StopPayloadFile -Message ("ENGINE_TERMINAL " + $completedS + "`nENGINE_TERMINAL " + $completedS)) -Expected block -ExpectedText '多次' -ObservationFile $noObservation
Test-GateCase -Name 'executor_marker_not_last_block' -PayloadFile (New-StopPayloadFile -Message ("ENGINE_TERMINAL " + $completedS + "`n补充说明")) -Expected block -ExpectedText '末行' -ObservationFile $noObservation
Test-GateCase -Name 'executor_marker_invalid_json_block' -PayloadFile (New-StopPayloadFile -Message "收尾。`nENGINE_TERMINAL {not-json}") -Expected block -ExpectedText 'JSON' -ObservationFile $noObservation
Test-GateCase -Name 'executor_contract_rejected_block' -PayloadFile (New-StopPayloadFile -Message ("提交。`nENGINE_TERMINAL " + $executionMissingFields)) -Expected block -ExpectedText 'Validator' -ObservationFile $noObservation
Test-GateCase -Name 'executor_blocked_contract_passes' -PayloadFile (New-StopPayloadFile -Message ("真实外部阻塞。`nENGINE_TERMINAL " + $blockedL)) -Expected pass -ObservationFile $noObservation
Test-GateCase -Name 'executor_open_checklist_blocks' -PayloadFile (New-StopPayloadFile -Message ("聚焦检查通过。`nENGINE_TERMINAL " + $completedS)) -Expected block -ExpectedText '自定任务清单' -ObservationFile (New-ObservationFile -Open 3)
Test-GateCase -Name 'executor_open_checklist_blocks_zero_tool_turn' -PayloadFile (New-StopPayloadFile -ToolCount 0 -Message '本回合先汇报进展。') -Expected block -ExpectedText '自定任务清单' -ObservationFile (New-ObservationFile -Open 1)
Test-GateCase -Name 'executor_zero_tool_turn_without_open_items_passes' -PayloadFile (New-StopPayloadFile -ToolCount 0 -Message '本回合只回答问题。') -Expected pass -ObservationFile $noObservation

New-RoleFile -Role 'admin' | Out-Null
Test-GateCase -Name 'admin_session_ungated' -PayloadFile (New-StopPayloadFile -Message '这里是管理员回合的自然语言收尾。') -Expected pass
New-RoleFile -Role 'planner' | Out-Null
Test-GateCase -Name 'planner_session_ungated' -PayloadFile (New-StopPayloadFile -Message '规划结论如下。') -Expected pass
Remove-Item -LiteralPath (Join-Path $sessions 'sess_test_0001.role.json') -Force
Test-GateCase -Name 'unbound_session_ungated' -PayloadFile (New-StopPayloadFile -Message '未声明角色。') -Expected pass

# --- 无进展升级与审计 -----------------------------------------------------
New-RoleFile -Session 'sess_repeat_case' -Role 'executor' | Out-Null
$repeatPayload = New-StopPayloadFile -Session 'sess_repeat_case' -Message '仍未完成，稍后继续。'
Test-GateCase -Name 'repeat_first_block' -PayloadFile $repeatPayload -Expected block -ObservationFile $noObservation
Test-GateCase -Name 'repeat_second_block_escalates' -PayloadFile $repeatPayload -Expected block -ExpectedText '最小原子动作' -ObservationFile $noObservation
Test-GateCase -Name 'repeat_third_block_switches_path' -PayloadFile $repeatPayload -Expected block -ExpectedText '切换' -ObservationFile $noObservation

# --- 宿主入口包装层（cmd）----------------------------------------------
function Test-WrapperCase {
    param(
        [Parameter(Mandatory = $true)] [string] $Name,
        [Parameter(Mandatory = $true)] [string] $PayloadFile,
        [string] $GateScript = '',
        [string] $ExpectedText = '',
        [int] $ExpectedExit = 0,
        [switch] $ExpectJson
    )

    $wrapper = Join-Path $rootDir '.codex/hooks/zcode-stop-gate.cmd'
    $logDir = Join-Path $workDir ("wrapper-log-{0}" -f [guid]::NewGuid().ToString('N'))
    # 包装层不带 -RuntimeRoot，门禁读生产运行时目录，因此测试会话的角色文件写在那里并事后清理。
    $productionSessions = Join-Path $rootDir '.codex/governance/runtime/zcode/sessions'
    $productionRoleFile = Join-Path $productionSessions 'sess_wrap_case.role.json'
    if (-not (Test-Path -LiteralPath $productionSessions -PathType Container)) { New-Item -ItemType Directory -Path $productionSessions -Force | Out-Null }
    [System.IO.File]::WriteAllText($productionRoleFile, '{"role":"executor"}', [System.Text.UTF8Encoding]::new($false))
    $previousGate = $env:ZCODE_GATE_SCRIPT
    $previousLog = $env:ZCODE_GATE_LOGDIR
    $previousRoot = $env:ZCODE_PROJECT_DIR
    $env:ZCODE_PROJECT_DIR = $rootDir
    $env:ZCODE_GATE_LOGDIR = $logDir
    if ([string]::IsNullOrWhiteSpace($GateScript)) { Remove-Item Env:\ZCODE_GATE_SCRIPT -ErrorAction SilentlyContinue } else { $env:ZCODE_GATE_SCRIPT = $GateScript }
    $previousPreference = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        $startInfo = [System.Diagnostics.ProcessStartInfo]::new()
        $startInfo.FileName = $env:ComSpec
        $startInfo.Arguments = "/d /s /c `"`"$wrapper`"`""
        $startInfo.WorkingDirectory = $rootDir
        $startInfo.UseShellExecute = $false
        $startInfo.RedirectStandardInput = $true
        $startInfo.RedirectStandardOutput = $true
        $startInfo.RedirectStandardError = $true
        $startInfo.StandardOutputEncoding = [System.Text.UTF8Encoding]::new($false)
        $startInfo.StandardErrorEncoding = [System.Text.UTF8Encoding]::new($false)
        $process = [System.Diagnostics.Process]::Start($startInfo)
        $process.StandardInput.Write([System.IO.File]::ReadAllText($PayloadFile, [System.Text.Encoding]::UTF8))
        $process.StandardInput.Close()
        $stdout = $process.StandardOutput.ReadToEnd()
        $stderr = $process.StandardError.ReadToEnd()
        $process.WaitForExit()
        $raw = $stdout + $stderr
        $exitCode = $process.ExitCode
    } finally {
        $ErrorActionPreference = $previousPreference
        if ($null -eq $previousGate) { Remove-Item Env:\ZCODE_GATE_SCRIPT -ErrorAction SilentlyContinue } else { $env:ZCODE_GATE_SCRIPT = $previousGate }
        if ($null -eq $previousLog) { Remove-Item Env:\ZCODE_GATE_LOGDIR -ErrorAction SilentlyContinue } else { $env:ZCODE_GATE_LOGDIR = $previousLog }
        if ($null -eq $previousRoot) { Remove-Item Env:\ZCODE_PROJECT_DIR -ErrorAction SilentlyContinue } else { $env:ZCODE_PROJECT_DIR = $previousRoot }
    }

    $problems = @()
    if ($exitCode -ne $ExpectedExit) { $problems += "exit=$exitCode expected=$ExpectedExit" }
    if ($ExpectJson) {
        $trimmed = $stdout.Trim()
        if (-not $trimmed.StartsWith('{')) { $problems += "stdout-not-json=$($trimmed.Substring(0, [Math]::Min(80, $trimmed.Length)))" }
        else {
            $parsed = ConvertFrom-GateJson -Text $trimmed
            if ($null -eq $parsed -or (Get-GateJsonText $parsed 'decision') -ne 'block') { $problems += "decision-not-block=$trimmed" }
        }
    }
    if (-not [string]::IsNullOrWhiteSpace($ExpectedText)) {
        if (-not (($raw -replace '\s', '').Contains(($ExpectedText -replace '\s', '')))) { $problems += "missing-text=$ExpectedText" }
    }
    if (Test-Path -LiteralPath $productionRoleFile) { Remove-Item -LiteralPath $productionRoleFile -Force }
    if ($problems.Count -eq 0) { $script:passed++ } else { $script:failed++; Write-Output "FAIL $Name :: $($problems -join ' | ') :: output=$($raw.Trim())" }
}

New-RoleFile -Session 'sess_wrap_case' -Role 'executor' | Out-Null
$wrapperPayload = New-StopPayloadFile -Session 'sess_wrap_case' -Message '上下文已达物理极限，我先停下等压缩。'
Test-WrapperCase -Name 'wrapper_block_normal' -PayloadFile $wrapperPayload -ExpectJson -ExpectedText 'ENGINE_TERMINAL'
Test-WrapperCase -Name 'wrapper_fallback_block' -PayloadFile $wrapperPayload -GateScript (Join-Path $workDir 'missing-gate.ps1') -ExpectJson -ExpectedText 'failed twice'

# --- “上下文已满”自我估计：必须有宿主实测证据 ---------------------------
$lowUsage = New-ObservationFile -Open 0 -ContextTokens 584256 -ContextLimit 1000000
$highUsage = New-ObservationFile -Open 0 -ContextTokens 920000 -ContextLimit 1000000
$overUsage = New-ObservationFile -Open 0 -ContextTokens 990000 -ContextLimit 1000000 -ContextExceeded $true
$contextClaimMessage = "上下文窗口已接近上限，我先保存状态并输出终态行，等待压缩后续作。`nENGINE_TERMINAL " + $completedS
Test-GateCase -Name 'context_claim_low_usage_blocks' -PayloadFile (New-StopPayloadFile -Session 'sess_repeat_case' -Message $contextClaimMessage) -Expected block -ExpectedText '未接近上限' -ObservationFile $lowUsage
Test-GateCase -Name 'context_claim_high_usage_still_blocks' -PayloadFile (New-StopPayloadFile -Session 'sess_repeat_case' -Message $contextClaimMessage) -Expected block -ExpectedText '上下文压缩由宿主自动完成' -ObservationFile $highUsage
Test-GateCase -Name 'context_claim_with_host_overflow_still_blocks' -PayloadFile (New-StopPayloadFile -Session 'sess_repeat_case' -Message $contextClaimMessage) -Expected block -ExpectedText '按自动压缩并重试请求完成的' -ObservationFile $overUsage
Test-GateCase -Name 'context_claim_without_measurement_still_blocks' -PayloadFile (New-StopPayloadFile -Session 'sess_repeat_case' -Message $contextClaimMessage) -Expected block -ExpectedText '宿主未提供上下文实测值' -ObservationFile $noObservation
Test-GateCase -Name 'no_context_claim_low_usage_passes' -PayloadFile (New-StopPayloadFile -Session 'sess_repeat_case' -Message ("聚焦检查通过。`nENGINE_TERMINAL " + $completedS)) -Expected pass -ObservationFile $lowUsage
Test-GateCase -Name 'context_claim_low_usage_blocks_zero_tool_turn' -PayloadFile (New-StopPayloadFile -Session 'sess_repeat_case' -ToolCount 0 -Message '上下文快满了，先停在这里等你确认。') -Expected block -ExpectedText '宿主实测最近一次模型请求输入 584256 / 上限 1000000' -ObservationFile $lowUsage
Test-GateCase -Name 'context_claim_with_valid_blocked_contract_passes' -PayloadFile (New-StopPayloadFile -Session 'sess_repeat_case' -Message ("上下文已满，且宿主已确认外部依赖不可用。`nENGINE_TERMINAL " + $blockedL)) -Expected pass -ObservationFile $overUsage

$auditPayload = New-StopPayloadFile -Message '仍未完成，稍后继续。' -Session 'sess_audit_case'
New-RoleFile -Session 'sess_audit_case' -Role 'executor' | Out-Null
Test-GateCase -Name 'audit_case_blocks' -PayloadFile $auditPayload -Expected block -ObservationFile $noObservation -Audit
$auditFile = Join-Path $runtime 'audit.jsonl'
$auditOk = $false
if (Test-Path -LiteralPath $auditFile) {
    $records = @(Get-Content -LiteralPath $auditFile | Where-Object { -not [string]::IsNullOrWhiteSpace($_) })
    $last = $records[-1] | ConvertFrom-Json
    $auditOk = $last.reason_code -eq 'MARKER_MISSING' -and $last.decision -eq 'block' -and $last.gated -eq 1 -and $last.ts -match '^\d{4}-\d{2}-\d{2}T'
}
if ($auditOk) { $passed++ } else { $failed++; Write-Output 'FAIL audit_record_missing_or_wrong' }

# --- 角色绑定入口 ---------------------------------------------------------
Test-RoleCase -Name 'role_declared_admin' -Prompt '你是管理员，检查一下项目hook门禁。' -ExpectedRole 'admin'
Test-RoleCase -Name 'role_declared_executor' -Prompt '本会话角色为执行，请从提示05继续。' -ExpectedRole 'executor'
Test-RoleCase -Name 'role_declared_planner' -Prompt '角色：规划。请形成方向。' -ExpectedRole 'planner'
Test-RoleCase -Name 'role_declared_as_admin' -Prompt '以管理员身份维护治理实现。' -ExpectedRole 'admin'
Test-RoleCase -Name 'role_mentioned_not_declared' -Prompt '让执行角色去做这件事，规划先给出方向。' -ExpectedRole ''
Test-RoleCase -Name 'role_ambiguous_not_bound' -Prompt '本会话角色是执行，你的身份是管理员。' -ExpectedRole ''

# --- 宿主载荷异常：fail closed -------------------------------------------
$invalidPayload = Join-Path $workDir 'payload-invalid.json'
[System.IO.File]::WriteAllText($invalidPayload, '{not-json', [System.Text.UTF8Encoding]::new($false))
$invalidResult = Invoke-Gate -PayloadFile $invalidPayload
if ($invalidResult.exitCode -eq 2 -and $invalidResult.output.Contains('不能结束')) {
    $passed++
} else {
    $failed++
    Write-Output "FAIL invalid_payload_fail_closed :: exit=$($invalidResult.exitCode) output=$($invalidResult.output)"
}

# --- 宿主按 UTF-8 解码 hook 输出：字节级校验 ------------------------------
$rawPayload = New-StopPayloadFile -Session 'sess_repeat_case' -Message '仍未完成，稍后继续。'
$rawOut = Join-Path $workDir 'raw-stdout.txt'
$rawErr = Join-Path $workDir 'raw-stderr.txt'
$rawArguments = @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $gatePath, '-InputFile', $rawPayload, '-EngineRoot', $rootDir, '-RuntimeRoot', $runtime, '-NoAudit', '-ObservationFile', $noObservation)
$commandLine = (@('powershell.exe') + ($rawArguments | ForEach-Object { '"' + $_ + '"' })) -join ' '
& cmd.exe /c "$commandLine > `"$rawOut`" 2> `"$rawErr`""
$utf8Detail = ''
$utf8Ok = $false
try {
    $decoded = [System.Text.UTF8Encoding]::new($false, $true).GetString([System.IO.File]::ReadAllBytes($rawOut))
    $utf8Ok = $decoded.Contains('执行会话不能结束') -and $decoded.Contains('契约')
    $utf8Detail = $decoded.Substring(0, [Math]::Min(100, $decoded.Length))
} catch {
    $utf8Detail = 'not-valid-utf8: ' + $_.Exception.Message
}
if ($utf8Ok) { $passed++ } else { $failed++; Write-Output "FAIL utf8_stdout :: $utf8Detail" }

Remove-Item -LiteralPath $workDir -Recurse -Force
Write-Output "stop-gate-windows cases=$($passed + $failed) passed=$passed failed=$failed"
if ($failed -gt 0) { exit 1 }
exit 0
