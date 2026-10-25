@echo off
setlocal
title Liquid Glass updater
set "KIT=%~dp0"
set "VC=%USERPROFILE%\Vencord"
set "TIP="

echo.
echo  ==========================================
echo       Liquid Glass  +  AlbumGlass updater
echo  ==========================================
echo.

if not exist "%VC%\package.json" (
  echo  [X] Liquid Glass isn't installed yet. Run INSTALL.bat first.
  goto end
)

echo  [1/4] Copying the new plugin...
set "TIP=Could not copy the plugin files. Make sure you extracted the whole zip first."
if not exist "%VC%\src\userplugins\albumGlass" mkdir "%VC%\src\userplugins\albumGlass"
copy /y "%KIT%plugin\albumGlass\*.*" "%VC%\src\userplugins\albumGlass\" >nul
if errorlevel 1 goto fail

echo  [2/4] Updating the theme...
if not exist "%APPDATA%\Vencord\themes" mkdir "%APPDATA%\Vencord\themes"
copy /y "%KIT%theme\LiquidGlass.theme.css" "%APPDATA%\Vencord\themes\LiquidGlass.theme.css" >nul

echo  [3/4] Building...
set "TIP=The build failed. Try INSTALL.bat instead - it reinstalls everything."
cd /d "%VC%"
call pnpm build
if errorlevel 1 goto fail

echo  [4/4] Restarting Discord...
taskkill /f /im Discord.exe >nul 2>nul
timeout /t 2 >nul
if exist "%LOCALAPPDATA%\Discord\Update.exe" start "" "%LOCALAPPDATA%\Discord\Update.exe" --processStart Discord.exe

echo.
echo  ==========================================
echo   DONE! Discord is restarting.
echo  ==========================================
goto end

:fail
echo.
echo  [X] Something went wrong.
if defined TIP echo      %TIP%

:end
echo.
pause
