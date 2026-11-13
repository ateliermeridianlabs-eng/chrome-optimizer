#!/bin/bash
# Installs Minecraft Blocker. Double-click in Finder (or run: bash install.command).
# Needs an admin password. Run it again after editing blocker.sh to apply changes.
set -euo pipefail
cd "$(dirname "$0")"
DIR=/Library/MinecraftBlocker
PLIST=/Library/LaunchDaemons/local.minecraftblocker.plist

echo "=== Installing Minecraft Blocker (admin password needed) ==="
# Undo the lock from a previous install so files can be replaced
sudo chflags -f noschg "$DIR/blocker.sh" "$PLIST" 2>/dev/null || true
sudo launchctl bootout system "$PLIST" 2>/dev/null || true

sudo mkdir -p "$DIR"
sudo cp blocker.sh "$DIR/blocker.sh"
sudo cp uninstall.command "$DIR/uninstall.command"
sudo cp local.minecraftblocker.plist "$PLIST"
sudo chown -R root:wheel "$DIR" "$PLIST"
sudo chmod 755 "$DIR" "$DIR/blocker.sh" "$DIR/uninstall.command"
sudo chmod 644 "$PLIST"
# Lock the files so they can't be edited or deleted, even with sudo, until unlocked
sudo chflags schg "$DIR/blocker.sh" "$PLIST"

# The on/off app may have switched it off earlier; make sure it is allowed to start
sudo launchctl enable system/local.minecraftblocker
sudo launchctl bootstrap system "$PLIST"

# Build the on/off app (~/Applications/Minecraft Blocker.app)
bash ./make-app.command
echo
echo "Done. Minecraft Launcher, Lunar Client and the Minecraft game now get closed within 2 seconds."
echo "To turn it off or on later, open the app: Minecraft Blocker (admin password needed)."
echo "Log of what was closed: /var/log/minecraftblocker.log"
