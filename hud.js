let first = null;
async function render() {
  const { items } = await chrome.storage.session.get({ items: [] });
  first = items[0];
  const list = document.getElementById('list');
  list.textContent = '';
  for (const i of items) {
    const d = document.createElement('div'); d.className = 'item';
    const t = document.createElement('div'); t.className = 't'; t.textContent = i.title || 'Claude';
    const a = document.createElement('div'); a.className = 'a'; a.textContent = new Date(i.at).toLocaleTimeString();
    d.append(t, a);
    d.onclick = () => chrome.runtime.sendMessage({ type: 'hud-go', tabId: i.tabId });
    list.append(d);
  }
  document.title = `Claude finished (${items.length})`;
}
async function chime() {
  try {
    const ctx = new AudioContext();
    [660, 880].forEach((f, k) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.value = f; o.connect(g); g.connect(ctx.destination);
      const t = ctx.currentTime + k * 0.18;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.3, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
      o.start(t); o.stop(t + 0.4);
    });
  } catch (_) {}
}
document.getElementById('go').onclick = () => first
  ? chrome.runtime.sendMessage({ type: 'hud-go', tabId: first.tabId })
  : chrome.runtime.sendMessage({ type: 'hud-dismiss' });
document.getElementById('x').onclick = () => chrome.runtime.sendMessage({ type: 'hud-dismiss' });
chrome.runtime.onMessage.addListener(m => { if (m.type === 'hud-refresh') { render(); chime(); } });
render(); chime();
