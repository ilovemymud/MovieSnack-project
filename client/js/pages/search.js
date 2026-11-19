UI.renderHeader();
if (UI.requireAuth()) {
  const form = document.getElementById("searchForm");
  const input = document.getElementById("q");
  const list = document.getElementById("movies");
  const result = document.getElementById("result");
  let genre = null, lastFoodId = null;

  form.addEventListener("submit", async e => {
    e.preventDefault();
    const q = input.value.trim();
    if (q.length < 2) { UI.toast("Введите минимум 2 символа", true); return; }
    list.replaceChildren(UI.h("li", { class: "empty" }, "Поиск..."));
    try {
      renderMovies(await API.get("/movies/search?q=" + encodeURIComponent(q)));
    } catch (err) {
      list.replaceChildren(UI.h("li", { class: "empty" }, err.message));
    }
  });

  function renderMovies(movies) {
    if (!movies.length) { list.replaceChildren(UI.h("li", { class: "empty" }, "Ничего не найдено")); return; }
    list.replaceChildren(...movies.map(m => UI.h("li", { class: "movie" },
      UI.h("div", {},
        UI.h("strong", {}, m.title),
        UI.h("span", { class: "muted" }, " " + m.year + " · " + m.genre.name)),
      UI.h("button", { class: "btn btn--small", type: "button", onclick: () => {
        genre = m.genre; lastFoodId = null; showPairing(m.title);
      } }, "Подобрать еду"))));
  }

  async function showPairing(title) {
    result.replaceChildren(UI.h("h2", {}, "Еда к фильму «" + title + "»"), UI.h("p", { class: "empty" }, "..."));
    try {
      const p = await API.getPairing(genre.id, lastFoodId);
      lastFoodId = p.food.id;
      const actions = UI.h("div", { class: "picker__actions" });
      result.replaceChildren(
        UI.h("h2", {}, "Еда к фильму «" + title + "»"),
        UI.h("p", { class: "muted" }, "Жанр: " + p.genre.name),
        UI.h("p", { class: "result__food" }, p.food.name),
        UI.h("button", { class: "btn btn--dark", type: "button", onclick: () => showPairing(title) }, "Ещё вариант"),
        actions);
      UI.pairingActions(actions, p);
    } catch (err) {
      result.replaceChildren(UI.h("p", { class: "empty" }, err.message));
    }
  }
}
