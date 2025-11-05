# FFmpeg Setup Script for Blendgine (Windows)
# This script downloads and sets up FFmpeg binaries for local development

param(
    [switch]$Force
)

Write-Host "🚀 Setting up FFmpeg for Blendgine..." -ForegroundColor Green

# Create bin directory
$binDir = "src-tauri\bin"
if (!(Test-Path $binDir)) {
    New-Item -ItemType Directory -Path $binDir -Force | Out-Null
}

# Check if FFmpeg already exists
$ffmpegPath = Join-Path $binDir "ffmpeg.exe"
if (Test-Path $ffmpegPath) {
    if ($Force) {
        Write-Host "⚠️  FFmpeg already exists. Removing due to -Force flag..." -ForegroundColor Yellow
        Remove-Item $ffmpegPath -Force
    } else {
        Write-Host "✅ FFmpeg already exists at: $ffmpegPath" -ForegroundColor Green
        Write-Host "Use -Force to reinstall" -ForegroundColor Yellow
        exit 0
    }
}

Write-Host "📥 Downloading FFmpeg for Windows..." -ForegroundColor Blue

# Download FFmpeg
$ffmpegUrl = "https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip"
$zipPath = "ffmpeg.zip"

try {
    Invoke-WebRequest -Uri $ffmpegUrl -OutFile $zipPath
    Write-Host "✅ Download completed" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to download FFmpeg: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Extract and setup
Write-Host "📦 Extracting FFmpeg..." -ForegroundColor Blue
try {
    Expand-Archive -Path $zipPath -DestinationPath "." -Force
    
    # Find ffmpeg.exe in extracted directory
    $ffmpegExe = Get-ChildItem -Path "." -Recurse -Name "ffmpeg.exe" | Select-Object -First 1
    if ($ffmpegExe) {
        $sourcePath = Join-Path "." $ffmpegExe
        Copy-Item -Path $sourcePath -Destination $ffmpegPath -Force
        Write-Host "✅ FFmpeg installed: $ffmpegPath" -ForegroundColor Green
    } else {
        throw "ffmpeg.exe not found in extracted archive"
    }
} catch {
    Write-Host "❌ Failed to extract/setup FFmpeg: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Clean up
Write-Host "🧹 Cleaning up temporary files..." -ForegroundColor Blue
Remove-Item $zipPath -Force -ErrorAction SilentlyContinue
Get-ChildItem -Path "." -Directory -Name "ffmpeg-*" | ForEach-Object {
    Remove-Item $_ -Recurse -Force -ErrorAction SilentlyContinue
}

# Verify installation
Write-Host "🔍 Verifying FFmpeg installation..." -ForegroundColor Blue
if (Test-Path $ffmpegPath) {
    Write-Host "✅ FFmpeg binary found and ready" -ForegroundColor Green
    Get-ChildItem $binDir | Format-Table Name, Length, LastWriteTime
    
    # Test FFmpeg
    Write-Host "🧪 Testing FFmpeg..." -ForegroundColor Blue
    try {
        $version = & $ffmpegPath -version | Select-Object -First 1
        Write-Host "✅ $version" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  FFmpeg test failed: $($_.Exception.Message)" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ FFmpeg binary not found" -ForegroundColor Red
    exit 1
}

Write-Host "🎉 FFmpeg setup completed successfully!" -ForegroundColor Green
Write-Host "📁 FFmpeg binary location: $ffmpegPath" -ForegroundColor Cyan 