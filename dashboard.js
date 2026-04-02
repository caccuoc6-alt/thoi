/**
 * Demo dashboard:
 * - Reads JWT from localStorage
 * - Redirects back to login if missing
 * - Provides logout button
 */

const token = localStorage.getItem("auth_token");
const tokenPreview = document.getElementById("tokenPreview");
const dashMessage = document.getElementById("dashMessage");
const logoutBtn = document.getElementById("logoutBtn");

function setMessage(type, message) {
  dashMessage.textContent = message;
  dashMessage.classList.remove("is-error", "is-success");
  dashMessage.classList.add(type === "success" ? "is-success" : "is-error");
}

if (!token) {
  setMessage("error", "No session found. Please log in.");
  setTimeout(() => {
    window.location.href = "./index.html";
  }, 650);
} else {
  setMessage("success", "Session OK. Welcome!");
  tokenPreview.value = token;
}

logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("auth_token");
  window.location.href = "./index.html";
});

