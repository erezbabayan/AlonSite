// Stories page: quote list + full-letter reader drawn from LETTERS_DATA.
(function () {
  "use strict";

  var READER_SWAP_DELAY_MS = 120;
  var READER_CLOSE_TRANSITION_MS = 280;

  var stories = (window.STORIES_DATA && window.STORIES_DATA.stories) || [];
  var letters = (window.LETTERS_DATA && window.LETTERS_DATA.letters) || [];

  var listEl = document.getElementById("stories-list");
  var countEl = document.getElementById("stories-count");
  var readerEl = document.getElementById("story-reader");
  var readerCard = document.getElementById("story-reader-card");
  var readerTitle = document.getElementById("story-reader-title");
  var readerMeta = document.getElementById("story-reader-meta");
  var readerBody = document.getElementById("story-reader-body");
  var readerBack = document.getElementById("story-reader-back");
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

  function cardHtml(story, index) {
    return (
      '<button type="button" class="story-card" data-index="' +
      index +
      '" aria-label="פתחו את המכתב המלא של ' +
      escapeHtml(story.from) +
      '">' +
      '<p class="story-quote">' +
      escapeHtml(story.quote) +
      "</p>" +
      '<p class="story-from">— ' +
      escapeHtml(story.from) +
      "</p>" +
      '<span class="inline-flex items-center gap-1 text-accent-gold text-xs font-bold mt-4">' +
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
        openLetter(Number(btn.getAttribute("data-index")));
      });
    });
  }

  function openLetter(index) {
    var story = stories[index];
    if (!story) return;
    var letter = findLetter(story.letterId);
    if (!letter) return;

    readerEl.classList.remove("hidden");
    readerEl.classList.add("flex");
    requestAnimationFrame(function () {
      readerEl.classList.add("reader-open");
    });
    document.body.style.overflow = "hidden";

    readerCard.classList.remove("reader-card-visible");
    setTimeout(function () {
      readerTitle.textContent = letter.title || "";
      var metaParts = [];
      if (letter.from) metaParts.push("מאת " + letter.from);
      if (letter.to) metaParts.push("אל " + letter.to);
      if (letter.dateLabel) metaParts.push(letter.dateLabel);
      readerMeta.textContent = metaParts.join(" · ");
      readerBody.innerHTML = (letter.body || "")
        .split(/\n\n+/)
        .map(function (p) {
          return '<p class="mb-4 last:mb-0">' + escapeHtml(p) + "</p>";
        })
        .join("");
      readerCard.scrollTop = 0;
      readerCard.classList.add("reader-card-visible");
    }, READER_SWAP_DELAY_MS);

    try {
      history.replaceState(null, "", "#letter-" + story.letterId);
    } catch (e) {}
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

  if (readerBack) readerBack.addEventListener("click", closeReader);
  if (readerClose) readerClose.addEventListener("click", closeReader);
  if (readerEl) {
    readerEl.addEventListener("click", function (e) {
      if (e.target === readerEl) closeReader();
    });
  }
  document.addEventListener("keydown", function (e) {
    if (!readerEl || readerEl.classList.contains("hidden")) return;
    if (e.key === "Escape") closeReader();
  });

  renderList();

  // Deep-link: #letter-<id> opens that letter on load
  var hash = window.location.hash || "";
  var m = hash.match(/^#letter-(.+)$/);
  if (m) {
    var targetId = m[1];
    for (var i = 0; i < stories.length; i++) {
      if (stories[i].letterId === targetId) {
        openLetter(i);
        break;
      }
    }
  }
})();
