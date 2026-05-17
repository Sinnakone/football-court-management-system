@echo off
title Backend - San Bong
cd /d "%~dp0san-bong-backend"
echo Starting Docker Compose...
docker compose up -d
if errorlevel 1 (
    echo Docker compose failed.
    pause
    exit /b 1
)
echo Starting backend dev server...
npm install
npm run dev
pause
