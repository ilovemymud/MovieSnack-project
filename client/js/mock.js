// Заглушки вместо бэкенда. Данные хранятся в localStorage ("mockdb"),
// поэтому не пропадают при переходе между страницами. Сброс: localStorage.removeItem("mockdb")
const Mock = {
  KEY: "mockdb",

  seed() {
    const names = {
      1: ["Мармеладные мишки", "Попкорн с карамелью", "Фруктовое ассорти"],
      2: ["Стейк с кровью", "Острые крылышки", "Томатный суп"],
      3: ["Начос с сыром", "Попкорн", "Пицца на компанию"],
      4: ["Горький шоколад", "Сыр и виноград", "Чай с печеньем"],
      5: ["Лапша быстрого приготовления", "Космические леденцы", "Роллы"],
      6: ["Бургер", "Острые чипсы", "Хот-доги"]
    };
    const foods = [], pairs = [];
    Object.entries(names).forEach(([gid, list]) => list.forEach(n => {
      const id = foods.length + 1;
      foods.push({ id, name: n });
      pairs.push({ id, genre_id: +gid, food_id: id });
    }));
    return {
      seq: 1000,
      users: [
        { id: 1, email: "admin@mail.ru", password: "admin123", role: "admin" },
        { id: 2, email: "user@mail.ru",  password: "user123",  role: "user" }
      ],
      genres: ["Мультфильмы", "Хоррор", "Комедия", "Драма", "Фантастика", "Боевик"]
        .map((name, i) => ({ id: i + 1, name })),
      foods, pairs,
      movies: [
        ["Шрек", 2001, 1], ["Рататуй", 2007, 1], ["Тайна Коко", 2017, 1],
        ["Оно", 2017, 2], ["Заклятие", 2013, 2], ["Сияние", 1980, 2],
        ["Один дома", 1990, 3], ["Маска", 1994, 3],
        ["Побег из Шоушенка", 1994, 4], ["Зелёная миля", 1999, 4],
        ["Интерстеллар", 2014, 5], ["Матрица", 1999, 5],
        ["Джон Уик", 2014, 6], ["Безумный Макс: Дорога ярости", 2015, 6]
      ].map(([title, year, genre_id]) => ({ title, year, genre_id })),
      favorites: [], history: []
    };
  },

  load() { return JSON.parse(localStorage.getItem(this.KEY) || "null") || this.seed(); },
  save(db) { localStorage.setItem(this.KEY, JSON.stringify(db)); },

  async handle(method, path, body) {
    await new Promise(r => setTimeout(r, 250)); // имитация сети
    const db = this.load();
    const [route, qs] = path.split("?");
    const q = new URLSearchParams(qs || "");
    body = body || {};

    const token = Auth.getToken();
    const me = token && token.startsWith("mock-")
      ? db.users.find(u => u.id === +token.slice(5)) : null;
    const need = role => {
      if (!me) throw new Error("Требуется вход");
      if (role && me.role !== role) throw new Error("Нет доступа");
      return me;
    };
    const done = data => { this.save(db); return data; };
    const session = u => ({ token: "mock-" + u.id, user: { id: u.id, email: u.email, role: u.role } });
    const genreOf = id => db.genres.find(g => g.id === id);
    const foodOf  = id => db.foods.find(f => f.id === id);
    let m;

    // ---- гость ----
    if (method === "GET" && route === "/genres") return db.genres;

    if (method === "GET" && route === "/pairing") {
      const genre = genreOf(+q.get("genre_id"));
      if (!genre) throw new Error("Жанр не найден");
      let ids = db.pairs.filter(p => p.genre_id === genre.id).map(p => p.food_id);
      if (!ids.length) throw new Error("Для жанра пока нет блюд");
      if (ids.length > 1) ids = ids.filter(id => id !== +q.get("exclude"));
      const food = foodOf(ids[Math.floor(Math.random() * ids.length)]);
      const res = { genre, food: { id: food.id, name: food.name } };
      if (me) {
        const h = { id: ++db.seq, user_id: me.id, genre: genre.name, food_id: food.id,
                    food: food.name, date: new Date().toISOString(), rating: null };
        db.history.push(h);
        res.history_id = h.id;
      }
      return done(res);
    }

    // ---- авторизация ----
    if (method === "POST" && route === "/auth/login") {
      const u = db.users.find(x => x.email === body.email && x.password === body.password);
      if (!u) throw new Error("Неверный email или пароль");
      return session(u);
    }
    if (method === "POST" && route === "/auth/register") {
      if (db.users.some(x => x.email === body.email)) throw new Error("Email уже занят");
      const u = { id: ++db.seq, email: body.email, password: body.password, role: "user" };
      db.users.push(u);
      return done(session(u));
    }

    // ---- пользователь ----
    if (method === "GET" && route === "/movies/search") {
      need();
      const s = (q.get("q") || "").toLowerCase();
      return db.movies.filter(x => x.title.toLowerCase().includes(s))
        .map(x => ({ title: x.title, year: x.year, genre: genreOf(x.genre_id) }));
    }

    if (route === "/favorites") {
      need();
      if (method === "GET")
        return db.favorites.filter(f => f.user_id === me.id)
          .map(f => ({ id: f.id, food: foodOf(f.food_id) }));
      if (method === "POST") {
        if (db.favorites.some(f => f.user_id === me.id && f.food_id === body.food_id))
          throw new Error("Уже в избранном");
        db.favorites.push({ id: ++db.seq, user_id: me.id, food_id: body.food_id });
        return done({ ok: true });
      }
    }
    if (method === "DELETE" && (m = route.match(/^\/favorites\/(\d+)$/))) {
      need();
      db.favorites = db.favorites.filter(f => !(f.id === +m[1] && f.user_id === me.id));
      return done({ ok: true });
    }

    if (method === "GET" && route === "/history") {
      need();
      return db.history.filter(h => h.user_id === me.id).reverse();
    }
    if (method === "POST" && route === "/ratings") {
      need();
      const h = db.history.find(x => x.id === body.history_id && x.user_id === me.id);
      if (!h || body.value < 1 || body.value > 5) throw new Error("Некорректная оценка");
      h.rating = body.value;
      return done({ ok: true });
    }

    // ---- админ ----
    if (route.startsWith("/admin")) {
      need("admin");

      if (route === "/admin/stats") {
        const rated = db.history.filter(h => h.rating);
        const count = {};
        db.history.forEach(h => count[h.food] = (count[h.food] || 0) + 1);
        return {
          users: db.users.length, genres: db.genres.length, foods: db.foods.length,
          pairs: db.pairs.length, picks: db.history.length,
          avg_rating: rated.length ? +(rated.reduce((s, h) => s + h.rating, 0) / rated.length).toFixed(2) : null,
          top_foods: Object.entries(count).sort((a, b) => b[1] - a[1]).slice(0, 5)
            .map(([name, picks]) => ({ name, picks }))
        };
      }

      if (route === "/admin/users" && method === "GET")
        return db.users.map(u => ({ id: u.id, email: u.email, role: u.role }));
      if ((m = route.match(/^\/admin\/users\/(\d+)$/))) {
        const u = db.users.find(x => x.id === +m[1]);
        if (!u) throw new Error("Пользователь не найден");
        if (u.id === me.id) throw new Error("Нельзя изменить самого себя");
        if (method === "PUT") u.role = body.role;
        if (method === "DELETE") db.users = db.users.filter(x => x !== u);
        return done({ ok: true });
      }

      if ((m = route.match(/^\/admin\/(genres|foods)(?:\/(\d+))?$/))) {
        const kind = m[1], id = +m[2];
        const name = (body.name || "").trim();
        if (method === "GET") return db[kind];
        if (method === "POST") {
          if (!name) throw new Error("Введите название");
          const item = { id: ++db.seq, name };
          db[kind].push(item);
          return done(item);
        }
        const item = db[kind].find(x => x.id === id);
        if (!item) throw new Error("Не найдено");
        if (method === "PUT") {
          if (!name) throw new Error("Введите название");
          item.name = name;
        }
        if (method === "DELETE") {
          db[kind] = db[kind].filter(x => x !== item);
          const key = kind === "genres" ? "genre_id" : "food_id";
          db.pairs = db.pairs.filter(p => p[key] !== id);
          if (kind === "foods") db.favorites = db.favorites.filter(f => f.food_id !== id);
        }
        return done({ ok: true });
      }

      if (route === "/admin/pairs" && method === "GET")
        return db.pairs.map(p => ({ id: p.id, genre: genreOf(p.genre_id), food: foodOf(p.food_id) }));
      if (route === "/admin/pairs" && method === "POST") {
        if (!genreOf(body.genre_id) || !foodOf(body.food_id)) throw new Error("Выберите жанр и блюдо");
        if (db.pairs.some(p => p.genre_id === body.genre_id && p.food_id === body.food_id))
          throw new Error("Такая связь уже есть");
        db.pairs.push({ id: ++db.seq, genre_id: body.genre_id, food_id: body.food_id });
        return done({ ok: true });
      }
      if (method === "DELETE" && (m = route.match(/^\/admin\/pairs\/(\d+)$/))) {
        db.pairs = db.pairs.filter(p => p.id !== +m[1]);
        return done({ ok: true });
      }
    }

    throw new Error("Мок: нет маршрута " + method + " " + route);
  }
};
