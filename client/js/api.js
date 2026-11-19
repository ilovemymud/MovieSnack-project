// Единая точка для всех запросов к бэкенду.
// USE_MOCK = true — работаем на заглушках; false — реальный API друга.
const API = {
  BASE_URL: "/api",
  USE_MOCK: true,

  async request(path, { method = "GET", body } = {}) {
    if (API.USE_MOCK) return Mock.handle(method, path, body);

    const headers = { "Content-Type": "application/json" };
    const token = Auth.getToken();
    if (token) headers.Authorization = "Bearer " + token;

    const res = await fetch(API.BASE_URL + path, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (res.status === 401) Auth.clear();
      throw new Error(data.error || "Ошибка " + res.status);
    }
    return data;
  },

  get:  (path)       => API.request(path),
  post: (path, body) => API.request(path, { method: "POST", body }),
  put:  (path, body) => API.request(path, { method: "PUT", body }),
  del:  (path)       => API.request(path, { method: "DELETE" }),

  getGenres:  ()                  => API.get("/genres"),
  getPairing: (genreId, exclude)  => API.get("/pairing?genre_id=" + genreId + (exclude ? "&exclude=" + exclude : "")),
  login:      (email, password)   => API.post("/auth/login",    { email, password }),
  register:   (email, password)   => API.post("/auth/register", { email, password })
};
