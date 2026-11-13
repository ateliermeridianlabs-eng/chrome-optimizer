#!/bin/bash
# Removes Minecraft Blocker. Needs an admin password.
# A copy lives at /Library/MinecraftBlocker/uninstall.command.
set -uo pipefail
DIR=/Library/MinecraftBlocker
PLIST=/Library/LaunchDaemons/local.minecraftblocker.plist

echo "=== Removing Minecraft Blocker (admin password needed) ==="
sudo chflags -f noschg "$DIR/blocker.sh" "$PLIST"
sudo launchctl bootout system "$PLIST" 2>/dev/null
sudo rm -f "$PLIST"
sudo rm -rf "$DIR"
sudo launchctl enable system/local.minecraftblocker 2>/dev/null   # clear the "off" setting
rm -rf "$HOME/Applications/Minecraft Blocker.app"
echo "Removed."
