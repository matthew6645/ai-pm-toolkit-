(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const isMac = /Mac|iPhone|iPad/i.test(navigator.platform || navigator.userAgent);
  const META_LABEL = isMac ? "⌘" : "Ctrl";

  const SUN_SVG = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>';
  const MOON_SVG = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';

  // ── Shared theme helpers ──────────────────────────────
  function currentTheme() {
    return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
  }
  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    try { localStorage.setItem("theme", theme); } catch (e) {}
    const btn = document.querySelector(".theme-toggle");
    if (btn) {
      const dark = theme === "dark";
      btn.innerHTML = dark ? SUN_SVG : MOON_SVG;
      btn.title = dark ? "Switch to light mode" : "Switch to dark mode";
    }
  }
  function toggleTheme() {
    applyTheme(currentTheme() === "dark" ? "light" : "dark");
  }

  // ── Active nav highlight ──────────────────────────────
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

  function initThemeToggle() {
    const navLinks = document.querySelector(".nav-links");
    if (!navLinks || navLinks.querySelector(".theme-toggle")) return;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "theme-toggle";
    btn.setAttribute("aria-label", "Toggle theme");
    btn.addEventListener("click", toggleTheme);
    navLinks.insertBefore(btn, navLinks.firstChild);
    applyTheme(currentTheme());
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

  // ── Command palette (⌘K / Ctrl+K) ─────────────────────
  function isTypingTarget(el) {
    if (!el) return false;
    const tag = el.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
    if (el.isContentEditable) return true;
    return false;
  }

  function buildPaletteItems() {
    const pages = [
      { name: "Home", href: "index.html", icon: "🏠" },
      { name: "About", href: "about.html", icon: "👤" },
      { name: "Guides", href: "guides.html", icon: "📚" },
      { name: "Case Study", href: "case-study.html", icon: "📖" },
    ];
    const tools = [
      { name: "PRD Generator", href: "prd-generator.html", icon: "📄" },
      { name: "Feature Prioritization", href: "prioritization.html", icon: "⚖️" },
      { name: "Research Synthesizer", href: "research-synth.html", icon: "🔬" },
      { name: "Deck Builder", href: "deck-builder.html", icon: "🗂️" },
    ];
    const guides = [
      { name: "Latest Claude Releases", href: "guide-releases.html", icon: "🚀" },
      { name: "MCP Connectors for PMs", href: "guide-mcp-connectors.html", icon: "🔌" },
      { name: "Claude Tips for PMs", href: "guide-claude-tips.html", icon: "🧭" },
      { name: "Prompting Claude for Payments", href: "guide-payments-prompting.html", icon: "💳" },
      { name: "Claude for Incident Response", href: "guide-incident-response.html", icon: "🚨" },
      { name: "Claude for Regulatory & Compliance Docs", href: "guide-compliance-docs.html", icon: "📋" },
    ];
    const actions = [
      { name: "Toggle dark mode", icon: "🌓", action: toggleTheme },
      { name: "Show keyboard shortcuts", icon: "⌨️", action: () => window.openShortcutsOverlay && window.openShortcutsOverlay() },
      { name: "Open GitHub repo", href: "https://github.com/matthew6645/ai-pm-toolkit-", external: true, icon: "🐙" },
      { name: "Connect on LinkedIn", href: "https://www.linkedin.com/in/matthew-whytepm/", external: true, icon: "🔗" },
    ];
    const groups = [
      { label: "Pages", items: pages },
      { label: "Tools", items: tools },
      { label: "Guides", items: guides },
      { label: "Actions", items: actions },
    ];
    const flat = [];
    groups.forEach((g) => g.items.forEach((it) => flat.push({ ...it, group: g.label })));
    return { groups, flat };
  }

  function initCommandPalette() {
    const { flat } = buildPaletteItems();
    const backdrop = document.createElement("div");
    backdrop.className = "cmdk-backdrop";
    backdrop.innerHTML = `
      <div class="cmdk-panel" role="dialog" aria-label="Command palette">
        <input class="cmdk-input" type="text" placeholder="Search pages, tools, guides…" autocomplete="off" spellcheck="false" />
        <div class="cmdk-results" role="listbox"></div>
        <div class="cmdk-footer">
          <span><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
          <span><kbd>↵</kbd> select</span>
          <span><kbd>esc</kbd> close</span>
        </div>
      </div>`;
    document.body.appendChild(backdrop);

    const input = backdrop.querySelector(".cmdk-input");
    const results = backdrop.querySelector(".cmdk-results");
    let filtered = flat.slice();
    let selected = 0;

    function escapeHtml(s) {
      return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    }

    function render() {
      if (filtered.length === 0) {
        results.innerHTML = '<div class="cmdk-empty">No matches</div>';
        return;
      }
      let html = "";
      let lastGroup = "";
      filtered.forEach((item, i) => {
        if (item.group !== lastGroup) {
          html += `<div class="cmdk-section">${escapeHtml(item.group)}</div>`;
          lastGroup = item.group;
        }
        html += `<div class="cmdk-item${i === selected ? " selected" : ""}" data-index="${i}" role="option">
          <span class="cmdk-icon">${item.icon}</span>
          <span class="cmdk-name">${escapeHtml(item.name)}</span>
        </div>`;
      });
      results.innerHTML = html;
      const sel = results.querySelector(".cmdk-item.selected");
      if (sel) sel.scrollIntoView({ block: "nearest" });
    }

    function filter(q) {
      const lower = (q || "").trim().toLowerCase();
      filtered = lower ? flat.filter((i) => i.name.toLowerCase().includes(lower)) : flat.slice();
      selected = 0;
      render();
    }

    function execute(item) {
      close();
      if (item.action) { item.action(); return; }
      if (item.href) {
        if (item.external) window.open(item.href, "_blank", "noopener");
        else window.location.href = item.href;
      }
    }

    function open() {
      backdrop.classList.add("open");
      input.value = "";
      filtered = flat.slice();
      selected = 0;
      render();
      setTimeout(() => input.focus(), 20);
    }
    function close() { backdrop.classList.remove("open"); }
    function isOpen() { return backdrop.classList.contains("open"); }

    input.addEventListener("input", (e) => filter(e.target.value));
    input.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        selected = Math.min(selected + 1, filtered.length - 1);
        render();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        selected = Math.max(selected - 1, 0);
        render();
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filtered[selected]) execute(filtered[selected]);
      } else if (e.key === "Escape") {
        e.preventDefault();
        close();
      }
    });
    results.addEventListener("click", (e) => {
      const node = e.target.closest(".cmdk-item");
      if (!node) return;
      const i = parseInt(node.dataset.index, 10);
      if (filtered[i]) execute(filtered[i]);
    });
    backdrop.addEventListener("click", (e) => { if (e.target === backdrop) close(); });

    // Cmd/Ctrl + K to toggle
    document.addEventListener("keydown", (e) => {
      const meta = isMac ? e.metaKey : e.ctrlKey;
      if (meta && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        isOpen() ? close() : open();
      }
    });

    window.openCommandPalette = open;
  }

  // ── Keyboard shortcuts overlay (?) + T toggle ─────────
  function initShortcutsOverlay() {
    const overlay = document.createElement("div");
    overlay.className = "shortcuts-backdrop";
    overlay.innerHTML = `
      <div class="shortcuts-panel" role="dialog" aria-label="Keyboard shortcuts">
        <h3>Keyboard shortcuts</h3>
        <p class="shortcuts-sub">Press <kbd>esc</kbd> to close.</p>
        <div class="shortcut-row"><span>Open command palette</span><span class="keys"><kbd>${META_LABEL}</kbd><kbd>K</kbd></span></div>
        <div class="shortcut-row"><span>Submit form (in tools)</span><span class="keys"><kbd>${META_LABEL}</kbd><kbd>↵</kbd></span></div>
        <div class="shortcut-row"><span>Toggle dark mode</span><span class="keys"><kbd>T</kbd></span></div>
        <div class="shortcut-row"><span>Show this help</span><span class="keys"><kbd>?</kbd></span></div>
        <div class="shortcut-row"><span>Close any overlay</span><span class="keys"><kbd>esc</kbd></span></div>
      </div>`;
    document.body.appendChild(overlay);

    function open() { overlay.classList.add("open"); }
    function close() { overlay.classList.remove("open"); }
    function isOpen() { return overlay.classList.contains("open"); }

    overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });

    document.addEventListener("keydown", (e) => {
      // Esc closes whatever modal is open
      if (e.key === "Escape" && isOpen()) {
        e.preventDefault();
        close();
        return;
      }
      // Don't trigger non-meta shortcuts while typing
      if (isTypingTarget(e.target)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === "?" || (e.shiftKey && e.key === "/")) {
        e.preventDefault();
        isOpen() ? close() : open();
      } else if (e.key === "t" || e.key === "T") {
        e.preventDefault();
        toggleTheme();
      }
    });

    window.openShortcutsOverlay = open;
  }

  function initAll() {
    initActiveNav();
    initThemeToggle();
    initKbdHints();
    initSubmitShortcut();
    initLastUpdated();
    initCommandPalette();
    initShortcutsOverlay();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAll);
  } else {
    initAll();
  }

  // ── Button ripple effect ──────────────────────────────
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
