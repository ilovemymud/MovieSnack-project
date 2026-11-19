// Одна логика для login.html и register.html (режим берётся из data-mode)
const form = document.getElementById("authForm");
const isRegister = form.dataset.mode === "register";
const formError = document.getElementById("formError");

if (Auth.getUser()) location.href = "index.html";
UI.renderHeader();

function setError(name, text) {
  form.querySelector('[data-error="' + name + '"]').textContent = text;
}

form.addEventListener("submit", async e => {
  e.preventDefault();
  const email = form.elements.email.value.trim();
  const password = form.elements.password.value;
  let ok = true;

  ["email", "password", "password2"].forEach(n => { if (form.querySelector('[data-error="' + n + '"]')) setError(n, ""); });
  formError.textContent = "";

  if (!/^\S+@\S+\.\S+$/.test(email)) { setError("email", "Введите корректный email"); ok = false; }
  if (password.length < 6) { setError("password", "Минимум 6 символов"); ok = false; }
  if (isRegister && form.elements.password2.value !== password) { setError("password2", "Пароли не совпадают"); ok = false; }
  if (!ok) return;

  const btn = form.querySelector("button[type=submit]");
  btn.disabled = true;
  try {
    const data = isRegister ? await API.register(email, password) : await API.login(email, password);
    Auth.setSession(data);
    location.href = data.user.role === "admin" ? "admin.html" : "index.html";
  } catch (err) {
    formError.textContent = err.message;
    btn.disabled = false;
  }
});
