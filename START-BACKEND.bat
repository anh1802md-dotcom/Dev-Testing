@echo off
chcp 65001 >nul
cd /d "%~dp0backend"
echo === MedCare Backend API ===
echo SQL Server: LAPTOP-BD1H54CO\SQLEXPRESS
echo.

if not exist node_modules (
  echo Installing dependencies...
  call npm install
)

if not exist .env (
  copy .env.example .env
)

echo Starting API on http://localhost:5000
echo Postman: postman/MedCare-API.postman_collection.json
echo.
call npm start
