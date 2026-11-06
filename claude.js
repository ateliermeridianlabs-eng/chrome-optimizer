// Runs on claude.ai. Tells background.js when Claude goes from "working" to "done".
(() => {
  // Claude counts as working while any of these is on the page. If alerts stop after a
  // claude.ai redesign, inspect the Stop button and add its selector here.
  const BUSY = [
    '[data-cds="TurnStatus"][data-state="busy"]',   // Claude Code / projects: "Claude is working" status
    '[data-cds="ChatComposer"][data-busy="true"]',   // Claude Code / projects: message box while working
    '[data-is-streaming="true"]',                    // normal chats: reply still streaming
    'button[aria-label*="Stop" i]',
    'button[aria-label*="Interrupt" i]'
  ].join(',');

  let busy = false, busySince = 0, timer = null;

  function check() {
    if (document.querySelector(BUSY)) {
      if (!busy) { busy = true; busySince = Date.now(); chrome.runtime.sendMessage({ type: 'claude-busy' }); }
      clearTimeout(timer); timer = null;
    } else if (busy && !timer) {
      // must stay idle 1.5 s, and must have worked at least 0.8 s, to count as done
      timer = setTimeout(() => {
        timer = null; busy = false;
        if (Date.now() - busySince > 2300) chrome.runtime.sendMessage({ type: 'claude-done', title: document.title, looking: document.hasFocus() });
      }, 1500);
    }
  }
  // MutationObserver keeps working in background tabs (timers get slowed down there)
  new MutationObserver(check).observe(document.documentElement, { subtree: true, childList: true, attributes: true, attributeFilter: ['data-is-streaming', 'aria-label', 'data-state', 'data-busy'] });
  chrome.runtime.sendMessage({ type: 'claude-seen' });
  check();
})();
