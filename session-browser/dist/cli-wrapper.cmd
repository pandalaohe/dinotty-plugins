@echo off
rem Windows counterpart of cli-wrapper: find node, then exec dist\cli with all args.
setlocal
set "SCRIPT_DIR=%~dp0"
set "CLI_SCRIPT=%SCRIPT_DIR%cli"

if not exist "%CLI_SCRIPT%" (
  echo Error: CLI script not found at %CLI_SCRIPT% 1>&2
  exit /b 1
)

rem Prefer node on PATH.
where node >nul 2>nul
if %errorlevel%==0 (
  node "%CLI_SCRIPT%" %*
  exit /b %errorlevel%
)

rem Fallback to common per-user install locations (nvm-windows / fnm / volta / default).
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
