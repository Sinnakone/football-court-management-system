@echo off
title San Bong - Launcher
echo Launching all services in isolated terminals...
start "Backend"  cmd /k "%~dp0run-backend.bat"
start "Frontend" cmd /k "%~dp0run-frontend.bat"
start "Admin"    cmd /k "%~dp0run-admin.bat"
echo All services launched.
exit
