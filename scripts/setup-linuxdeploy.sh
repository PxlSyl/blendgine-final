#!/bin/bash
# setup-linuxdeploy.sh
# Script to download and set up linuxdeploy for Tauri AppImage packaging

set -e  # Exit on error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
TOOLS_DIR="$PROJECT_ROOT/tools/linuxdeploy"

echo "🚀 Setting up linuxdeploy for AppImage packaging..."
echo "   Tools will be installed to: $TOOLS_DIR"

# Create tools directory if it doesn't exist
mkdir -p "$TOOLS_DIR"
cd "$TOOLS_DIR"

# Download linuxdeploy if not already present
if [ ! -f linuxdeploy-x86_64.AppImage ]; then
  echo "📥 Downloading linuxdeploy..."
  wget -c "https://github.com/linuxdeploy/linuxdeploy/releases/download/continuous/linuxdeploy-x86_64.AppImage"
  chmod +x linuxdeploy-x86_64.AppImage
  echo "✅ Downloaded and made executable: linuxdeploy-x86_64.AppImage"
else
  echo "✅ linuxdeploy already exists, skipping download"
fi

# Download AppImage plugin if not already present
if [ ! -f linuxdeploy-plugin-appimage-x86_64.AppImage ]; then
  echo "📥 Downloading linuxdeploy-plugin-appimage..."
  wget -c "https://github.com/linuxdeploy/linuxdeploy-plugin-appimage/releases/download/continuous/linuxdeploy-plugin-appimage-x86_64.AppImage"
  chmod +x linuxdeploy-plugin-appimage-x86_64.AppImage
  echo "✅ Downloaded and made executable: linuxdeploy-plugin-appimage-x86_64.AppImage"
else
  echo "✅ linuxdeploy-plugin-appimage already exists, skipping download"
fi

# Create a wrapper script to export the PATH before running Tauri build
cat > "$TOOLS_DIR/build-with-linuxdeploy.sh" << 'EOF'
#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export PATH="$SCRIPT_DIR:$PATH"

# Go back to project root
cd "$(dirname "$(dirname "$SCRIPT_DIR")")"

echo "🔧 Building with linuxdeploy in PATH..."
echo "   Running: yarn tauri build $@"

# Pass all arguments to tauri build
yarn tauri build "$@"
EOF

chmod +x "$TOOLS_DIR/build-with-linuxdeploy.sh"

echo ""
echo "✨ Setup complete! ✨"
echo ""
echo "To build your app with linuxdeploy, run:"
echo "   $TOOLS_DIR/build-with-linuxdeploy.sh"
echo ""
echo "Or add to your PATH manually:"
echo "   export PATH=\"$TOOLS_DIR:\$PATH\""
echo "   yarn tauri build"
echo ""
echo "For verbose output, add --verbose:"
echo "   $TOOLS_DIR/build-with-linuxdeploy.sh --verbose"
echo ""
