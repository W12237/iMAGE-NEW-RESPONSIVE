@echo off
setlocal
cd /d "%~dp0"
title Image Developments - Local Website

echo.
echo ==============================================
echo   Image Developments - Local Website
echo ==============================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed.
  echo.
  echo Please install the LTS version from https://nodejs.org/
  echo Then close this window and double-click RUN_PROJECT.bat again.
  echo.
  pause
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo npm could not be found. Please reinstall Node.js from https://nodejs.org/
  echo.
  pause
  exit /b 1
)

if not exist ".env" (
  echo Creating the local settings file...
  copy /y ".env.example" ".env" >nul
  if errorlevel 1 goto :failed
)

if not exist "node_modules" (
  echo Installing the project for the first time. This may take a few minutes...
  call npm install
  if errorlevel 1 goto :failed
)

echo Preparing the local database...
call npm run db:generate
if errorlevel 1 goto :failed

call npx prisma migrate deploy
if errorlevel 1 goto :failed

call npm run db:seed
if errorlevel 1 goto :failed

echo.
echo Starting the website...
echo Your browser will open at http://localhost:3000
echo Keep this window open. Press Ctrl+C here to stop the website.
echo.

start "" powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 4; Start-Process 'http://localhost:3000'"
call npm run dev
exit /b %errorlevel%

:failed
echo.
echo The project could not start. Please copy the error shown above and send it to the developer.
echo.
pause
exit /b 1
