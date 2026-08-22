(function () {
  "use strict";

  // The memorial video plays inside a modal rather than sending visitors off
  // to YouTube. The iframe src is only set on open (and cleared on close) so
  // the embed never loads — or keeps playing — while the modal is closed.
  function initVideoModal() {
    const modal = document.getElementById("legacy-video-modal");
    const frame = document.getElementById("legacy-video-frame");
    if (!modal || !frame) return;

    const titleEl = document.getElementById("legacy-video-title");
    const descEl = document.getElementById("legacy-video-desc");
    const closeBtn = document.getElementById("legacy-video-close");

    function open(trigger) {
      const id = trigger.getAttribute("data-video-id");
      if (!id) return;

      frame.src =
        "https://www.youtube-nocookie.com/embed/" +
        encodeURIComponent(id) +
        "?autoplay=1&rel=0";
      titleEl.textContent = trigger.getAttribute("data-title") || "";
      descEl.textContent = trigger.getAttribute("data-desc") || "";

      modal.classList.remove("hidden");
      modal.classList.add("flex");
      document.body.style.overflow = "hidden";
    }

    function close() {
      modal.classList.add("hidden");
      modal.classList.remove("flex");
      document.body.style.overflow = "";
      frame.src = "";
    }

    document.querySelectorAll("[data-legacy-video-trigger]").forEach((trigger) => {
      trigger.addEventListener("click", () => open(trigger));
      trigger.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open(trigger);
        }
      });
    });

    closeBtn.addEventListener("click", close);
    modal.addEventListener("click", (e) => {
      if (e.target.closest("#legacy-video-frame, #legacy-video-close, #legacy-video-text")) return;
      close();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !modal.classList.contains("hidden")) close();
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    initVideoModal();

    const modal = document.getElementById("legacy-modal");
    if (!modal) return;

    const imgEl = document.getElementById("legacy-modal-img");
    const textEl = document.getElementById("legacy-modal-text");
    const titleEl = document.getElementById("legacy-modal-title");
    const descEl = document.getElementById("legacy-modal-desc");
    const closeBtn = document.getElementById("legacy-modal-close");
    const prevBtn = document.getElementById("legacy-modal-prev");
    const nextBtn = document.getElementById("legacy-modal-next");

    let images = [];
    let currentIndex = 0;
    let title = "";

    function showImage(index) {
      currentIndex = (index + images.length) % images.length;
      imgEl.src = images[currentIndex];
      imgEl.alt = title;
    }

    function openModal(trigger) {
      const full = trigger.getAttribute("data-full");
      const full2 = trigger.getAttribute("data-full-2") || "";
      title = trigger.getAttribute("data-title") || "";
      const desc = trigger.getAttribute("data-desc") || "";

      images = [full, full2].filter(Boolean);
      showImage(0);

      const hasMultiple = images.length > 1;
      prevBtn.classList.toggle("hidden", !hasMultiple);
      nextBtn.classList.toggle("hidden", !hasMultiple);

      titleEl.textContent = title;
      descEl.textContent = desc;
      textEl.classList.toggle("hidden", !title && !desc);

      modal.classList.remove("hidden");
      modal.classList.add("flex");
      document.body.style.overflow = "hidden";
    }

    function closeModal() {
      modal.classList.add("hidden");
      modal.classList.remove("flex");
      document.body.style.overflow = "";
      imgEl.src = "";
      images = [];
    }

    document.querySelectorAll("[data-legacy-modal-trigger]").forEach((trigger) => {
      trigger.addEventListener("click", () => openModal(trigger));
      trigger.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openModal(trigger);
        }
      });
    });

    prevBtn.addEventListener("click", () => showImage(currentIndex - 1));
    nextBtn.addEventListener("click", () => showImage(currentIndex + 1));

    closeBtn.addEventListener("click", closeModal);
    modal.addEventListener("click", (e) => {
      if (e.target.closest("#legacy-modal-img, #legacy-modal-prev, #legacy-modal-next, #legacy-modal-close, #legacy-modal-text")) return;
      closeModal();
    });
    document.addEventListener("keydown", (e) => {
      if (modal.classList.contains("hidden")) return;
      if (e.key === "Escape") closeModal();
      // RTL: right arrow = previous, left arrow = next.
      if (e.key === "ArrowRight") showImage(currentIndex - 1);
      if (e.key === "ArrowLeft") showImage(currentIndex + 1);
    });
  });
})();
