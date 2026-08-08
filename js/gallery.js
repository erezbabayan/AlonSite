// Gallery page behavior: category filtering and the lightbox. Reads
// window.GALLERY_DATA (see gallery-data.js) and drives the markup in
// gallery.html. Depends on site.js for the shared nav/candles/song widgets.
(function () {
  "use strict";

  const ALL_KEY = "__all__";

  // Categories fall into two chronological groups: chapters of his life,
  // then the categories that came after — separated by a visual divider
  // so the grouping reads clearly instead of one jumbled row of chips.
  const LIFE_KEYS = ["ילדות-ובגרות", "בר-מצווה-אלון", "חברים", "צבא", "משפחה", "כתבים-של-אלון"];

  const FILTER_SWITCH_TRANSITION_MS = 220; // grid fade-out/in while switching categories
  const LIGHTBOX_SWAP_DELAY_MS = 150; // lets the fade-out finish before swapping the image src
  const LIGHTBOX_CLOSE_TRANSITION_MS = 280; // matches the CSS lightbox-open transition duration
  const SWIPE_THRESHOLD_PX = 40; // minimum horizontal drag to count as a swipe

  const DATA = window.GALLERY_DATA || { categories: [] };

  // Flat list of every image with its category label, in category order.
  const flatImages = DATA.categories.flatMap((cat) =>
    cat.images.map((img) => ({ ...img, categoryKey: cat.key, categoryLabel: cat.label }))
  );

  const filtersEl = document.getElementById("category-filters");
  const gridEl = document.getElementById("gallery-grid");
  const emptyEl = document.getElementById("gallery-empty");
  const countEl = document.getElementById("gallery-count");

  let activeKey = ALL_KEY;
  let visibleImages = flatImages;
  let lightboxIndex = 0;

  function pillHtml(p) {
    return `
      <button data-key="${p.key}" class="category-pill ${p.key === activeKey ? "active" : ""} whitespace-nowrap flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-white border border-outline-variant/25 text-primary font-label text-sm font-medium tracking-wide">
        ${p.label}<span class="pill-count">${p.count}</span>
      </button>`;
  }

  function renderFilters() {
    const allPill = { key: ALL_KEY, label: "הכל", count: flatImages.length };
    const lifePills = DATA.categories
      .filter((c) => LIFE_KEYS.includes(c.key))
      .map((c) => ({ key: c.key, label: c.label, count: c.images.length }));
    const afterPills = DATA.categories
      .filter((c) => !LIFE_KEYS.includes(c.key))
      .map((c) => ({ key: c.key, label: c.label, count: c.images.length }));

    filtersEl.innerHTML = `
      <div class="flex flex-wrap justify-center gap-2.5">
        ${[allPill].concat(lifePills).map(pillHtml).join("")}
      </div>
      <div class="flex flex-wrap justify-center gap-2.5">
        ${afterPills.map(pillHtml).join("")}
      </div>`;
  }

  function galleryItemHtml(img, index) {
    const categoryTag =
      activeKey === ALL_KEY
        ? `<span class="block pt-3 pb-0.5 text-[11px] font-label tracking-[0.08em] text-secondary/75 truncate">${img.categoryLabel}</span>`
        : "";
    // aspect-ratio (from the real pixel dimensions gallery-data.js records
    // per photo) reserves the frame's true height up front, so the layout
    // pass below can measure accurate heights before any image has loaded.
    const ratio = img.w && img.h ? `${img.w} / ${img.h}` : "3 / 4";
    return `
      <div class="masonry-item">
        <button data-index="${index}" class="gallery-thumb group relative block w-full">
          <span class="photo-frame block">
            <span class="photo-frame-inner bg-surface-container-highest block" style="aspect-ratio: ${ratio};">
              <img alt="${img.alt}" loading="lazy" class="w-full h-full object-cover" src="${img.thumb}"/>
            </span>
          </span>
          ${categoryTag}
        </button>
      </div>`;
  }

  // ---------------------------------------------------------------------
  // Masonry layout — real "shortest column first" packing (how Pinterest
  // actually lays photos out), not CSS multi-column's height-balancing
  // heuristic, which estimates column heights before photos have loaded
  // and doesn't reliably re-balance once they have. Each photo's true
  // height is known immediately (from `aspect-ratio` above, itself from
  // the real pixel dimensions in gallery-data.js), so every item can be
  // measured and placed in one pass with no layout shift and no risk of
  // photos piling into one column while another sits empty.
  // ---------------------------------------------------------------------

  const GRID_GAP_X = 20; // px, matches the 1.25rem gap columns used to have
  const GRID_GAP_Y = 28; // px, matches the 1.75rem margin-bottom items used to have
  const LAYOUT_DEBOUNCE_MS = 150;

  function columnsForWidth(width) {
    if (width >= 1024) return 4;
    if (width >= 768) return 3;
    return 2;
  }

  function layoutMasonry() {
    const items = Array.from(gridEl.querySelectorAll(".masonry-item"));
    if (!items.length) {
      gridEl.style.height = "0px";
      return;
    }

    // Always use the viewport's normal column count, even when a category
    // has fewer photos than that — a single photo should sit at one normal
    // column's width, not stretch across every column just because the
    // others have nothing to place in them.
    const containerWidth = gridEl.clientWidth;
    const columns = columnsForWidth(window.innerWidth);
    const colWidth = (containerWidth - GRID_GAP_X * (columns - 1)) / columns;

    // Pass 1: give every item its column width and measure its real
    // rendered height (frame padding + aspect-ratio photo + category tag,
    // whatever the current CSS says) — no manual duplication of those
    // numbers here.
    items.forEach((item) => {
      item.style.position = "static";
      item.style.width = `${colWidth}px`;
    });
    const heights = items.map((item) => item.getBoundingClientRect().height);

    // Pass 2: shortest-column-first placement, RTL — column 0 sits at the
    // visual right edge, matching how this grid always read before.
    const columnHeights = new Array(columns).fill(0);
    items.forEach((item, i) => {
      let col = 0;
      for (let c = 1; c < columns; c++) {
        if (columnHeights[c] < columnHeights[col]) col = c;
      }
      item.style.position = "absolute";
      item.style.top = `${columnHeights[col]}px`;
      item.style.right = `${col * (colWidth + GRID_GAP_X)}px`;
      columnHeights[col] += heights[i] + GRID_GAP_Y;
    });

    gridEl.style.height = `${Math.max(...columnHeights) - GRID_GAP_Y}px`;
  }

  let layoutResizeTimer = null;
  window.addEventListener("resize", () => {
    clearTimeout(layoutResizeTimer);
    layoutResizeTimer = setTimeout(layoutMasonry, LAYOUT_DEBOUNCE_MS);
  });

  function renderGrid() {
    visibleImages = activeKey === ALL_KEY ? flatImages : flatImages.filter((img) => img.categoryKey === activeKey);

    countEl.textContent = `${visibleImages.length} תמונות`;

    if (visibleImages.length === 0) {
      gridEl.innerHTML = "";
      gridEl.style.height = "0px";
      emptyEl.classList.remove("hidden");
      return;
    }
    emptyEl.classList.add("hidden");

    gridEl.innerHTML = visibleImages.map(galleryItemHtml).join("");

    gridEl.querySelectorAll(".gallery-thumb").forEach((btn) => {
      btn.addEventListener("click", () => openLightbox(Number(btn.dataset.index)));
      const imgEl = btn.querySelector("img");
      if (imgEl.complete) {
        imgEl.classList.add("loaded");
      } else {
        imgEl.addEventListener("load", () => imgEl.classList.add("loaded"));
      }
    });

    layoutMasonry();
  }

  function renderAll() {
    renderFilters();
    renderGrid();
  }

  filtersEl.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-key]");
    if (!btn || btn.dataset.key === activeKey) return;
    activeKey = btn.dataset.key;
    renderFilters();
    gridEl.style.opacity = "0";
    setTimeout(() => {
      renderGrid();
      gridEl.style.opacity = "1";
    }, FILTER_SWITCH_TRANSITION_MS);

    // Jump back to the start of the results so a new category never
    // leaves the visitor stranded mid-scroll in an unrelated spot.
    // (Measured off the grid section, not the sticky filter bar — a
    // sticky element's own rect reports its stuck viewport position,
    // not its true document offset, once it's actually stuck.)
    // Nav height is read live (site.js keeps --nav-h in sync) rather than
    // assumed, since the nav wraps to two lines on narrow screens.
    const navHeight = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--nav-h")) || 64;
    const filterSection = filtersEl.closest("section");
    const gridSection = gridEl.closest("section");
    const offset = navHeight + filterSection.offsetHeight;
    const targetY = gridSection.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top: Math.max(targetY, 0), behavior: "smooth" });
  });

  // -----------------------------------------------------------------------
  // Lightbox
  // -----------------------------------------------------------------------

  const lightboxEl = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightbox-img");
  const lightboxLabel = document.getElementById("lightbox-label");
  const lightboxCounter = document.getElementById("lightbox-counter");
  const lightboxSpinner = document.getElementById("lightbox-spinner");

  function openLightbox(index) {
    lightboxIndex = index;
    updateLightbox();
    lightboxEl.classList.remove("hidden");
    lightboxEl.classList.add("flex");
    requestAnimationFrame(() => lightboxEl.classList.add("lightbox-open"));
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    lightboxEl.classList.remove("lightbox-open");
    document.body.style.overflow = "";
    setTimeout(() => {
      lightboxEl.classList.add("hidden");
      lightboxEl.classList.remove("flex");
    }, LIGHTBOX_CLOSE_TRANSITION_MS);
  }

  function updateLightbox() {
    const img = visibleImages[lightboxIndex];
    if (!img) return;
    lightboxImg.style.opacity = "0";
    lightboxImg.style.transform = "scale(0.97)";
    const swap = () => {
      lightboxImg.src = img.full;
      lightboxImg.alt = img.alt;
      lightboxLabel.textContent = img.categoryLabel;
      lightboxCounter.textContent = `${lightboxIndex + 1} / ${visibleImages.length}`;
      lightboxSpinner.classList.remove("hidden");
      lightboxSpinner.classList.add("flex");
    };
    const reveal = () => {
      lightboxImg.style.opacity = "1";
      lightboxImg.style.transform = "scale(1)";
      lightboxSpinner.classList.add("hidden");
      lightboxSpinner.classList.remove("flex");
    };
    if (lightboxImg.src) {
      setTimeout(() => {
        swap();
        lightboxImg.onload = reveal;
      }, LIGHTBOX_SWAP_DELAY_MS);
    } else {
      swap();
      lightboxImg.onload = reveal;
    }
  }

  function showPrev() {
    lightboxIndex = (lightboxIndex - 1 + visibleImages.length) % visibleImages.length;
    updateLightbox();
  }
  function showNext() {
    lightboxIndex = (lightboxIndex + 1) % visibleImages.length;
    updateLightbox();
  }

  document.getElementById("lightbox-close").addEventListener("click", closeLightbox);
  document.getElementById("lightbox-prev").addEventListener("click", showPrev);
  document.getElementById("lightbox-next").addEventListener("click", showNext);
  lightboxEl.addEventListener("click", (e) => {
    // Close on any click that isn't on the photo itself or a control button —
    // not just clicks that land exactly on the outer backdrop. The image sits
    // inside a padded wrapper div that visually reads as "around the photo"
    // but isn't the lightboxEl itself, so a strict e.target === lightboxEl
    // check misses clicks in that space (side padding, gap above/below, the
    // counter/label text area).
    if (e.target.closest("#lightbox-img, button")) return;
    closeLightbox();
  });
  document.addEventListener("keydown", (e) => {
    if (lightboxEl.classList.contains("hidden")) return;
    if (e.key === "Escape") closeLightbox();
    // RTL gallery: right arrow = previous, left arrow = next.
    if (e.key === "ArrowRight") showPrev();
    if (e.key === "ArrowLeft") showNext();
  });

  // Swipe to navigate on touch devices. RTL gallery: same mapping as the
  // arrow keys above — drag toward screen-right = previous, toward left = next.
  let touchStartX = null;
  lightboxEl.addEventListener(
    "touchstart",
    (e) => {
      touchStartX = e.changedTouches[0].clientX;
    },
    { passive: true }
  );
  lightboxEl.addEventListener(
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

  renderAll();
})();
