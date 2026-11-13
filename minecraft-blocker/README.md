# Minecraft Blocker (macOS)

Force-quits **Minecraft Launcher**, **Lunar Client** and the **Minecraft Java game** within 2 seconds of them opening, and removes their icons from the Dock (checked about every 30 seconds).
Other Java apps are not touched: only processes whose command line contains a Minecraft/Lunar marker are killed.

## Install
macOS blocks double-clicking scripts downloaded from the internet ("could not be opened, move to Trash"). Install from Terminal instead, which skips that check:

1. Get this `minecraft-blocker` folder onto your Mac (download the repo ZIP from GitHub and unzip it, usually into Downloads).
2. Open **Terminal** (Cmd+Space, type Terminal, Enter).
3. Paste this and press Enter, then type your Mac password (nothing shows while typing, that is normal):

```
bash ~/Downloads/chrome-optimizer-main/minecraft-blocker/install.command
```

If the folder is somewhere else: type `bash ` (with a space), drag `install.command` from Finder into the Terminal window, press Enter.

What it installs:
- `/Library/MinecraftBlocker/blocker.sh` – the watcher (root-owned, locked with `schg`).
- `/Library/LaunchDaemons/local.minecraftblocker.plist` – starts it at boot as root and restarts it if killed.
- Log of everything it closed: `/var/log/minecraftblocker.log`.

## Turn it on and off
The install also builds **Minecraft Blocker.app** in `~/Applications` (find it with Spotlight). Open it: it says whether the blocker is ON or OFF and offers to flip it. Flipping needs the admin password. OFF stays off after a restart until you turn it on again.
To rebuild the app alone: `bash path/to/minecraft-blocker/make-app.command`. The app is only a small script (`toggle.sh`) wrapped in a folder, so it is built on your Mac and macOS does not block it.

## Uninstall
In Terminal: `bash /Library/MinecraftBlocker/uninstall.command` and type the admin password.

## Edit what gets blocked
Open `blocker.sh`, edit the `PATTERNS` list (each line is one rule, `#` starts a comment; other launchers like Badlion, Feather, Prism, CurseForge, Modrinth are there, commented out). Then run the install command again.

## How strong is it?
- Can't be stopped from Activity Monitor or Terminal without the admin password, and it restarts itself. The on/off app asks for the same password, so anyone who knows it can turn the blocker off.
- The on/off app was only syntax-checked and run against fake `osascript`/`launchctl` on Linux, never on a real Mac.
- **If your account is an admin, you can still remove it with your own password.** For real protection, make your everyday account a Standard user and let someone else keep the admin password (System Settings > Users & Groups).
- The Dock cleanup was only syntax-checked, never run on a Mac.
- Matching was tested with simulated processes on Linux, not yet on a real Mac with Minecraft installed.
