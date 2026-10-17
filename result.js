const resultsStatus = document.getElementById("resultsStatus");
const resultsContainer = document.getElementById("resultsContainer");

async function loadMyResults() {
  try {
    const response = await fetch("/api/results/me");
    const data = await response.json();

    if (response.status === 401) {
      window.location.href = "login.html";
      return;
    }

    if (!response.ok) {
      throw new Error(data.error || "Could not load results.");
    }

    resultsStatus.textContent =
      "Class: " + data.studentClass;

    if (data.results.length === 0) {
      resultsContainer.textContent =
        "No results have been published for your account yet.";
      return;
    }

    const table = document.createElement("table");
    table.style.width = "100%";
    table.style.borderCollapse = "collapse";

    const header = table.insertRow();
    ["Subject", "Term", "Session", "Score"].forEach((label) => {
      const th = document.createElement("th");
      th.textContent = label;
      th.style.padding = "10px";
      th.style.borderBottom = "2px solid #073b83";
      th.style.textAlign = "left";
      header.appendChild(th);
    });

    data.results.forEach((result) => {
      const row = table.insertRow();

      [
        result.subject,
        result.term,
        result.session,
        result.score + "/100"
      ].forEach((value) => {
        const cell = row.insertCell();
        cell.textContent = value;
        cell.style.padding = "10px";
        cell.style.borderBottom = "1px solid #ddd";
      });
    });

    resultsContainer.replaceChildren(table);
  } catch (error) {
    resultsStatus.textContent = error.message;
  }
}

loadMyResults();

const databaseResultForm =
  document.getElementById("databaseResultForm");

databaseResultForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const status = document.getElementById("databaseResultStatus");
  const formData = new FormData(databaseResultForm);
  const data = Object.fromEntries(formData.entries());

  data.score = Number(data.score);

  try {
    const response = await fetch("/api/admin/results", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (response.status === 401) {
      window.location.href = "login.html";
      return;
    }

    if (!response.ok) {
      throw new Error(result.error || "Could not save result.");
    }

    status.textContent = result.message;
    status.style.color = "green";
    databaseResultForm.reset();
  } catch (error) {
    status.textContent = error.message;
    status.style.color = "red";
  }
});
