$desktop = [Environment]::GetFolderPath('Desktop')
$shortcutPath = Join-Path $desktop "5Star Online Mart ERP.lnk"
$targetPath = "c:\Users\admah\OneDrive\Desktop\akshit erp\Launch_5Star_ERP.bat"
$workingDir = "c:\Users\admah\OneDrive\Desktop\akshit erp"

$ws = New-Object -ComObject WScript.Shell
$s = $ws.CreateShortcut($shortcutPath)
$s.TargetPath = $targetPath
$s.WorkingDirectory = $workingDir
$s.Description = "5Star Online Mart POS Billing & Inventory ERP"
$s.Save()

Write-Host "Desktop shortcut created successfully at: $shortcutPath"
