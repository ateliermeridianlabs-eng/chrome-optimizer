#!/bin/bash
# On/off switch for the Minecraft Blocker. make-app.command copies this into "Minecraft Blocker.app".
# Shows whether the blocker is ON or OFF, and flips it after the admin password is typed.

LABEL=local.minecraftblocker
PLIST=/Library/LaunchDaemons/$LABEL.plist
TITLE="Minecraft Blocker"

say() { osascript -e "display dialog \"$1\" with title \"$TITLE\" buttons {\"OK\"} default button 1" >/dev/null 2>&1; }

if [ ! -f "$PLIST" ]; then
  say "Not installed yet. Run minecraft-blocker/install.command in Terminal first."
  exit 1
fi

# The blocker is ON while its watcher script is running.
if pgrep -qf /Library/MinecraftBlocker/blocker.sh; then
  state=ON;  action="Turn off"; new=OFF
  # disable = stays off after a restart; bootout = stops it now
  cmds="/bin/launchctl disable system/$LABEL; /bin/launchctl bootout system $PLIST"
else
  state=OFF; action="Turn on";  new=ON
  cmds="/bin/launchctl enable system/$LABEL; /bin/launchctl bootstrap system $PLIST"
fi

choice=$(osascript -e "button returned of (display dialog \"Minecraft Blocker is $state.\" with title \"$TITLE\" buttons {\"Cancel\", \"$action\"} default button 2)" 2>/dev/null) || exit 0
[ "$choice" = "$action" ] || exit 0

if osascript -e "do shell script \"$cmds\" with administrator privileges" >/dev/null 2>&1; then
  say "Minecraft Blocker is now $new."
else
  say "Nothing changed (password cancelled or wrong)."
fi
