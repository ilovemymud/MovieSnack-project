// Хранение сессии и шапка по роли. Права всё равно проверяет бэк.
const Auth = {
  getToken: () => localStorage.getItem("token"),
  getUser()  { return JSON.parse(localStorage.getItem("user") || "null"); },
  setSession(data) {
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
  },
  clear() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },
  logout() { Auth.clear(); location.href = "index.html"; },

  renderNav() {
    const box = document.getElementById("authLinks");
    if (!box) return;
    const user = Auth.getUser();
    if (!user) {
      box.innerHTML = '<a class="btn btn--small" href="login.html">Войти</a>';
      return;
    }
    let html = '<a href="search.html">Поиск фильма</a><a href="favorites.html">Избранное</a><a href="history.html">История</a>';
    if (user.role === "admin") html += '<a href="admin.html">Админка</a>';
    html += '<button class="btn btn--small btn--dark" id="logoutBtn" type="button">Выйти</button>';
    box.innerHTML = html;
    document.getElementById("logoutBtn").addEventListener("click", Auth.logout);
  }
};
