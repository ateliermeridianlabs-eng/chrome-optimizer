#!/bin/bash
# Builds a macOS configuration profile that locks Chrome (and Brave) down around Google Optimizer.
# Double-click this file in Finder (or run: bash make-lockdown-profile.command).
set -euo pipefail
cd "$(dirname "$0")"
OUT="$HOME/Desktop/GoogleOptimizer-Lockdown.mobileconfig"

echo "=== Google Optimizer lockdown profile ==="
echo
echo "This profile can only be removed with a REMOVAL PASSWORD."
echo "For it to really work, have SOMEONE ELSE type it now and don't let them tell you."
echo
while true; do
  read -r -s -p "Removal password: " P1; echo
  read -r -s -p "Repeat: " P2; echo
  [ -n "$P1" ] && [ "$P1" = "$P2" ] && break
  echo "Empty or mismatch, try again."
done
clear
echo "Optional: Chrome Web Store ID of Google Optimizer (32 letters a-p)."
echo "Only exists if you published it to the Web Store. With it, Chrome force-installs the"
echo "extension and its Remove button disappears. Leave empty if you loaded it unpacked."
read -r -p "Extension ID (Enter to skip): " EXTID
if [ -n "$EXTID" ] && ! [[ "$EXTID" =~ ^[a-p]{32}$ ]]; then echo "That is not a valid ID."; exit 1; fi

esc() { printf '%s' "$1" | sed -e 's/&/\&amp;/g' -e 's/</\&lt;/g' -e 's/>/\&gt;/g'; }
PW=$(esc "$P1")
U() { uuidgen; }

FORCE=""
if [ -n "$EXTID" ]; then
  FORCE="<key>ExtensionInstallForcelist</key><array><string>${EXTID};https://clients2.google.com/service/update2/crx</string></array>"
fi

browser_payload() { # $1 = preference domain
cat <<P
    <dict>
      <key>PayloadType</key><string>$1</string>
      <key>PayloadIdentifier</key><string>local.reelsblocker.lockdown.$1</string>
      <key>PayloadUUID</key><string>$(U)</string>
      <key>PayloadVersion</key><integer>1</integer>
      <key>PayloadDisplayName</key><string>Google Optimizer lockdown ($1)</string>
      <!-- No incognito, no guest windows, no new profiles: all of these would run without the extension -->
      <key>IncognitoModeAvailability</key><integer>1</integer>
      <key>BrowserGuestModeEnabled</key><false/>
      <key>BrowserAddPersonEnabled</key><false/>
      <!-- Extensions page blocked; Instagram blocked at browser level except Direct Messages.
           This part keeps working even if the extension itself is removed. -->
      <key>URLBlocklist</key>
      <array>
        <string>chrome://extensions</string>
        <string>brave://extensions</string>
        <string>instagram.com</string>
        <string>facebook.com</string>
        <string>fb.com</string>
        <string>threads.net</string>
        <string>threads.com</string>
      </array>
      <key>URLAllowlist</key>
      <array>
        <string>instagram.com/direct</string>
        <string>instagram.com/accounts</string>
        <string>instagram.com/challenge</string>
        <string>instagram.com/two_factor</string>
        <string>instagram.com/api</string>
        <string>instagram.com/ajax</string>
        <string>instagram.com/graphql</string>
      </array>
      $FORCE
    </dict>
P
}

cat > "$OUT" <<EOF2
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>PayloadType</key><string>Configuration</string>
  <key>PayloadVersion</key><integer>1</integer>
  <key>PayloadIdentifier</key><string>local.reelsblocker.lockdown</string>
  <key>PayloadUUID</key><string>$(U)</string>
  <key>PayloadDisplayName</key><string>Google Optimizer Lockdown</string>
  <key>PayloadDescription</key><string>Locks Instagram to Direct Messages in Chrome and Brave and blocks the ways around Google Optimizer.</string>
  <key>PayloadScope</key><string>System</string>
  <key>PayloadContent</key>
  <array>
$(browser_payload com.google.Chrome)
$(browser_payload com.brave.Browser)
    <dict>
      <key>PayloadType</key><string>com.apple.profileRemovalPassword</string>
      <key>PayloadIdentifier</key><string>local.reelsblocker.lockdown.removalpassword</string>
      <key>PayloadUUID</key><string>$(U)</string>
      <key>PayloadVersion</key><integer>1</integer>
      <key>RemovalPassword</key><string>${PW}</string>
    </dict>
  </array>
</dict>
</plist>
EOF2
unset P1 P2 PW

if command -v plutil >/dev/null; then plutil -lint "$OUT"; fi
echo
echo "Profile written to: $OUT"
echo
echo "Next:"
echo " 1. It opens now. macOS says 'Profile downloaded'."
echo " 2. System Settings > General > Device Management (older macOS: Privacy & Security > Profiles)."
echo " 3. Double-click 'Google Optimizer Lockdown' > Install > enter your Mac password."
echo " 4. Quit Chrome completely (Cmd+Q) and reopen it."
echo " 5. Check chrome://policy shows the rules, and chrome://extensions is now blocked."
open "$OUT" || true
