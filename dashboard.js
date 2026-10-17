
async function verifyStudent() {
  try {
    const response = await fetch("/api/me");

    if (response.status === 401) {
      window.location.href = "login.html";
      return;
    }

    const data = await response.json();

    if (!response.ok || data.user.role !== "student") {
      window.location.href = "admin.html";
      return;
    }

    const welcome = document.getElementById("welcomeUsername");

    if (welcome) {
      welcome.textContent = data.user.fullName;
    }
  } catch {
    document.body.textContent =
      "Unable to verify your account. Please start the server and try again.";
  }
}

verifyStudent();

document.getElementById("logoutButton")?.addEventListener("click", async () => {
  await fetch("/api/logout", { method: "POST" });
  window.location.href = "login.html";
});
