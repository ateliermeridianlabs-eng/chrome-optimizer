/* Google Optimizer: Instagram / YouTube / Facebook / Threads blocker. Everything here is always on.
 * Layer 1: URL guard  - redirects away from blocked pages (works on SPA navigation via polling).
 * Layer 2: CSS        - hides links/posts instantly via attribute-gated rules (needs :has(), Chrome 105+/Firefox 121+).
 * Layer 3: Text scan  - hides "Suggested"/"Sponsored" posts that have no stable selector.
 * Selectors depend on Instagram/YouTube markup and WILL break when they redesign. Fix them in SITES below.
 */
(function () {
  "use strict";
  var api = typeof browser !== "undefined" ? browser : chrome;
  var host = location.hostname;
  // Facebook and Threads: blocked completely, no setting.
  if (/(^|\.)(facebook\.com|fb\.com|threads\.net|threads\.com)$/.test(host)) {
    window.stop();
    var name = /threads/.test(host) ? "Threads" : "Facebook";
    document.documentElement.innerHTML = "<head><title>Blocked</title></head><body style=\"margin:0;height:100vh;display:flex;" +
      "align-items:center;justify-content:center;background:#0f0f0f;color:#aaa;font:18px system-ui,sans-serif\">" + name + " is blocked.</body>";
    return;
  }
  var site = /(^|\.)instagram\.com$/.test(host) ? "ig" : /(^|\.)youtube\.com$/.test(host) ? "yt" : null;
  if (!site) return;

  var root = document.documentElement;
  // Blocking is always on. Only the YouTube lists in settings.js can be changed (from the popup).
  var S = Object.assign({}, GO_DEFAULTS);
  var loaded = false; // until storage answers, blocked pages are hidden but not redirected

  // ---------- Site definitions (the extension point: add a site = add an entry) ----------
  var SITES = {
    ig: {
      // Return a URL to redirect to, or null to allow.
      redirect: function (p) {
        if (!/^\/(direct|accounts|challenge|two_factor|api|ajax|graphql|session|oauth|auth_platform|legal|privacy)(\/|$)/.test(p))
          return "/direct/inbox/";
        if (/^\/reels?(\/|$)/.test(p)) return "/";
        var m = p.match(/^\/([^\/]+)\/reels\/?$/);           // profile Reels tab
        if (m && m[1] !== "explore") return "/" + m[1] + "/";
        if (/^\/explore\/?$/.test(p)) return "/"; // tag/location pages still allowed
        return null;
      },
      css: {
        igReels: [
          'a[href="/reels/"]', 'a[href^="/reels/"]', 'a[href$="/reels/"]',
          'article:has(a[href*="/reel/"])', 'article:has(video)',
          'html:not([data-rb-dm]) main a[href*="/reel/"]'
        ],
        igExplore: ['a[href="/explore/"]'],
        igFeed: ['html[data-rb-home] main article'],
        // DMs-only: every internal link that leads out of Direct is removed (nav, profiles, shared posts/reels).
        igDmOnly: [
          // nav/sidebar links outside the chat area (links inside chats stay so profile pictures and photos show;
          // clicking them still redirects back to the inbox)
          'a[href^="/"]:not([href^="/direct/"]):not([href^="/accounts/"]):not(main a)',
          // shared reels: removed entirely, thumbnail included
          'a[href*="/reel/"]', 'a[href*="/reels/"]', '[role="button"]:has(a[href*="/reel/"])',
          // shared posts (picture posts) too
          'a[href*="/p/"]', '[role="button"]:has(a[href*="/p/"])',
          '[data-rb-reelmsg]'
        ],
        // Boring chat: grayscale, no plain videos, no photo upload. aria-labels are best guesses.
        igBoring: [
          // images, profile pictures, GIFs and stickers stay visible. Real videos are hidden;
          // looping videos are kept because GIFs are often delivered that way.
          'video:not([loop])',
          // "Create"/new post button
          'a:has(svg[aria-label="New post" i])', '[role="link"]:has(svg[aria-label="New post" i])',
          '[role="button"]:has(svg[aria-label="New post" i])', 'a[href^="/create/"]',
          // voice messages (and their waveform) are allowed; emoji, GIF/sticker, voice-note and call buttons too; only photo/video upload stays hidden
          'div[role="button"]:has(svg[aria-label*="Photo" i]):not(:has(svg[aria-label*="GIF" i]))', 'input[type="file"]',
          // no profile pictures inside an open chat (the chat list keeps them)
          'html[data-rb-thread] main img:is([alt*="profile picture" i],[alt*="profile-picture" i]):not([data-rb-tlist] img)'
        ]
      },
      rawCss: {
        // Grayscale only media, so unread red dots keep their colour.
        igBoring: "html[data-rb-igboring] :is(img,video,canvas,svg image){filter:grayscale(1)!important}" +
          "html[data-rb-igboring] *,html[data-rb-igboring] *::before,html[data-rb-igboring] *::after{animation:none!important;transition:none!important}" +
          // Message bubbles -> plain square boxes. Mine: white box, black text. Theirs: black box, white text.
          // compact chat list with colour profile pictures
          // (selectors are kept more specific than the grayscale rule above so they win)
          "html[data-rb-igboring] [data-rb-tlist] :is(img,img),html[data-rb-igboring] [data-rb-tav] img," +
          "html[data-rb-igboring] img[alt*='profile picture' i]{filter:none!important}" +
          "html[data-rb-igboring] [data-rb-trow] [role=button]>div{padding:4px 16px!important}" +
          "html[data-rb-igboring] [data-rb-tav][data-rb-tav]{width:36px!important;height:36px!important;min-width:36px!important}" +
          "html[data-rb-igboring] [data-rb-trow=new] [role=button]>div{background:rgba(255,255,255,.08)!important}" +
          // chat row: centre name on the avatar, preview on the same line to the right of the name
          "html[data-rb-active-pane] body{box-shadow:inset 0 3px 0 #0095f6!important}" +
          "html [data-rb-tin]{align-items:center!important}" +
          "html [data-rb-tcol]{align-self:center!important;justify-content:center!important;margin-top:0!important;margin-bottom:0!important}" +
          "html [data-rb-tline]{display:flex!important;flex-direction:row!important;align-items:center!important;gap:8px!important;flex-wrap:nowrap!important}" +
          "html [data-rb-tline]>*{margin:0!important;min-width:0!important}" +
          // Messages are plain text: no bubble, no border, normal page text colour.
          "html [data-rb-bubble]{border-radius:0!important;background:none!important;box-shadow:none!important;border:0!important;color:var(--rb-text,inherit)!important}" +
          "html [data-rb-bubble] *{color:var(--rb-text,inherit)!important;background:transparent!important}"
      },
      textRules: function () {
        return [/^(suggested for you|suggested posts|suggested reels|suggestions for you)$/i, /^(sponsored|paid partnership.*)$/i];
      },
      flags: function (p) {
        set("data-rb-dm", /^\/direct\//.test(p));
        set("data-rb-thread", /^\/direct\/t\//.test(p));
        set("data-rb-home", p === "/");
      },
      extraScan: function () {
        hideNotes();
        hideReelMsgs();
        boxBubbles();
        compactInbox();
        if (pane === "right") hideLeftOfChat();
        filterNotifications();
      }
    },
    yt: {
      redirect: function (p) {
        if (/^\/shorts(\/|$)/.test(p)) return "/";
        var cm = p.match(/^(\/(?:@[^\/]+|channel\/[^\/]+|c\/[^\/]+|user\/[^\/]+))\/shorts\/?$/);
        if (cm) return cm[1];
        return null;
      },
      css: {
        ytShorts: [
          'a[title="Shorts"]', 'ytd-guide-entry-renderer:has(a[title="Shorts"])',
          'ytd-mini-guide-entry-renderer[aria-label="Shorts"]',
          'ytd-reel-shelf-renderer', 'ytd-rich-shelf-renderer[is-shorts]',
          'ytd-rich-section-renderer:has(ytd-rich-shelf-renderer[is-shorts])',
          'grid-shelf-view-model', 'ytd-video-renderer:has(a[href^="/shorts/"])',
          'ytd-rich-item-renderer:has(a[href^="/shorts/"])', 'ytd-grid-video-renderer:has(a[href^="/shorts/"])',
          'yt-tab-shape[tab-title="Shorts"]', 'ytm-reel-shelf-renderer',
          'ytm-shorts-lockup-view-model', 'ytm-pivot-bar-item-renderer:has(.pivot-shorts)'
        ],
        ytEduHome: ['ytd-browse[page-subtype="home"] #primary', 'ytd-browse[page-subtype="home"] ytd-rich-grid-renderer'],
        // Focus mode: no home feed, no recommendations next to / under the video, no comments.
        focus: [
          'ytd-browse[page-subtype="home"] #primary', 'ytd-watch-flexy #secondary',
          'ytd-watch-flexy #related', 'ytd-watch-flexy #comments', '.ytp-endscreen-content',
          '.ytp-ce-element', '.ytp-autonav-endscreen-countdown-overlay', 'ytd-guide-section-renderer:has(a[href="/feed/trending"])'
        ]
      },
      textRules: function () { return []; },
      flags: function () {},
      extraScan: function () { focusScan(); }
    }
  };
  var SITE = SITES[site];

  function set(attr, on) { on ? root.setAttribute(attr, "") : root.removeAttribute(attr); }

  // ---------- Layer 2: CSS ----------
  var style = document.createElement("style");
  style.id = "rb-style";
  function buildCss() {
    var out = [];
    Object.keys(SITE.css).forEach(function (key) {
      var sel = SITE.css[key].map(function (s) {
        // prefix every selector with html[data-rb-<key>] so toggling is just an attribute flip
        return s.indexOf("html") === 0 ? s.replace(/^html/, "html[data-rb-" + key + "]")
                                       : "html[data-rb-" + key + "] " + s;
      });
      // one rule per selector: an unsupported selector must not kill the others
      sel.forEach(function (x) { out.push(x + "{display:none!important}"); });
    });
    if (SITE.rawCss) Object.keys(SITE.rawCss).forEach(function (k) { out.push(SITE.rawCss[k]); });
    out.push("[data-rb-hidden]{display:none!important}");
    out.push("html[data-rb-focus] [data-rb-fhide]{display:none!important}");
    out.push("html[data-rb-leaving]{visibility:hidden!important}");
    style.textContent = out.join("\n");
  }
  function mountStyle() {
    var parent = document.head || document.documentElement;
    if (parent && !style.isConnected) parent.appendChild(style);
  }

  function applyFlags() {
    Object.keys(SITE.css).forEach(function (k) { set("data-rb-" + k, true); }); // every rule is always on
    if (SITE.rawCss) Object.keys(SITE.rawCss).forEach(function (k) { set("data-rb-" + k, true); });
    SITE.flags(location.pathname);
  }

  // ---------- Layer 1: URL guard ----------
  var lastHref = "";
  function checkUrl() {
    if (location.href === lastHref) return;
    SITE.flags(location.pathname);
    var to = SITE.redirect(location.pathname);
    if (!loaded) { set("data-rb-leaving", !!to); return; }
    lastHref = location.href;
    set("data-rb-leaving", false);
    if (to && to !== location.pathname) {
      set("data-rb-leaving", true);
      location.replace(to);
    }
  }

  // ---------- Layer 3: text scan ----------
  var scanQueued = false;
  function queueScan() {
    if (scanQueued) return;
    scanQueued = true;
    setTimeout(function () { scanQueued = false; scan(); }, 200);
  }
  function hideFrom(el) {
    var art = el.closest("article");
    if (art) { art.setAttribute("data-rb-hidden", ""); return; }
    // Not in a post: climb to the largest ancestor that still contains no feed posts
    // (e.g. a "Suggested for you" account carousel between posts, or the sidebar block).
    var node = el, best = null;
    for (var i = 0; i < 6 && node.parentElement; i++) {
      var p = node.parentElement;
      if (p === document.body || p.tagName === "MAIN" || p.tagName === "NAV" ||
          p.querySelector("article, header, nav, a[href^='/p/'], a[href*='/direct/']")) break;
      best = p; node = p;
    }
    if (best) best.setAttribute("data-rb-hidden", "");
  }
  function scan() {
    if (!document.body) return;
    var rules = SITE.textRules();
    if (rules.length) {
      var nodes = document.querySelectorAll("span, a, div[role='button'], h2, h3, h4");
      for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        if (n.childElementCount > 1 || n.closest("[data-rb-hidden]")) continue;
        var t = n.textContent;
        if (!t || t.length > 40) continue;
        t = t.trim();
        for (var r = 0; r < rules.length; r++) if (rules[r].test(t)) { hideFrom(n); break; }
      }
    }
    if (SITE.extraScan) SITE.extraScan();
    // Stop hidden videos from playing audio in the background.
    document.querySelectorAll("video").forEach(function (v) {
      // voice messages play through a hidden player with no picture (videoWidth 0): leave those alone
      if (!v.paused && v.getClientRects().length === 0 && v.readyState >= 1 && v.videoWidth > 0) { v.muted = true; v.pause(); }
    });
  }


  // ---------- Instagram Notes tray ----------
  // No stable selector: find the "Your note"/"Share a note" label and hide the smallest-text container
  // around it that does not include any chat in the inbox list.
  var NOTE_RE = /^(your note|share a note|note\.\.\.|notes|leave a note)$/i;
  function hideNotes() {
    if (!/^\/direct\//.test(location.pathname)) return;
    var nodes = document.querySelectorAll("span, div");
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      if (n.childElementCount > 1 || n.closest("[data-rb-hidden]")) continue;
      var t = n.textContent; if (!t || t.length > 20 || !NOTE_RE.test(t.trim())) continue;
      var node = n, best = n;
      for (var d = 0; d < 6 && node.parentElement; d++) {
        var par = node.parentElement;
        if (par === document.body || par.tagName === "MAIN" || par.textContent.length > 600 ||
            par.querySelector('a[href^="/direct/t/"], [role="listitem"], [role="list"], textarea, [contenteditable="true"]')) break;
        best = par; node = par;
      }
      best.setAttribute("data-rb-hidden", "");
    }
  }

  // ---------- Instagram: shared reels inside chats ----------
  // A shared reel may render as a card without a /reel/ link. Detect the reel icon or label and hide its card.
  function hideReelMsgs() {
    var marks = document.querySelectorAll('svg[aria-label="Reel" i], svg[aria-label="Reels" i], svg[aria-label="Clip" i], ' +
      '[aria-label*="reel" i]:not(textarea):not([contenteditable]), a[href*="/reel/"], a[href*="/p/"]');
    var leafs = document.querySelectorAll("span, div");
    var list = Array.prototype.slice.call(marks);
    for (var i = 0; i < leafs.length; i++) {
      var n = leafs[i];
      if (n.childElementCount) continue;
      var t = n.textContent; if (!t || t.length > 80) continue;
      if (/^reels?$|\b(sent|shared|forwarded) (you )?a (reel|post)\b|\b(reel|post) by\b/i.test(t.trim())) list.push(n);
    }
    // Shared posts show as a big picture with a bold caption under it, with no link. Your friends' own
    // photos never have a caption, so: big picture + bold caption in the same message = shared post.
    if (/^\/direct\/t\//.test(location.pathname)) document.querySelectorAll("main img").forEach(function (img) {
      if (img.closest("[data-rb-reelmsg]") || img.getBoundingClientRect().width < 150) return;
      for (var node = img.parentElement, d = 0; node && d < 8 && node.tagName !== "MAIN"; node = node.parentElement, d++) {
        if (node.textContent.length > 400 || node.querySelector('[role="textbox"], [contenteditable="true"]')) return;
        var bold = Array.prototype.some.call(node.querySelectorAll("span, div"), function (n) {
          return !n.childElementCount && (n.textContent || "").trim().length >= 20 && weight(n) >= 600;
        });
        if (bold) { list.push(node); node.setAttribute("data-rb-reelmsg", ""); return; }
      }
    });
    list.forEach(function (el) {
      if (el.closest("[data-rb-reelmsg]")) return;
      // Inbox/thread-list preview ("Bob sent a reel", "You sent a reel"): hide only that line, never the chat row.
      if (el.closest('a[href^="/direct/t/"], [role="listitem"], [role="list"]')) { el.setAttribute("data-rb-reelmsg", ""); return; }
      // climb to the message bubble: stop before anything holding the composer or the whole conversation
      var node = el, best = el;
      for (var d = 0; d < 7 && node.parentElement; d++) {
        var par = node.parentElement;
        if (par === document.body || par.tagName === "MAIN" || par.textContent.length > 300 ||
            par.querySelector('textarea, [contenteditable="true"], [role="list"], [role="grid"], a[href^="/direct/t/"]')) break;
        best = par; node = par;
      }
      best.setAttribute("data-rb-reelmsg", "");
    });
  }

  // ---------- Instagram: square message bubbles ----------
  // Bubbles have no stable class. A bubble = nearest rounded, filled ancestor of a message's text.
  // Mine vs theirs = which side of its row it sits on.
  function filled(cs) {
    return (cs.backgroundColor && cs.backgroundColor !== "rgba(0, 0, 0, 0)" && cs.backgroundColor !== "transparent") ||
      (cs.backgroundImage && cs.backgroundImage !== "none");
  }
  function boxBubbles() {
    if (!/^\/direct\/t\//.test(location.pathname)) return;
    // text colour: white on a dark page, black on a light one
    for (var bg = document.querySelector("main"); bg; bg = bg.parentElement) {
      var c = getComputedStyle(bg).backgroundColor.match(/[\d.]+/g);
      if (c && (c.length < 4 || +c[3] > 0)) { root.style.setProperty("--rb-text", (+c[0] + +c[1] + +c[2]) / 3 < 128 ? "#fff" : "#000"); break; }
    }
    var texts = document.querySelectorAll('main [dir="auto"]:not([data-rb-seen])');
    for (var i = 0; i < texts.length; i++) {
      var t = texts[i];
      t.setAttribute("data-rb-seen", "");
      if (t.closest('[data-rb-bubble], textarea, [contenteditable="true"], [role="textbox"], header, a[href^="/direct/t/"]')) continue;
      var node = t, bubble = null;
      for (var d = 0; d < 6 && node && node.tagName !== "MAIN"; d++, node = node.parentElement) {
        var cs = getComputedStyle(node);
        // grouped messages have one small corner, so use the largest corner radius
        var rad = Math.max(parseFloat(cs.borderTopLeftRadius) || 0, parseFloat(cs.borderTopRightRadius) || 0,
                           parseFloat(cs.borderBottomLeftRadius) || 0, parseFloat(cs.borderBottomRightRadius) || 0);
        if (rad >= 8 && filled(cs)) { bubble = node; break; }
      }
      if (!bubble) { if (!t.getClientRects().length) t.removeAttribute("data-rb-seen"); continue; }
      // voice notes, photos and other media keep Instagram's own look (plain-text style would erase the play button and waveform)
      if (bubble.querySelector("svg, img, video, audio, canvas")) continue;
      // row = first ancestor clearly wider than the bubble
      var b = bubble.getBoundingClientRect(), row = bubble.parentElement;
      while (row && row.tagName !== "MAIN" && row.getBoundingClientRect().width < b.width * 1.6) row = row.parentElement;
      if (!row) continue;
      var r = row.getBoundingClientRect();
      if (!b.width || !r.width) { t.removeAttribute("data-rb-seen"); continue; } // not laid out yet: retry
      var mine = (r.right - b.right) < (b.left - r.left);
      bubble.setAttribute("data-rb-bubble", mine ? "me" : "them");
    }
  }

  // ---------- Instagram: compact chat list ----------
  // Left column: drop the Notes area between Search and "Messages"; list shows names only,
  // and only chats with unread messages (plus the one that is open). Other chats: use Search.
  function leafWith(re, root) {
    var c = (root || document).querySelectorAll("span, h1, h2, div, a");
    for (var i = 0; i < c.length; i++) if (!c[i].childElementCount && re.test((c[i].textContent || "").trim())) return c[i];
    return null;
  }
  function textLeaves(el) {
    var out = [];
    el.querySelectorAll("span, div, abbr, time").forEach(function (n) {
      if (n.childElementCount === 0 && (n.textContent || "").trim()) out.push(n);
    });
    return out;
  }
  function weight(n) { var w = getComputedStyle(n).fontWeight; return w === "bold" ? 700 : (parseInt(w, 10) || 400); }
  function compactInbox() {
    if (!/^\/direct\//.test(location.pathname)) return;
    // the "Messages" heading that sits next to "Requests" (not the sidebar's Messages label)
    var head = null;
    document.querySelectorAll("span, h1, h2, div").forEach(function (n) {
      if (head || n.childElementCount || !/^messages$/i.test((n.textContent || "").trim())) return;
      var a = n;
      for (var q = 0; q < 4 && a.parentElement; q++) { a = a.parentElement; if (a.querySelector("input, textarea, [contenteditable='true']")) return; if (leafWith(/^requests?( \(\d+\))?$/i, a)) { head = n; return; } }
    });
    if (!head) return;
    // 1) hide every block above "Messages" up to (not including) the search box
    var node = head;
    for (var d = 0; d < 10 && node.parentElement && node.tagName !== "MAIN"; d++) {
      var stop = false;
      for (var sib = node.previousElementSibling; sib; sib = sib.previousElementSibling) {
        if (sib.querySelector('input, [role="textbox"], [contenteditable="true"]') || /^input$/i.test(sib.tagName)) { stop = true; break; }
        if (!sib.hasAttribute("data-rb-hidden")) sib.setAttribute("data-rb-hidden", "");
      }
      if (stop) break;
      node = node.parentElement;
    }
    // 2) list = deepest element after the heading whose children are 3+ rows that each have an avatar + text
    var col = head.parentElement, list = null;
    for (var u = 0; u < 8 && col && !list; u++, col = col.parentElement) {
      var cands = col.querySelectorAll("div, ul");
      for (var i = cands.length - 1; i >= 0; i--) {
        // must come after the heading (the hidden Notes list comes before it)
        if (!(head.compareDocumentPosition(cands[i]) & Node.DOCUMENT_POSITION_FOLLOWING) || cands[i].closest("[data-rb-hidden]")) continue;
        var k = cands[i].children, rows = 0;
        // avatars load lazily, so a row is "has a button/link/img and some text"
        for (var j = 0; j < k.length; j++) if (k[j].querySelector('img, [role="button"], a') && (k[j].textContent || "").trim()) rows++;
        if (rows >= 3 && rows >= k.length * 0.3 && !cands[i].querySelector("textarea, [contenteditable='true']")) { list = cands[i]; break; }
      }
    }
    if (!list) return;
    // Never hide rows: Instagram's list is virtualised and stops rendering chats it thinks are off screen.
    list.setAttribute("data-rb-tlist", "");
    Array.prototype.forEach.call(list.children, function (r) {
      if (!(r.textContent || "").trim()) return;            // still loading
      var img = r.querySelector("img");
      for (var e = img, n = 0; e && e !== r && n < 3; e = e.parentElement, n++) e.setAttribute("data-rb-tav", "");
      var lv = textLeaves(r), name = lv[0], rest = lv.slice(1);
      if (!name) return;
      var dot = Array.prototype.some.call(r.querySelectorAll("div, span"), function (n) {
        if (n.childElementCount || (n.textContent || "").trim()) return false;
        var b = n.getBoundingClientRect(), cs = getComputedStyle(n);
        return b.width > 4 && b.width <= 14 && Math.abs(b.width - b.height) < 2 && filled(cs) && parseFloat(cs.borderTopLeftRadius) >= b.width / 2 - 1;
      });
      // read previews are muted grey; unread previews are bold and/or the same bright colour as the name
      var unread = dot || !!r.querySelector('[aria-label*="unread" i]') ||
        rest.some(function (n) { return weight(n) >= 600; }) ||
        (rest[0] && getComputedStyle(rest[0]).color === getComputedStyle(name).color);
      r.setAttribute("data-rb-trow", unread ? "new" : "read");
      // Layout: name centred next to the profile picture, new-message preview to the right of the name.
      var col = name;                                          // text column = name's ancestor that sits beside the avatar
      while (col.parentElement && col.parentElement !== r && !(img && col.parentElement.contains(img))) col = col.parentElement;
      col.setAttribute("data-rb-tcol", "");
      if (col.parentElement) col.parentElement.setAttribute("data-rb-tin", "");
      if (rest[0]) {                                           // lowest element holding both name and preview = one line
        var line = name.parentElement;
        while (line && line !== col && !line.contains(rest[0])) line = line.parentElement;
        if (line && line.contains(rest[0])) line.setAttribute("data-rb-tline", "");
      }
      // preview only when there is a new message
      rest.forEach(function (n) { unread ? n.removeAttribute("data-rb-hidden") : n.setAttribute("data-rb-hidden", ""); });
    });
  }

  // ---------- Instagram: notifications = follow requests only ----------
  var FOLLOW_RE = /follow requests?|requested to follow/i;
  var SECTION_RE = /^(new|today|yesterday|this week|this month|earlier|last 7 days|last 30 days|suggested for you|see all)$/i;
  function filterNotifications() {
    var panels = [];
    // desktop: slide-out panel headed "Notifications"; mobile web: /accounts/activity/
    document.querySelectorAll("h1, h2, span, div").forEach(function (h) {
      if (h.childElementCount === 0 && /^notifications$/i.test((h.textContent || "").trim()) && !h.closest("nav a, [data-rb-npanel]")) {
        var p = h, best = null;
        for (var d = 0; d < 8 && p.parentElement && p.parentElement !== document.body; d++) {
          p = p.parentElement;
          if (p.querySelectorAll("img").length >= 1 && p.getBoundingClientRect().height > window.innerHeight * 0.5) { best = p; break; }
        }
        // the sidebar's own "Notifications" label climbs into the sidebar, which holds the Messages link: skip it
        if (best && !best.querySelector('a[href^="/direct/"], textarea, [contenteditable="true"]')) best.setAttribute("data-rb-npanel", "");
      }
    });
    document.querySelectorAll("[data-rb-npanel]").forEach(function (x) { panels.push(x); });
    if (/^\/accounts\/activity/.test(location.pathname) && !/followRequests/.test(location.search)) {
      var m = document.querySelector("main"); if (m) panels.push(m);
    }
    panels.forEach(function (panel) {
      // rows = clickable things with an avatar
      panel.querySelectorAll('a, div[role="button"], [role="listitem"], [role="link"]').forEach(function (row) {
        if (!row.querySelector("img") || row.parentElement.closest("[data-rb-nrow]")) return;
        row.setAttribute("data-rb-nrow", "");
        if (!FOLLOW_RE.test(row.textContent || "")) row.setAttribute("data-rb-hidden", "");
      });
      panel.querySelectorAll("span, div, h2, h3").forEach(function (n) {
        if (n.childElementCount === 0 && SECTION_RE.test((n.textContent || "").trim())) n.setAttribute("data-rb-hidden", "");
      });
    });
  }

  // ---------- YouTube focus mode ----------
  function norm(x) { return String(x || "").toLowerCase().replace(/^@/, "").replace(/[\s_.-]/g, ""); }
  function lines(x) { return String(x || "").split(/[\n,]+/).map(function (l) { return l.trim(); }).filter(Boolean); }
  function allowSets() {
    return { ch: lines(S.ytAllowChannels).concat(lines(S.ytEduChannels)).map(norm), kw: lines(S.ytAllowKeywords).map(function (k) { return k.toLowerCase(); }) };
  }
  // ids: array of channel identifiers (handle, UC id, display name). title: video title.
  function isAllowed(ids, title, A) {
    for (var i = 0; i < ids.length; i++) if (ids[i] && A.ch.indexOf(norm(ids[i])) >= 0) return true;
    title = String(title || "").toLowerCase();
    for (var k = 0; k < A.kw.length; k++) if (title && title.indexOf(A.kw[k]) >= 0) return true;
    return false;
  }
  function idsFromHref(href) {
    var m = String(href || "").match(/\/(?:@([^\/?#]+)|channel\/([^\/?#]+)|c\/([^\/?#]+)|user\/([^\/?#]+))/);
    if (!m) return [];
    return [decodeURIComponent(m[1] || m[2] || m[3] || m[4])];
  }
  var overlay = null;
  function showBlock(msg) {
    if (!msg) { if (overlay) { overlay.remove(); overlay = null; } return; }
    if (!document.body) return;
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "rb-focus-overlay";
      overlay.style.cssText = "position:fixed;inset:0;z-index:2147483647;background:#0f0f0f;color:#eee;display:flex;" +
        "flex-direction:column;align-items:center;justify-content:center;font:16px system-ui,sans-serif;text-align:center;padding:24px";
    }
    if (!overlay.isConnected) document.body.appendChild(overlay);
    var until = "Focus mode is always on.";
    overlay.innerHTML = "";
    var h = document.createElement("div"); h.style.cssText = "font-size:28px;font-weight:700;margin-bottom:10px"; h.textContent = msg;
    var p = document.createElement("div"); p.style.color = "#aaa"; p.textContent = until + " Only allowlisted channels play.";
    var a = document.createElement("a"); a.href = "/feed/subscriptions"; a.textContent = "Go to subscriptions";
    a.style.cssText = "margin-top:18px;color:#3ea6ff";
    overlay.appendChild(h); overlay.appendChild(p); overlay.appendChild(a);
  }
  function pauseAll() {
    document.querySelectorAll("video").forEach(function (v) { if (!v.paused) v.pause(); v.muted = true; });
  }
  var ITEMS = "ytd-video-renderer, ytd-rich-item-renderer, ytd-compact-video-renderer, ytd-grid-video-renderer," +
    "ytd-playlist-video-renderer, ytd-playlist-renderer, ytd-radio-renderer, ytd-movie-renderer, ytd-reel-item-renderer," +
    "ytd-channel-renderer, yt-lockup-view-model, ytd-compact-radio-renderer, ytd-compact-playlist-renderer";
  var CH_LINK = 'a[href^="/@"], a[href^="/channel/"], a[href^="/c/"], a[href^="/user/"]';
  function focusScan() {
    if (site !== "yt" || !loaded) return;
    var A = allowSets(), p = location.pathname;
    // 1) Filter every video tile on any list page (search, subscriptions, channel, playlists, sidebar).
    document.querySelectorAll(ITEMS).forEach(function (it) {
      if (it.parentElement && it.parentElement.closest(ITEMS)) return; // nested renderer: judged by outer one
      var ids = [];
      it.querySelectorAll(CH_LINK).forEach(function (a) { ids = ids.concat(idsFromHref(a.getAttribute("href"))); });
      it.querySelectorAll("ytd-channel-name #text, #channel-name #text, #channel-title").forEach(function (n) { ids.push(n.textContent.trim()); });
      var t = it.querySelector("#video-title, a#video-title-link, h3");
      var ok = isAllowed(ids, t ? t.textContent : "", A);
      ok ? it.removeAttribute("data-rb-fhide") : it.setAttribute("data-rb-fhide", "");
    });
    // 2) Watch page: decide on the current video; fail closed until the owner is known.
    if (p === "/watch") {
      var v = new URLSearchParams(location.search).get("v");
      var flexy = document.querySelector("ytd-watch-flexy");
      var fresh = flexy && flexy.getAttribute("video-id") === v;
      var owner = document.querySelector("ytd-watch-metadata #owner, ytd-video-owner-renderer");
      var ids = [];
      if (fresh && owner) {
        owner.querySelectorAll(CH_LINK).forEach(function (a) { ids = ids.concat(idsFromHref(a.getAttribute("href"))); });
        owner.querySelectorAll("ytd-channel-name #text, #channel-name").forEach(function (n) { ids.push(n.textContent.trim()); });
      }
      var h1 = document.querySelector("ytd-watch-metadata h1");
      var title = fresh && h1 ? h1.textContent : "";
      if (fresh && (ids.length || title) && isAllowed(ids, title, A)) showBlock(null);
      else { showBlock(ids.length ? "Blocked during focus time" : "Checking video…"); pauseAll(); }
      return;
    }
    // 3) Channel pages: only allowlisted channels.
    var chIds = idsFromHref(p);
    if (chIds.length) {
      var name = document.querySelector("ytd-c4-tabbed-header-renderer #channel-name, yt-page-header-view-model h1, #page-header h1");
      if (name) chIds.push(name.textContent.trim());
      if (isAllowed(chIds, "", A)) showBlock(null); else { showBlock("Channel blocked during focus time"); pauseAll(); }
      return;
    }
    showBlock(null);
  }

  // ---------- YouTube: educational home feed ----------
  var edu = { key: "", items: null, errors: [], loading: false, el: null };
  function resolveChannelId(h) {
    if (/^UC[\w-]{22}$/.test(h)) return Promise.resolve(h);
    var handle = h.replace(/^@/, "");
    return new Promise(function (res) {
      api.storage.local.get("cid:" + handle.toLowerCase(), function (o) {
        var c = o && o["cid:" + handle.toLowerCase()];
        if (c) return res(c);
        fetch("/@" + encodeURIComponent(handle), { credentials: "omit" }).then(function (r) { return r.text(); }).then(function (t) {
          var m = t.match(/<link rel="canonical" href="https:\/\/www\.youtube\.com\/channel\/(UC[\w-]{22})"/) ||
                  t.match(/"externalId":"(UC[\w-]{22})"/) || t.match(/"channelId":"(UC[\w-]{22})"/);
          var id = m ? m[1] : null;
          if (id) { var x = {}; x["cid:" + handle.toLowerCase()] = id; api.storage.local.set(x); }
          res(id);
        }).catch(function () { res(null); });
      });
    });
  }
  function loadFeed(handles) {
    var YT = "http://www.youtube.com/xml/schemas/2015", MEDIA = "http://search.yahoo.com/mrss/";
    return Promise.all(handles.map(function (h) {
      return resolveChannelId(h).then(function (id) {
        if (!id) return { h: h, err: true, vids: [] };
        return fetch("/feeds/videos.xml?channel_id=" + id, { credentials: "omit" }).then(function (r) { return r.text(); }).then(function (x) {
          var doc = new DOMParser().parseFromString(x, "application/xml");
          var vids = Array.prototype.map.call(doc.getElementsByTagName("entry"), function (e) {
            var link = e.querySelector("link[rel=alternate]");
            var href = link ? link.getAttribute("href") : "";
            var vid = (e.getElementsByTagNameNS(YT, "videoId")[0] || {}).textContent;
            var author = e.querySelector("author > name");
            return { id: vid, title: (e.querySelector("title") || {}).textContent, ch: author ? author.textContent : h,
                     date: new Date((e.querySelector("published") || {}).textContent), short: /\/shorts\//.test(href) };
          }).filter(function (v) { return v.id && !v.short; });
          return { h: h, vids: vids };
        });
      }).catch(function () { return { h: h, err: true, vids: [] }; });
    }));
  }
  function ago(d) {
    var s = (Date.now() - d) / 1000, u = [[86400 * 365, "year"], [86400 * 30, "month"], [86400 * 7, "week"], [86400, "day"], [3600, "hour"], [60, "minute"]];
    for (var i = 0; i < u.length; i++) if (s >= u[i][0]) { var n = Math.floor(s / u[i][0]); return n + " " + u[i][1] + (n > 1 ? "s" : "") + " ago"; }
    return "just now";
  }
  function renderEdu() {
    var el = edu.el; el.innerHTML = "";
    var h = document.createElement("div"); h.style.cssText = "font:600 20px Roboto,Arial,sans-serif;margin:0 0 4px";
    h.textContent = "Educational feed";
    var sub = document.createElement("div"); sub.style.cssText = "font:13px Roboto,Arial,sans-serif;color:#888;margin-bottom:16px";
    sub.textContent = edu.loading ? "Loading latest videos…" :
      "Latest uploads from your educational channels. Edit the list in the Reels Blocker popup." +
      (edu.errors.length ? " Could not find: " + edu.errors.join(", ") + "." : "");
    el.appendChild(h); el.appendChild(sub);
    var grid = document.createElement("div");
    grid.style.cssText = "display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:24px 16px";
    (edu.items || []).slice(0, 48).forEach(function (v) {
      var a = document.createElement("a"); a.href = "/watch?v=" + v.id; a.className = "rb-edu-card";
      a.style.cssText = "text-decoration:none;color:inherit;font-family:Roboto,Arial,sans-serif";
      var img = document.createElement("img"); img.src = "https://i.ytimg.com/vi/" + v.id + "/mqdefault.jpg";
      img.style.cssText = "width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:10px;display:block";
      var t = document.createElement("div"); t.textContent = v.title; t.style.cssText = "font:500 15px/1.35 Roboto,Arial,sans-serif;margin-top:8px;color:var(--yt-spec-text-primary,#0f0f0f)";
      var m = document.createElement("div"); m.textContent = v.ch + " · " + ago(v.date); m.style.cssText = "font-size:13px;color:#888;margin-top:2px";
      a.appendChild(img); a.appendChild(t); a.appendChild(m); grid.appendChild(a);
    });
    el.appendChild(grid);
  }
  function eduHome() {
    var on = location.pathname === "/";
    if (!on) { if (edu.el) edu.el.style.display = "none"; return; }
    var host = document.querySelector('ytd-browse[page-subtype="home"]');
    if (!host) return;
    if (!edu.el) { edu.el = document.createElement("div"); edu.el.id = "rb-edu-home"; edu.el.style.cssText = "padding:24px;max-width:1700px;margin:0 auto;color:var(--yt-spec-text-primary,#0f0f0f)"; }
    if (edu.el.parentElement !== host) host.insertBefore(edu.el, host.firstChild);
    edu.el.style.display = "";
    var handles = lines(S.ytEduChannels), key = handles.join("|");
    if (edu.key === key) return;
    edu.key = key; edu.loading = true; edu.items = []; renderEdu();
    loadFeed(handles).then(function (res) {
      if (edu.key !== key) return;
      edu.loading = false;
      edu.errors = res.filter(function (r) { return r.err; }).map(function (r) { return r.h; });
      edu.items = [].concat.apply([], res.map(function (r) { return r.vids; })).sort(function (a, b) { return b.date - a.date; });
      renderEdu();
    });
  }

  // ---------- YouTube: subscriptions cleanup (on /feed/channels) ----------
  var un = { el: null, state: "idle", remove: [], keep: [], done: 0, failed: [] };
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function chanInfo(r) {
    var ids = [];
    r.querySelectorAll(CH_LINK).forEach(function (a) { ids = ids.concat(idsFromHref(a.getAttribute("href"))); });
    var n = r.querySelector("#channel-title #text, #channel-title, #text");
    var name = n ? n.textContent.trim() : (ids[0] || "?");
    ids.push(name);
    return { el: r, name: name, ids: ids };
  }
  function keepSet() { return lines(S.ytKeepSubs).map(norm); }
  function isKept(c, K) { return c.ids.some(function (i) { return K.indexOf(norm(i)) >= 0; }); }
  function unsubPanel() {
    var on = location.pathname === "/feed/channels";
    if (!on) { if (un.el) { un.el.remove(); un.el = null; } return; }
    if (!un.el && document.body) {
      un.el = document.createElement("div"); un.el.id = "rb-unsub";
      un.el.style.cssText = "position:fixed;right:16px;bottom:16px;z-index:2147483646;width:340px;max-height:70vh;overflow:auto;background:#111;color:#eee;" +
        "border:1px solid #444;border-radius:10px;padding:14px;font:13px system-ui,sans-serif;box-shadow:0 6px 24px #0008";
      document.body.appendChild(un.el); drawUnsub();
    }
  }
  function btn(label, fn, danger) {
    var b = document.createElement("button"); b.textContent = label;
    b.style.cssText = "margin-top:10px;padding:8px 12px;border-radius:6px;border:0;cursor:pointer;font-weight:600;" + (danger ? "background:#c00;color:#fff" : "background:#3ea6ff;color:#000");
    b.onclick = fn; return b;
  }
  function drawUnsub() {
    var el = un.el; if (!el) return; el.innerHTML = "";
    var h = document.createElement("div"); h.style.cssText = "font-weight:700;font-size:15px;margin-bottom:6px"; h.textContent = "Subscriptions cleanup";
    el.appendChild(h);
    var p = document.createElement("div"); el.appendChild(p);
    if (un.state === "idle") {
      p.textContent = "Keeps: " + lines(S.ytKeepSubs).join(", ") + ". Scan first; nothing is changed until you confirm.";
      el.appendChild(btn("Scan subscriptions", scanSubs));
    } else if (un.state === "scanning") {
      p.textContent = "Loading every subscription (scrolling)…";
    } else if (un.state === "preview" || un.state === "confirm") {
      p.textContent = "Keeping " + un.keep.length + ": " + (un.keep.map(function (c) { return c.name; }).join(", ") || "none") +
        ". Will unsubscribe from " + un.remove.length + ":";
      var ul = document.createElement("div"); ul.style.cssText = "margin-top:6px;max-height:30vh;overflow:auto;color:#f88";
      ul.textContent = un.remove.map(function (c) { return c.name; }).join(", ") || "nothing";
      el.appendChild(ul);
      if (un.remove.length) {
        el.appendChild(un.state === "preview"
          ? btn("Unsubscribe from " + un.remove.length, function () { un.state = "confirm"; drawUnsub(); }, true)
          : btn("Really unsubscribe? Click to confirm", runUnsub, true));
      }
      el.appendChild(btn("Rescan", scanSubs));
    } else if (un.state === "running") {
      p.textContent = "Unsubscribing " + (un.done + un.failed.length) + " / " + un.remove.length + "… Keep this tab open.";
    } else if (un.state === "done") {
      p.textContent = "Done. Unsubscribed from " + un.done + "." + (un.failed.length ? " Failed (do these by hand): " + un.failed.join(", ") : "");
      el.appendChild(btn("Rescan", scanSubs));
    }
  }
  function scanSubs() {
    un.state = "scanning"; drawUnsub();
    var last = -1, stable = 0, rounds = 0;
    (function step() {
      var n = document.querySelectorAll("ytd-channel-renderer").length;
      if (n === last) stable++; else { stable = 0; last = n; }
      rounds++;
      if (stable >= 4 || rounds > 200) {
        var K = keepSet(), all = Array.prototype.map.call(document.querySelectorAll("ytd-channel-renderer"), chanInfo);
        un.keep = all.filter(function (c) { return isKept(c, K); });
        un.remove = all.filter(function (c) { return !isKept(c, K); });
        un.state = "preview"; drawUnsub(); return;
      }
      window.scrollTo(0, document.documentElement.scrollHeight);
      setTimeout(step, 600);
    })();
  }
  // tried in order: the real <button> first, its wrapper only as a fallback
  var CONFIRM_SEL = ["yt-confirm-dialog-renderer #confirm-button button", "tp-yt-paper-dialog #confirm-button button",
                     "yt-confirm-dialog-renderer #confirm-button", "button[aria-label=\"Unsubscribe\"]"];
  function findVisible(sel, re) {
    var sels = Array.isArray(sel) ? sel : [sel];
    for (var k = 0; k < sels.length; k++) {
      var c = document.querySelectorAll(sels[k]);
      for (var i = 0; i < c.length; i++)
        if (c[i].getClientRects().length && !c[i].closest("#rb-unsub") && (!re || re.test(c[i].textContent.trim()))) return c[i];
    }
    return null;
  }
  function unsubOne(c) {
    var b = c.el.querySelector("ytd-subscribe-button-renderer button, #subscribe-button button");
    if (!b) return Promise.resolve(false);
    if (/^subscribe$/i.test(b.textContent.trim())) return Promise.resolve(true); // already gone
    b.scrollIntoView({ block: "center" }); b.click();
    return sleep(700).then(function () {
      var confirm = findVisible(CONFIRM_SEL);
      if (confirm) return confirm;
      var item = findVisible("ytd-menu-service-item-renderer, tp-yt-paper-item, yt-list-item-view-model, ytd-popup-container [role=menuitem]", /^unsubscribe$/i);
      if (!item) return null;
      item.click();
      return sleep(700).then(function () { return findVisible(CONFIRM_SEL); });
    }).then(function (confirm) {
      if (!confirm) { document.body.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })); return false; }
      confirm.click();
      return sleep(900).then(function () {
        var b2 = c.el.querySelector("ytd-subscribe-button-renderer button, #subscribe-button button");
        return !!b2 && /^subscribe$/i.test(b2.textContent.trim());
      });
    });
  }
  function runUnsub() {
    un.state = "running"; un.done = 0; un.failed = []; drawUnsub();
    var i = 0;
    (function next() {
      if (i >= un.remove.length) { un.state = "done"; drawUnsub(); return; }
      var c = un.remove[i++];
      unsubOne(c).then(function (ok) { ok ? un.done++ : un.failed.push(c.name); drawUnsub(); setTimeout(next, 800); })
                 .catch(function () { un.failed.push(c.name); setTimeout(next, 800); });
    })();
  }

  // ---------- Instagram: two chats side by side ----------
  // The popup opens two Instagram windows, left and right half of the screen (background.js).
  //   left  = normal Instagram (chat list + chat A)
  //   right = chat B only: everything to the left of the chat (menu bar, chat list) is hidden
  // Click into a message box to make that side active (blue bar on top); a chat clicked in the list
  // opens on the active side. (Instagram shows "page isn't available" inside frames, so windows it is.)
  var pane = null, active = "right";
  function paneState(m) {
    if (!m) return;
    pane = m.pane; active = m.active;
    if (pane) root.setAttribute("data-rb-pane", pane);
    set("data-rb-active-pane", pane && pane === active);
  }
  function hideLeftOfChat() {
    var box = document.querySelector('[role="textbox"], [contenteditable="true"], textarea');
    if (!box) return;
    var chatLeft = box.getBoundingClientRect().left;
    for (var el = box; el && el !== document.body; el = el.parentElement) {
      var parent = el.parentElement;
      if (!parent) break;
      Array.prototype.forEach.call(parent.children, function (sib) {
        if (sib === el || sib.contains(box)) return;
        var r = sib.getBoundingClientRect();
        if (r.width && r.right <= chatLeft + 2) sib.setAttribute("data-rb-hidden", "");
      });
    }
  }
  if (site === "ig" && window.top === window) {
    api.runtime.sendMessage({ type: "split-hello" }, function (m) { void api.runtime.lastError; paneState(m); });
    api.runtime.onMessage.addListener(function (m) { if (m.type === "split-state") paneState(m); });
    // typing box clicked -> this side is active
    document.addEventListener("focusin", function (e) {
      if (pane && e.target.closest && e.target.closest('[role="textbox"], [contenteditable="true"], textarea')) api.runtime.sendMessage({ type: "split-active", pane: pane });
    }, true);
    // list clicked on the left while the right side is active -> open that chat on the right instead
    document.addEventListener("click", function (e) {
      if (pane !== "left" || active !== "right" || !e.target.closest("[data-rb-tlist]")) return;
      var before = location.pathname, tries = 0;
      var t = setInterval(function () {
        if (++tries > 40) return clearInterval(t);
        if (location.pathname === before || !/^\/direct\/t\//.test(location.pathname)) return;
        clearInterval(t);
        api.runtime.sendMessage({ type: "split-open", path: location.pathname });
        history.back(); // left side goes back to the chat it had
      }, 100);
    }, true);
  }

  // ---------- Wiring ----------
  buildCss();
  mountStyle();
  applyFlags();
  checkUrl();

  api.storage.sync.get(GO_DEFAULTS, function (got) {
    S = got;
    loaded = true;
    applyFlags();
    lastHref = "";
    checkUrl();
    queueScan();
  });
  api.storage.onChanged.addListener(function (changes, area) {
    if (area !== "sync") return;
    Object.keys(changes).forEach(function (k) { S[k] = changes[k].newValue; });
    applyFlags(); lastHref = ""; checkUrl(); queueScan();
  });

  new MutationObserver(function () {
    mountStyle();
    // style new message bubbles before the browser paints them, so sent messages don't flash
    if (site === "ig" && loaded && /^\/direct\/t\//.test(location.pathname)) boxBubbles();
    queueScan();
  })
    .observe(document.documentElement, { childList: true, subtree: true });
  setInterval(checkUrl, 300);
  if (site === "yt") setInterval(function () { if (loaded) { focusScan(); eduHome(); unsubPanel(); } }, 700);
  window.addEventListener("popstate", checkUrl);
})();
