@echo off
cd /d "%~dp0"

echo Build web...
npm run build
if errorlevel 1 exit /b 1

echo Sync Android...
npx cap sync android
if errorlevel 1 exit /b 1

echo Build APK avec Gradle...
cd android
gradle assembleDebug
if errorlevel 1 exit /b 1

echo.
echo APK pret: android\app\build\outputs\apk\debug\app-debug.apk
echo.