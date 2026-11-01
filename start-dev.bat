@echo off
rem One-click dev server for the portfolio.
rem Opens http://127.0.0.1:5173/ in your default browser, then starts Vite.
cd /d "%~dp0"
start "" "http://127.0.0.1:5173/"
npx vite --host 127.0.0.1 --port 5173 --strictPort
pause
