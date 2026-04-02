/**
 * Cozy login UI behavior:
 * - Toggle show/hide password
 * - Basic validation with inline error messages
 */

const form = document.getElementById("loginForm");
const identityInput = document.getElementById("identity");
const passwordInput = document.getElementById("password");
const togglePasswordBtn = document.getElementById("togglePassword");

const identityErrorEl = document.getElementById("identityError");
const passwordErrorEl = document.getElementById("passwordError");
const formMessageEl = document.getElementById("formMessage");

// A simple, practical email format check (not exhaustive).
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

function setError(inputEl, errorEl, message) {
  errorEl.textContent = message;
  if (message) inputEl.classList.add("is-invalid");
  else inputEl.classList.remove("is-invalid");
}

function clearErrors() {
  setError(identityInput, identityErrorEl, "");
  setError(passwordInput, passwordErrorEl, "");
  if (formMessageEl) {
    formMessageEl.textContent = "";
    formMessageEl.classList.remove("is-error", "is-success");
    formMessageEl.style.display = "none";
  }
}

function validate() {
  const identity = identityInput.value.trim();
  const password = passwordInput.value;

  let ok = true;

  if (!identity) {
    setError(identityInput, identityErrorEl, "Please enter your email or username.");
    ok = false;
  } else if (identity.includes("@")) {
    // Only enforce email format when it clearly looks like an email.
    if (!EMAIL_RE.test(identity)) {
      setError(identityInput, identityErrorEl, "Please enter a valid email address.");
      ok = false;
    } else {
      setError(identityInput, identityErrorEl, "");
    }
  } else if (identity.length < 3) {
    setError(identityInput, identityErrorEl, "Username should be at least 3 characters.");
    ok = false;
  } else {
    setError(identityInput, identityErrorEl, "");
  }

  if (!password.trim()) {
    setError(passwordInput, passwordErrorEl, "Please enter your password.");
    ok = false;
  } else if (password.length < 6) {
    setError(passwordInput, passwordErrorEl, "Password should be at least 6 characters.");
    ok = false;
  } else {
    setError(passwordInput, passwordErrorEl, "");
  }

  return ok;
}

function setFormMessage(type, message) {
  if (!formMessageEl) return;
  formMessageEl.textContent = message;
  formMessageEl.classList.remove("is-error", "is-success");
  formMessageEl.classList.add(type === "success" ? "is-success" : "is-error");
  formMessageEl.style.display = "block";
}

function setPasswordVisibility(visible) {
  passwordInput.type = visible ? "text" : "password";
  togglePasswordBtn.setAttribute("aria-pressed", visible ? "true" : "false");
  togglePasswordBtn.setAttribute("aria-label", visible ? "Hide password" : "Show password");
  togglePasswordBtn.title = visible ? "Hide password" : "Show password";

  // Swap the icon path for a small visual cue.
  const svg = togglePasswordBtn.querySelector("svg");
  if (!svg) return;

  svg.innerHTML = visible
    ? `<path d="M2.1 3.5 3.5 2.1l18.4 18.4-1.4 1.4-3.1-3.1c-1.6.8-3.4 1.2-5.4 1.2-5.5 0-9.7-4.1-11-7 1-2.2 3.6-5.2 7.2-6.5L2.1 3.5Zm6.6 6.6a2.8 2.8 0 0 0 3.9 3.9l-3.9-3.9ZM12 6.9c2 0 3.9.5 5.5 1.3l-2.1 2.1A2.8 2.8 0 0 0 11 9.8l-2.2-2.2c.9-.4 2-.7 3.2-.7Zm8.8 5.1c-1.3 2.9-5.5 7-10.8 7-.9 0-1.8-.1-2.6-.3l2.2-2.2c.1 0 .3 0 .4 0a2.8 2.8 0 0 0 2.8-2.8c0-.1 0-.3 0-.4l3.5-3.5c1.8 1.3 3.1 3 3.7 4.2Z"/>`
    : `<path d="M12 5c5.5 0 9.7 4.1 11 7-1.3 2.9-5.5 7-11 7S2.3 14.9 1 12c1.3-2.9 5.5-7 11-7Zm0 2C7.8 7 4.4 10 3.2 12 4.4 14 7.8 17 12 17s7.6-3 8.8-5C19.6 10 16.2 7 12 7Zm0 2.2A2.8 2.8 0 1 1 9.2 12 2.8 2.8 0 0 1 12 9.2Z"/>`;
}

// Live validation: clear messages as the user fixes input.
identityInput.addEventListener("input", () => {
  const value = identityInput.value.trim();

  if (!value) {
    setError(identityInput, identityErrorEl, "");
    return;
  }

  if (value.includes("@")) {
    setError(identityInput, identityErrorEl, EMAIL_RE.test(value) ? "" : "Please enter a valid email address.");
    return;
  }

  setError(identityInput, identityErrorEl, value.length >= 3 ? "" : "Username should be at least 3 characters.");
});

passwordInput.addEventListener("input", () => {
  const value = passwordInput.value;
  if (!value) {
    setError(passwordInput, passwordErrorEl, "");
    return;
  }
  setError(passwordInput, passwordErrorEl, value.length >= 6 ? "" : "Password should be at least 6 characters.");
});

togglePasswordBtn.addEventListener("click", () => {
  const visible = passwordInput.type === "password";
  setPasswordVisibility(visible);
  passwordInput.focus();
});

form.addEventListener("submit", (e) => {
  e.preventDefault();
  clearErrors();

  if (!validate()) {
    // Move focus to the first invalid input for a smoother UX.
    const firstInvalid = form.querySelector(".is-invalid");
    if (firstInvalid) firstInvalid.focus();
    return;
  }

  // ---- Connect to backend ----
  // If your backend runs on a different port, change this value.
  const API_BASE = "http://localhost:8080";

  const btn = form.querySelector('button[type="submit"]');
  const original = btn.textContent;
  btn.disabled = true;
  btn.textContent = "Logging in…";

  fetch(`${API_BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      identity: identityInput.value.trim(),
      password: passwordInput.value,
    }),
  })
    .then(async (res) => {
      const data = await res.json().catch(() => ({}));
      return { ok: res.ok, status: res.status, data };
    })
    .then(({ ok, data }) => {
      if (!ok) {
        // Field-level errors (if backend sent them)
        if (data?.fieldErrors?.identity) setError(identityInput, identityErrorEl, data.fieldErrors.identity);
        if (data?.fieldErrors?.password) setError(passwordInput, passwordErrorEl, data.fieldErrors.password);

        setFormMessage("error", data?.message || "Login failed.");
        return;
      }

      // Save JWT for subsequent requests (demo).
      if (data?.token) localStorage.setItem("auth_token", data.token);

      setFormMessage("success", "Login successful! Redirecting…");

      // Demo redirect: replace with your real dashboard route/page.
      setTimeout(() => {
        window.location.href = "./dashboard.html";
      }, 700);
    })
    .catch(() => {
      setFormMessage("error", "Couldn’t reach the server. Is it running?");
    })
    .finally(() => {
      btn.disabled = false;
      btn.textContent = original;
    });
});

// Initialize state.
setPasswordVisibility(false);

