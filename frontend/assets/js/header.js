// Inject shared header and burger drawer
(function () {
  const header = document.getElementById("app-header");
  if (!header) return;
  header.innerHTML = `
    <div class="header">
      <div class="container header__row">
        <a href="./index.html" class="logo"><strong>LuxMart</strong></a>
        <nav class="header__nav">
         
          <a class="header__link" data-i18n="nav.products" href="./products.html">Products</a>
          <a class="header__link" data-i18n="nav.our_stores" href="./our-stores.html">Our Stores</a>
           <a class="header__link" data-i18n="nav.about_us" href="./about.html">About Us</a>
          <a class="header__link" data-i18n="nav.customer_service" href="./customer.html">Customer Service</a>
          <a class="header__link" data-i18n="nav.category" id="openCatModal" href="javascript:void(0)">Category</a>
        </nav>
        <div class="header__icons">
          <select id="langSelect" title="Language">
            <option value="en">EN</option>
            <option value="az">AZ</option>
            <option value="es">ES</option>
            <option value="de">DE</option>
          </select>
          <select id="currencySelect" title="Currency">
            <option value="USD">$</option>
            <option value="AZN">₼</option>
            <option value="EUR">€</option>
            <option value="TRY">₺</option>
          </select>
          <a href="javascript:void(0)" id="profileBtn" title="Profile">👤</a>
          <a href="./cart.html" class="header__cart" title="Cart">🛒<span class="header__badge" id="cartBadge" style="display:none">0</span></a>
          <button class="burger" id="burgerBtn">☰</button>
        </div>
      </div>
    </div>
    <div class="overlay" id="drawerOverlay"></div>
    <div class="drawer" id="drawer">
      <button id="drawerClose" class="btn">✖</button>
      
      <a class="header__link" data-i18n="nav.products" href="./products.html">Products</a>
      <a class="header__link" data-i18n="nav.our_stores" href="./our-stores.html">Our Stores</a>
      <a class="header__link" data-i18n="nav.about_us" href="./about.html">About Us</a>
      <a class="header__link" data-i18n="nav.customer_service" href="./customer.html">Customer Service</a>
      <a class="header__link" data-i18n="nav.category" id="openCatModalDrawer" href="javascript:void(0)">Category</a>
    </div>
  `;

  // Drawer logic (slide right -> left)
  const drawer = document.getElementById("drawer");
  const overlay = document.getElementById("drawerOverlay");
  document.getElementById("burgerBtn").addEventListener("click", () => {
    drawer.classList.add("open");
    overlay.classList.add("show");
  });
  function closeDrawer() {
    drawer.classList.remove("open");
    overlay.classList.remove("show");
  }
  document.getElementById("drawerClose").addEventListener("click", closeDrawer);
  overlay.addEventListener("click", closeDrawer);

  // Category modal
  const modalRoot = document.getElementById("app-modal-root");
  const modal = document.createElement("div");
  modal.className = "modal";
  modal.id = "catModal";
  modal.innerHTML = `<div class="modal__panel">
    <h3 data-i18n="nav.category">Categories</h3>
    <div id="catList" class="grid"></div>
    <div style="text-align:right;margin-top:8px"><button class="btn" id="closeCat">Close</button></div>
  </div>`;
  modalRoot.appendChild(modal);
  // Ensure freshly injected markup is translated to current locale
  try { window.i18n && window.i18n.setLocale(window.i18n.getLocale()); } catch(_) {}
  function openCat() {
    modal.classList.add("show");
    if (window.renderCategories) window.renderCategories("catList");
  }
  function closeCat() {
    modal.classList.remove("show");
  }
  document.getElementById("openCatModal").addEventListener("click", openCat);
  document
    .getElementById("openCatModalDrawer")
    .addEventListener("click", () => {
      openCat();
      closeDrawer();
    });
  modal.querySelector("#closeCat").addEventListener("click", closeCat);

  // Language & Currency
  const langSelect = document.getElementById("langSelect");
  langSelect.value = window.i18n.getLocale();
  langSelect.addEventListener("change", (e) =>
    window.i18n.setLocale(e.target.value)
  );

  const currencySelect = document.getElementById("currencySelect");
  currencySelect.value = window.currency.getCurrency();
  currencySelect.addEventListener("change", (e) =>
    window.currency.setCurrency(e.target.value)
  );

  // Cart badge
  window.renderCartBadge = function () {
    const badge = document.getElementById("cartBadge");
    const count =
      window.cart && typeof window.cart.getCount === "function"
        ? window.cart.getCount()
        : 0;
    if (count > 0) {
      badge.textContent = count > 99 ? "99+" : String(count);
      badge.style.display = "flex";
    } else {
      badge.style.display = "none";
    }
  };
  try {
    window.renderCartBadge();
  } catch (_) {}

  // Profile button behavior: go to login if no token, else profile
  const profileBtn = document.getElementById("profileBtn");
  if (profileBtn) {
    profileBtn.addEventListener("click", () => {
      const token = localStorage.getItem("Jwt");
      if (token && token.length > 0) {
        window.location.href = "./profile.html";
      } else {
        window.location.href = "./login.html";
      }
    });
  }
})();
