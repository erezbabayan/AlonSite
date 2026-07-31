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
  // Height of the sticky top nav bar (`top-16` in gallery.html) that the
  // filter bar sticks below — used to compute the true scroll target.
  const STICKY_NAV_HEIGHT_PX = 64;
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
    return `
      <div class="masonry-item">
        <button data-index="${index}" class="gallery-thumb group relative block w-full">
          <span class="photo-frame block">
            <span class="photo-frame-inner bg-surface-container-highest">
              <img alt="${img.alt}" loading="lazy" class="w-full h-auto object-cover" src="${img.thumb}"/>
            </span>
          </span>
          ${categoryTag}
        </button>
      </div>`;
  }

  function renderGrid() {
    visibleImages = activeKey === ALL_KEY ? flatImages : flatImages.filter((img) => img.categoryKey === activeKey);

    countEl.textContent = `${visibleImages.length} תמונות`;

    if (visibleImages.length === 0) {
      gridEl.innerHTML = "";
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
    const filterSection = filtersEl.closest("section");
    const gridSection = gridEl.closest("section");
    const offset = STICKY_NAV_HEIGHT_PX + filterSection.offsetHeight;
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
    if (e.target === lightboxEl) closeLightbox();
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
