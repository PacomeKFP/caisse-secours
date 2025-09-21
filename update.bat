@echo off
title Caisse Secours - Mise a jour

echo.
echo ============================================
echo   CAISSE SECOURS - SCRIPT DE MISE A JOUR
echo ============================================
echo.

REM Vérifier si Node.js est installé
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERREUR] Node.js n'est pas installe ou non accessible.
    echo Veuillez installer Node.js depuis https://nodejs.org/
    echo.
    pause
    exit /b 1
)

REM Se déplacer vers le répertoire du script
cd /d "%~dp0"

echo [INFO] Repertoire de travail: %CD%
echo.

REM Demander confirmation si pas en mode auto
if "%1"=="--auto" goto :run_auto
if "%1"=="-y" goto :run_auto

echo [ATTENTION] Cette operation va mettre a jour Caisse Secours.
echo.
echo Voulez-vous continuer ? (O/N)
set /p confirm="> "

if /i "%confirm%"=="O" goto :run_auto
if /i "%confirm%"=="Y" goto :run_auto
if /i "%confirm%"=="OUI" goto :run_auto
if /i "%confirm%"=="YES" goto :run_auto

echo.
echo [INFO] Mise a jour annulee par l'utilisateur.
pause
exit /b 0

:run_auto
echo [INFO] Demarrage de la mise a jour...
echo.

REM Exécuter le script de mise à jour
node updater.js %*

REM Vérifier le code de retour
if %errorlevel% equ 0 (
    echo.
    echo [SUCCES] Mise a jour terminee avec succes !
    echo.
    echo [INFO] Vous pouvez maintenant redemarrer l'application.
) else (
    echo.
    echo [ERREUR] La mise a jour a echoue.
    echo Consultez les messages ci-dessus pour plus de details.
)

echo.
pause