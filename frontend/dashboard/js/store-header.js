(function () {
  "use strict";

  // === Конфиг ссылок ===
  const LINKS = [
    { key: "products", title: "Products", href: "./index.html#products" },
    { key: "discounts", title: "Discounts", href: "./index.html#discounts" },
    { key: "coupons", title: "Coupons", href: "./index.html#coupons" },
    { key: "store", title: "Store Dashboard", href: "./store.html" },
  ];

  // Токены, которые чистим при выходе
  const TOKEN_KEYS = ["storeJwt"];

  // Определяем активный пункт по текущему URL
  function detectActiveKey() {
    const path = (location.pathname || "").toLowerCase();
    const hash = (location.hash || "").toLowerCase();

    if (path.endsWith("/store.html") || path.endsWith("store.html"))
      return "store";
    if (
      path.endsWith("/index.html") ||
      path.endsWith("index.html") ||
      path.endsWith("/")
    ) {
      if (hash.includes("products")) return "products";
      if (hash.includes("discounts")) return "discounts";
      if (hash.includes("coupons")) return "coupons";
      return "products"; // дефолт
    }
    return "";
  }

  // Рендер шапки
  function renderHeader(container, activeKey) {
    const navHtml = LINKS.map((link) => {
      const isActive = activeKey && activeKey === link.key;
      return `<a href="${link.href}" data-key="${link.key}" class="${
        isActive ? "active" : ""
      }">${link.title}</a>`;
    }).join("");

    container.innerHTML = `
      <header class="dashboard-header" aria-label="Store header">
        <div class="container header__inner">
          <button id="storeBurger"
                  class="burger"
                  aria-label="Open navigation"
                  aria-controls="storeNav"
                  aria-expanded="false">
            <span></span><span></span><span></span>
          </button>

          <h1>Dashboard — Store Owner</h1>

          <nav id="storeNav" class="admin-nav" role="navigation">
            ${navHtml}
            <a href="javascript:void(0)" id="storeLogoutBtn" class="logout btn" style="margin-left:12px">Logout</a>
          </nav>
        </div>
      </header>
      <div id="storeNavOverlay" class="admin-nav__overlay" hidden></div>
    `;

    // Logout
    container
      .querySelector("#storeLogoutBtn")
      ?.addEventListener("click", () => {
        if (!confirm("Log out from Store Dashboard?")) return;
        TOKEN_KEYS.forEach((k) => localStorage.removeItem(k));
        location.reload();
      });

    // Подсветка при смене hash на index.html
    window.addEventListener("hashchange", () => {
      const newActive = detectActiveKey();
      highlight(container, newActive);
    });

    // Бургер-меню
    const burger = container.querySelector("#storeBurger");
    const overlay = container.querySelector("#storeNavOverlay");
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
    window.addEventListener(
      "keydown",
      (e) => e.key === "Escape" && closeMenu()
    );
    // Закрывать меню при клике по ссылке на мобиле
    container.querySelector("#storeNav")?.addEventListener("click", (e) => {
      const a = e.target.closest("a");
      if (!a) return;
      if (window.matchMedia("(max-width: 600px)").matches) closeMenu();
    });
    // Сброс при ресайзе
    window.addEventListener("resize", () => {
      if (!window.matchMedia("(max-width: 600px)").matches) closeMenu();
    });
  }

  // Подсветка активного пункта
  function highlight(container, activeKey) {
    const links = Array.from(container.querySelectorAll("nav a[data-key]"));
    links.forEach((a) => a.classList.remove("active"));
    const link = links.find((a) => (a.dataset.key || "") === activeKey);
    if (link) link.classList.add("active");
  }

  // Автомонтирование
  document.addEventListener("DOMContentLoaded", () => {
    const host = document.getElementById("store-header");
    if (!host) return;

    let activeKey = (host.getAttribute("data-active") || "")
      .trim()
      .toLowerCase();
    if (!activeKey) activeKey = detectActiveKey();

    renderHeader(host, activeKey);
  });

  // Экспортируем методы (если вдруг понадобится вручную)
  window.StoreHeader = {
    mount(targetSelector = "#store-header", activeKey = "") {
      const host = document.querySelector(targetSelector);
      if (!host) return;
      if (!activeKey) activeKey = detectActiveKey();
      renderHeader(host, activeKey);
    },
    setActive(activeKey) {
      const host = document.querySelector("#store-header");
      if (!host) return;
      highlight(host, activeKey);
    },
  };
})();
