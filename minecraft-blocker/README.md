# Photo Booth Blocker (macOS)

Force-quits **Photo Booth** within 2 seconds of it opening, and removes its icon from the Dock (checked about every 30 seconds).
Only processes whose command line contains `Photo Booth.app/` are killed. (This folder used to block Minecraft; those rules are still in `blocker.sh`, commented out.)

## Turn it on or off
Open the **Photo Booth Blocker** app (Cmd+Space, type "Photo Booth Blocker", Enter). It says whether blocking is ON or OFF; click the button to switch and type your Mac password.
It stays the way you leave it, also after a restart. Turning it back on does not put Photo Booth back in the Dock.

## Install
macOS blocks double-clicking scripts downloaded from the internet ("could not be opened, move to Trash"). Install from Terminal instead, which skips that check:

1. Get this `minecraft-blocker` folder onto your Mac (download the repo ZIP from GitHub and unzip it, usually into Downloads).
2. Open **Terminal** (Cmd+Space, type Terminal, Enter).
3. Paste this and press Enter, then type your Mac password (nothing shows while typing, that is normal):

```
bash ~/Downloads/chrome-optimizer-main/minecraft-blocker/install.command
```

If the folder is somewhere else: type `bash ` (with a space), drag `install.command` from Finder into the Terminal window, press Enter.
Already had the Minecraft version installed? Running this replaces it; no need to uninstall first.

What it installs:
- `/Library/MinecraftBlocker/blocker.sh` – the watcher (root-owned, locked with `schg`).
- `/Library/LaunchDaemons/local.minecraftblocker.plist` – starts it at boot as root and restarts it if killed.
- `/Applications/Photo Booth Blocker.app` – the on/off switch. It creates or deletes `/Library/MinecraftBlocker/off`; while that file exists nothing is blocked.
- Log of everything it closed: `/var/log/minecraftblocker.log`.

## Uninstall
In Terminal: `bash /Library/MinecraftBlocker/uninstall.command` and type the admin password.

## Edit what gets blocked
Open `blocker.sh`, edit the `PATTERNS` list (each line is one rule, `#` starts a comment) and `DOCK_APPS`. Then run the install command again.

## How strong is it?
- Can't be stopped from Activity Monitor or Terminal without the admin password, and it restarts itself. The on/off app also needs the admin password.
- **If your account is an admin, you can still turn it off or remove it with your own password.** For real protection, make your everyday account a Standard user and let someone else keep the admin password (System Settings > Users & Groups).
- Watch out: any process whose command line contains `Photo Booth.app/` is killed, including a Terminal command that types that path.
- The on/off app and the Dock cleanup were never run on a Mac (no Mac to test on). Blocking and the off switch were tested with simulated processes on Linux.
