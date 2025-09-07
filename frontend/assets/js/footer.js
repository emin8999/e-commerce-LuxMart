(function () {
  const mount = document.getElementById("app-footer");
  if (!mount) return;

  // Определяем корректный путь к storeLogin.html и другим страницам
  const inDashboard = window.location.pathname.includes("/dashboard/");
  const sellHref = inDashboard ? "./storeLogin.html" : "./dashboard/storeLogin.html";

  mount.innerHTML = `
    <div class="footer">
      <div class="container footer__row">
        <div class="footer__brand">
          <a href="${inDashboard ? "../index.html" : "./index.html"}" class="logo"><strong>LuxMart</strong></a>
        </div>
        <nav class="footer__nav">
          <a class="footer__link" id="sellWithUs" href="${sellHref}">Sell with us</a>
        </nav>
      </div>
    </div>
  `;
})();

