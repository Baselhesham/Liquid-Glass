@echo off
setlocal
title Liquid Glass installer
set "KIT=%~dp0"
set "VC=%USERPROFILE%\Vencord"
set "TIP="

echo.
echo  ==========================================
echo           Liquid Glass  +  AlbumGlass
echo  ==========================================
echo.
echo  This will:
echo    - download Vencord's source code to %VC%
echo    - add the AlbumGlass plugin and the Liquid Glass theme
echo    - build it and put it into your Discord
echo.
echo  Discord will be closed during the last step.
echo.
pause

where git >nul 2>nul
if errorlevel 1 (
  echo.
  echo  [X] Git is not installed.
  echo      1. Download it from https://git-scm.com  ^(click Next on every screen^)
  echo      2. Restart your PC
  echo      3. Double-click INSTALL.bat again
  goto end
)
where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo  [X] Node.js is not installed.
  echo      1. Download the LTS version from https://nodejs.org
  echo         ^(leave "Tools for Native Modules" unchecked^)
  echo      2. Restart your PC
  echo      3. Double-click INSTALL.bat again
  goto end
)

echo.
echo  [1/7] Installing pnpm...
set "TIP=npm could not install pnpm. Check your internet connection and try again."
call npm install -g pnpm --allow-scripts=pnpm
if errorlevel 1 goto fail

if exist "%VC%\.git" (
  echo  [2/7] Vencord is already downloaded, updating it...
  git -C "%VC%" pull
) else (
  echo  [2/7] Downloading Vencord...
  set "TIP=Could not reach GitHub. Some internet providers block it from the command line - turn on a VPN (like Cloudflare 1.1.1.1 / WARP) and run INSTALL.bat again."
  git clone https://github.com/Vendicated/Vencord "%VC%"
  if errorlevel 1 goto fail
)

echo  [3/7] Adding the AlbumGlass plugin...
set "TIP=Could not copy the plugin files. Make sure you extracted the whole zip before running INSTALL.bat."
if not exist "%VC%\src\userplugins\albumGlass" mkdir "%VC%\src\userplugins\albumGlass"
copy /y "%KIT%plugin\albumGlass\*.*" "%VC%\src\userplugins\albumGlass\" >nul
if errorlevel 1 goto fail

echo  [4/7] Installing Vencord's parts (a few minutes, lots of text is normal)...
set "TIP=Downloading packages failed. Check your internet or turn on a VPN, then run INSTALL.bat again."
cd /d "%VC%"
call pnpm install
if errorlevel 1 goto fail

echo  [5/7] Building...
set "TIP=The build failed. Run INSTALL.bat once more; if it still fails, open an issue on the GitHub page with a screenshot of this window."
call pnpm build
if errorlevel 1 goto fail

echo  [6/7] Adding the Liquid Glass theme...
if not exist "%APPDATA%\Vencord\themes" mkdir "%APPDATA%\Vencord\themes"
copy /y "%KIT%theme\LiquidGlass.theme.css" "%APPDATA%\Vencord\themes\LiquidGlass.theme.css" >nul

echo  [7/7] Putting it into Discord...
if not exist "%VC%\dist\Installer" mkdir "%VC%\dist\Installer"
set "INST=%VC%\dist\Installer\VencordInstallerCli.exe"
if exist "%KIT%VencordInstallerCli.exe" copy /y "%KIT%VencordInstallerCli.exe" "%INST%" >nul
if exist "%USERPROFILE%\Downloads\VencordInstallerCli.exe" copy /y "%USERPROFILE%\Downloads\VencordInstallerCli.exe" "%INST%" >nul
if not exist "%INST%" (
  curl.exe -L --connect-timeout 20 -o "%INST%" https://github.com/Vencord/Installer/releases/latest/download/VencordInstallerCli.exe
)
if not exist "%INST%" (
  echo.
  echo  [!] Could not download the Vencord installer.
  echo      1. Open this link in your browser:
  echo         https://github.com/Vencord/Installer/releases/latest/download/VencordInstallerCli.exe
  echo      2. Put the downloaded file next to INSTALL.bat
  echo      3. Double-click INSTALL.bat again
  goto end
)

echo.
echo  Closing Discord...
taskkill /f /im Discord.exe >nul 2>nul
taskkill /f /im DiscordPTB.exe >nul 2>nul
taskkill /f /im DiscordCanary.exe >nul 2>nul
timeout /t 2 >nul

set "VENCORD_USER_DATA_DIR=%VC%"
set "VENCORD_DEV_INSTALL=1"
echo.
echo  *** A menu will show up. Pick your Discord with the arrow keys and press ENTER.
echo.
set "TIP=The Vencord installer failed. Make sure Discord is fully closed (check the tray icon near the clock) and run INSTALL.bat again."
"%INST%" --install
if errorlevel 1 goto fail

echo.
echo  ==========================================
echo   DONE! Open Discord, then:
echo    1. Settings - Themes  : turn on  Liquid Glass
echo       ^(turn off any other theme you had on^)
echo    2. Settings - Plugins : turn on  AlbumGlass
echo    3. Play something on Spotify
echo.
echo   Spotify must be connected in Settings - Connections
echo   with "Display Spotify as your status" turned on.
echo  ==========================================
goto end

:fail
echo.
echo  [X] Something went wrong.
if defined TIP echo      %TIP%

:end
echo.
pause
