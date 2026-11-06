# Google Optimizer (Chrome extension)

One extension that replaces **Reels Blocker** and **Claude Done Alert**. Remove both old ones from `chrome://extensions` after installing this.

## Install
1. Unzip `google-optimizer.zip` somewhere permanent. You get one folder, `GoogleOptimizer`.
2. Open `chrome://extensions` and turn on **Developer mode**.
3. Click **Load unpacked** and pick the `GoogleOptimizer` folder (manifest.json is directly inside it).
4. Pin the icon. Reload any open Instagram, YouTube and claude.ai tabs.

## What it does
Always on, no switch:
- Instagram locked to DMs only (same rules as Reels Blocker v2.8.0).
- YouTube Shorts blocked.
- YouTube focus mode: only allowed channels, home-feed channels, or videos whose title has an allowed keyword play. Home page shows your educational channels.
- Facebook and Threads blocked.

The popup lets you choose:
- **When Claude finishes a reply:** Alert me (a window that stays until you click it), Switch to it (jumps to the Claude tab), or Off. Nothing happens if you are already looking at that Claude tab.
- **YouTube lists:** allowed channels, keywords, home-feed channels, subscriptions to keep.

## Where to edit things
| File | What's in it |
|---|---|
| `settings.js` | Default values for everything the popup can change. |
| `blocker.js` | Instagram, YouTube, Facebook, Threads rules. Selectors are in `SITES` at the top. |
| `claude.js` | How it spots that Claude finished (`BUSY` selector list at the top). |
| `background.js` | What happens when Claude finishes (alert window or tab switch). |
| `popup.html` / `popup.js` | The popup you see when you click the icon. |
| `hud.html` / `hud.js` | The "Claude finished" alert window. |

After editing, click the reload arrow on the extension in `chrome://extensions`.

## Lockdown (optional)
`lockdown/make-lockdown-profile.command` builds the macOS profile that makes the extension hard to remove (same as before). It keeps the old profile identifier, so it replaces an existing Reels Blocker lockdown profile instead of adding a second one.
