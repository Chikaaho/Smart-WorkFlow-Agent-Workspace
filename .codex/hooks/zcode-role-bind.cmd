@echo off
rem ZCode session role binding host entry (wrapper).
rem Calls the PowerShell binding script through the host's cmd shell path and retries once.
rem A session whose role never binds does not enable the stop gate, so failures are logged
rem to entry-failures.log instead of blocking the user prompt.
setlocal enableextensions
set "PS=%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe"
set "ROLE=%ZCODE_PROJECT_DIR%\.codex\governance\session-role.ps1"
if defined ZCODE_ROLE_SCRIPT set "ROLE=%ZCODE_ROLE_SCRIPT%"
set "LOGDIR=%ZCODE_PROJECT_DIR%\.codex\governance\runtime\zcode"
if defined ZCODE_GATE_LOGDIR set "LOGDIR=%ZCODE_GATE_LOGDIR%"
set "LOG=%LOGDIR%\entry-failures.log"

"%PS%" -NoLogo -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "%ROLE%"
if "%ERRORLEVEL%"=="0" exit /b 0
"%PS%" -NoLogo -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "%ROLE%"
if "%ERRORLEVEL%"=="0" exit /b 0

if not exist "%LOGDIR%" mkdir "%LOGDIR%" 2>nul
echo %DATE% %TIME% UserPromptSubmit entry failed>>"%LOG%"
exit /b 0
