@echo off
REM Tenh Gram — 1-click update for the repo checkout.
REM Double-click this file: it pulls the latest code, installs
REM dependencies, then starts the desktop app. No terminal typing.
REM It does NOT touch your accounts (they live in %APPDATA%\Tenh Gram\data).
cd /d "%~dp0"

where git >nul 2>&1
if errorlevel 1 (
  echo Git is not installed. Install Git for Windows, then run this file again.
  pause
  exit /b 1
)

echo Updating Tenh Gram...
git pull --ff-only
if errorlevel 1 (
  echo.
  echo Update stopped: git pull failed.
  echo You may have local changes. Run "git stash" once, then run this file again.
  pause
  exit /b 1
)

call npm install
if errorlevel 1 (
  echo.
  echo Update stopped: npm install failed. Check the error above.
  pause
  exit /b 1
)

echo.
echo Tenh Gram is up to date. Starting the desktop app...
call npm run desktop
