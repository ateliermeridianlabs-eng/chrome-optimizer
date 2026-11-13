#!/bin/bash
# Builds "Minecraft Blocker.app" (the on/off switch) in ~/Applications. No admin password needed.
# It is built here on your Mac, so macOS does not block it the way it blocks downloaded apps.
# install.command runs this for you; run it alone to rebuild the app.
set -euo pipefail
cd "$(dirname "$0")"
APP="$HOME/Applications/Minecraft Blocker.app"

rm -rf "$APP"
mkdir -p "$APP/Contents/MacOS"
cp toggle.sh "$APP/Contents/MacOS/MinecraftBlocker"
chmod 755 "$APP/Contents/MacOS/MinecraftBlocker"
cat > "$APP/Contents/Info.plist" <<'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleName</key><string>Minecraft Blocker</string>
  <key>CFBundleExecutable</key><string>MinecraftBlocker</string>
  <key>CFBundleIdentifier</key><string>local.minecraftblocker.switch</string>
  <key>CFBundlePackageType</key><string>APPL</string>
  <key>CFBundleVersion</key><string>1</string>
</dict>
</plist>
EOF
echo "Built: $APP (open it from Launchpad or Spotlight: Minecraft Blocker)"
