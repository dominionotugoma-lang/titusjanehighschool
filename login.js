
const loginForm = document.getElementById("loginForm");

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;
  const status = document.getElementById("loginStatus");

  try {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Login failed.");
    }

    window.location.href = result.redirect;
  } catch (error) {
    if (status) {
      status.textContent = error.message;
      status.style.color = "red";
    } else {
      alert(error.message);
    }
  }
});
