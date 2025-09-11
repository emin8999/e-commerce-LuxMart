document.addEventListener("DOMContentLoaded", () => {
  const API_BASE = "http://116.203.51.133/luxmart"; // базовый URL для входа магазина
  const form = document.getElementById("tab-store");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = form.querySelector('input[name="email"]').value.trim();
    const password = form.querySelector('input[name="password"]').value.trim();

    const payload = { email, password };

    const submitBtn = form.querySelector('button[type="submit"]');
    const initialText = submitBtn?.textContent;
    if (submitBtn) submitBtn.textContent = "Вход...";
    try {
      const res = await fetch(`${API_BASE}/store/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const contentType = res.headers.get("content-type") || "";
      const parseBody = async () =>
        contentType.includes("application/json") ? res.json() : res.text();

      if (!res.ok) {
        const errBody = await parseBody();
        const errMsg =
          typeof errBody === "string"
            ? errBody
            : errBody?.message || "Неверный email или пароль";
        throw new Error(errMsg);
      }

      const data = await parseBody();
      if (data && data.token) {
        localStorage.setItem("storeJwt", data.token);
        window.location.href = "store.html"; // переход на страницу магазина
      } else {
        alert("Не удалось получить токен авторизации");
      }
    } catch (err) {
      console.error("❌ Ошибка при входе:", err);
      alert("Ошибка входа: " + err.message);
    } finally {
      if (submitBtn) submitBtn.textContent = initialText || "Sign In";
    }
  });
});
//store place düyməsi
// Находим кнопку
const goBtn = document.getElementById("goBtn");

// Клик → переход
goBtn.addEventListener("click", () => {
  // Измени адрес назначения
  window.location.href = "../index.html";
});
