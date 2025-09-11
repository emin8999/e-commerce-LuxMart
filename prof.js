/* ==== header-burger.js ====
 * Не меняя HTML-файлы, аккуратно строим бургер:
 * - Находим #app-header
 * - Сохраняем ссылку на nav/меню/правый блок, клонируем внутрь offcanvas
 * - Вставляем кнопку-бургер и overlay
 * - Управляем классом body--menu-open
 */

(function () {
  const root = document.getElementById("app-header");
  if (!root) return;

  // Уже построенный хедер (header.js) чаще всего делает контейнер-обёртку
  const host = root.firstElementChild || root;

  // 1) Кнопка-бургер (влево)
  const burger = document.createElement("button");
  burger.className = "hdr-burger";
  burger.setAttribute("aria-label", "Open menu");
  burger.innerHTML = "<i></i>";
  // Слева: если у тебя логотип уже вставлен, кнопка станет правее/левее — оба варианта ок
  host.insertBefore(burger, host.firstChild);

  // 2) Overlay + Drawer
  const overlay = document.createElement("div");
  overlay.className = "hdr-overlay";
  document.body.appendChild(overlay);

  const drawer = document.createElement("aside");
  drawer.className = "hdr-drawer";
  drawer.innerHTML = `
    <div class="hdr-drawer__head">
      <div class="hdr-title">Menu</div>
      <button class="hdr-close" aria-label="Close">✕</button>
    </div>
    <div class="hdr-drawer__body" id="hdrDrawerBody"></div>
  `;
  document.body.appendChild(drawer);
  const drawerBody = drawer.querySelector("#hdrDrawerBody");

  // 3) Вытащим из хедера "навигацию" и "правую часть" (если есть) и клонируем
  // — селекторы максимально широкие, чтобы поймать твои варианты
  const maybeBlocks = [
    ...root.querySelectorAll(
      "nav, .nav, .menu, .header-right, .search, .user, .lang"
    ),
  ];

  if (maybeBlocks.length) {
    const section = document.createElement("div");
    section.className = "hdr-section";
    const head = document.createElement("div");
    head.className = "hdr-section__head";
    head.textContent = "Navigation";
    const list = document.createElement("div");
    list.className = "hdr-list";

    // Клонируем найденные блоки «как есть», чтобы работали их события
    // (если они навешаны через делегирование)
    maybeBlocks.forEach((blk, i) => {
      const cloned = blk.cloneNode(true);
      list.appendChild(cloned);
    });

    section.appendChild(head);
    section.appendChild(list);
    drawerBody.appendChild(section);
  }

  // 4) Слушатели
  const openMenu = () => document.body.classList.add("body--menu-open");
  const closeMenu = () => document.body.classList.remove("body--menu-open");

  burger.addEventListener("click", openMenu);
  drawer.querySelector(".hdr-close").addEventListener("click", closeMenu);
  overlay.addEventListener("click", closeMenu);

  // Close on ESC
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMenu();
  });

  // 5) Безопасность: если header.js перерисовывает хедер,
  // можно «дебоунсить» и обновлять offcanvas — пока делаем один раз при загрузке.
})();
