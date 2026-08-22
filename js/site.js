// Shared behavior for the memorial site: candle-lighting (backed by a JSON
// file on the server via /api/candles, shared across all visitors), mobile
// nav toggle, and the share button. Included by index.html and gallery.html.
(function () {
  "use strict";

  // ---------------------------------------------------------------------
  // Candles
  // ---------------------------------------------------------------------

  let candlesCache = [];

  const CANDLES_PAGE_SIZE = 18; // cards per "show more" batch, fits 3 grid columns x 6 rows
  let visibleCandleCount = CANDLES_PAGE_SIZE;
  const CANDLES_LOCAL_KEY = "alon-memorial-candles";

  function siteRoot() {
    const el = document.querySelector('script[src*="site.js"]');
    if (el && el.src) {
      return el.src.replace(/\/js\/site\.js(?:\?.*)?$/, "");
    }
    return "";
  }

  function readLocalCandles() {
    try {
      const raw = JSON.parse(localStorage.getItem(CANDLES_LOCAL_KEY) || "[]");
      return Array.isArray(raw) ? raw : [];
    } catch (e) {
      return [];
    }
  }

  function writeLocalCandles(list) {
    try {
      localStorage.setItem(CANDLES_LOCAL_KEY, JSON.stringify(list));
    } catch (e) {
      /* private mode / quota */
    }
  }

  function candleKey(candle) {
    return [candle.date || "", candle.name || "", candle.message || ""].join("\n");
  }

  function mergeCandles(remote, local) {
    const out = [];
    const seen = {};
    (remote || []).concat(local || []).forEach((candle) => {
      if (!candle || !candle.name) return;
      const key = candleKey(candle);
      if (seen[key]) return;
      seen[key] = true;
      out.push(candle);
    });
    out.sort(function (a, b) {
      return String(a.date || "").localeCompare(String(b.date || ""));
    });
    return out;
  }

  function fetchJsonArray(url) {
    return fetch(url).then(function (res) {
      if (!res.ok) throw new Error("request failed");
      return res.json();
    }).then(function (data) {
      return Array.isArray(data) ? data : [];
    });
  }

  function fetchCandles() {
    const root = siteRoot();
    return fetchJsonArray(root + "/api/candles")
      .catch(function () {
        return fetchJsonArray(root + "/api/candles.php");
      })
      .catch(function () {
        return [];
      })
      .then(function (remote) {
        return mergeCandles(remote, readLocalCandles());
      });
  }

  function postCandle(name, message) {
    const entry = { name: name, message: message, date: new Date().toISOString() };
    const root = siteRoot();
    const body = JSON.stringify({ name: name, message: message });
    const headers = { "Content-Type": "application/json" };

    function saveLocal(saved) {
      const list = readLocalCandles();
      list.push(saved);
      writeLocalCandles(list);
      return saved;
    }

    return fetch(root + "/api/candles", { method: "POST", headers: headers, body: body })
      .then(function (res) {
        if (!res.ok) throw new Error("request failed");
        return res.json();
      })
      .catch(function () {
        return fetch(root + "/api/candles.php", { method: "POST", headers: headers, body: body }).then(function (res) {
          if (!res.ok) throw new Error("request failed");
          return res.json();
        });
      })
      .then(function (saved) {
        const ok = saved && saved.name ? saved : entry;
        saveLocal(ok);
        return ok;
      })
      .catch(function () {
        return saveLocal(entry);
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
      <div class="candle-entry bg-surface-container-low rounded-lg p-6 h-full flex flex-col${isNewest ? " candle-entry-new" : ""}">
        <div class="flex justify-between items-baseline gap-4 mb-2">
          <span class="flex items-center gap-2 font-headline font-bold text-primary">
            <img src="/media/icons/dam-hamacabim.png" alt="דם המכבים" class="memorial-photo text-accent-gold text-xl"/>
            ${escapeHtml(candle.name)}
          </span>
          <span class="font-label text-xs text-secondary" dir="ltr">${formatDate(candle.date)}</span>
        </div>
        ${message}
      </div>`;
  }

  function updateCandleLoadMoreButton(shownCount, totalCount) {
    const btn = document.getElementById("candle-load-more");
    if (!btn) return;
    btn.classList.toggle("hidden", shownCount >= totalCount);
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
        '<p class="col-span-full text-center text-secondary font-body py-6">היו הראשונים להשאיר כאן זיכרון ומילה לזכרו.</p>';
      updateCandleLoadMoreButton(0, 0);
      return;
    }

    const newestFirst = candles.slice().reverse();
    const visible = newestFirst.slice(0, visibleCandleCount);

    listEl.innerHTML = visible.map((candle, index) => candleEntryHtml(candle, index === 0)).join("");
    updateCandleLoadMoreButton(visible.length, newestFirst.length);
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
        window.alert("לא הצלחנו לשמור את הזיכרון. נסו שוב בעוד רגע.");
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

    const loadMoreBtn = document.getElementById("candle-load-more");
    if (loadMoreBtn) {
      loadMoreBtn.addEventListener("click", () => {
        visibleCandleCount += CANDLES_PAGE_SIZE;
        renderCandles();
      });
    }
  }

  // ---------------------------------------------------------------------
  // Mobile nav
  // ---------------------------------------------------------------------

  // ---------------------------------------------------------------------
  // Nav height
  // The fixed top nav is normally one line (~4rem), but wraps to two lines
  // on narrow screens once the site title no longer fits — anything that
  // assumes a fixed nav height (main's top padding, the sticky filter bar,
  // anchor scroll offsets) would otherwise sit partly hidden underneath it.
  // Measuring the real height and exposing it as --nav-h keeps all of that
  // correct regardless of title length, viewport width, or font load timing.
  // ---------------------------------------------------------------------
  function setupNavHeightVar() {
    const nav = document.querySelector("nav");
    if (!nav) return;

    function updateNavHeight() {
      document.documentElement.style.setProperty("--nav-h", `${nav.getBoundingClientRect().height}px`);
    }

    updateNavHeight();
    window.addEventListener("resize", updateNavHeight);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(updateNavHeight);
    }
    window.addEventListener("load", updateNavHeight);
  }

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
  // Ambient background song (local file): stays paused/muted until the
  // visitor explicitly clicks the song widget — no autoplay on entry. To
  // keep it playing across page navigations (index <-> gallery are separate
  // page loads, not one app), the current time and "is this visitor playing
  // it" flag are persisted per tab, so the next page picks the song back up
  // where it left off instead of restarting from the beginning.
  // ---------------------------------------------------------------------

  const SONG_STATE_KEY = "alon-bibian-song-state";
  // Playlist plays in order and loops back to the first track after the last.
  const SONG_PLAYLIST = ["/audio/atzlenu-bagan.mp3", "/audio/tachzor.mp3"];
  const BG_AUDIO_VOLUME = 0.5;
  const SONG_SAVE_INTERVAL_MS = 1000; // how often timeupdate persists the resume point

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

    let trackIndex =
      Number.isInteger(state.track) && state.track >= 0 && state.track < SONG_PLAYLIST.length
        ? state.track
        : 0;
    audio.src = SONG_PLAYLIST[trackIndex];

    function persist(extra) {
      saveSongState({
        time: audio.currentTime,
        playing: !audio.paused && !audio.muted,
        track: trackIndex,
        ...extra,
      });
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

    // No autoplay: the song stays paused/muted on load. If the visitor was
    // already playing it before navigating to this page, resume unmuted
    // playback (browsers allow that once the origin has had a real
    // interaction); otherwise stay silent until the widget is clicked.
    audio.muted = true;
    updateSongIcons(true);

    function attemptPlay() {
      const p = audio.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    }

    if (state.playing) {
      audio.muted = false;
      attemptPlay();
      updateSongIcons(false);
    }

    function toggle() {
      if (audio.paused || audio.muted) {
        attemptPlay();
        audio.muted = false;
        updateSongIcons(false);
      } else {
        audio.pause();
        audio.muted = true;
        updateSongIcons(true);
      }
      persist();
    }

    if (widget) widget.addEventListener("click", toggle);

    // Advance to the next track in the playlist when one ends, looping back
    // to the first track after the last.
    audio.addEventListener("ended", () => {
      trackIndex = (trackIndex + 1) % SONG_PLAYLIST.length;
      audio.src = SONG_PLAYLIST[trackIndex];
      audio.currentTime = 0;
      attemptPlay();
      persist({ time: 0 });
    });

    // Only one audio/video should ever play at a time. Whenever any media
    // element starts playing, pause every other one on the page — the
    // ambient song (with its own muted/icon/persist bookkeeping) and any
    // memorial video or audio clip alike. "play" doesn't bubble, so this
    // listens in the capture phase.
    document.addEventListener(
      "play",
      (e) => {
        const el = e.target;
        if (!(el instanceof HTMLMediaElement)) return;
        document.querySelectorAll("audio, video").forEach((other) => {
          if (other === el || other.paused) return;
          if (other === audio) {
            audio.pause();
            audio.muted = true;
            updateSongIcons(true);
            persist();
          } else {
            other.pause();
          }
        });
      },
      true
    );

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

  // Death: 4 Feb 1997 = 28 Shevat 5757 (תשנ״ז). Years-since counts
  // completed Hebrew yahrzeits (כ״ח בשבט), not the Gregorian anniversary.
  const DEATH_HEBREW_YEAR = 5757;
  const YAHRZEIT_HEBREW_MONTH = "Shevat";
  const YAHRZEIT_HEBREW_DAY = 28;
  const YAHRZEIT_SEARCH_WINDOW_DAYS = 400; // comfortably more than one Hebrew year
  const MS_PER_DAY = 86400000;
  const HEBREW_MONTH_ORDER = {
    Tishri: 1,
    Heshvan: 2,
    Cheshvan: 2,
    Kislev: 3,
    Tevet: 4,
    Shevat: 5,
    Adar: 6,
    "Adar I": 6,
    "Adar II": 7,
    Nisan: 8,
    Iyar: 9,
    Sivan: 10,
    Tamuz: 11,
    Tammuz: 11,
    Av: 12,
    Elul: 13,
  };

  function hebrewParts(date) {
    const fmt = new Intl.DateTimeFormat("en-US-u-ca-hebrew", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const parts = fmt.formatToParts(date);
    const day = Number(parts.find((p) => p.type === "day")?.value);
    const month = parts.find((p) => p.type === "month")?.value || "";
    const year = Number(parts.find((p) => p.type === "year")?.value);
    return { day, month, year };
  }

  function yearsSinceHebrewYahrzeit(now) {
    const { day, month, year } = hebrewParts(now);
    if (!year || !month || !day) return null;
    const monthOrder = HEBREW_MONTH_ORDER[month];
    const shevatOrder = HEBREW_MONTH_ORDER[YAHRZEIT_HEBREW_MONTH];
    const reachedYahrzeitThisYear =
      monthOrder > shevatOrder ||
      (monthOrder === shevatOrder && day >= YAHRZEIT_HEBREW_DAY);
    let years = year - DEATH_HEBREW_YEAR;
    if (!reachedYahrzeitThisYear) years--;
    return Math.max(0, years);
  }

  function nextHebrewYahrzeit(now) {
    let d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    for (let i = 0; i < YAHRZEIT_SEARCH_WINDOW_DAYS; i++) {
      const { day, month } = hebrewParts(d);
      if (day === YAHRZEIT_HEBREW_DAY && month === YAHRZEIT_HEBREW_MONTH) return d;
      d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
    }
    return null;
  }

  function setupMemorialDates() {
    const now = new Date();

    const yearsEl = document.getElementById("years-since-note");
    if (yearsEl) {
      try {
        const years = yearsSinceHebrewYahrzeit(now);
        if (years != null) {
          yearsEl.textContent = `${years} שנים לאסון המסוקים`;
        }
      } catch (e) {
        // Keep the HTML fallback (currently 29) if Hebrew calendar isn't available.
      }
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

  // ---------------------------------------------------------------------
  // Home-page nav scroll spy — keeps "פרקי חיים" / "הנצחה ומורשת" in the
  // top nav underlined once their section is in view, matching how the
  // nav already highlights the current page on every other page.
  // ---------------------------------------------------------------------

  const NAV_DESKTOP_ACTIVE = ["is-active", "text-[#1A2E44]"];
  const NAV_DESKTOP_INACTIVE = ["text-[#585f65]", "hover:text-[#1A2E44]", "transition-colors", "duration-300"];
  const NAV_MOBILE_ACTIVE = ["text-[#1A2E44]"];
  const NAV_MOBILE_INACTIVE = ["text-[#585f65]"];

  function setupHomeNavScrollSpy() {
    const sections = document.querySelectorAll("[data-nav-section]");
    const navLinks = document.querySelectorAll("nav a[data-nav-key]");
    if (!sections.length || !navLinks.length || !("IntersectionObserver" in window)) return;

    let activeKey = null;

    function activate(key) {
      if (!key || key === activeKey) return;
      activeKey = key;
      navLinks.forEach((link) => {
        const isMobile = link.closest("#mobile-nav-panel") !== null;
        const activeClasses = isMobile ? NAV_MOBILE_ACTIVE : NAV_DESKTOP_ACTIVE;
        const inactiveClasses = isMobile ? NAV_MOBILE_INACTIVE : NAV_DESKTOP_INACTIVE;
        const isActive = link.dataset.navKey === key;
        link.classList.remove(...(isActive ? inactiveClasses : activeClasses));
        link.classList.add(...(isActive ? activeClasses : inactiveClasses));
      });
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) activate(entry.target.dataset.navSection);
        });
      },
      { rootMargin: "-45% 0px -45% 0px" }
    );
    sections.forEach((s) => observer.observe(s));
  }

  document.addEventListener("DOMContentLoaded", () => {
    setupNavHeightVar();
    setupCandles();
    setupMobileNav();
    setupSongWidget();
    setupShareButton();
    setupScrollTopButton();
    setupMemorialDates();
    setupRevealAnimations();
    setupHomeNavScrollSpy();
    setupPortraitPhotoFocus();
  });

  function setupPortraitPhotoFocus() {
    document.querySelectorAll(".life-spine-media img").forEach((img) => {
      const mark = () => {
        if (!img.naturalWidth) return;
        img.classList.toggle("is-portrait", img.naturalHeight > img.naturalWidth);
      };
      if (img.complete) mark();
      else img.addEventListener("load", mark);
    });
  }
})();
