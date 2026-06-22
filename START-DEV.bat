@echo off
chcp 65001 >nul
cd /d "%~dp0"

where node >nul 2>&1
if errorlevel 1 (
  echo Chua cai Node.js. Tai tai: https://nodejs.org
  pause
  exit /b 1
)

if not exist "node_modules\" (
  echo Dang cai dependencies...
  call npm install
  if errorlevel 1 (
    echo npm install that bai.
    pause
    exit /b 1
  )
)

start "" "http://localhost:3000"
echo.
echo MedCare dev server: http://localhost:3000
echo Dang nhap demo: admin@demo.com / 123456
echo Nhan Ctrl+C de dung server.
echo.
call npm start
