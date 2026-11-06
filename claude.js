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

  // After the extension is reloaded or updated, this old copy of the script is cut off from it and
  // sending a message throws "Extension context invalidated". Then stop quietly;
  // background.js puts a fresh copy into every open claude.ai tab.
  function send(msg) {
    try {
      if (chrome.runtime?.id) return chrome.runtime.sendMessage(msg).catch(() => {});
    } catch (_) {}
    observer.disconnect(); clearTimeout(timer);
  }

  function check() {
    if (document.querySelector(BUSY)) {
      if (!busy) { busy = true; busySince = Date.now(); send({ type: 'claude-busy' }); }
      clearTimeout(timer); timer = null;
    } else if (busy && !timer) {
      // must stay idle 1.5 s, and must have worked at least 0.8 s, to count as done
      timer = setTimeout(() => {
        timer = null; busy = false;
        if (Date.now() - busySince > 2300) send({ type: 'claude-done', title: document.title, looking: document.hasFocus() });
      }, 1500);
    }
  }
  // MutationObserver keeps working in background tabs (timers get slowed down there)
  const observer = new MutationObserver(check);
  observer.observe(document.documentElement, { subtree: true, childList: true, attributes: true, attributeFilter: ['data-is-streaming', 'aria-label', 'data-state', 'data-busy'] });
  send({ type: 'claude-seen' });
  check();
})();
