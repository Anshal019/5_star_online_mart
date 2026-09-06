@echo off
TITLE Create 5Star ERP Desktop Shortcut
CLS

set SCRIPT_DIR=%~dp0
set BATCH_PATH=%SCRIPT_DIR%Launch_5Star_ERP.bat

echo Creating Windows Desktop Shortcut...

powershell -Command "$desktop = [Environment]::GetFolderPath('Desktop'); $shortcutPath = Join-Path $desktop '5Star Online Mart ERP.lnk'; $ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut($shortcutPath); $s.TargetPath = '%BATCH_PATH%'; $s.WorkingDirectory = '%SCRIPT_DIR%'; $s.Description = '5Star Online Mart POS Billing & Inventory ERP'; $s.Save(); Write-Host 'Shortcut created at:' $shortcutPath"

echo.
echo Desktop shortcut creation complete!
