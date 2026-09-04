// Letters page behavior: category filtering and the full-letter reader.
// Reads window.LETTERS_DATA (see letters-data.js) and drives the markup in
// letters.html. Depends on site.js for the shared nav/candles widgets.
(function () {
  "use strict";

  const ALL_KEY = "__all__";
  const FILTER_SWITCH_TRANSITION_MS = 220; // grid fade-out/in while switching categories
  const READER_SWAP_DELAY_MS = 120; // lets the fade-out finish before swapping the letter content
  const READER_CLOSE_TRANSITION_MS = 280; // matches the CSS reader-open transition duration
  const SWIPE_THRESHOLD_PX = 40; // minimum horizontal drag to count as a swipe

  // The life-story text is kept in LETTERS_DATA for the stories page, but it
  // is not a letter — hide it here. `order` remains the primary sort key.
  const letters = ((window.LETTERS_DATA && window.LETTERS_DATA.letters) || [])
    .filter((l) => l.category && l.category !== "story")
    .slice()
    .sort((a, b) => (a.order || 0) - (b.order || 0));
  const categories = (window.LETTERS_DATA && window.LETTERS_DATA.categories) || [];

  let activeKey = ALL_KEY;
  let visibleLetters = letters;
  let readerIndex = 0;

  const filtersEl = document.getElementById("category-filters");
  const gridEl = document.getElementById("letters-grid");
  const emptyEl = document.getElementById("letters-empty");
  const countEl = document.getElementById("letters-count");

  function categoryLabel(key) {
    const cat = categories.find((c) => c.key === key);
    return cat ? cat.label : key;
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function displayTitle(letter) {
    return window.letterDisplayTitle ? window.letterDisplayTitle(letter) : letter.title || "";
  }

  function displayFrom(letter) {
    return window.letterDisplayFrom ? window.letterDisplayFrom(letter) : letter.from || "";
  }

  function formatDate(letter) {
    return window.letterDisplayDate ? window.letterDisplayDate(letter) : letter.dateLabel || "";
  }

  function categoryCount(key) {
    return letters.filter((l) => l.category === key).length;
  }

  function pillHtml(p) {
    return `
      <button data-key="${p.key}" class="category-pill ${p.key === activeKey ? "active" : ""} whitespace-nowrap flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-white border border-outline-variant/25 text-primary font-label text-sm font-medium tracking-wide">
        ${escapeHtml(p.label)}<span class="pill-count">${p.count}</span>
      </button>`;
  }

  function renderFilters() {
    const pills = [{ key: ALL_KEY, label: "הכל", count: letters.length }].concat(
      categories.map((c) => ({ key: c.key, label: c.label, count: categoryCount(c.key) }))
    );
    filtersEl.innerHTML = pills
      .filter((p) => p.key === ALL_KEY || p.count > 0)
      .map(pillHtml)
      .join("");
  }

  function letterCardHtml(letter, index) {
    const fromText = displayFrom(letter);
    const metaParts = [];
    if (fromText) metaParts.push(`מאת <span class="text-primary/80 font-semibold">${escapeHtml(fromText)}</span>`);
    if (letter.to) metaParts.push(`אל <span class="text-primary/80 font-semibold">${escapeHtml(letter.to)}</span>`);
    const meta = metaParts.length
      ? `<p class="font-label text-xs text-secondary/80 mb-3">${metaParts.join(" · ")}</p>`
      : "";

    const dateText = formatDate(letter);
    return `
      <button data-index="${index}" data-category="${escapeHtml(letter.category || "")}" class="letter-card text-right p-6 md:p-7 flex flex-col">
        <span class="letter-fold" aria-hidden="true"></span>
        <div class="flex items-start justify-between gap-3 mb-4">
          <span class="letter-tag font-label text-[0.62rem] uppercase tracking-[0.18em] font-bold text-accent-gold">${escapeHtml(categoryLabel(letter.category))}</span>
          ${dateText ? `<span class="font-label text-xs text-secondary shrink-0 mt-0.5">${escapeHtml(dateText)}</span>` : ""}
        </div>
        <h3 class="text-lg font-headline font-bold text-primary mb-2">${escapeHtml(displayTitle(letter))}</h3>
        ${meta}
        <p class="letter-body text-sm text-on-surface-variant line-clamp-5 flex-1">${escapeHtml(letter.body)}</p>
        <span class="inline-flex items-center gap-1 text-accent-gold text-xs font-bold mt-4">
          קראו את המכתב המלא
          <span class="material-symbols-outlined text-sm not-italic">arrow_back</span>
        </span>
      </button>`;
  }

  function renderGrid() {
    visibleLetters = activeKey === ALL_KEY ? letters : letters.filter((l) => l.category === activeKey);
    if (activeKey === ALL_KEY) {
      countEl.textContent = "מכתבים שנכתבו על אלון";
    } else if (activeKey === "writings") {
      countEl.textContent = "דברים שכתב אלון";
    } else {
      countEl.textContent = `${visibleLetters.length} מכתבים`;
    }

    if (visibleLetters.length === 0) {
      gridEl.innerHTML = "";
      emptyEl.classList.remove("hidden");
      return;
    }
    emptyEl.classList.add("hidden");

    gridEl.innerHTML = visibleLetters.map(letterCardHtml).join("");

    gridEl.querySelectorAll("[data-index]").forEach((btn) => {
      btn.addEventListener("click", () => openReader(Number(btn.dataset.index)));
    });
  }

  filtersEl.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-key]");
    if (!btn || btn.dataset.key === activeKey) return;
    activeKey = btn.dataset.key;
    renderFilters();
    gridEl.style.transition = `opacity ${FILTER_SWITCH_TRANSITION_MS}ms ease-out`;
    gridEl.style.opacity = "0";
    setTimeout(() => {
      renderGrid();
      gridEl.style.opacity = "1";
    }, FILTER_SWITCH_TRANSITION_MS);
  });

  // -----------------------------------------------------------------------
  // Reader modal
  // -----------------------------------------------------------------------

  const readerEl = document.getElementById("letter-reader");
  const readerCard = document.getElementById("reader-card");
  const readerScroll = document.getElementById("reader-scroll");
  const readerCategory = document.getElementById("reader-category");
  const readerTitle = document.getElementById("reader-title");
  const readerDate = document.getElementById("reader-date");
  const readerMeta = document.getElementById("reader-meta");
  const readerBody = document.getElementById("reader-body");
  const readerSignature = document.getElementById("reader-signature");
  const readerCounter = document.getElementById("reader-counter");

  function updateReader() {
    const letter = visibleLetters[readerIndex];
    if (!letter) return;
    readerCard.classList.remove("reader-card-visible");
    setTimeout(() => {
      readerCard.dataset.category = letter.category || "";
      readerCategory.textContent = categoryLabel(letter.category);
      readerTitle.textContent = displayTitle(letter);
      readerDate.textContent = formatDate(letter);
      const fromText = displayFrom(letter);
      const metaParts = [];
      if (fromText) metaParts.push(`מאת ${fromText}`);
      if (letter.to) metaParts.push(`אל ${letter.to}`);
      readerMeta.textContent = metaParts.join(" · ");
      readerBody.innerHTML = letter.body
        .split(/\n\n+/)
        .map((p) => `<p class="mb-4 last:mb-0">${escapeHtml(p)}</p>`)
        .join("");
      readerSignature.textContent = letter.signature || "";
      readerCounter.textContent = `${readerIndex + 1} / ${visibleLetters.length}`;
      if (readerScroll) readerScroll.scrollTop = 0;
      readerCard.classList.add("reader-card-visible");
    }, READER_SWAP_DELAY_MS);
  }

  function openReader(index) {
    readerIndex = index;
    readerEl.classList.remove("hidden");
    readerEl.classList.add("flex");
    requestAnimationFrame(() => readerEl.classList.add("reader-open"));
    document.body.style.overflow = "hidden";
    updateReader();
  }

  function closeReader() {
    readerEl.classList.remove("reader-open");
    document.body.style.overflow = "";
    setTimeout(() => {
      readerEl.classList.add("hidden");
      readerEl.classList.remove("flex");
    }, READER_CLOSE_TRANSITION_MS);
  }

  function showPrev() {
    readerIndex = (readerIndex - 1 + visibleLetters.length) % visibleLetters.length;
    updateReader();
  }
  function showNext() {
    readerIndex = (readerIndex + 1) % visibleLetters.length;
    updateReader();
  }

  document.getElementById("reader-close").addEventListener("click", closeReader);
  document.getElementById("reader-prev").addEventListener("click", showPrev);
  document.getElementById("reader-next").addEventListener("click", showNext);
  readerEl.addEventListener("click", (e) => {
    if (e.target === readerEl) closeReader();
  });
  document.addEventListener("keydown", (e) => {
    if (readerEl.classList.contains("hidden")) return;
    if (e.key === "Escape") closeReader();
    if (e.key === "ArrowRight") showPrev();
    if (e.key === "ArrowLeft") showNext();
  });

  let touchStartX = null;
  readerEl.addEventListener(
    "touchstart",
    (e) => {
      touchStartX = e.changedTouches[0].clientX;
    },
    { passive: true }
  );
  readerEl.addEventListener(
    "touchend",
    (e) => {
      if (touchStartX === null) return;
      const dx = e.changedTouches[0].clientX - touchStartX;
      touchStartX = null;
      if (Math.abs(dx) < SWIPE_THRESHOLD_PX) return;
      if (dx > 0) showPrev();
      else showNext();
    },
    { passive: true }
  );

  renderFilters();
  renderGrid();
})();
