// Letters page behavior: category filtering and the full-letter reader.
// Reads window.LETTERS_DATA (see letters-data.js) and drives the markup in
// letters.html. Depends on site.js for the shared nav/candles/song widgets.
(function () {
  "use strict";

  const ALL_KEY = "__all__";
  const FILTER_SWITCH_TRANSITION_MS = 220; // wheel fade-out/in while switching categories
  const READER_SWAP_DELAY_MS = 120; // lets the fade-out finish before swapping the letter content
  const READER_CLOSE_TRANSITION_MS = 280; // matches the CSS reader-open transition duration
  const SWIPE_THRESHOLD_PX = 40; // minimum horizontal drag to count as a swipe
  const WHEEL_SNAP_TRANSITION_MS = 420; // matches the inline transition set on #wheel-ring
  const WHEEL_DRAG_CLICK_THRESHOLD_PX = 4; // drags shorter than this still count as a card click
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Most real letters have no exact date in the source material — only a
  // handful carry a real ISO `date`. `order` reflects the sequence the family
  // organized the material in (grouped by author/category), and is the
  // primary sort key; letters that do have a real date keep it for display.
  const letters = ((window.LETTERS_DATA && window.LETTERS_DATA.letters) || [])
    .slice()
    .sort((a, b) => (a.order || 0) - (b.order || 0));
  const categories = (window.LETTERS_DATA && window.LETTERS_DATA.categories) || [];

  let activeKey = ALL_KEY;
  let visibleLetters = letters;
  let readerIndex = 0;

  const filtersEl = document.getElementById("category-filters");
  const wheelShellEl = document.getElementById("wheel-shell");
  const wheelStageEl = document.getElementById("wheel-stage");
  const wheelRingEl = document.getElementById("wheel-ring");
  const wheelPrevBtn = document.getElementById("wheel-prev");
  const wheelNextBtn = document.getElementById("wheel-next");
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

  // Prefers a free-text `dateLabel` (e.g. "חודש לפני נפילתו", "תשנ"ז") for
  // letters without a known exact date, over guessing/formatting a fake one.
  function formatDate(letter) {
    if (letter.dateLabel) return letter.dateLabel;
    if (letter.date) {
      const d = new Date(letter.date);
      if (!isNaN(d)) return d.toLocaleDateString("he-IL", { year: "numeric", month: "long", day: "numeric" });
    }
    return "";
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

  function wheelCardHtml(letter) {
    const metaParts = [];
    if (letter.from) metaParts.push(`מאת ${escapeHtml(letter.from)}`);
    if (letter.to) metaParts.push(`אל ${escapeHtml(letter.to)}`);
    const dateText = formatDate(letter);
    const metaLine = metaParts.concat(dateText ? [dateText] : []).join(" · ");
    return `
      <button type="button" class="wheel-card-expand" aria-label="הגדלה וקריאת המכתב המלא" title="הגדלה">
        <span class="material-symbols-outlined text-base">open_in_full</span>
      </button>
      <span class="font-label text-[0.6rem] uppercase tracking-[0.14em] text-accent-gold font-bold">${escapeHtml(categoryLabel(letter.category))}</span>
      <h3 class="text-sm font-headline font-bold text-primary mt-1 mb-1 leading-snug">${escapeHtml(letter.title)}</h3>
      <div class="wheel-card-body">${escapeHtml(letter.body)}</div>
      ${metaLine ? `<p class="wheel-card-meta">${metaLine}</p>` : ""}`;
  }

  // -----------------------------------------------------------------------
  // Letters wheel — a hexagonal 3D drum, like a real rotary card file. Only
  // up to MAX_FACETS cards exist in the DOM at once, at fixed angles around
  // the drum (never more than 6, so the sides visibly curve away and pass
  // behind out of sight — .wheel-card's backface-visibility:hidden makes
  // them vanish past 90°, rather than the near-flat wall you'd get from one
  // facet per letter). The ring itself always rests at rotation 0; every
  // step animates out to the next facet position and then, invisibly to the
  // user, relabels which letter sits in which facet and resets to 0 — the
  // classic "infinite carousel" trick — so all 54 letters stay reachable
  // through a fixed 6-sided wheel.
  // -----------------------------------------------------------------------

  const MAX_FACETS = 6;

  let wheelRotation = 0; // current ring rotateY, degrees (0 whenever at rest)
  let wheelStepDeg = 0; // 360 / facet count
  let wheelCenterIndex = 0; // real letter index currently facing front
  let wheelDragState = null;
  let wheelDragMoved = false;

  function setWheelTransition(on) {
    wheelRingEl.style.transition =
      on && !prefersReducedMotion ? `transform ${WHEEL_SNAP_TRANSITION_MS}ms cubic-bezier(0.22, 0.61, 0.36, 1)` : "none";
  }

  function applyWheelRotation(rotation) {
    wheelRotation = rotation;
    wheelRingEl.style.transform = `rotateY(${rotation}deg)`;
    const cards = wheelRingEl.children;
    const n = cards.length;
    if (n === 0) return;
    const frontSliceDeg = 180 / n;
    for (let i = 0; i < n; i++) {
      let angle = ((i * 360) / n + rotation) % 360;
      if (angle > 180) angle -= 360;
      if (angle < -180) angle += 360;
      const dist = Math.abs(angle);
      const card = cards[i];
      const isFront = dist < frontSliceDeg;
      card.classList.toggle("front", isFront);
      // Only the front letter is meant to be legible — like turning through
      // a real card wheel one at a time, the rest read as blurred, dimmed
      // parchment until they rotate into place, so nothing next is spoiled
      // ahead of time.
      card.style.opacity = isFront ? "1" : String(Math.max(0.35, 1 - dist / 140));
      card.style.filter = isFront ? "none" : `blur(${Math.min(6, 2 + dist / 25)}px)`;
    }
  }

  function layoutWheel() {
    const cards = wheelRingEl.children;
    const n = cards.length;
    if (n === 0) return;
    const width = cards[0].getBoundingClientRect().width;
    const radius = Math.round(width / 2 / Math.tan(Math.PI / n));
    wheelStageEl.style.perspective = `${Math.round(radius * 3)}px`;
    wheelStepDeg = 360 / n;
    for (let i = 0; i < n; i++) {
      cards[i].style.transform = `rotateY(${(i * 360) / n}deg) translateZ(${radius}px)`;
    }
    setWheelTransition(false);
    applyWheelRotation(wheelRotation);
  }

  // A facet's fixed slot angle (slot * 360/n) mapped to a signed offset from
  // the front (0, 1, 2, .. then wrapping to ..-2, -1) — e.g. for a hexagon:
  // 0, 60, 120, 180, 240, 300 -> 0, 1, 2, 3, -2, -1.
  function offsetForSlot(slot, n) {
    return slot > n / 2 ? slot - n : slot;
  }

  // Fills every facet with whichever real letter belongs at its current
  // offset from wheelCenterIndex, wrapping around the full letter list.
  function assignFacetContent() {
    const cards = wheelRingEl.children;
    const n = cards.length;
    const total = visibleLetters.length;
    if (n === 0 || total === 0) return;
    for (let slot = 0; slot < n; slot++) {
      const offset = offsetForSlot(slot, n);
      const letterIndex = (((wheelCenterIndex + offset) % total) + total) % total;
      const card = cards[slot];
      if (card.dataset.letterIndex === String(letterIndex)) continue;
      card.dataset.letterIndex = String(letterIndex);
      const letter = visibleLetters[letterIndex];
      card.setAttribute("aria-label", `הגדלת המכתב: ${letter.title}`);
      card.innerHTML = wheelCardHtml(letter);
    }
  }

  // Points the wheel at `index` with no visible spin — used when the reader
  // (opened via a click, or navigated with its own prev/next) needs the
  // wheel behind it to already show the right letter once it closes.
  function syncWheelToIndex(index) {
    if (visibleLetters.length === 0) return;
    wheelCenterIndex = index;
    assignFacetContent();
    setWheelTransition(false);
    applyWheelRotation(0);
  }

  // Turns the wheel by exactly `steps` facets (positive = toward the next
  // letter), animates the spin, then relabels facets and snaps invisibly
  // back to the 0deg baseline so the drum can keep spinning indefinitely.
  function stepWheel(steps, animate) {
    const n = wheelRingEl.children.length;
    const total = visibleLetters.length;
    if (n === 0 || total === 0 || steps === 0) return;
    const targetRotation = -steps * wheelStepDeg;
    setWheelTransition(animate);
    applyWheelRotation(targetRotation);
    const finalize = () => {
      wheelCenterIndex = (((wheelCenterIndex + steps) % total) + total) % total;
      assignFacetContent();
      setWheelTransition(false);
      applyWheelRotation(0);
    };
    if (animate && !prefersReducedMotion) {
      wheelRingEl.addEventListener("transitionend", finalize, { once: true });
    } else {
      finalize();
    }
  }

  function renderWheel() {
    visibleLetters = activeKey === ALL_KEY ? letters : letters.filter((l) => l.category === activeKey);
    countEl.textContent = `${visibleLetters.length} מכתבים`;

    wheelRingEl.innerHTML = "";
    wheelRotation = 0;
    wheelCenterIndex = 0;

    if (visibleLetters.length === 0) {
      wheelShellEl.classList.add("hidden");
      emptyEl.classList.remove("hidden");
      return;
    }
    emptyEl.classList.add("hidden");
    wheelShellEl.classList.remove("hidden");

    const facetCount = Math.min(visibleLetters.length, MAX_FACETS);
    for (let slot = 0; slot < facetCount; slot++) {
      const card = document.createElement("div");
      card.className = "letter-card wheel-card";
      card.setAttribute("role", "button");
      card.setAttribute("tabindex", "0");
      const open = () => {
        if (wheelDragMoved) return;
        openReader(Number(card.dataset.letterIndex));
      };
      card.addEventListener("click", open);
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open();
        }
      });
      wheelRingEl.appendChild(card);
    }

    layoutWheel();
    assignFacetContent();
  }

  wheelStageEl.addEventListener("pointerdown", (e) => {
    wheelDragState = { startX: e.clientX, lastX: e.clientX };
    wheelDragMoved = false;
    setWheelTransition(false);
    wheelStageEl.setPointerCapture(e.pointerId);
  });
  wheelStageEl.addEventListener("pointermove", (e) => {
    if (!wheelDragState) return;
    const dx = e.clientX - wheelDragState.lastX;
    if (Math.abs(e.clientX - wheelDragState.startX) > WHEEL_DRAG_CLICK_THRESHOLD_PX) wheelDragMoved = true;
    wheelDragState.lastX = e.clientX;
    applyWheelRotation(wheelRotation + dx * 0.5);
  });
  function endWheelDrag() {
    if (!wheelDragState) return;
    wheelDragState = null;
    const snappedSteps = Math.round(wheelRotation / wheelStepDeg);
    stepWheel(-snappedSteps, true);
  }
  wheelStageEl.addEventListener("pointerup", endWheelDrag);
  wheelStageEl.addEventListener("pointercancel", endWheelDrag);

  wheelPrevBtn.addEventListener("click", () => stepWheel(-1, true));
  wheelNextBtn.addEventListener("click", () => stepWheel(1, true));

  let wheelResizeTimer = null;
  window.addEventListener("resize", () => {
    clearTimeout(wheelResizeTimer);
    wheelResizeTimer = setTimeout(layoutWheel, 150);
  });

  filtersEl.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-key]");
    if (!btn || btn.dataset.key === activeKey) return;
    activeKey = btn.dataset.key;
    renderFilters();
    wheelShellEl.style.transition = `opacity ${FILTER_SWITCH_TRANSITION_MS}ms ease-out`;
    wheelShellEl.style.opacity = "0";
    setTimeout(() => {
      renderWheel();
      wheelShellEl.style.opacity = "1";
    }, FILTER_SWITCH_TRANSITION_MS);
  });

  // -----------------------------------------------------------------------
  // Reader modal
  // -----------------------------------------------------------------------

  const readerEl = document.getElementById("letter-reader");
  const readerFlipStage = document.getElementById("reader-flip-stage");
  const readerCard = document.getElementById("reader-card");
  const readerCategory = document.getElementById("reader-category");
  const readerTitle = document.getElementById("reader-title");
  const readerDate = document.getElementById("reader-date");
  const readerMeta = document.getElementById("reader-meta");
  const readerBody = document.getElementById("reader-body");
  const readerSignature = document.getElementById("reader-signature");
  const readerCounter = document.getElementById("reader-counter");

  const PAGE_FLIP_DURATION_MS = 620; // matches the flip-page-next/prev animation duration in letters.css
  const PAGE_FLIP_SAFETY_MARGIN_MS = 150; // fallback cleanup in case animationend never fires
  let isFlipping = false;

  function fillReaderContent() {
    const letter = visibleLetters[readerIndex];
    if (!letter) return;
    readerCategory.textContent = categoryLabel(letter.category);
    readerTitle.textContent = letter.title;
    readerDate.textContent = formatDate(letter);
    const metaParts = [];
    if (letter.from) metaParts.push(`מאת ${letter.from}`);
    if (letter.to) metaParts.push(`אל ${letter.to}`);
    readerMeta.textContent = metaParts.join(" · ");
    readerBody.innerHTML = letter.body
      .split(/\n\n+/)
      .map((p) => `<p class="mb-4 last:mb-0">${escapeHtml(p)}</p>`)
      .join("");
    readerSignature.textContent = letter.signature || "";
    readerCounter.textContent = `${readerIndex + 1} / ${visibleLetters.length}`;
    readerCard.scrollTop = 0;
    // Keep the wheel (visible again once the reader closes) pointing at
    // whichever letter is open, including when reached via the reader's
    // own prev/next rather than a wheel click.
    syncWheelToIndex(readerIndex);
  }

  // First render on open: a plain fade/scale-in, no page turn (nothing to
  // turn away from yet).
  function updateReader() {
    readerCard.classList.remove("reader-card-visible");
    setTimeout(() => {
      fillReaderContent();
      readerCard.classList.add("reader-card-visible");
    }, READER_SWAP_DELAY_MS);
  }

  // Subsequent navigation: turn the current page over like a real notebook,
  // spine on the right. A page element — a front face (the outgoing letter)
  // and a plain paper back face — rotates away in 3D over the real card,
  // which is swapped to the new letter immediately underneath. Past the
  // edge-on point the front face hides and the paper back shows, exactly
  // like a physical sheet turning, not a card fading out.
  function flipReader(direction) {
    if (isFlipping || visibleLetters.length < 2) return;
    isFlipping = true;

    const activeClass = direction > 0 ? "flip-next-active" : "flip-prev-active";

    const clone = document.createElement("div");
    clone.className = "page-flip-clone " + (direction > 0 ? "flip-next" : "flip-prev");

    const page = document.createElement("div");
    page.className = "flip-page";

    const front = document.createElement("div");
    front.className = "flip-face flip-face-front";
    const frontContent = readerCard.cloneNode(true);
    frontContent.removeAttribute("id");
    front.appendChild(frontContent);

    const back = document.createElement("div");
    back.className = "flip-face flip-face-back";

    page.appendChild(front);
    page.appendChild(back);

    const shadow = document.createElement("div");
    shadow.className = "flip-shadow";

    clone.appendChild(page);
    clone.appendChild(shadow);
    readerFlipStage.appendChild(clone);

    readerIndex = (readerIndex + direction + visibleLetters.length) % visibleLetters.length;
    fillReaderContent();

    let done = false;
    function finish() {
      if (done) return;
      done = true;
      clone.remove();
      isFlipping = false;
    }
    page.addEventListener("animationend", finish, { once: true });
    setTimeout(finish, PAGE_FLIP_DURATION_MS + PAGE_FLIP_SAFETY_MARGIN_MS);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => page.classList.add(activeClass));
    });
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

  // In RTL reading order the next letter's page turns forward from the
  // spine on the right (direction 1); the previous letter turns back
  // toward the right (direction -1).
  function showPrev() {
    flipReader(-1);
  }
  function showNext() {
    flipReader(1);
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
  renderWheel();
})();
