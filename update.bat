REM filepath: c:\workspace\clients\caisse-secours\microfinance-app\update_and_build.bat
@echo off
git fetch --tags
for /f %%i in ('git describe --tags --abbrev=0') do set latest_tag=%%i
git checkout %latest_tag%
echo Mise à jour terminée vers le tag %latest_tag%.
npm install
npm run build
echo Build terminé.
pause