# Google Optimizer

Personal anti-distraction tools for **Chrome on a Mac**, kept small and easy to edit:

1. **Google Optimizer**: one Chrome extension (files in the repo root) that blocks distracting content, alerts you when Claude finishes a reply, and pins important Gmail at the top.
2. **Minecraft Blocker** (`minecraft-blocker/`): a macOS background service that closes Minecraft Launcher, Lunar Client and the Minecraft game.

> **Start here if you are new:** read "Current state" below first. The newest code is on `main`.

---

## Goals

| Goal | How |
|---|---|
| Instagram only for DMs | Every page except `/direct/...` (and login pages) redirects to the inbox. Reels are blocked everywhere, including reels and shared posts sent in DMs, both ways. |
| Clean DM look | Compact chat list with colour profile pictures, names centred on the picture, a preview only for chats with new messages, no notes bar. Messages show as plain text (no bubbles). Voice notes still work. |
| Two chats at once | Popup button "Open 2 chats side by side" opens two Instagram windows, left and right half of the screen. |
| YouTube without junk | Shorts blocked. Focus mode: only allowed channels, home-feed channels, or videos whose title has an allowed keyword will play. Home page shows your educational channels. Subscriptions page keeps only the "keep" list. |
| Facebook and Threads gone | Pages are replaced with "Facebook is blocked" / "Threads is blocked". |
| Know when Claude is done | On claude.ai (chat and Claude Code pages), when a reply finishes: **Alert me** (a window that stays until clicked), **Switch to it** (jumps to the Claude tab), or **Off**. Nothing happens if you are already on that tab. |
| Important Gmail first | An "Important" section at the top of the Gmail inbox with mail from chosen senders. |
| No Minecraft | Minecraft Launcher, Lunar Client and the Java game are force-quit within 2 seconds; Dock icons removed. |

The extension has **no on/off switch on purpose**. (The Minecraft Blocker does have one, an app that needs the admin password, added on request 13 Nov 2026.) The only choices in the popup are the Claude finish mode, the YouTube lists and the Gmail sender list.

Default YouTube "subscriptions to keep": @veritasium, @kurzgesagt, @FlameFragsMC, @wemmbumc, @Spokeishere, @ParrotX2.

---

## Current state (6 Nov 2026)

### Branches and pull requests

Everything is merged into `main` (v3.5.3). Old work branches (`center-chat-names`, `claude/project-thread-*`) are kept only for history.

| PR | What it added |
|---|---|
| #1 | Instagram DM layout, split windows, voice notes, shared-post hiding, Claude Code detection |
| #2 | Gmail Important section (merged into #1's branch) |
| #3 | v3.5.3: fixes the "Extension context invalidated" error, re-injects the Claude watcher into open tabs after a reload |
| #4 | This README and the Minecraft Blocker |

### Done
- Everything in the Goals table is built (extension v3.5.3, Minecraft Blocker v1).
- Confirmed working live by the user: Instagram side-by-side chats.
- Claude Code "working" detection was taken from the live page markup.

### Not verified / known limits
- **Mostly tested on fake (mock) pages**, not the live sites. Instagram, YouTube and Gmail change their page code often; when a feature stops working the fix is usually a selector at the top of the matching file.
- **Claude alert "Switch to it"** was reported failing before v3.5.3. The likely cause (stale script after an extension reload) is fixed in PR #3 but not yet confirmed live. The popup shows when a Claude page was last seen / working / finished, to help diagnose.
- **Gmail Important** only sees emails loaded on the current inbox page. Older mail on later pages is not pulled in ("See all" runs a Gmail search for all of it). Not yet checked on live Gmail.
- **Brightspace sender address is pending.** For now any sender containing "brightspace" or "d2l" counts. Replace those two lines with the real address once known.
- **Instagram cannot be shown inside a frame** (it shows "page isn't available"), so side-by-side uses two real windows, not one tab.
- **Scrolling the tab strip is not possible**: Chrome does not let extensions change the tab bar.
- **Bookmarks scroll panel**: offered, not built.
- **Minecraft Blocker** was tested with simulated processes on Linux only, never on a real Mac. The Dock cleanup has never run.
- **Admin accounts can remove everything** (extension, lockdown profile, Minecraft Blocker). Real protection needs a Standard everyday account with someone else holding the admin password.

---

## Install the Chrome extension

1. On GitHub, click **Code > Download ZIP**, and unzip it somewhere permanent (not Downloads, which gets cleaned).
2. Open `chrome://extensions` and turn on **Developer mode** (top right).
3. Click **Load unpacked** and pick the unzipped folder (the one with `manifest.json` directly inside).
4. Pin the icon. Reload any open Instagram, YouTube, Gmail and claude.ai tabs.
5. If the old **Reels Blocker** or **Claude Done Alert** extensions are installed, remove them. This one replaces both.

To update: replace the folder's files with the new ones, then click the reload arrow on the extension card in `chrome://extensions`.

### Optional: make it hard to remove
`lockdown/make-lockdown-profile.command` builds a macOS profile (needs a removal password, ideally typed by someone else). Run it in Terminal: `bash path/to/lockdown/make-lockdown-profile.command`, then open the `.mobileconfig` file it puts on your Desktop. It reuses the old Reels Blocker profile identifier, so it replaces that profile instead of adding a second one.

## Install the Minecraft Blocker (macOS)

Don't double-click (macOS refuses downloaded scripts). In Terminal:

```
bash path/to/minecraft-blocker/install.command
```

Type your Mac password (nothing shows while typing). Remove later with `bash /Library/MinecraftBlocker/uninstall.command`. Details in [`minecraft-blocker/README.md`](minecraft-blocker/README.md).

---

## File map

| File | What's in it |
|---|---|
| `manifest.json` | Extension name, version, which script runs on which site. Bump `version` on every change. |
| `settings.js` | Default values for everything the popup can change (YouTube lists, Gmail senders, Claude mode). |
| `blocker.js` | Instagram, YouTube, Facebook and Threads rules. Site selectors are in `SITES` near the top. |
| `claude.js` | Detects when Claude is working / finished (`BUSY` selector list at the top). |
| `background.js` | Alert window or tab switch when Claude finishes; opens the two Instagram windows; re-injects `claude.js` after a reload. |
| `gmail.js` | Gmail Important section. Gmail class names at the top. |
| `popup.html` / `popup.js` | The popup when you click the icon. |
| `hud.html` / `hud.js` | The "Claude finished" alert window. |
| `icons/` | Extension icons. |
| `lockdown/` | Script that builds the macOS lockdown profile. |
| `minecraft-blocker/` | `blocker.sh` (the watcher; edit `PATTERNS` to change what is blocked), `install.command`, `uninstall.command`, the LaunchDaemon `.plist`, `toggle.sh` + `make-app.command` (the on/off app). |

## Working on this repo

- Keep code simple and readable; the owner edits it by hand.
- Don't add on/off toggles to the extension (the Minecraft Blocker app is the one exception).
- Make changes on a branch and open a pull request. Don't push straight to `main`.
- Bump `version` in `manifest.json` with each extension change.
- Say in the PR what was tested and where (mock page vs live site).
- `.zip` files are not committed. Build one from the folder when needed.
