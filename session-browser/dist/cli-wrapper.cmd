@echo off
rem Windows counterpart of cli-wrapper: find node, then exec dist\cli with all args.
setlocal
set "SCRIPT_DIR=%~dp0"
set "CLI_SCRIPT=%SCRIPT_DIR%cli"

if not exist "%CLI_SCRIPT%" (
  echo Error: CLI script not found at %CLI_SCRIPT% 1>&2
  exit /b 1
)

rem Prefer node on PATH (covers nvm-windows / fnm / volta shims when installed).
where node >nul 2>nul
if errorlevel 1 goto find_node
node "%CLI_SCRIPT%" %*
exit /b %errorlevel%

:find_node
rem Fallback: common install locations (system nodejs, per-user installer, scoop).
set "NODE_CAND=%ProgramFiles%\nodejs\node.exe"
if exist "%NODE_CAND%" goto run
set "NODE_CAND=%LOCALAPPDATA%\Programs\nodejs\node.exe"
if exist "%NODE_CAND%" goto run
set "NODE_CAND=%USERPROFILE%\scoop\shims\node.exe"
if exist "%NODE_CAND%" goto run

echo Error: node executable not found on PATH 1>&2
exit /b 1

:run
"%NODE_CAND%" "%CLI_SCRIPT%" %*
exit /b %errorlevel%
