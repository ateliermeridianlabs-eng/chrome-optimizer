#!/bin/bash
# App Blocker: force-quits Photo Booth (the Minecraft rules are still below, commented out).
# Runs as root in the background (started by /Library/LaunchDaemons/local.minecraftblocker.plist).
#
# TO EDIT: add or remove lines in PATTERNS below, then run install.command again.
# Each line is matched against a process's FULL command line (path + arguments),
# so other apps are left alone: only processes that contain one of these are killed.
#
# ON/OFF: while the file /Library/MinecraftBlocker/off exists, nothing is blocked.
# The "Photo Booth Blocker" app in /Applications creates/deletes that file (asks for the Mac password).

PATTERNS=(
  'Photo Booth\.app/'                    # Photo Booth
  # --- Minecraft: remove the # to block it again ---
  # 'Minecraft\.app/'                      # Minecraft Launcher
  # 'Lunar Client\.app/'                   # Lunar Client
  # 'net\.minecraft\.client\.main\.Main'   # vanilla game main class
  # 'minecraft\.launcher\.brand'           # flag the official launcher passes to the game
  # 'Application Support/minecraft/'       # game files of the official launcher
  # 'com\.moonsworth\.'                    # Lunar Client's game code
  # '\.lunarclient/'                       # Lunar Client's game files and Java runtime
  # 'net\.fabricmc\.loader\.impl\.launch'  # Fabric modded Minecraft
  # 'cpw\.mods\.'                          # Forge modded Minecraft
)

CHECK_EVERY=2   # seconds between checks
LOG=/var/log/minecraftblocker.log
OFF_FLAG=/Library/MinecraftBlocker/off   # exists = blocking is switched off

# Dock icons to remove (matched against the app's file URL; a space is written %20)
DOCK_APPS='Photo%20Booth\.app'   # Minecraft was: 'Minecraft\.app|Lunar%20Client\.app'
DOCK_EVERY=15   # check the Dock every 15 rounds (about 30 seconds)

# Removes matching icons from the Dock of whoever is logged in, then restarts the Dock.
clean_dock() {
  local u uid tmp key i n url found=0
  u=$(stat -f %Su /dev/console)
  if [ -z "$u" ] || [ "$u" = root ] || [ "$u" = loginwindow ]; then return; fi
  uid=$(id -u "$u")
  asu() { launchctl asuser "$uid" sudo -u "$u" "$@"; }
  asu defaults read com.apple.dock 2>/dev/null | grep -Eq "$DOCK_APPS" || return
  tmp=$(asu mktemp /tmp/dock.XXXXXX) || return
  asu defaults export com.apple.dock "$tmp"
  for key in persistent-apps recent-apps; do
    n=0; while asu plutil -extract "$key.$n" xml1 -o /dev/null "$tmp" 2>/dev/null; do n=$((n+1)); done
    for (( i=n-1; i>=0; i-- )); do   # go backwards so removing doesn't shift the rest
      url=$(asu plutil -extract "$key.$i.tile-data.file-data._CFURLString" raw -o - "$tmp" 2>/dev/null)
      if echo "$url" | grep -Eq "$DOCK_APPS"; then
        asu plutil -remove "$key.$i" "$tmp" && found=1
        echo "$(date '+%F %T') removed from Dock: $url" >> "$LOG"
      fi
    done
  done
  if [ "$found" = 1 ]; then
    asu defaults import com.apple.dock "$tmp"
    killall Dock 2>/dev/null
  fi
  rm -f "$tmp"
}

round=0
while true; do
  if [ -e "$OFF_FLAG" ]; then sleep "$CHECK_EVERY"; continue; fi
  if (( round % DOCK_EVERY == 0 )); then clean_dock; fi
  round=$((round+1))
  for p in "${PATTERNS[@]}"; do
    pids=$(pgrep -f -- "$p")
    if [ -n "$pids" ]; then
      kill -9 $pids 2>/dev/null
      echo "$(date '+%F %T') killed [$p] pids: $(echo $pids)" >> "$LOG"
    fi
  done
  sleep "$CHECK_EVERY"
done
