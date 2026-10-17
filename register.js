const registerForm = document.getElementById("registerForm");

registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData(registerForm);
  const data = Object.fromEntries(formData.entries());

  const status = document.getElementById("registerStatus");

  try {
    const response = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Registration failed.");
    }

    if (status) {
      status.textContent = result.message;
      status.style.color = "green";
    } else {
      alert(result.message);
    }

    registerForm.reset();

    // Send the student to the real login page.
    window.location.href = "login.html";
  } catch (error) {
    if (status) {
      status.textContent = error.message;
      status.style.color = "red";
    } else {
      alert(error.message);
    }
  }
});
