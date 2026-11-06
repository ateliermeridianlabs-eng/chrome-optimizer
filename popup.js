const LISTS = ['ytAllowChannels', 'ytAllowKeywords', 'ytEduChannels', 'ytKeepSubs'];
const saved = () => { document.getElementById('saved').textContent = 'Saved'; setTimeout(() => document.getElementById('saved').textContent = '', 1000); };

chrome.storage.sync.get(GO_DEFAULTS, s => {
  // Claude mode buttons
  const buttons = document.querySelectorAll('#claudeMode button');
  const show = v => buttons.forEach(b => b.classList.toggle('sel', b.dataset.v === v));
  show(s.claudeMode);
  buttons.forEach(b => b.onclick = () => { show(b.dataset.v); chrome.storage.sync.set({ claudeMode: b.dataset.v }, saved); });

  // YouTube lists
  for (const k of LISTS) {
    const el = document.getElementById(k);
    el.value = s[k];
    el.onchange = () => chrome.storage.sync.set({ [k]: el.value }, saved);
  }
});

document.getElementById('test').onclick = () => chrome.runtime.sendMessage({ type: 'test' });
// Instagram with two chats side by side, in a new tab
document.getElementById('split').onclick = () => chrome.tabs.create({ url: 'https://www.instagram.com/direct/inbox/#split' });
