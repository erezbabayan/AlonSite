// Shared behavior for the memorial site: candle-lighting (localStorage-backed),
// mobile nav toggle, and the share button. Included by index.html and gallery.html.
(function () {
  "use strict";

  var STORAGE_KEY = "alon-bibian-memorial-candles";

  function loadCandles() {
    try {
      var raw = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return Array.isArray(raw) ? raw : [];
    } catch (e) {
      return [];
    }
  }

  function saveCandles(candles) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(candles));
  }

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function formatDate(iso) {
    var d = new Date(iso);
    return d.toLocaleDateString("he-IL", { year: "numeric", month: "long", day: "numeric" });
  }

  function renderCandles() {
    var candles = loadCandles();
    var countEls = document.querySelectorAll("[data-candle-count]");
    for (var i = 0; i < countEls.length; i++) countEls[i].textContent = candles.length;

    var listEl = document.getElementById("candle-list");
    if (!listEl) return;

    if (candles.length === 0) {
      listEl.innerHTML =
        '<p class="text-center text-secondary font-body py-6">היו הראשונים להדליק כאן נר ולהשאיר מילה לזכרו.</p>';
      return;
    }

    listEl.innerHTML = candles
      .slice()
      .reverse()
      .map(function (c, i) {
        return (
          '<div class="candle-entry bg-surface-container-low rounded-lg p-6' +
          (i === 0 ? " candle-entry-new" : "") +
          '">' +
          '<div class="flex justify-between items-baseline gap-4 mb-2">' +
          '<span class="flex items-center gap-2 font-headline font-bold text-primary">' +
          '<span class="material-symbols-outlined flame-icon text-accent-gold text-base" style="font-variation-settings: \'FILL\' 1">local_fire_department</span>' +
          escapeHtml(c.name) +
          "</span>" +
          '<span class="font-label text-xs text-secondary" dir="ltr">' + formatDate(c.date) + "</span>" +
          "</div>" +
          (c.message
            ? '<p class="font-body text-on-surface-variant leading-relaxed">' + escapeHtml(c.message) + "</p>"
            : "") +
          "</div>"
        );
      })
      .join("");
  }

  function openModal() {
    var modal = document.getElementById("candle-modal");
    if (!modal) return;
    modal.classList.remove("hidden");
    modal.classList.add("flex");
    document.body.style.overflow = "hidden";
    var nameInput = document.getElementById("candle-name-input");
    if (nameInput) setTimeout(function () { nameInput.focus(); }, 150);
  }

  function closeModal() {
    var modal = document.getElementById("candle-modal");
    if (!modal) return;
    modal.classList.add("hidden");
    modal.classList.remove("flex");
    document.body.style.overflow = "";
  }

  function handleCandleSubmit(e) {
    e.preventDefault();
    var nameInput = document.getElementById("candle-name-input");
    var messageInput = document.getElementById("candle-message-input");
    var name = nameInput.value.trim();
    if (!name) {
      nameInput.focus();
      return;
    }
    var message = (messageInput.value || "").trim();
    var candles = loadCandles();
    candles.push({ name: name, message: message, date: new Date().toISOString() });
    saveCandles(candles);
    nameInput.value = "";
    messageInput.value = "";
    renderCandles();
    closeModal();
    var listEl = document.getElementById("candle-list");
    if (listEl) listEl.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function setupCandles() {
    renderCandles();

    var triggers = document.querySelectorAll("[data-candle-trigger]");
    for (var i = 0; i < triggers.length; i++) {
      triggers[i].addEventListener("click", function (e) {
        e.preventDefault();
        openModal();
      });
    }

    var closeBtn = document.getElementById("candle-modal-close");
    if (closeBtn) closeBtn.addEventListener("click", closeModal);

    var modal = document.getElementById("candle-modal");
    if (modal) {
      modal.addEventListener("click", function (e) {
        if (e.target === modal) closeModal();
      });
    }

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && modal && !modal.classList.contains("hidden")) closeModal();
    });

    var form = document.getElementById("candle-form");
    if (form) form.addEventListener("submit", handleCandleSubmit);
  }

  function setupMobileNav() {
    var toggle = document.getElementById("mobile-nav-toggle");
    var panel = document.getElementById("mobile-nav-panel");
    if (!toggle || !panel) return;
    toggle.addEventListener("click", function () {
      var isOpen = panel.classList.toggle("open");
      toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
      var iconEl = toggle.querySelector(".material-symbols-outlined");
      if (iconEl) iconEl.textContent = isOpen ? "close" : "menu";
    });
    panel.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        panel.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
        var iconEl = toggle.querySelector(".material-symbols-outlined");
        if (iconEl) iconEl.textContent = "menu";
      });
    });
  }

  // Ambient background song (local file): autoplays muted on load (the only
  // zero-click autoplay browsers allow), one click/scroll unmutes it. To keep
  // it playing across page navigations (index <-> gallery are separate page
  // loads, not one app), the current time and "has this visitor unmuted
  // before" flag are persisted per tab, so the next page picks the song back
  // up where it left off instead of restarting from silence.
  var SONG_STATE_KEY = "alon-bibian-song-state";

  function loadSongState() {
    try {
      var raw = JSON.parse(sessionStorage.getItem(SONG_STATE_KEY));
      return raw && typeof raw === "object" ? raw : {};
    } catch (e) {
      return {};
    }
  }

  function saveSongState(state) {
    try {
      sessionStorage.setItem(SONG_STATE_KEY, JSON.stringify(state));
    } catch (e) {}
  }

  function updateSongIcons(muted) {
    var icon = document.getElementById("song-mute-icon");
    if (icon) icon.textContent = muted ? "volume_off" : "volume_up";
    var pulse = document.getElementById("song-widget-pulse");
    if (pulse) pulse.style.display = muted ? "" : "none";
  }

  function setupSongWidget() {
    var audio = document.getElementById("bg-audio");
    var widget = document.getElementById("song-widget");
    if (!audio) return;

    var state = loadSongState();
    audio.volume = 0.5;

    function persist(extra) {
      var next = { time: audio.currentTime, unmuted: !audio.muted };
      for (var k in extra) next[k] = extra[k];
      saveSongState(next);
    }

    // Resume where the previous page left off instead of starting from 0,
    // so moving between pages feels like one continuous song.
    if (typeof state.time === "number" && isFinite(state.time) && state.time > 0) {
      var resumeTime = state.time;
      var applyResume = function () {
        if (audio.duration && resumeTime < audio.duration) audio.currentTime = resumeTime;
      };
      if (audio.readyState >= 1) applyResume();
      else audio.addEventListener("loadedmetadata", applyResume, { once: true });
    }

    // Once a visitor has unmuted during this browsing session, later page
    // loads on the same site try to resume unmuted right away — browsers
    // allow that once a user has already interacted with audio on the
    // origin. If the browser still blocks it, fall back to muted + the
    // first-interaction listener below, same as a first-ever visit.
    var wantsUnmuted = !!state.unmuted;
    audio.muted = !wantsUnmuted;
    var p = audio.play();
    if (p && typeof p.catch === "function") {
      p.catch(function () {
        audio.muted = true;
        updateSongIcons(true);
      });
    }
    updateSongIcons(audio.muted);

    function attemptPlay() {
      var pp = audio.play();
      if (pp && typeof pp.catch === "function") pp.catch(function () {});
    }

    function unmuteNow() {
      if (audio.paused) attemptPlay();
      audio.muted = false;
      updateSongIcons(false);
      persist();
    }

    // Browsers block audible autoplay entirely on a visitor's very first
    // page — there is no zero-click way around that. Closest thing to
    // "automatic": the very first interaction anywhere on the page (click,
    // tap, key, scroll) unmutes it right away, so visitors don't need to
    // find and click the small speaker icon.
    var autoUnmuteEvents = ["click", "touchstart", "keydown", "scroll", "wheel"];
    var autoUnmute = function () {
      unmuteNow();
      autoUnmuteEvents.forEach(function (evt) { document.removeEventListener(evt, autoUnmute); });
    };
    if (audio.muted) {
      autoUnmuteEvents.forEach(function (evt) {
        document.addEventListener(evt, autoUnmute, { once: true, passive: true });
      });
    }

    function toggle() {
      if (audio.paused) attemptPlay();
      audio.muted = !audio.muted;
      updateSongIcons(audio.muted);
      persist();
      // The widget itself counts as the "first interaction" too — don't let
      // the page-wide listener immediately re-fire and flip it right back.
      autoUnmuteEvents.forEach(function (evt) { document.removeEventListener(evt, autoUnmute); });
    }

    if (widget) widget.addEventListener("click", toggle);

    // Keep the resume point fresh so a navigation mid-song (or a closed tab
    // that gets restored) picks up close to where it actually was.
    var lastSaveAt = 0;
    audio.addEventListener("timeupdate", function () {
      var now = Date.now();
      if (now - lastSaveAt > 1000) {
        lastSaveAt = now;
        persist();
      }
    });
    window.addEventListener("pagehide", function () { persist(); });
    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "hidden") persist();
    });
  }

  // Clipboard API needs a secure context and can still be denied by browser
  // policy (seen in practice: NotAllowedError even on https). This legacy
  // technique works everywhere with no permissions involved.
  function legacyCopy(text) {
    var textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.top = "0";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    textarea.setSelectionRange(0, text.length);
    var ok = false;
    try {
      ok = document.execCommand("copy");
    } catch (e) {
      ok = false;
    }
    document.body.removeChild(textarea);
    return ok;
  }

  function setupShareButton() {
    var btn = document.getElementById("share-button");
    if (!btn) return;

    function showCopied() {
      var original = btn.textContent;
      btn.textContent = "הקישור הועתק ✓";
      setTimeout(function () {
        btn.textContent = original;
      }, 2000);
    }

    function copyWithFallback(url) {
      if (legacyCopy(url)) {
        showCopied();
        return;
      }
      try {
        window.prompt("העתיקו את הקישור:", url);
      } catch (e) {
        // Some embedded/restricted browsers disable prompt() outright —
        // fall back to showing the raw link in the button so there's
        // always something the visitor can select and copy by hand.
        btn.textContent = url;
      }
    }

    btn.addEventListener("click", function () {
      var url = window.location.href;
      if (navigator.share) {
        navigator.share({ title: document.title, url: url }).catch(function () {});
        return;
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard
          .writeText(url)
          .then(showCopied)
          .catch(function () {
            copyWithFallback(url);
          });
        return;
      }
      copyWithFallback(url);
    });
  }

  function setupScrollTopButton() {
    var btn = document.getElementById("scroll-top-btn");
    if (!btn) return;

    function update() {
      var visible = window.scrollY > 400;
      btn.classList.toggle("opacity-0", !visible);
      btn.classList.toggle("pointer-events-none", !visible);
      btn.classList.toggle("translate-y-4", !visible);
    }

    window.addEventListener("scroll", update, { passive: true });
    update();

    btn.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  function setupRevealAnimations() {
    var targets = document.querySelectorAll(".reveal");
    if (!targets.length || !("IntersectionObserver" in window)) return;
    // Only hide-then-reveal once JS has actually run — if this script fails
    // to load, content stays visible (no animation) instead of disappearing.
    targets.forEach(function (t) { t.classList.add("reveal-pending"); });
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.remove("reveal-pending");
            entry.target.classList.add("in-view");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    targets.forEach(function (t) { observer.observe(t); });
  }

  document.addEventListener("DOMContentLoaded", function () {
    setupCandles();
    setupMobileNav();
    setupSongWidget();
    setupShareButton();
    setupScrollTopButton();
    setupRevealAnimations();
  });
})();
