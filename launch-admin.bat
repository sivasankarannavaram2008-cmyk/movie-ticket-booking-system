@echo off
cd /d "%~dp0"
echo Starting Movie Ticket Booking System - Admin Dashboard...
start "" "http://localhost:3000/admin"
npm run start
