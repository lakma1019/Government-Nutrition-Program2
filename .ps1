# Get the directory where this script is located
$ScriptDir = $PSScriptRoot

# Define the paths relative to the script directory
$FrontEndPath = Join-Path -Path $ScriptDir -ChildPath "front_end"
$BackEndPath = Join-Path -Path $ScriptDir -ChildPath "back_end"

Write-Host "Starting development environment from: $ScriptDir"
Write-Host "-------------------------------------------------"

# --- Terminal 1: Frontend Dev Server ---
Write-Host "Launching Frontend Dev Server (npm run dev) in new window..."
$feArgs = "-NoExit -Command `"Set-Location '$FrontEndPath'; Write-Host 'Starting Frontend (npm run dev)...'; npm run dev`""
Start-Process powershell.exe -ArgumentList $feArgs -WorkingDirectory $FrontEndPath

# Add a small delay to allow the first window to potentially grab ports/resources if needed
Start-Sleep -Seconds 2

# --- Terminal 2: Backend Consolidated Server ---
Write-Host "Launching Backend Consolidated Server (npm run dev:consolidated) in new window..."
$beConsolidatedArgs = "-NoExit -Command `"Set-Location '$BackEndPath'; Write-Host 'Starting Backend Consolidated Server (npm run dev:consolidated)...'; npm run dev:consolidated`""
Start-Process powershell.exe -ArgumentList $beConsolidatedArgs -WorkingDirectory $BackEndPath

Write-Host "-------------------------------------------------"
Write-Host "All processes launched in separate PowerShell windows."
Write-Host "Check each window for output and status."
# Keep the initial script window open briefly to show messages
# Start-Sleep -Seconds 5 # Optional: Uncomment if you want this window to pause

