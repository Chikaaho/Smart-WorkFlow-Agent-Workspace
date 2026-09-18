@echo off
rem ZCode Stop gate host entry (wrapper).
rem - Calls the PowerShell gate through the host's cmd shell path, which is the same path
rem   the host uses for every shell command and is more reliable than argv mode.
rem - PowerShell stdout is captured to a temp file and re-emitted only when the gate
rem   exited 0 or 2; a broken entry (missing script, engine failure, banner output)
rem   can therefore never pollute the host-visible stdout.
rem - Retries once, then fails closed with a block reason and an entry failure log line.
rem Terminal rules live only in .codex/governance/terminal-contract.json and the shared validator.
setlocal enableextensions
set "PS=%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe"
set "GATE=%ZCODE_PROJECT_DIR%\.codex\hooks\..\governance\stop-gate.ps1"
if defined ZCODE_GATE_SCRIPT set "GATE=%ZCODE_GATE_SCRIPT%"
set "LOGDIR=%ZCODE_PROJECT_DIR%\.codex\governance\runtime\zcode"
if defined ZCODE_GATE_LOGDIR set "LOGDIR=%ZCODE_GATE_LOGDIR%"
set "LOG=%LOGDIR%\entry-failures.log"
set "OUT=%TEMP%\zcode-stop-gate-%RANDOM%%RANDOM%.json"

"%PS%" -NoLogo -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "%GATE%" >"%OUT%"
set "RC=%ERRORLEVEL%"
if "%RC%"=="0" goto emit
if "%RC%"=="2" goto propagate

"%PS%" -NoLogo -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "%GATE%" >"%OUT%"
set "RC=%ERRORLEVEL%"
if "%RC%"=="0" goto emit
if "%RC%"=="2" goto propagate

del "%OUT%" 1>nul 2>nul
if not exist "%LOGDIR%" mkdir "%LOGDIR%" 2>nul
echo %DATE% %TIME% Stop entry failed rc=%RC%>>"%LOG%"
echo {"decision":"block","reason":"Execution session cannot end: the stop gate entry failed twice (host dispatch failure). Next action: continue the authorized work items instead of wrapping up; then run .codex/governance/hook-selfcheck.ps1 and hand the entry failure log to the administrator."}
exit /b 0

:emit
type "%OUT%"
del "%OUT%" 1>nul 2>nul
exit /b 0

:propagate
del "%OUT%" 1>nul 2>nul
exit /b 2
