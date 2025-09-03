document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("adminJwt");
  if (!token) {
    // если токена нет — значит не авторизован → кидаем на логин
    window.location.href = "adminLogin.html";
  }
});
