@echo off
setlocal EnableExtensions
cd /d "%~dp0"

echo === MedCare JMeter Load Test (Giai doan 7) ===
echo.

where jmeter >nul 2>&1
if errorlevel 1 (
  echo [LOI] JMeter chua co trong PATH.
  echo       Cai Java + JMeter: https://jmeter.apache.org/download_jmeter.cgi
  echo       Them %%JMETER_HOME%%\bin vao PATH, roi chay lai file nay.
  exit /b 1
)

call npm run jmeter:generate
if errorlevel 1 exit /b 1

if not exist "jmeter\results" mkdir "jmeter\results"

set "STAMP=%date:~-4%%date:~3,2%%date:~0,2%_%time:~0,2%%time:~3,2%%time:~6,2%"
set "STAMP=%STAMP: =0%"
set "JTL=jmeter\results\run_%STAMP%.jtl"
set "HTML=jmeter\results\html_%STAMP%"

echo.
echo Kiem tra server: http://localhost:3000
echo (Neu chua chay: mo terminal khac va chay npm start)
echo.
echo THREADS=10  RAMP_UP=30s  LOOPS=1
echo.

jmeter -n -t jmeter\medcare-load-test.jmx -JCSV=%CD%\jmeter\asset-paths.csv -JTHREADS=10 -JRAMP_UP=30 -JLOOPS=1 -l "%JTL%" -e -o "%HTML%"
if errorlevel 1 (
  echo [LOI] JMeter that bai. Dam bao npm start dang chay tren port 3000.
  exit /b 1
)

echo.
echo === Xong ===
echo JTL:  %JTL%
echo HTML: %HTML%\index.html
start "" "%HTML%\index.html"
endlocal
