# Контракт API MovieSnack (фронт ↔ бэк)

Префикс `/api`, JSON. Авторизация: `Authorization: Bearer <JWT>`.
Ошибка: HTTP 4xx + `{ "error": "текст для пользователя" }` (401 — нет входа, 403 — нет прав, 404, 422 — валидация).
Фронт включает реальный API так: в `js/api.js` → `USE_MOCK: false`.

| Метод и путь | Доступ | Тело / параметры | Ответ |
|---|---|---|---|
| GET `/genres` | гость | — | `[{id, name}]` |
| GET `/pairing?genre_id=&exclude=` | гость | `exclude` — id блюда, которое не повторять | `{genre:{id,name}, food:{id,name}, history_id?}` (`history_id` только если есть токен — бэк пишет запись в историю) |
| POST `/auth/register` | гость | `{email, password}` | `{token, user:{id,email,role}}` |
| POST `/auth/login` | гость | `{email, password}` | `{token, user:{id,email,role}}` |
| GET `/movies/search?q=` | user | — | `[{title, year, genre:{id,name}}]` |
| GET `/favorites` | user | — | `[{id, food:{id,name}}]` |
| POST `/favorites` | user | `{food_id}` | `{ok:true}`; 422 если уже есть |
| DELETE `/favorites/:id` | user | — | `{ok:true}` |
| GET `/history` | user | — | `[{id, genre, food, date (ISO), rating (1–5 | null)}]`, новые первыми |
| POST `/ratings` | user | `{history_id, value 1..5}` | `{ok:true}` |
| GET `/admin/users` | admin | — | `[{id,email,role}]` |
| PUT `/admin/users/:id` | admin | `{role: "user"|"admin"}` | `{ok:true}` |
| DELETE `/admin/users/:id` | admin | — | `{ok:true}` |
| GET/POST `/admin/genres`, PUT/DELETE `/admin/genres/:id` | admin | `{name}` | список `[{id,name}]` / `{id,name}` / `{ok:true}` |
| GET/POST `/admin/foods`, PUT/DELETE `/admin/foods/:id` | admin | `{name}` | аналогично |
| GET `/admin/pairs` | admin | — | `[{id, genre:{id,name}, food:{id,name}}]` |
| POST `/admin/pairs` | admin | `{genre_id, food_id}` | `{ok:true}`; 422 при дубле |
| DELETE `/admin/pairs/:id` | admin | — | `{ok:true}` |
| GET `/admin/stats` | admin | — | `{users, genres, foods, pairs, picks, avg_rating|null, top_foods:[{name,picks}]}` |

Нужно от бэка: CORS для адреса фронта, роли проверять на сервере, пароли — `password_hash`.
