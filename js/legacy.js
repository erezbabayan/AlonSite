(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", () => {
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
      if (e.target === modal) closeModal();
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
