(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  document.addEventListener("pointerdown", (event) => {
    if (reduceMotion.matches) return;
    const btn = event.target.closest(".btn");
    if (!btn || btn.disabled) return;

    const rect = btn.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    btn.style.setProperty("--btn-x", `${x}px`);
    btn.style.setProperty("--btn-y", `${y}px`);

    btn.classList.remove("is-rippling");
    void btn.offsetWidth;
    btn.classList.add("is-rippling");
  });

  document.addEventListener(
    "animationend",
    (event) => {
      if (event.animationName === "btn-ripple") {
        event.target.classList.remove("is-rippling");
      }
    },
    true
  );
})();
