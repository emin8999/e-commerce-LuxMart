(function () {
  "use strict";

  // === Конфиг ===
  const LINKS = [
    { key: "stores", title: "Stores", href: "./allStores.html" },
    { key: "users", title: "Users", href: "./users.html" },
    { key: "rates", title: "Exchange Rates", href: "./admin.html" },
    { key: "shipping", title: "Shipping", href: "./admin.html#shipping" },
    { key: "analytics", title: "Analytics", href: "./admin.html#analytics" },
    { key: "translations", title: "Translations", href: "./translation.html" },
  ];
  const TOKEN_KEYS = ["storeJwt", "adminJwt"];

  function detectActiveKey() {
    const path = (location.pathname || "").toLowerCase();
    const hash = (location.hash || "").toLowerCase();
    if (path.endsWith("/allstores.html") || path.endsWith("allstores.html"))
      return "stores";
    if (path.endsWith("/users.html") || path.endsWith("users.html"))
      return "users";
    if (path.endsWith("/translation.html") || path.endsWith("translation.html"))
      return "translations";
    if (path.endsWith("/admin.html") || path.endsWith("admin.html")) {
      if (hash.includes("shipping")) return "shipping";
      if (hash.includes("analytics")) return "analytics";
      return "rates";
    }
    return "";
  }

  function renderHeader(container, activeKey) {
    const nav = LINKS.map((link) => {
      const isActive = activeKey && activeKey === link.key;
      return `<a href="${link.href}" data-key="${link.key}" class="${
        isActive ? "active" : ""
      }">${link.title}</a>`;
    }).join("");

    container.innerHTML = `
      <header class="dashboard-header" data-mobile="false" aria-label="Admin header">
        <div class="container header__inner">
          <button id="adminBurger"
                  class="burger"
                  aria-label="Open navigation"
                  aria-controls="adminNav"
                  aria-expanded="false">
            <span></span><span></span><span></span>
          </button>

          <h1>Dashboard — Admin</h1>

          <nav id="adminNav" class="admin-nav" role="navigation">
            ${nav}
            <a href="javascript:void(0)" id="adminLogoutBtn" class="logout">Logout</a>
          </nav>
        </div>
      </header>
      <div id="adminNavOverlay" class="admin-nav__overlay" hidden></div>
    `;

    // logout (call API then redirect to adminLogin.html)
    async function adminApiLogout() {
      const url = "http://116.203.51.133/luxmart/api/admin/logout";
      const token =
        localStorage.getItem("adminJWT") ||
        localStorage.getItem("adminJwt") ||
        localStorage.getItem("storeJwt");
      try {
        await fetch(url, {
          method: "POST",
          mode: "cors",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: "omit",
        }).catch(() => {});
      } catch (_) {
        // ignore network errors; proceed to local cleanup
      }
    }

    async function handleAdminLogout() {
      if (!confirm("Log out from Admin?")) return;
      await adminApiLogout();
      // clear possible tokens
      ["adminJWT", "adminJwt", "storeJwt"].forEach((k) =>
        localStorage.removeItem(k)
      );
      try {
        history.replaceState(null, "", "./adminLogin.html");
      } catch (_) {}
      window.location.replace("./adminLogin.html");
    }

    // expose globally so other modules can reuse
    window.AdminAuth = Object.assign(window.AdminAuth || {}, {
      logout: handleAdminLogout,
    });

    container
      .querySelector("#adminLogoutBtn")
      ?.addEventListener("click", (e) => {
        e.preventDefault();
        handleAdminLogout();
      });

    // подсветка по hash для admin.html
    window.addEventListener("hashchange", () => {
      const newActive = detectActiveKey();
      highlight(container, newActive);
    });

    // бургер-меню
    const burger = container.querySelector("#adminBurger");
    const navEl = container.querySelector("#adminNav");
    const overlay = container.querySelector("#adminNavOverlay");
    const header = container.querySelector(".dashboard-header");

    function openMenu() {
      header.classList.add("nav-open");
      burger.setAttribute("aria-expanded", "true");
      overlay.hidden = false;
      document.documentElement.classList.add("nav-lock");
    }
    function closeMenu() {
      header.classList.remove("nav-open");
      burger.setAttribute("aria-expanded", "false");
      overlay.hidden = true;
      document.documentElement.classList.remove("nav-lock");
    }
    function toggleMenu() {
      if (header.classList.contains("nav-open")) closeMenu();
      else openMenu();
    }

    burger?.addEventListener("click", toggleMenu);
    overlay?.addEventListener("click", closeMenu);
    // закрытие по Esc
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeMenu();
    });
    // закрыть меню при клике по ссылке
    navEl?.addEventListener("click", (e) => {
      const a = e.target.closest("a");
      if (!a) return;
      if (window.matchMedia("(max-width: 600px)").matches) closeMenu();
    });
    // сброс при ресайзе > 600px
    window.addEventListener("resize", () => {
      if (!window.matchMedia("(max-width: 600px)").matches) closeMenu();
    });
  }

  function highlight(container, activeKey) {
    const links = Array.from(container.querySelectorAll("nav a[data-key]"));
    links.forEach((a) => a.classList.remove("active"));
    const link = links.find((a) => (a.dataset.key || "") === activeKey);
    if (link) link.classList.add("active");
  }

  document.addEventListener("DOMContentLoaded", () => {
    const host = document.getElementById("app-header");
    if (!host) return;
    let activeKey = (host.getAttribute("data-active") || "")
      .trim()
      .toLowerCase();
    if (!activeKey) activeKey = detectActiveKey();
    renderHeader(host, activeKey);
  });

  window.AdminHeader = {
    mount(targetSelector = "#app-header", activeKey = "") {
      const host = document.querySelector(targetSelector);
      if (!host) return;
      if (!activeKey) activeKey = detectActiveKey();
      renderHeader(host, activeKey);
    },
    setActive(activeKey) {
      const host = document.querySelector("#app-header");
      if (!host) return;
      highlight(host, activeKey);
    },
  };
})();
