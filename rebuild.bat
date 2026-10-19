@echo off
cd /d "%~dp0"
echo ===================================================
echo  Rebuilding Movie Ticket Booking System Modules
echo ===================================================
call npm run build
echo ===================================================
echo  Build Finished!
echo ===================================================
pause
