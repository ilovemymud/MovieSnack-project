UI.renderHeader();
if (UI.requireAuth()) {
  const box = document.getElementById("historyBox");

  async function load() {
    try {
      const rows = await API.get("/history");
      if (!rows.length) {
        box.replaceChildren(UI.h("p", { class: "empty" }, "История пуста. Подберите еду на главной странице."));
        return;
      }
      const body = UI.h("tbody", {}, rows.map(r => UI.h("tr", {},
        UI.h("td", {}, new Date(r.date).toLocaleString("ru-RU")),
        UI.h("td", {}, r.genre),
        UI.h("td", {}, r.food),
        UI.h("td", {}, UI.stars(r.rating || 0, n => UI.run(async () => {
          await API.post("/ratings", { history_id: r.id, value: n });
          load();
        }))))));
      box.replaceChildren(UI.h("div", { class: "table-wrap" },
        UI.h("table", {},
          UI.h("thead", {}, UI.h("tr", {}, ["Дата", "Жанр", "Еда", "Оценка"].map(t => UI.h("th", {}, t)))),
          body)));
    } catch (e) {
      box.replaceChildren(UI.h("p", { class: "empty" }, e.message));
    }
  }
  load();
}
