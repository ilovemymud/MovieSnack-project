UI.renderHeader();
if (UI.requireAuth()) {
  const box = document.getElementById("cards");

  async function load() {
    try {
      const items = await API.get("/favorites");
      if (!items.length) {
        box.replaceChildren(UI.h("p", { class: "empty" }, "Пока пусто. Добавляйте еду кнопкой «В избранное» после подбора."));
        return;
      }
      box.replaceChildren(...items.map(it => UI.h("article", { class: "card" },
        UI.h("h3", {}, it.food.name),
        UI.h("button", { class: "btn btn--small btn--ghost", type: "button", onclick: () => UI.run(async () => {
          await API.del("/favorites/" + it.id);
          UI.toast("Удалено");
          load();
        }) }, "Убрать"))));
    } catch (e) {
      box.replaceChildren(UI.h("p", { class: "empty" }, e.message));
    }
  }
  load();
}
