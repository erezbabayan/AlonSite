(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", () => {
    const modal = document.getElementById("legacy-modal");
    if (!modal) return;

    const imgEl = document.getElementById("legacy-modal-img");
    const imgEl2 = document.getElementById("legacy-modal-img-2");
    const textEl = document.getElementById("legacy-modal-text");
    const titleEl = document.getElementById("legacy-modal-title");
    const descEl = document.getElementById("legacy-modal-desc");
    const closeBtn = document.getElementById("legacy-modal-close");

    function openModal(trigger) {
      const full = trigger.getAttribute("data-full");
      const full2 = trigger.getAttribute("data-full-2") || "";
      const title = trigger.getAttribute("data-title") || "";
      const desc = trigger.getAttribute("data-desc") || "";

      imgEl.src = full;
      imgEl.alt = title;
      if (imgEl2) {
        if (full2) {
          imgEl2.src = full2;
          imgEl2.alt = title;
          imgEl2.classList.remove("hidden");
        } else {
          imgEl2.src = "";
          imgEl2.classList.add("hidden");
        }
      }
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
      if (imgEl2) {
        imgEl2.src = "";
        imgEl2.classList.add("hidden");
      }
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

    closeBtn.addEventListener("click", closeModal);
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !modal.classList.contains("hidden")) closeModal();
    });
  });
})();
