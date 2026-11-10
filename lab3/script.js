// Простая база «жанр — еда» (позже заменится запросами к REST API)
const foodByGenre = {
  "Мультфильмы": ["Мармеладные мишки", "Попкорн с карамелью", "Фруктовое ассорти"],
  "Хоррор":      ["Стейк с кровью", "Красные острые крылышки", "Томатный суп"],
  "Комедия":     ["Начос с сыром", "Попкорн", "Пицца на компанию"],
  "Драма":       ["Горький шоколад", "Сыр и виноград", "Чай с печеньем"],
  "Фантастика":  ["Лапша быстрого приготовления", "Космические леденцы", "Роллы"],
  "Боевик":      ["Бургер", "Острые чипсы", "Хот-доги"]
};

const genreButtons = document.querySelectorAll(".genre");
const resultGenre  = document.getElementById("resultGenre");
const resultFood   = document.getElementById("resultFood");
const againBtn     = document.getElementById("againBtn");

let currentGenre = null;

function pickFood(genre) {
  const list = foodByGenre[genre];
  resultGenre.textContent = genre;
  resultFood.textContent  = list[Math.floor(Math.random() * list.length)];
}

genreButtons.forEach(function (btn) {
  btn.addEventListener("click", function () {
    genreButtons.forEach(b => b.classList.remove("is-active"));
    btn.classList.add("is-active");
    currentGenre = btn.dataset.genre;
    pickFood(currentGenre);
  });
});

againBtn.addEventListener("click", function () {
  if (currentGenre) pickFood(currentGenre);
});
