UI.renderHeader();
if (UI.requireAuth("admin")) {
  const tabBar = document.getElementById("tabs");
  const content = document.getElementById("adminContent");
  const h = UI.h;
  let current = "users";

  const table = (heads, rows) => h("div", { class: "table-wrap" }, h("table", {},
    h("thead", {}, h("tr", {}, heads.map(t => h("th", {}, t)))),
    h("tbody", {}, rows.map(r => h("tr", {}, r.map(c => h("td", {}, c)))))));

  // Кнопка: выполнить запрос и перерисовать вкладку
  const act = (label, cls, fn) => h("button", { class: "btn btn--small " + cls, type: "button",
    onclick: () => UI.run(async () => { await fn(); open(current); }) }, label);

  async function renderUsers() {
    const users = await API.get("/admin/users");
    const me = Auth.getUser();
    return table(["ID", "Email", "Роль", ""], users.map(u => [
      u.id, u.email,
      h("select", { class: "input", disabled: u.id === me.id, onchange: e =>
        UI.run(async () => { await API.put("/admin/users/" + u.id, { role: e.target.value }); UI.toast("Роль изменена"); }) },
        ["user", "admin"].map(r => h("option", { value: r, selected: u.role === r }, r))),
      u.id === me.id ? "" : act("Удалить", "btn--danger", async () => {
        if (!confirm("Удалить пользователя " + u.email + "?")) throw new Error("Отменено");
        await API.del("/admin/users/" + u.id);
      })
    ]));
  }

  async function renderNames(kind, placeholder) {
    const items = await API.get("/admin/" + kind);
    const input = h("input", { class: "input", placeholder, maxlength: "60" });
    const add = h("form", { class: "toolbar", onsubmit: e => {
      e.preventDefault();
      UI.run(async () => { await API.post("/admin/" + kind, { name: input.value }); open(current); });
    } }, input, h("button", { class: "btn", type: "submit" }, "Добавить"));
    return h("div", {}, add, table(["ID", "Название", ""], items.map(it => [
      it.id, it.name,
      h("div", { class: "toolbar" },
        act("Переименовать", "btn--ghost", async () => {
          const name = prompt("Новое название", it.name);
          if (name === null) throw new Error("Отменено");
          await API.put("/admin/" + kind + "/" + it.id, { name });
        }),
        act("Удалить", "btn--danger", async () => {
          if (!confirm("Удалить «" + it.name + "»? Связанные записи тоже удалятся.")) throw new Error("Отменено");
          await API.del("/admin/" + kind + "/" + it.id);
        }))
    ])));
  }

  async function renderPairs() {
    const [pairs, genres, foods] = await Promise.all([
      API.get("/admin/pairs"), API.get("/admin/genres"), API.get("/admin/foods")]);
    const opts = list => list.map(x => h("option", { value: x.id }, x.name));
    const g = h("select", { class: "input" }, opts(genres));
    const f = h("select", { class: "input" }, opts(foods));
    const add = h("form", { class: "toolbar", onsubmit: e => {
      e.preventDefault();
      UI.run(async () => { await API.post("/admin/pairs", { genre_id: +g.value, food_id: +f.value }); open(current); });
    } }, g, f, h("button", { class: "btn", type: "submit" }, "Связать"));
    return h("div", {}, add, table(["Жанр", "Еда", ""], pairs.map(p => [
      p.genre.name, p.food.name, act("Удалить", "btn--danger", () => API.del("/admin/pairs/" + p.id))])));
  }

  async function renderStats() {
    const s = await API.get("/admin/stats");
    const stat = (label, value) => h("div", { class: "stat" }, h("strong", {}, value), h("span", {}, label));
    return h("div", {},
      h("div", { class: "stats" },
        stat("Пользователи", s.users), stat("Жанры", s.genres), stat("Блюда", s.foods),
        stat("Связи", s.pairs), stat("Подборов", s.picks), stat("Средняя оценка", s.avg_rating ?? "—")),
      h("h2", {}, "Популярная еда"),
      s.top_foods.length
        ? table(["Блюдо", "Подборов"], s.top_foods.map(t => [t.name, t.picks]))
        : h("p", { class: "empty" }, "Данных пока нет"));
  }

  const views = {
    users:  ["Пользователи", renderUsers],
    genres: ["Жанры", () => renderNames("genres", "Новый жанр")],
    foods:  ["Блюда", () => renderNames("foods", "Новое блюдо")],
    pairs:  ["Связи «жанр — еда»", renderPairs],
    stats:  ["Статистика", renderStats]
  };

  async function open(key) {
    current = key;
    tabBar.querySelectorAll("button").forEach(b => b.classList.toggle("is-active", b.dataset.key === key));
    content.replaceChildren(h("p", { class: "empty" }, "Загрузка..."));
    try {
      content.replaceChildren(await views[key][1]());
    } catch (e) {
      content.replaceChildren(h("p", { class: "empty" }, e.message));
    }
  }

  Object.entries(views).forEach(([key, [title]]) =>
    tabBar.append(h("button", { class: "tab", type: "button", "data-key": key, onclick: () => open(key) }, title)));
  open("users");
}
