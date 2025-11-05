#!/bin/bash

# FFmpeg Setup Script for Blendgine
# This script downloads and sets up FFmpeg binaries for local development

set -e

echo "🚀 Setting up FFmpeg for Blendgine..."

# Create bin directory
mkdir -p src-tauri/bin

# Detect OS
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
    OS="windows"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macos"
else
    OS="linux"
fi

echo "📋 Detected OS: $OS"

# Download and setup FFmpeg based on OS
case $OS in
    "windows")
        echo "📥 Downloading FFmpeg for Windows..."
        curl -L -o ffmpeg.zip "https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip"
        unzip -q ffmpeg.zip
        # Find and copy ffmpeg.exe
        find . -name "ffmpeg.exe" -exec cp {} src-tauri/bin/ffmpeg.exe \;
        chmod +x src-tauri/bin/ffmpeg.exe
        echo "✅ FFmpeg for Windows installed: src-tauri/bin/ffmpeg.exe"
        ;;
    "linux")
        echo "📥 Downloading FFmpeg for Linux..."
        curl -L -o ffmpeg.tar.xz "https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-linux64-gpl.tar.xz"
        tar -xf ffmpeg.tar.xz
        # Find and copy ffmpeg binary
        find . -name "ffmpeg" -executable -exec cp {} src-tauri/bin/ffmpeg \;
        chmod +x src-tauri/bin/ffmpeg
        echo "✅ FFmpeg for Linux installed: src-tauri/bin/ffmpeg"
        ;;
    "macos")
        echo "📥 Downloading FFmpeg for macOS..."
        curl -L -o ffmpeg.zip "https://evermeet.cx/ffmpeg/getrelease/zip"
        unzip -q ffmpeg.zip
        # Find and copy ffmpeg binary
        find . -name "ffmpeg" -executable -exec cp {} src-tauri/bin/ffmpeg \;
        chmod +x src-tauri/bin/ffmpeg
        echo "✅ FFmpeg for macOS installed: src-tauri/bin/ffmpeg"
        ;;
esac

# Clean up downloaded files
echo "🧹 Cleaning up temporary files..."
rm -f ffmpeg.zip ffmpeg.tar.xz
rm -rf ffmpeg-*

# Verify installation
echo "🔍 Verifying FFmpeg installation..."
if [ -f "src-tauri/bin/ffmpeg" ] || [ -f "src-tauri/bin/ffmpeg.exe" ]; then
    echo "✅ FFmpeg binary found and ready"
    ls -la src-tauri/bin/
    
    # Test FFmpeg
    echo "🧪 Testing FFmpeg..."
    if [ -f "src-tauri/bin/ffmpeg.exe" ]; then
        ./src-tauri/bin/ffmpeg.exe -version | head -1
    else
        ./src-tauri/bin/ffmpeg -version | head -1
    fi
else
    echo "❌ FFmpeg binary not found"
    exit 1
fi

echo "🎉 FFmpeg setup completed successfully!"
echo "📁 FFmpeg binary location: src-tauri/bin/" 