@echo off
title Admin - San Bong
cd /d "%~dp0san-bong-admin"
echo Starting admin dev server...
npm install
npm run dev
pause
