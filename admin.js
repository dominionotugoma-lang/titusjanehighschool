
document.getElementById("adminYear").textContent =
  new Date().getFullYear();

// This is a front-end demo. These counters are placeholders,
// not counts of real student or school records.
document.getElementById("studentCount").textContent = "0";
document.getElementById("announcementCount").textContent = "0";

document.getElementById("adminLogout").addEventListener("click", () => {
  window.location.href = "index.html";
});

async function verifyAdministrator() {
  try {
    const response = await fetch("/api/me");

    if (response.status === 401) {
      window.location.href = "login.html";
      return;
    }

    const data = await response.json();

    if (!response.ok || data.user.role !== "admin") {
      window.location.href = "dashboard.html";
    }
  } catch {
    document.body.textContent =
      "Unable to verify your account. Please start the server and try again.";
  }
}

verifyAdministrator();
