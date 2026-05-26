@echo off
echo Stopping DentaCare...
powershell -ExecutionPolicy Bypass -File "%~dp0dev-down.ps1"
pause
