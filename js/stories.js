// Stories page: quote grid + full-letter reader drawn from LETTERS_DATA.
// Reader supports prev/next, keyboard arrows and swipe, same as letters.js,
// so visitors can browse every story without returning to the grid each time.
(function () {
  "use strict";

  var READER_SWAP_DELAY_MS = 120;
  var READER_CLOSE_TRANSITION_MS = 280;
  var SWIPE_THRESHOLD_PX = 40;

  var stories = (window.STORIES_DATA && window.STORIES_DATA.stories) || [];
  var letters = (window.LETTERS_DATA && window.LETTERS_DATA.letters) || [];

  var readerIndex = 0;

  var listEl = document.getElementById("stories-list");
  var countEl = document.getElementById("stories-count");
  var readerEl = document.getElementById("story-reader");
  var readerCard = document.getElementById("story-reader-card");
  var readerScroll = document.getElementById("story-reader-scroll");
  var readerTitle = document.getElementById("story-reader-title");
  var readerMeta = document.getElementById("story-reader-meta");
  var readerBody = document.getElementById("story-reader-body");
  var readerCounter = document.getElementById("story-reader-counter");
  var readerPrev = document.getElementById("story-reader-prev");
  var readerNext = document.getElementById("story-reader-next");
  var readerClose = document.getElementById("story-reader-close");

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str == null ? "" : String(str);
    return div.innerHTML;
  }

  function findLetter(id) {
    for (var i = 0; i < letters.length; i++) {
      if (letters[i].id === id) return letters[i];
    }
    return null;
  }

  function displayFrom(story, letter) {
    if (letter && window.letterDisplayFrom) return window.letterDisplayFrom(letter);
    return story.from || (letter && letter.from) || "";
  }

  function cardHtml(story, index) {
    var letter = findLetter(story.letterId);
    var fromText = displayFrom(story, letter);
    return (
      '<button type="button" class="story-card" data-index="' +
      index +
      '" aria-label="פתחו את המכתב המלא של ' +
      escapeHtml(fromText) +
      '">' +
      '<p class="story-quote">' +
      escapeHtml(story.quote) +
      "</p>" +
      '<p class="story-from">- ' +
      escapeHtml(fromText) +
      "</p>" +
      '<span class="inline-flex items-center gap-1 text-accent-gold text-xs font-bold mt-auto pt-4">' +
      "למכתב המלא" +
      '<span class="material-symbols-outlined text-sm not-italic">arrow_back</span>' +
      "</span>" +
      "</button>"
    );
  }

  function renderList() {
    if (!listEl) return;
    if (countEl) {
      countEl.textContent = stories.length + " סיפורים מתוך המכתבים";
    }
    listEl.innerHTML = stories.map(cardHtml).join("");
    listEl.querySelectorAll("[data-index]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        openReader(Number(btn.getAttribute("data-index")));
      });
    });
  }

  function updateReader() {
    var story = stories[readerIndex];
    if (!story) return;
    var letter = findLetter(story.letterId);
    if (!letter) return;

    readerCard.classList.remove("reader-card-visible");
    setTimeout(function () {
      readerTitle.textContent = window.letterDisplayTitle
        ? window.letterDisplayTitle(letter)
        : letter.title || "";
      var metaParts = [];
      var fromText = displayFrom(story, letter);
      if (fromText) metaParts.push("מאת " + fromText);
      if (letter.to) metaParts.push("אל " + letter.to);
      var dateText = window.letterDisplayDate ? window.letterDisplayDate(letter) : letter.dateLabel;
      if (dateText) metaParts.push(dateText);
      readerMeta.textContent = metaParts.join(" · ");
      readerBody.innerHTML = (letter.body || "")
        .split(/\n\n+/)
        .map(function (p) {
          return '<p class="mb-4 last:mb-0">' + escapeHtml(p) + "</p>";
        })
        .join("");
      if (readerCounter) readerCounter.textContent = (readerIndex + 1) + " / " + stories.length;
      if (readerScroll) readerScroll.scrollTop = 0;
      else readerCard.scrollTop = 0;
      readerCard.classList.add("reader-card-visible");
    }, READER_SWAP_DELAY_MS);

    try {
      history.replaceState(null, "", "#letter-" + story.letterId);
    } catch (e) {}
  }

  function openReader(index) {
    readerIndex = index;
    readerEl.classList.remove("hidden");
    readerEl.classList.add("flex");
    requestAnimationFrame(function () {
      readerEl.classList.add("reader-open");
    });
    document.body.style.overflow = "hidden";
    updateReader();
  }

  function closeReader() {
    readerEl.classList.remove("reader-open");
    document.body.style.overflow = "";
    setTimeout(function () {
      readerEl.classList.add("hidden");
      readerEl.classList.remove("flex");
    }, READER_CLOSE_TRANSITION_MS);
    try {
      history.replaceState(null, "", window.location.pathname + window.location.search);
    } catch (e) {}
  }

  function showPrev() {
    readerIndex = (readerIndex - 1 + stories.length) % stories.length;
    updateReader();
  }
  function showNext() {
    readerIndex = (readerIndex + 1) % stories.length;
    updateReader();
  }

  if (readerPrev) readerPrev.addEventListener("click", showPrev);
  if (readerNext) readerNext.addEventListener("click", showNext);
  if (readerClose) readerClose.addEventListener("click", closeReader);
  if (readerEl) {
    readerEl.addEventListener("click", function (e) {
      if (e.target === readerEl) closeReader();
    });
  }
  document.addEventListener("keydown", function (e) {
    if (!readerEl || readerEl.classList.contains("hidden")) return;
    if (e.key === "Escape") closeReader();
    if (e.key === "ArrowRight") showPrev();
    if (e.key === "ArrowLeft") showNext();
  });

  var touchStartX = null;
  if (readerEl) {
    readerEl.addEventListener(
      "touchstart",
      function (e) {
        touchStartX = e.changedTouches[0].clientX;
      },
      { passive: true }
    );
    readerEl.addEventListener(
      "touchend",
      function (e) {
        if (touchStartX === null) return;
        var dx = e.changedTouches[0].clientX - touchStartX;
        touchStartX = null;
        if (Math.abs(dx) < SWIPE_THRESHOLD_PX) return;
        if (dx > 0) showPrev();
        else showNext();
      },
      { passive: true }
    );
  }

  renderList();

  // Deep-link: #letter-<id> opens that story on load
  var hash = window.location.hash || "";
  var m = hash.match(/^#letter-(.+)$/);
  if (m) {
    var targetId = m[1];
    for (var i = 0; i < stories.length; i++) {
      if (stories[i].letterId === targetId) {
        openReader(i);
        break;
      }
    }
  }
})();
