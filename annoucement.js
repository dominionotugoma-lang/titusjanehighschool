
const STORAGE_KEY = "thsDemoAnnouncements";

const announcementForm = document.getElementById("announcementForm");
const announcementList = document.getElementById("announcementList");
const emptyMessage = document.getElementById("emptyMessage");
const message = document.getElementById("message");

document.getElementById("year").textContent =
  new Date().getFullYear();

function loadAnnouncements() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === null) return [];

    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

let announcements = loadAnnouncements();

function saveAnnouncements() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(announcements));
    return true;
  } catch {
    showMessage("Unable to save the announcement in this browser.", true);
    return false;
  }
}

function showMessage(text, isError = false) {
  message.textContent = text;
  message.style.color = isError ? "#b42318" : "#176b36";
}

function renderAnnouncements() {
  announcementList.replaceChildren();

  if (announcements.length === 0) {
    emptyMessage.textContent =
      "There are no announcements yet. Add one using the form below.";
    return;
  }

  emptyMessage.textContent = "";

  const newestFirst = [...announcements].sort(
    (a, b) => b.createdAt - a.createdAt
  );

  newestFirst.forEach(item => {
    const article = document.createElement("article");
    article.className = "announcement";

    const category = document.createElement("span");
    category.className = "category";
    category.textContent = item.category;

    const title = document.createElement("h3");
    title.textContent = item.title;

    const meta = document.createElement("p");
    meta.className = "announcement-meta";
    meta.textContent = new Date(item.createdAt).toLocaleString();

    const body = document.createElement("p");
    // textContent prevents entered text from being interpreted as HTML.
    body.textContent = item.body;
    body.style.whiteSpace = "pre-wrap";

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "delete-button";
    deleteButton.textContent = "Delete Demo Announcement";

    deleteButton.addEventListener("click", () => {
      deleteAnnouncement(item.id);
    });

    article.append(category, title, meta, body, deleteButton);
    announcementList.appendChild(article);
  });
}

announcementForm.addEventListener("submit", event => {
  event.preventDefault();

  const title = document.getElementById("announcementTitle")
    .value.trim();

  const category = document.getElementById("announcementCategory").value;

  const body = document.getElementById("announcementBody")
    .value.trim();

  if (!title || !category || !body) {
    showMessage("Please complete all fields.", true);
    return;
  }

  const announcement = {
    id: `announcement-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    title,
    category,
    body,
    createdAt: Date.now()
  };

  announcements.push(announcement);

  if (!saveAnnouncements()) {
    announcements.pop();
    return;
  }

  announcementForm.reset();
  showMessage("Demo announcement published successfully.");
  renderAnnouncements();
});

function deleteAnnouncement(id) {
  const item = announcements.find(announcement => announcement.id === id);
  if (!item) return;

  if (!window.confirm(`Delete "${item.title}"?`)) return;

  const previous = announcements;
  announcements = announcements.filter(item => item.id !== id);

  if (!saveAnnouncements()) {
    announcements = previous;
    return;
  }

  showMessage("Demo announcement deleted.");
  renderAnnouncements();
}

renderAnnouncements();
