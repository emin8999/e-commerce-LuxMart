// Minimal admin/store dashboard handlers (demo)
(async function () {
  const API_BASE = "http://116.203.51.133/luxmart";
  const path = location.pathname;

  // ===== Store pages auth guard + logout =====
  const isStorePage =
    !!document.getElementById("storeLogoutBtn") ||
    /\/dashboard\/(store\.html|index\.html|addProducts\.html)$/.test(path);
  if (isStorePage) {
    const token = localStorage.getItem("storeJwt");
    if (!token) {
      // no token → go to login and replace history entry
      window.location.replace("storeLogin.html");
    } else {
      // prevent back navigation to this page after logout
      history.replaceState(null, document.title, location.href);
      window.addEventListener("popstate", () => {
        if (!localStorage.getItem("storeJwt")) {
          window.location.replace("storeLogin.html");
        } else {
          history.pushState(null, document.title, location.href);
        }
      });

      // extra protection for bfcache
      window.onpageshow = (e) => {
        if (e.persisted && !localStorage.getItem("storeJwt")) {
          window.location.replace("storeLogin.html");
        }
      };
    }

    const logoutBtn = document.getElementById("storeLogoutBtn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", async () => {
        const t = localStorage.getItem("storeJwt");
        try {
          if (t) {
            await fetch(`${API_BASE}/store/logout`, {
              method: "POST",
              headers: { Authorization: `Bearer ${t}` },
            }).catch(() => {});
          }
        } finally {
          localStorage.removeItem("storeJwt");
          window.location.replace("storeLogin.html");
        }
      });
    }
  }

  // ===== Admin pages (existing) =====
  if (path.endsWith("/admin.html")) {
    // Rates
    const r = await fetch(`${API_BASE}/api/config/rates`)
      .then((r) => r.json())
      .catch(() => ({ AZN: 1.7, EUR: 0.92, TRY: 33 }));
    document.getElementById("rateAZN").value = r.AZN || 1.7;
    document.getElementById("rateEUR").value = r.EUR || 0.92;
    document.getElementById("rateTRY").value = r.TRY || 33;
    document.getElementById("saveRates").onclick = async () => {
      const body = {
        AZN: Number(document.getElementById("rateAZN").value || 1.7),
        EUR: Number(document.getElementById("rateEUR").value || 0.92),
        TRY: Number(document.getElementById("rateTRY").value || 33),
      };
      await fetch(`${API_BASE}/api/config/rates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      alert("Rates saved");
    };
    // Shipping
    const s = await fetch(`${API_BASE}/api/config/shipping`)
      .then((r) => r.json())
      .catch(() => ({ shippingCost: 5 }));
    document.getElementById("shippingCost").value = s.shippingCost || 5;
    document.getElementById("saveShipping").onclick = async () => {
      const body = {
        shippingCost: Number(
          document.getElementById("shippingCost").value || 5
        ),
      };
      await fetch(`${API_BASE}/api/config/shipping`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      alert("Shipping saved");
    };
  }
})();
