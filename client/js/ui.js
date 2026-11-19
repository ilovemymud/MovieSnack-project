// Общие помощники интерфейса
const UI = {
  // Создание элемента: UI.h("div", {class: "x", onclick: fn}, "текст", child)
  // Текст вставляется через append(строка) — это безопасно от XSS.
  h(tag, props = {}, ...kids) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
      if (k === "class") el.className = v;
      else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
      else if (v !== false && v != null) el.setAttribute(k, v);
    }
    kids.flat().filter(c => c != null && c !== false)
      .forEach(c => el.append(c instanceof Node ? c : String(c)));
    return el;
  },

  toast(text, isError) {
    const t = UI.h("div", { class: "toast" + (isError ? " toast--error" : ""), role: "status" }, text);
    document.body.append(t);
    setTimeout(() => t.remove(), 3000);
  },

  // Выполнить действие, ошибку показать тостом
  async run(fn) {
    try { return await fn(); } catch (e) { UI.toast(e.message, true); }
  },

  // Защита страницы (на сервере права всё равно проверяются)
  requireAuth(role) {
    const u = Auth.getUser();
    if (!u) { location.href = "login.html"; return null; }
    if (role && u.role !== role) { location.href = "index.html"; return null; }
    return u;
  },

  renderHeader() {
    const header = document.getElementById("siteHeader");
    if (!header) return;
    header.append(
      UI.h("a", { class: "logo", href: "index.html" }, "MovieSnack"),
      UI.h("nav", { class: "nav" },
        UI.h("a", { href: "index.html" }, "Главная"),
        UI.h("div", { class: "nav__auth", id: "authLinks" }))
    );
    Auth.renderNav();
  },

  // Звёздочки оценки 1–5
  stars(value, onRate) {
    const box = UI.h("div", { class: "stars", role: "group", "aria-label": "Оценка" });
    for (let i = 1; i <= 5; i++) {
      box.append(UI.h("button", {
        type: "button", class: i <= value ? "is-on" : "",
        "aria-label": "Оценка " + i, onclick: () => onRate(i)
      }, "★"));
    }
    return box;
  },

  // Кнопки «В избранное» и оценка под результатом подбора (только для вошедших)
  pairingActions(box, p) {
    box.replaceChildren();
    if (!Auth.getUser()) return;
    const fav = UI.h("button", { class: "btn btn--small btn--ghost", type: "button" }, "♡ В избранное");
    fav.addEventListener("click", () => UI.run(async () => {
      await API.post("/favorites", { food_id: p.food.id });
      fav.textContent = "♥ В избранном";
      fav.disabled = true;
    }));
    box.append(fav);
    if (!p.history_id) return;
    let stars;
    const draw = v => UI.stars(v, n => UI.run(async () => {
      await API.post("/ratings", { history_id: p.history_id, value: n });
      const fresh = draw(n);
      stars.replaceWith(fresh);
      stars = fresh;
      UI.toast("Оценка сохранена");
    }));
    stars = draw(0);
    box.append(stars);
  }
};
