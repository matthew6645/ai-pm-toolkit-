(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  function initActiveNav() {
    const raw = (window.location.pathname.split("/").pop() || "index").toLowerCase();
    const pathBase = raw.replace(/\.html$/, "") || "index";
    document.querySelectorAll(".nav-links a").forEach((link) => {
      const href = (link.getAttribute("href") || "").toLowerCase();
      if (href.startsWith("http") || href.startsWith("//") || href.startsWith("mailto:")) return;
      const hrefBase = href.replace(/\.html$/, "");
      const isExact = hrefBase === pathBase;
      const isGuideSection = hrefBase === "guides" && pathBase.startsWith("guide-");
      if (isExact || isGuideSection) link.classList.add("active");
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initActiveNav);
  } else {
    initActiveNav();
  }

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
