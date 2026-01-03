# PowerShell script to create a manual release for RuneQuest 3 Foundry VTT System
# Usage: .\scripts\create-release.ps1 <version>
# Example: .\scripts\create-release.ps1 1.0.7

param(
    [Parameter(Mandatory=$true)]
    [string]$Version
)

Write-Host "Creating release for version $Version..." -ForegroundColor Green

# Update version in system.json
Write-Host "Updating system.json version..." -ForegroundColor Yellow
$systemJson = Get-Content "system.json" | ConvertFrom-Json
$systemJson.version = $Version
$systemJson | ConvertTo-Json -Depth 10 | Set-Content "system.json"

# Create release directory
Write-Host "Creating release package..." -ForegroundColor Yellow
if (Test-Path "release") {
    Remove-Item -Recurse -Force "release"
}
New-Item -ItemType Directory -Path "release\runequest3" | Out-Null

# Copy files (excluding git, node_modules, and Foundry database files)
Write-Host "Copying files..." -ForegroundColor Yellow
Get-ChildItem -Path . -Recurse | Where-Object {
    $exclude = @(
        ".git",
        ".github",
        "node_modules",
        ".gitignore",
        "release",
        "tatus",
        "memory-bank"
    )
    $excludePatterns = @(
        "packs\*\LOCK",
        "packs\*\LOG*",
        "packs\*\MANIFEST-*",
        "packs\*\*.ldb",
        "packs\*\*.log",
        "packs\*\CURRENT",
        "packs\*\lost"
    )
    
    $relativePath = $_.FullName.Replace((Get-Location).Path + "\", "")
    $shouldExclude = $false
    
    foreach ($pattern in $exclude) {
        if ($relativePath -like "*\$pattern\*" -or $relativePath -like "$pattern\*") {
            $shouldExclude = $true
            break
        }
    }
    
    foreach ($pattern in $excludePatterns) {
        if ($relativePath -like $pattern) {
            $shouldExclude = $true
            break
        }
    }
    
    -not $shouldExclude
} | ForEach-Object {
    $destPath = $_.FullName.Replace((Get-Location).Path, "release\runequest3")
    $destDir = Split-Path $destPath -Parent
    if (-not (Test-Path $destDir)) {
        New-Item -ItemType Directory -Path $destDir | Out-Null
    }
    Copy-Item $_.FullName -Destination $destPath
}

# Create zip file
Write-Host "Creating zip file..." -ForegroundColor Yellow
Compress-Archive -Path "release\runequest3\*" -DestinationPath "runequest3-foundry.zip" -Force

# Copy system.json for manifest
Copy-Item "system.json" -Destination "release\system.json"

Write-Host ""
Write-Host "Release package created successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Files created:"
Write-Host "  - runequest3-foundry.zip (system package)"
Write-Host "  - release\system.json (manifest file)"
Write-Host ""
Write-Host "Next steps:"
Write-Host "1. Create a new release on GitHub: https://github.com/Kittenjuggler/runequest3-foundry/releases/new"
Write-Host "2. Tag: v$Version"
Write-Host "3. Title: Release v$Version"
Write-Host "4. Upload runequest3-foundry.zip and release\system.json"
Write-Host "5. Use this manifest URL: https://github.com/Kittenjuggler/runequest3-foundry/releases/download/v$Version/system.json"
Write-Host ""

