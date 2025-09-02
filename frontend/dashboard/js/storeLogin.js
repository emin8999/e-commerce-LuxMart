document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("tab-store");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Берем значения полей
    const email = form.querySelector('input[name="email"]').value.trim();
    const password = form.querySelector('input[name="password"]').value.trim();

    // Формируем объект
    const payload = {
      email: email,
      password: password,
    };

    console.log("📤 Отправляю на бэк:", payload);

    try {
      const res = await fetch("http://116.203.51.133/api/store/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload), // отправка как JSON
      });

      if (!res.ok) throw new Error(`Ошибка сервера: ${res.status}`);

      const data = await res.json();
      console.log("✅ Ответ от сервера:", data);

      // Если пришел токен, сохраняем его и переходим на store.html
      if (data.token) {
        localStorage.setItem("storeJWT", data.token); // сохраняем токен
        window.location.href = "store.html"; // редирект на страницу магазина
      } else {
        console.warn("⚠️ Токен не получен. Авторизация не прошла.");
      }
    } catch (err) {
      console.error("❌ Ошибка при отправке:", err);
    }
  });
});
