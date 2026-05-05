(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const isMac = /Mac|iPhone|iPad/i.test(navigator.platform || navigator.userAgent);

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

  const SUN_SVG = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>';
  const MOON_SVG = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';

  function initThemeToggle() {
    const navLinks = document.querySelector(".nav-links");
    if (!navLinks || navLinks.querySelector(".theme-toggle")) return;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "theme-toggle";
    btn.setAttribute("aria-label", "Toggle theme");

    const render = () => {
      const isDark = document.documentElement.getAttribute("data-theme") === "dark";
      btn.innerHTML = isDark ? SUN_SVG : MOON_SVG;
      btn.title = isDark ? "Switch to light mode" : "Switch to dark mode";
    };

    btn.addEventListener("click", () => {
      const isDark = document.documentElement.getAttribute("data-theme") === "dark";
      const next = isDark ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      try { localStorage.setItem("theme", next); } catch (e) {}
      render();
    });

    render();
    navLinks.insertBefore(btn, navLinks.firstChild);
  }

  function initKbdHints() {
    if (isMac) return;
    document.querySelectorAll(".kbd-hint kbd").forEach((el) => {
      if (el.textContent.trim() === "⌘") el.textContent = "Ctrl";
    });
  }

  function initSubmitShortcut() {
    document.addEventListener("keydown", (e) => {
      const meta = isMac ? e.metaKey : e.ctrlKey;
      if (!meta || e.key !== "Enter") return;
      const form = e.target.closest && e.target.closest("form");
      if (!form) return;
      const submit = form.querySelector('button[type="submit"]');
      if (!submit || submit.disabled) return;
      e.preventDefault();
      submit.click();
    });
  }

  function initLastUpdated() {
    const footer = document.querySelector("footer");
    if (!footer) return;
    fetch("https://api.github.com/repos/matthew6645/ai-pm-toolkit-/commits/main")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data || !data.commit) return;
        const date = new Date(data.commit.author.date);
        if (isNaN(date)) return;
        const formatted = date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
        const span = document.createElement("span");
        span.className = "last-updated";
        span.textContent = "· Last updated " + formatted;
        footer.appendChild(span);
      })
      .catch(() => {});
  }

  // Public helper used by tool scripts for copy-button feedback.
  window.flashCopied = function (button, originalText) {
    if (!button) return;
    const orig = originalText != null ? originalText : button.textContent;
    button.classList.add("copied");
    button.innerHTML = "&#10003; Copied";
    setTimeout(() => {
      button.classList.remove("copied");
      button.textContent = orig;
    }, 1800);
  };

  function initAll() {
    initActiveNav();
    initThemeToggle();
    initKbdHints();
    initSubmitShortcut();
    initLastUpdated();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAll);
  } else {
    initAll();
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
