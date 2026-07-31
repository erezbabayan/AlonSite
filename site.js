// Shared behavior for the memorial site: candle-lighting (backed by a JSON
// file on the server via /api/candles, shared across all visitors), mobile
// nav toggle, and the share button. Included by index.html and gallery.html.
(function () {
  "use strict";

  // ---------------------------------------------------------------------
  // Candles
  // ---------------------------------------------------------------------

  let candlesCache = [];

  function fetchCandles() {
    return fetch("/api/candles")
      .then((res) => {
        if (!res.ok) throw new Error("request failed");
        return res.json();
      })
      .then((data) => (Array.isArray(data) ? data : []))
      .catch(() => []);
  }

  function postCandle(name, message) {
    return fetch("/api/candles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, message }),
    }).then((res) => {
      if (!res.ok) throw new Error("request failed");
      return res.json();
    });
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function formatDate(iso) {
    return new Date(iso).toLocaleDateString("he-IL", { year: "numeric", month: "long", day: "numeric" });
  }

  function candleEntryHtml(candle, isNewest) {
    const message = candle.message
      ? `<p class="font-body text-on-surface-variant leading-relaxed">${escapeHtml(candle.message)}</p>`
      : "";
    return `
      <div class="candle-entry bg-surface-container-low rounded-lg p-6${isNewest ? " candle-entry-new" : ""}">
        <div class="flex justify-between items-baseline gap-4 mb-2">
          <span class="flex items-center gap-2 font-headline font-bold text-primary">
            <span class="material-symbols-outlined flame-icon text-accent-gold text-base" style="font-variation-settings: 'FILL' 1">local_fire_department</span>
            ${escapeHtml(candle.name)}
          </span>
          <span class="font-label text-xs text-secondary" dir="ltr">${formatDate(candle.date)}</span>
        </div>
        ${message}
      </div>`;
  }

  function renderCandles() {
    const candles = candlesCache;
    document.querySelectorAll("[data-candle-count]").forEach((el) => {
      el.textContent = candles.length;
    });

    const listEl = document.getElementById("candle-list");
    if (!listEl) return;

    if (candles.length === 0) {
      listEl.innerHTML =
        '<p class="text-center text-secondary font-body py-6">היו הראשונים להדליק כאן נר ולהשאיר מילה לזכרו.</p>';
      return;
    }

    listEl.innerHTML = candles
      .slice()
      .reverse()
      .map((candle, index) => candleEntryHtml(candle, index === 0))
      .join("");
  }

  const MODAL_FOCUS_DELAY_MS = 150; // let the open transition start before stealing focus

  function openModal() {
    const modal = document.getElementById("candle-modal");
    if (!modal) return;
    modal.classList.remove("hidden");
    modal.classList.add("flex");
    document.body.style.overflow = "hidden";
    const nameInput = document.getElementById("candle-name-input");
    if (nameInput) setTimeout(() => nameInput.focus(), MODAL_FOCUS_DELAY_MS);
  }

  function closeModal() {
    const modal = document.getElementById("candle-modal");
    if (!modal) return;
    modal.classList.add("hidden");
    modal.classList.remove("flex");
    document.body.style.overflow = "";
  }

  function handleCandleSubmit(e) {
    e.preventDefault();
    const nameInput = document.getElementById("candle-name-input");
    const messageInput = document.getElementById("candle-message-input");
    const name = nameInput.value.trim();
    if (!name) {
      nameInput.focus();
      return;
    }
    const message = (messageInput.value || "").trim();
    const submitBtn = document.getElementById("candle-submit-btn");
    if (submitBtn) submitBtn.disabled = true;
    postCandle(name, message)
      .then((entry) => {
        candlesCache.push(entry);
        nameInput.value = "";
        messageInput.value = "";
        renderCandles();
        closeModal();
        const listEl = document.getElementById("candle-list");
        if (listEl) listEl.scrollIntoView({ behavior: "smooth", block: "center" });
      })
      .catch(() => {
        window.alert("לא הצלחנו לשמור את הנר. נסו שוב בעוד רגע.");
      })
      .then(() => {
        if (submitBtn) submitBtn.disabled = false;
      });
  }

  function setupCandles() {
    fetchCandles().then((candles) => {
      candlesCache = candles;
      renderCandles();
    });

    document.querySelectorAll("[data-candle-trigger]").forEach((trigger) => {
      trigger.addEventListener("click", (e) => {
        e.preventDefault();
        openModal();
      });
    });

    const closeBtn = document.getElementById("candle-modal-close");
    if (closeBtn) closeBtn.addEventListener("click", closeModal);

    const modal = document.getElementById("candle-modal");
    if (modal) {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) closeModal();
      });
    }

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && modal && !modal.classList.contains("hidden")) closeModal();
    });

    const form = document.getElementById("candle-form");
    if (form) form.addEventListener("submit", handleCandleSubmit);
  }

  // ---------------------------------------------------------------------
  // Mobile nav
  // ---------------------------------------------------------------------

  function setupMobileNav() {
    const toggle = document.getElementById("mobile-nav-toggle");
    const panel = document.getElementById("mobile-nav-panel");
    if (!toggle || !panel) return;

    function setOpen(isOpen) {
      toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
      const iconEl = toggle.querySelector(".material-symbols-outlined");
      if (iconEl) iconEl.textContent = isOpen ? "close" : "menu";
    }

    toggle.addEventListener("click", () => setOpen(panel.classList.toggle("open")));
    panel.querySelectorAll("a").forEach((a) => {
      a.addEventListener("click", () => {
        panel.classList.remove("open");
        setOpen(false);
      });
    });
  }

  // ---------------------------------------------------------------------
  // Ambient background song (local file): autoplays muted on load (the only
  // zero-click autoplay browsers allow), one click/scroll unmutes it. To keep
  // it playing across page navigations (index <-> gallery are separate page
  // loads, not one app), the current time and "has this visitor unmuted
  // before" flag are persisted per tab, so the next page picks the song back
  // up where it left off instead of restarting from silence.
  // ---------------------------------------------------------------------

  const SONG_STATE_KEY = "alon-bibian-song-state";
  const BG_AUDIO_VOLUME = 0.5;
  const SONG_SAVE_INTERVAL_MS = 1000; // how often timeupdate persists the resume point
  // First interaction anywhere on the page unmutes the song — this is the
  // closest thing to "automatic" that browsers allow on a visitor's very
  // first page (audible autoplay with zero interaction is blocked outright).
  const UNMUTE_TRIGGER_EVENTS = ["click", "touchstart", "keydown", "scroll", "wheel"];

  function loadSongState() {
    try {
      const raw = JSON.parse(sessionStorage.getItem(SONG_STATE_KEY));
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
    const icon = document.getElementById("song-mute-icon");
    if (icon) icon.textContent = muted ? "volume_off" : "volume_up";
    const pulse = document.getElementById("song-widget-pulse");
    if (pulse) pulse.style.display = muted ? "" : "none";
  }

  function setupSongWidget() {
    const audio = document.getElementById("bg-audio");
    const widget = document.getElementById("song-widget");
    if (!audio) return;

    const state = loadSongState();
    audio.volume = BG_AUDIO_VOLUME;

    function persist(extra) {
      saveSongState({ time: audio.currentTime, unmuted: !audio.muted, ...extra });
    }

    // Resume where the previous page left off instead of starting from 0,
    // so moving between pages feels like one continuous song.
    if (typeof state.time === "number" && isFinite(state.time) && state.time > 0) {
      const resumeTime = state.time;
      const applyResume = () => {
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
    const wantsUnmuted = !!state.unmuted;
    audio.muted = !wantsUnmuted;
    const playAttempt = audio.play();
    if (playAttempt && typeof playAttempt.catch === "function") {
      playAttempt.catch(() => {
        audio.muted = true;
        updateSongIcons(true);
      });
    }
    updateSongIcons(audio.muted);

    function attemptPlay() {
      const p = audio.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    }

    function unmuteNow() {
      if (audio.paused) attemptPlay();
      audio.muted = false;
      updateSongIcons(false);
      persist();
    }

    const autoUnmute = () => {
      unmuteNow();
      UNMUTE_TRIGGER_EVENTS.forEach((evt) => document.removeEventListener(evt, autoUnmute));
    };
    if (audio.muted) {
      UNMUTE_TRIGGER_EVENTS.forEach((evt) => {
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
      UNMUTE_TRIGGER_EVENTS.forEach((evt) => document.removeEventListener(evt, autoUnmute));
    }

    if (widget) widget.addEventListener("click", toggle);

    // Keep the resume point fresh so a navigation mid-song (or a closed tab
    // that gets restored) picks up close to where it actually was.
    let lastSaveAt = 0;
    audio.addEventListener("timeupdate", () => {
      const now = Date.now();
      if (now - lastSaveAt > SONG_SAVE_INTERVAL_MS) {
        lastSaveAt = now;
        persist();
      }
    });
    window.addEventListener("pagehide", () => persist());
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") persist();
    });
  }

  // ---------------------------------------------------------------------
  // Share button
  // ---------------------------------------------------------------------

  const COPY_FEEDBACK_MS = 2000; // how long "link copied" replaces the button label

  // Clipboard API needs a secure context and can still be denied by browser
  // policy (seen in practice: NotAllowedError even on https). This legacy
  // technique works everywhere with no permissions involved.
  function legacyCopy(text) {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.top = "0";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    textarea.setSelectionRange(0, text.length);
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch (e) {
      ok = false;
    }
    document.body.removeChild(textarea);
    return ok;
  }

  function setupShareButton() {
    const btn = document.getElementById("share-button");
    if (!btn) return;

    function showCopied() {
      const original = btn.textContent;
      btn.textContent = "הקישור הועתק ✓";
      setTimeout(() => {
        btn.textContent = original;
      }, COPY_FEEDBACK_MS);
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

    btn.addEventListener("click", () => {
      const url = window.location.href;
      if (navigator.share) {
        navigator.share({ title: document.title, url }).catch(() => {});
        return;
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard
          .writeText(url)
          .then(showCopied)
          .catch(() => copyWithFallback(url));
        return;
      }
      copyWithFallback(url);
    });
  }

  // ---------------------------------------------------------------------
  // Scroll-to-top button
  // ---------------------------------------------------------------------

  const SCROLL_TOP_VISIBLE_AT_PX = 400; // how far down the page before the button appears

  function setupScrollTopButton() {
    const btn = document.getElementById("scroll-top-btn");
    if (!btn) return;

    function update() {
      const visible = window.scrollY > SCROLL_TOP_VISIBLE_AT_PX;
      btn.classList.toggle("opacity-0", !visible);
      btn.classList.toggle("pointer-events-none", !visible);
      btn.classList.toggle("translate-y-4", !visible);
    }

    window.addEventListener("scroll", update, { passive: true });
    update();

    btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  }

  // ---------------------------------------------------------------------
  // Living-memorial dates: how long it's been, and when the next Hebrew-
  // calendar yahrzeit (anniversary) falls. Both are derived at load time
  // instead of hardcoded so the page stays accurate on every future visit.
  // ---------------------------------------------------------------------

  const DEATH_DATE = new Date(1997, 1, 4); // 4 בפברואר 1997
  const YAHRZEIT_HEBREW_MONTH = "Shevat";
  const YAHRZEIT_HEBREW_DAY = "28";
  const YAHRZEIT_SEARCH_WINDOW_DAYS = 400; // comfortably more than one Hebrew year
  const MS_PER_DAY = 86400000;

  function yearsSince(fromDate, now) {
    let years = now.getFullYear() - fromDate.getFullYear();
    const hadAnniversaryThisYear =
      now.getMonth() > fromDate.getMonth() ||
      (now.getMonth() === fromDate.getMonth() && now.getDate() >= fromDate.getDate());
    if (!hadAnniversaryThisYear) years--;
    return years;
  }

  function nextHebrewYahrzeit(now) {
    const fmt = new Intl.DateTimeFormat("en-US-u-ca-hebrew", { day: "numeric", month: "long" });
    let d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    for (let i = 0; i < YAHRZEIT_SEARCH_WINDOW_DAYS; i++) {
      const parts = fmt.formatToParts(d);
      const day = parts.find((p) => p.type === "day")?.value;
      const month = parts.find((p) => p.type === "month")?.value;
      if (day === YAHRZEIT_HEBREW_DAY && month === YAHRZEIT_HEBREW_MONTH) return d;
      d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
    }
    return null;
  }

  function setupMemorialDates() {
    const now = new Date();

    const yearsEl = document.getElementById("years-since-note");
    if (yearsEl) {
      yearsEl.textContent = `${yearsSince(DEATH_DATE, now)} שנים בהם זכרו ממשיך ללוות אותנו`;
    }

    const yahrzeitEl = document.getElementById("next-yahrzeit-note");
    if (yahrzeitEl) {
      try {
        const next = nextHebrewYahrzeit(now);
        if (next) {
          const days = Math.round((next - new Date(now.getFullYear(), now.getMonth(), now.getDate())) / MS_PER_DAY);
          const dateLabel = next.toLocaleDateString("he-IL", { year: "numeric", month: "long", day: "numeric" });
          const when = days === 0 ? "היום" : days === 1 ? "מחר" : `בעוד ${days} ימים`;
          yahrzeitEl.textContent = `יום השנה הבא (כ"ח בשבט) — ${dateLabel} · ${when}`;
        }
      } catch (e) {
        // Hebrew-calendar Intl support isn't universal; leave the note
        // blank rather than show something wrong.
      }
    }
  }

  // ---------------------------------------------------------------------
  // Scroll-reveal animations
  // ---------------------------------------------------------------------

  const REVEAL_INTERSECTION_THRESHOLD = 0.15; // fraction of the element visible before it reveals

  function setupRevealAnimations() {
    const targets = document.querySelectorAll(".reveal");
    if (!targets.length || !("IntersectionObserver" in window)) return;
    // Only hide-then-reveal once JS has actually run — if this script fails
    // to load, content stays visible (no animation) instead of disappearing.
    targets.forEach((t) => t.classList.add("reveal-pending"));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.remove("reveal-pending");
            entry.target.classList.add("in-view");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: REVEAL_INTERSECTION_THRESHOLD }
    );
    targets.forEach((t) => observer.observe(t));
  }

  document.addEventListener("DOMContentLoaded", () => {
    setupCandles();
    setupMobileNav();
    setupSongWidget();
    setupShareButton();
    setupScrollTopButton();
    setupMemorialDates();
    setupRevealAnimations();
  });
})();
