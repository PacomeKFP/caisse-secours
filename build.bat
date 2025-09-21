@echo off
echo Building Caisse Secours Application...
echo.

echo 1. Installing dependencies...
call npm install
if %ERRORLEVEL% neq 0 (
    echo Error installing dependencies
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo 2. Building Next.js application...
call npm run build:next
if %ERRORLEVEL% neq 0 (
    echo Error building Next.js application
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo 3. Building Electron application...
call npm run build:electron
if %ERRORLEVEL% neq 0 (
    echo Error building Electron application
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo Build completed successfully!
echo Executable can be found in dist-electron folder
pause
