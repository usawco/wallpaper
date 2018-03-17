@echo off
setlocal enableextensions
set _DIR=%~dp0
powershell.exe -NoProfile -ExecutionPolicy bypass -Command %_DIR%wp.ps1