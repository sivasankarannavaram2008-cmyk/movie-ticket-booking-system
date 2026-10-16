@echo off
cd /d "%~dp0"
echo Starting Movie Ticket Booking System - Customer Portal...
start "" "http://localhost:3000"
npm run start
