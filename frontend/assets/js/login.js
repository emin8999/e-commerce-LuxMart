const form = document.getElementById("loginForm");

form.addEventListener("submit", async (e) => {
  e.preventDefault(); // отменяем стандартное поведение формы

  // собираем данные из формы
  const data = {
    email: document.getElementById("loginEmail").value,
    password: document.getElementById("loginPassword").value,
  };

  // выводим данные в консоль
  console.log("Данные для отправки:", data);

  try {
    const response = await fetch("http://116.203.51.133/api/client/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data), // отправляем данные как JSON-строку
    });

    const result = await response.json();
    console.log("Ответ от сервера:", result);

    if (response.ok) {
      console.log("Успешный вход!");

      // сохраняем JWT в localStorage
      if (result.token) {
        // предполагаем, что сервер возвращает { token: "..." }
        localStorage.setItem("jwt", result.token);
        console.log("JWT сохранён в localStorage:", result.token);
      } else {
        console.warn("Токен не получен от сервера!");
      }

      // редирект на index.html
      window.location.href = "index.html";
    } else {
      console.error("Ошибка входа:", result);
      alert(result.message || "Ошибка авторизации"); // можно выводить сообщение пользователю
    }
  } catch (error) {
    console.error("Ошибка при отправке:", error);
    alert("Не удалось подключиться к серверу");
  }
});
