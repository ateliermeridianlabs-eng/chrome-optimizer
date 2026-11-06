// Runs on mail.google.com. Shows an "Important" section at the top of the inbox with mail from
// the senders in the popup list (default in settings.js, key gmailImportant). Matching mail is
// moved out of the normal list into that section. Click a line to open the email.
(() => {
  // Gmail's own class names. If the section stops filling after a Gmail redesign, fix these.
  const ROW = 'tr.zA';                  // one email in the list
  const SENDER = 'span[email]';         // sender, has email="..." and name="..."
  const SUBJECT = 'span.bog';
  const DATE = 'td.xW span';
  const UNREAD = 'zE';                  // class on unread rows
  const THREAD = '[data-legacy-thread-id]';

  let rules = [];

  // One rule per line:  name@site.com = that address,  site.com = anyone @site.com or @x.site.com,
  // a plain word (brightspace) = sender address or name contains it.
  function parse(text) {
    rules = text.split('\n').map(s => s.trim().toLowerCase()).filter(Boolean);
  }

  function matches(email, name) {
    email = email.toLowerCase(); name = name.toLowerCase();
    return rules.some(r =>
      r.includes('@') ? email === r :
      r.includes('.') ? email.endsWith('@' + r) || email.endsWith('.' + r) :
      email.includes(r) || name.includes(r));
  }

  // Only on the inbox itself (and its later pages), not inside an email or other folders.
  const inInbox = () => /^(#inbox(\/p\d+)?)?$/.test(location.hash);

  function render() {
    const main = document.querySelector('div[role="main"]');
    let box = document.getElementById('go-important');
    document.querySelectorAll('tr.go-moved').forEach(r => r.classList.remove('go-moved'));
    if (!main || !inInbox() || !rules.length) { if (box) box.remove(); return; }

    const items = [];
    for (const row of main.querySelectorAll(ROW)) {
      const s = row.querySelector(SENDER);
      if (!s || !matches(s.getAttribute('email') || '', s.getAttribute('name') || s.textContent)) continue;
      row.classList.add('go-moved');
      const t = row.querySelector(THREAD);
      items.push({
        id: t ? t.getAttribute('data-legacy-thread-id') : '',
        from: s.getAttribute('name') || s.textContent,
        subject: (row.querySelector(SUBJECT) || {}).textContent || '(no subject)',
        date: (row.querySelector(DATE) || {}).textContent || '',
        unread: row.classList.contains(UNREAD)
      });
    }

    const html = '<div class="go-h">Important <span>' + items.length + '</span>' +
      '<a href="#search/' + encodeURIComponent('from:(' + rules.join(' OR ') + ')') + '">See all</a></div>' +
      (items.length ? '' : '<div class="go-empty">Nothing on this page</div>') +
      items.map(i => '<a class="go-row' + (i.unread ? ' go-new' : '') + '" href="#inbox/' + esc(i.id) + '">' +
        '<b>' + esc(i.from) + '</b><span>' + esc(i.subject) + '</span><i>' + esc(i.date) + '</i></a>').join('');

    if (!box) { box = document.createElement('div'); box.id = 'go-important'; }
    if (box.innerHTML !== html) box.innerHTML = html;
    if (main.firstChild !== box) main.prepend(box);
  }

  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const css = document.createElement('style');
  css.textContent = `
    tr.go-moved { display: none !important; }
    #go-important { margin: 8px 16px 12px; border: 2px solid #d93025; border-radius: 12px; overflow: hidden; font: 14px Google Sans, Roboto, sans-serif; }
    #go-important .go-h { display: flex; gap: 8px; align-items: center; padding: 8px 14px; background: #d93025; color: #fff; font-weight: 600; }
    #go-important .go-h span { background: #fff3; border-radius: 8px; padding: 0 7px; font-size: 12px; }
    #go-important .go-h a { margin-left: auto; color: #fff; font-weight: 400; font-size: 12px; }
    #go-important .go-row { display: flex; gap: 12px; padding: 7px 14px; color: inherit; text-decoration: none; border-top: 1px solid #8883; }
    #go-important .go-row:hover { background: #8881; }
    #go-important .go-row b { width: 180px; flex: none; font-weight: 400; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    #go-important .go-row span { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    #go-important .go-row i { font-style: normal; color: #888; font-size: 12px; }
    #go-important .go-new b, #go-important .go-new span { font-weight: 700; }
    #go-important .go-empty { padding: 7px 14px; color: #888; }`;
  document.documentElement.appendChild(css);

  let queued = false;
  const later = () => { if (!queued) { queued = true; setTimeout(() => { queued = false; render(); }, 300); } };

  chrome.storage.sync.get(GO_DEFAULTS, s => { parse(s.gmailImportant); later(); });
  chrome.storage.onChanged.addListener(c => { if (c.gmailImportant) { parse(c.gmailImportant.newValue || ''); later(); } });
  new MutationObserver(later).observe(document.documentElement, { childList: true, subtree: true });
  addEventListener('hashchange', later);
})();
