// Google Optimizer background: handles the "Claude finished" alert / auto-switch.
importScripts('settings.js');

async function goToTab(tabId) {
  const tab = await chrome.tabs.get(tabId);
  await chrome.windows.update(tab.windowId, { focused: true, drawAttention: true });
  await chrome.tabs.update(tab.id, { active: true });
}

// The alert window (hud.html) lists every finished chat until you click it.
async function showAlert(tab, title) {
  let { hud, items = [] } = await chrome.storage.session.get(['hud', 'items']);
  items = [{ tabId: tab.id, title: title.replace(/\s*[-|–]\s*Claude\s*$/i, ''), at: Date.now() }, ...items.filter(i => i.tabId !== tab.id)];
  await chrome.storage.session.set({ items });
  try {
    await chrome.windows.update(hud, { focused: true, drawAttention: true }); // already open: bring it up
    chrome.runtime.sendMessage({ type: 'hud-refresh' }).catch(() => {});
  } catch (_) {
    const win = await chrome.windows.create({ url: 'hud.html', type: 'popup', width: 380, height: 220, focused: true });
    await chrome.storage.session.set({ hud: win.id });
  }
}

async function closeAlert() {
  const { hud } = await chrome.storage.session.get('hud');
  await chrome.storage.session.set({ items: [], hud: null });
  if (hud) chrome.windows.remove(hud).catch(() => {});
}

chrome.windows.onRemoved.addListener(async id => {
  const { hud } = await chrome.storage.session.get('hud');
  if (id === hud) chrome.storage.session.set({ items: [], hud: null });
});

chrome.runtime.onMessage.addListener(async (msg, sender) => {
  // status line in the popup, to see what the extension noticed on claude.ai
  if (msg.type === 'claude-seen' || msg.type === 'claude-busy' || msg.type === 'claude-done') {
    const now = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    chrome.storage.session.set({ ['claude-' + msg.type.split('-')[1]]: now });
  }
  if (msg.type === 'claude-done') {
    const { claudeMode } = await chrome.storage.sync.get(GO_DEFAULTS);
    const win = await chrome.windows.getLastFocused().catch(() => null);
    const looking = msg.looking && sender.tab.active && win && win.focused && win.id === sender.tab.windowId;
    if (claudeMode === 'off' || looking) return;
    if (claudeMode === 'switch') goToTab(sender.tab.id);
    else showAlert(sender.tab, msg.title);
  }
  if (msg.type === 'hud-go') { goToTab(msg.tabId).catch(() => {}); closeAlert(); }
  if (msg.type === 'hud-dismiss') closeAlert();
  // ---- Instagram split: two windows, one chat list ----
  if (msg.type === 'split') {
    const { left, top, width, height } = msg.screen, half = Math.floor(width / 2), split = { active: 'right' };
    for (const [pane, x] of [['left', left], ['right', left + half]]) {
      const w = await chrome.windows.create({ url: 'https://www.instagram.com/direct/inbox/', type: 'normal', left: x, top, width: half, height });
      split[pane] = w.tabs[0].id;
    }
    await chrome.storage.session.set({ split });
  }
  if (msg.type === 'split-hello' || msg.type === 'split-active' || msg.type === 'split-open') {
    const { split } = await chrome.storage.session.get('split');
    if (!split) return;
    if (msg.type === 'split-active') { split.active = msg.pane; await chrome.storage.session.set({ split }); }
    if (msg.type === 'split-open') chrome.tabs.update(split.right, { url: 'https://www.instagram.com' + msg.path });
    for (const pane of ['left', 'right']) {
      chrome.tabs.sendMessage(split[pane], { type: 'split-state', pane, active: split.active }).catch(() => {});
    }
  }
  if (msg.type === 'test') {
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    showAlert(tab, 'Test alert');
  }
});
