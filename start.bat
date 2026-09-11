@echo off
title Ashley Outlet Catalog Server - Port 3008
cd /d "%~dp0"
echo ====================================================
echo Starting Ashley Furniture Outlet Digital Catalog...
echo Opening http://localhost:3008
echo ====================================================
node server/index.js
pause
