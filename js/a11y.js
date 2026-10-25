// Accessibility layer shared by every page: skip link and landmark labels,
// dialog semantics + focus handling for the site's modals, and the
// accessibility menu (text size, contrast, link underline, readable font,
// stop animations). Preferences live in localStorage on the visitor's device.
(function () {
  "use strict";

  var STORE_KEY = "alon-a11y";
  var FONT_STEPS = [100, 112, 125, 150];
  var root = document.documentElement;
  var prefs = { font: 0, contrast: false, links: false, readable: false, nomotion: false };

  function load() {
    try {
      var saved = JSON.parse(localStorage.getItem(STORE_KEY) || "{}");
      Object.keys(prefs).forEach(function (k) {
        if (typeof saved[k] === typeof prefs[k]) prefs[k] = saved[k];
      });
    } catch (e) { /* storage unavailable */ }
  }

  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(prefs)); } catch (e) { /* ignore */ }
  }

  function apply() {
    root.style.fontSize = FONT_STEPS[prefs.font] === 100 ? "" : FONT_STEPS[prefs.font] + "%";
    root.classList.toggle("a11y-contrast", prefs.contrast);
    root.classList.toggle("a11y-links", prefs.links);
    root.classList.toggle("a11y-readable", prefs.readable);
    root.classList.toggle("a11y-nomotion", prefs.nomotion);
  }

  // Apply immediately so saved settings don't flash in after load.
  load();
  apply();

  function focusables(container) {
    return Array.prototype.filter.call(
      container.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'),
      function (el) { return el.offsetParent !== null || el === document.activeElement; }
    );
  }

  function setupLandmarks() {
    var main = document.querySelector("main");
    if (main) {
      if (!main.id) main.id = "main-content";
      main.setAttribute("tabindex", "-1");
      if (!document.querySelector(".skip-link")) {
        var skip = document.createElement("a");
        skip.className = "skip-link";
        skip.href = "#" + main.id;
        skip.textContent = "דילוג לתוכן הראשי";
        skip.addEventListener("click", function () {
          setTimeout(function () { main.focus(); }, 0);
        });
        document.body.insertBefore(skip, document.body.firstChild);
      }
    }
    var nav = document.querySelector("nav");
    if (nav && !nav.getAttribute("aria-label")) nav.setAttribute("aria-label", "ניווט ראשי");
    var footer = document.querySelector("body > footer");
    if (footer && !footer.getAttribute("aria-label")) footer.setAttribute("aria-label", "תחתית האתר");
    document.querySelectorAll(".material-symbols-outlined").forEach(function (el) {
      if (!el.hasAttribute("aria-label")) el.setAttribute("aria-hidden", "true");
    });
    var list = document.getElementById("candle-list");
    if (list) list.setAttribute("aria-live", "polite");
  }

  // Modals are plain divs toggled with a "hidden" class. Watch them and add
  // dialog semantics, move focus in on open, trap Tab, and restore on close.
  function setupDialogs() {
    var opener = null;
    var current = null;

    function label(modal) {
      if (modal.getAttribute("aria-label")) return;
      var h = modal.querySelector("h2, h3, [id$='-title']");
      modal.setAttribute("aria-label", (h && h.textContent.trim()) || "חלון קופץ");
    }

    function onOpen(modal) {
      current = modal;
      opener = document.activeElement;
      modal.setAttribute("role", "dialog");
      modal.setAttribute("aria-modal", "true");
      label(modal);
      var target = modal.querySelector('[aria-label="סגור"], button');
      if (target) target.focus();
    }

    function onClose(modal) {
      if (current !== modal) return;
      current = null;
      if (opener && document.contains(opener) && opener.focus) opener.focus();
      opener = null;
    }

    var observer = new MutationObserver(function (records) {
      records.forEach(function (r) {
        var m = r.target;
        var wasHidden = (r.oldValue || "").split(/\s+/).indexOf("hidden") !== -1;
        var isHidden = m.classList.contains("hidden");
        if (wasHidden && !isHidden) onOpen(m);
        else if (!wasHidden && isHidden) onClose(m);
      });
    });

    function watch(m) {
      observer.observe(m, { attributes: true, attributeFilter: ["class"], attributeOldValue: true });
    }

    function scan() {
      document.querySelectorAll("div[id].fixed.inset-0").forEach(function (m) {
        if (!m.dataset.a11yWatched) { m.dataset.a11yWatched = "1"; watch(m); }
      });
    }
    scan();
    // The candle modal is injected by site.js after DOMContentLoaded.
    new MutationObserver(scan).observe(document.body, { childList: true });

    document.addEventListener("keydown", function (e) {
      if (e.key !== "Tab" || !current) return;
      var items = focusables(current);
      if (!items.length) return;
      var first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      else if (!current.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
    });
  }

  function setupWidget() {
    var fab = document.createElement("button");
    fab.type = "button";
    fab.className = "a11y-fab";
    fab.setAttribute("aria-label", "תפריט נגישות");
    fab.setAttribute("aria-expanded", "false");
    fab.setAttribute("aria-controls", "a11y-panel");
    fab.innerHTML = '<span class="material-symbols-outlined text-3xl" aria-hidden="true">accessibility_new</span>';

    var panel = document.createElement("div");
    panel.id = "a11y-panel";
    panel.className = "a11y-panel";
    panel.hidden = true;
    panel.setAttribute("role", "region");
    panel.setAttribute("aria-label", "הגדרות נגישות");
    panel.innerHTML =
      '<h2>הגדרות נגישות</h2>' +
      '<div class="a11y-row">' +
        '<button type="button" class="a11y-opt" data-a="bigger">הגדלת טקסט</button>' +
        '<button type="button" class="a11y-opt" data-a="smaller">הקטנת טקסט</button>' +
      '</div>' +
      '<div class="a11y-row">' +
        '<button type="button" class="a11y-opt" data-a="contrast" aria-pressed="false">ניגודיות גבוהה</button>' +
        '<button type="button" class="a11y-opt" data-a="links" aria-pressed="false">הדגשת קישורים</button>' +
        '<button type="button" class="a11y-opt" data-a="readable" aria-pressed="false">גופן קריא</button>' +
        '<button type="button" class="a11y-opt" data-a="nomotion" aria-pressed="false">עצירת אנימציות</button>' +
        '<button type="button" class="a11y-opt a11y-opt-wide" data-a="reset">איפוס הגדרות</button>' +
      '</div>' +
      '<a href="/AlonSite/pages/accessibility">הצהרת נגישות</a>';

    document.body.appendChild(fab);
    document.body.appendChild(panel);

    function sync() {
      panel.querySelectorAll("[aria-pressed]").forEach(function (b) {
        b.setAttribute("aria-pressed", prefs[b.dataset.a] ? "true" : "false");
      });
    }

    function toggle(open) {
      panel.hidden = !open;
      fab.setAttribute("aria-expanded", open ? "true" : "false");
    }

    fab.addEventListener("click", function () { toggle(panel.hidden); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !panel.hidden) { toggle(false); fab.focus(); }
    });
    document.addEventListener("click", function (e) {
      if (!panel.hidden && !panel.contains(e.target) && !fab.contains(e.target)) toggle(false);
    });

    panel.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-a]");
      if (!b) return;
      var a = b.dataset.a;
      if (a === "bigger") prefs.font = Math.min(FONT_STEPS.length - 1, prefs.font + 1);
      else if (a === "smaller") prefs.font = Math.max(0, prefs.font - 1);
      else if (a === "reset") prefs = { font: 0, contrast: false, links: false, readable: false, nomotion: false };
      else prefs[a] = !prefs[a];
      apply(); save(); sync();
    });
    sync();
  }

  document.addEventListener("DOMContentLoaded", function () {
    setupLandmarks();
    setupDialogs();
    setupWidget();
  });
})();
