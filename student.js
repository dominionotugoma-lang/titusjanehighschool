
async function loadStudentRecords() {
  const container = document.getElementById("studentRecords");

  try {
    const response = await fetch("/api/admin/students");
    const data = await response.json();

    if (response.status === 401) {
      window.location.href = "login.html";
      return;
    }

    if (response.status === 403) {
      container.textContent = "Administrator access is required.";
      return;
    }

    if (!response.ok) {
      throw new Error(data.error || "Could not load student records.");
    }

    const table = document.createElement("table");
    table.style.width = "100%";

    const headings = [
      "Full Name", "Username", "Email", "Class", "Phone"
    ];

    const headRow = table.insertRow();

    headings.forEach((heading) => {
      const cell = document.createElement("th");
      cell.textContent = heading;
      headRow.appendChild(cell);
    });

    data.students.forEach((student) => {
      const row = table.insertRow();

      [
        student.fullName,
        student.username,
        student.email,
        student.studentClass,
        student.phone
      ].forEach((value) => {
        const cell = row.insertCell();
        cell.textContent = value || "—";
      });
    });

    container.replaceChildren(table);
  } catch (error) {
    container.textContent = error.message;
  }
}

loadStudentRecords();

const REGISTRATION_KEY = "thsDemoRegistrations";
const MANUAL_KEY = "thsDemoStudentRecords";

const sampleStudents = [
  {
    id: "sample-1",
    name: "Emmanuel Obalaja",
    username: "emmanuel_demo",
    studentClass: "SS 2",
    email: "emmanuel@example.com"
  }
];

function readStorage(key, fallback = []) {
  try {
    const value = localStorage.getItem(key);
    if (value === null) return fallback;

    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

const studentForm = document.getElementById("studentForm");
const studentName = document.getElementById("studentName");
const studentUsername = document.getElementById("studentUsername");
const studentClass = document.getElementById("studentClass");
const studentEmail = document.getElementById("studentEmail");
const searchStudents = document.getElementById("searchStudents");
const studentTableBody = document.getElementById("studentTableBody");
const studentCount = document.getElementById("studentCount");
const recordMessage = document.getElementById("recordMessage");

function getAllStudents() {
  const registrations = readStorage(REGISTRATION_KEY);
  const manualRecords = readStorage(MANUAL_KEY, sampleStudents);

  // Registration records take priority over sample/manual records
  // when the username is the same.
  const combined = [...manualRecords];

  registrations.forEach(registration => {
    const existingIndex = combined.findIndex(
      student =>
        student.username.toLowerCase() ===
        registration.username.toLowerCase()
    );

    const normalized = {
      id: registration.id,
      name: registration.name,
      username: registration.username,
      studentClass: registration.studentClass,
      email: registration.email || ""
    };

    if (existingIndex >= 0) {
      combined[existingIndex] = normalized;
    } else {
      combined.push(normalized);
    }
  });

  return combined;
}

function showMessage(text, isError = false) {
  recordMessage.textContent = text;
  recordMessage.style.color = isError ? "#c62828" : "#176b36";
}

function renderStudents() {
  const students = getAllStudents();
  const query = searchStudents.value.trim().toLowerCase();

  const filtered = students.filter(student =>
    [
      student.name,
      student.username,
      student.studentClass,
      student.email
    ].some(value =>
      String(value || "").toLowerCase().includes(query)
    )
  );

  studentTableBody.replaceChildren();

  if (filtered.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");

    cell.colSpan = 5;
    cell.textContent = "No matching student records found.";
    row.appendChild(cell);
    studentTableBody.appendChild(row);
  } else {
    filtered.forEach(student => {
      const row = document.createElement("tr");

      [
        student.name,
        student.username,
        student.studentClass,
        student.email || "Not provided"
      ].forEach(value => {
        const cell = document.createElement("td");
        cell.textContent = value;
        row.appendChild(cell);
      });

      const actionCell = document.createElement("td");
      const deleteButton = document.createElement("button");

      deleteButton.type = "button";
      deleteButton.className = "delete-button";
      deleteButton.textContent = "Delete";

      deleteButton.addEventListener("click", () => {
        deleteStudent(student);
      });

      actionCell.appendChild(deleteButton);
      row.appendChild(actionCell);
      studentTableBody.appendChild(row);
    });
  }

  studentCount.textContent =
    `Showing ${filtered.length} of ${students.length} student records`;
}

studentForm.addEventListener("submit", event => {
  event.preventDefault();

  const name = studentName.value.trim();
  const username = studentUsername.value.trim();
  const selectedClass = studentClass.value;
  const email = studentEmail.value.trim();

  if (!name || !username || !selectedClass) {
    showMessage("Please complete the required fields.", true);
    return;
  }

  const allStudents = getAllStudents();

  if (allStudents.some(student =>
    student.username.toLowerCase() === username.toLowerCase()
  )) {
    showMessage("That username already exists.", true);
    return;
  }

  const manualRecords = readStorage(MANUAL_KEY, sampleStudents);

  manualRecords.push({
    id: `manual-${Date.now()}`,
    name,
    username,
    studentClass: selectedClass,
    email
  });

  try {
    localStorage.setItem(MANUAL_KEY, JSON.stringify(manualRecords));
  } catch {
    showMessage("Could not save this demo record.", true);
    return;
  }

  studentForm.reset();
  searchStudents.value = "";
  showMessage("Demo student record added.");
  renderStudents();
});

function deleteStudent(student) {
  if (!window.confirm(`Delete the record for ${student.name}?`)) {
    return;
  }

  // Remove registrations from the registration list.
  if (student.id.startsWith("registration-")) {
    const registrations = readStorage(REGISTRATION_KEY);
    const updated = registrations.filter(item => item.id !== student.id);

    try {
      localStorage.setItem(REGISTRATION_KEY, JSON.stringify(updated));
    } catch {
      showMessage("Could not update the demo records.", true);
      return;
    }
  } else {
    const manualRecords = readStorage(MANUAL_KEY, sampleStudents);
    const updated = manualRecords.filter(item => item.id !== student.id);

    try {
      localStorage.setItem(MANUAL_KEY, JSON.stringify(updated));
    } catch {
      showMessage("Could not update the demo records.", true);
      return;
    }
  }

  showMessage("Demo record deleted.");
  renderStudents();
}

searchStudents.addEventListener("input", renderStudents);

renderStudents();
