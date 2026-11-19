const genresList  = document.getElementById("genresList");
const resultGenre = document.getElementById("resultGenre");
const resultFood  = document.getElementById("resultFood");
const againBtn    = document.getElementById("againBtn");
const actionsBox  = document.getElementById("pickerActions");
let currentGenre = null;
let lastFoodId = null;

async function loadGenres() {
  genresList.textContent = "Загрузка...";
  try {
    const genres = await API.getGenres();
    genresList.innerHTML = "";
    genres.forEach(g => {
      const btn = document.createElement("button");
      btn.className = "genre";
      btn.type = "button";
      btn.textContent = g.name;
      btn.addEventListener("click", () => {
        document.querySelectorAll(".genre").forEach(b => b.classList.remove("is-active"));
        btn.classList.add("is-active");
        currentGenre = g;
        lastFoodId = null;
        showPairing();
      });
      genresList.appendChild(btn);
    });
  } catch (e) {
    genresList.textContent = "Не удалось загрузить жанры: " + e.message;
  }
}

async function showPairing() {
  if (!currentGenre) return;
  resultGenre.textContent = currentGenre.name;
  resultFood.textContent = "...";
  actionsBox.replaceChildren();
  try {
    const p = await API.getPairing(currentGenre.id, lastFoodId);
    lastFoodId = p.food.id;
    resultFood.textContent = p.food.name;
    UI.pairingActions(actionsBox, p);
  } catch (e) {
    resultFood.textContent = "Ошибка";
    resultGenre.textContent = e.message;
  }
}

againBtn.addEventListener("click", showPairing);
Auth.renderNav();
loadGenres();
