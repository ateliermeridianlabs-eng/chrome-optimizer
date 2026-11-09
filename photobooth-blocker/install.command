#!/bin/bash
# Installs Photo Booth Blocker and its on/off app. Double-click in Finder (or run: bash install.command).
# Needs an admin password. Run it again after editing blocker.sh to apply changes.
set -euo pipefail
cd "$(dirname "$0")"
DIR=/Library/PhotoBoothBlocker
PLIST=/Library/LaunchDaemons/local.photoboothblocker.plist
APP="/Applications/Photo Booth Blocker.app"

echo "=== Installing Photo Booth Blocker (admin password needed) ==="
# Undo the lock from a previous install so files can be replaced
sudo chflags -f noschg "$DIR/blocker.sh" "$PLIST" 2>/dev/null || true
sudo launchctl bootout system "$PLIST" 2>/dev/null || true

sudo mkdir -p "$DIR"
sudo cp blocker.sh "$DIR/blocker.sh"
sudo cp uninstall.command "$DIR/uninstall.command"
sudo cp local.photoboothblocker.plist "$PLIST"
sudo chown -R root:wheel "$DIR" "$PLIST"
sudo chmod 755 "$DIR" "$DIR/blocker.sh" "$DIR/uninstall.command"
sudo chmod 644 "$PLIST"
# Lock the files so they can't be edited or deleted, even with sudo, until unlocked
sudo chflags schg "$DIR/blocker.sh" "$PLIST"
sudo rm -f "$DIR/off"   # a fresh install always starts ON

# The on/off switch: an app in /Applications (find it with Cmd+Space, "Photo Booth Blocker")
sudo rm -rf "$APP"
sudo osacompile -o "$APP" switch.applescript

sudo launchctl bootstrap system "$PLIST"
echo
echo "Done. Photo Booth now gets closed within 2 seconds."
echo "To turn it on or off: open the \"Photo Booth Blocker\" app (Cmd+Space, type Photo Booth Blocker)."
echo "Log of what was closed: /var/log/photoboothblocker.log"
