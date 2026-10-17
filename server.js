
require("dotenv").config();

const express = require("express");
const session = require("express-session");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const bcrypt = require("bcryptjs");
const Database = require("better-sqlite3");
const path = require("path");

const app = express();
const PORT = Number(process.env.PORT) || 3000;

if (
  !process.env.SESSION_SECRET ||
  process.env.SESSION_SECRET.length < 32 ||
  !process.env.ADMIN_PASSWORD ||
  process.env.ADMIN_PASSWORD.includes("replace_this")
) {
  throw new Error(
    "Set a long SESSION_SECRET and a strong ADMIN_PASSWORD in .env first."
  );
}

const db = new Database(path.join(__dirname, "school.db"));

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// Create the database tables if they do not exist.
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    username TEXT NOT NULL COLLATE NOCASE UNIQUE,
    email TEXT NOT NULL COLLATE NOCASE UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'student'
      CHECK (role IN ('student', 'admin')),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE,
    student_class TEXT NOT NULL,
    phone TEXT NOT NULL DEFAULT '',
    gender TEXT NOT NULL DEFAULT '',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    subject TEXT NOT NULL,
    term TEXT NOT NULL,
    session_name TEXT NOT NULL,
    score REAL NOT NULL CHECK (score >= 0 AND score <= 100),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    UNIQUE (student_id, subject, term, session_name)
  );
`);

// Create the administrator account if it does not already exist.
// If you change ADMIN_PASSWORD later, this does not reset the old password.
const adminExists = db.prepare(
  "SELECT id FROM users WHERE username = ?"
).get(process.env.ADMIN_USERNAME || "schooladmin");

if (!adminExists) {
  const adminHash = bcrypt.hashSync(process.env.ADMIN_PASSWORD, 12);

  db.prepare(`
    INSERT INTO users (full_name, username, email, password_hash, role)
    VALUES (?, ?, ?, ?, 'admin')
  `).run(
    "School Administrator",
    process.env.ADMIN_USERNAME || "schooladmin",
    "admin@titusjane.invalid",
    adminHash
  );
}

app.disable("x-powered-by");
app.use(helmet());
app.use(express.json({ limit: "20kb" }));
app.use(express.urlencoded({ extended: false, limit: "20kb" }));

// This default session store is suitable only for local development.
// Replace it with a persistent session store before public deployment.
app.use(session({
  name: "ths.sid",
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: 1000 * 60 * 60 * 2
  }
}));

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many attempts. Please try again later." }
});

const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false
});

function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ error: "Please log in first." });
  }

  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.user || req.session.user.role !== "admin") {
    return res.status(403).json({
      error: "Administrator access is required."
    });
  }

  next();
}

function cleanText(value, maxLength = 100) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

// Health check: open /api/status to check the server.
app.get("/api/status", (req, res) => {
  res.json({
    success: true,
    message: "Titusjane High School backend is running."
  });
});

// Student registration.
app.post("/api/register", registrationLimiter, async (req, res) => {
  try {
    const fullName = cleanText(req.body.fullName, 100);
    const username = cleanText(req.body.username, 40);
    const email = cleanText(req.body.email, 150).toLowerCase();
    const phone = cleanText(req.body.phone, 30);
    const studentClass = cleanText(req.body.studentClass, 30);
    const gender = cleanText(req.body.gender, 30);
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;

    if (
      !fullName || !username || !email || !studentClass ||
      typeof password !== "string" ||
      typeof confirmPassword !== "string"
    ) {
      return res.status(400).json({
        error: "Please complete all required fields."
      });
    }

    if (!/^[a-zA-Z0-9_.-]{3,40}$/.test(username)) {
      return res.status(400).json({
        error: "Username must be 3–40 characters using letters, numbers, dots, underscores, or hyphens."
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "Enter a valid email address." });
    }

    if (password.length < 8 || password.length > 72) {
      return res.status(400).json({
        error: "Password must be between 8 and 72 characters."
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match." });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const createStudent = db.transaction(() => {
      const user = db.prepare(`
        INSERT INTO users
          (full_name, username, email, password_hash, role)
        VALUES (?, ?, ?, ?, 'student')
      `).run(fullName, username, email, passwordHash);

      db.prepare(`
        INSERT INTO students (user_id, student_class, phone, gender)
        VALUES (?, ?, ?, ?)
      `).run(user.lastInsertRowid, studentClass, phone, gender);
    });

    createStudent();

    res.status(201).json({
      success: true,
      message: "Registration completed. You can now log in."
    });
  } catch (error) {
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return res.status(409).json({
        error: "That username or email is already registered."
      });
    }

    console.error("Registration error:", error.message);
    res.status(500).json({ error: "Registration failed." });
  }
});

// Login for both students and the administrator.
app.post("/api/login", loginLimiter, async (req, res, next) => {
  try {
    const username = cleanText(req.body.username, 40);
    const password = req.body.password;

    if (!username || typeof password !== "string") {
      return res.status(400).json({
        error: "Enter your username and password."
      });
    }

    const user = db.prepare(`
      SELECT id, full_name, username, password_hash, role
      FROM users
      WHERE username = ?
    `).get(username);

    const validPassword = user
      ? await bcrypt.compare(password, user.password_hash)
      : false;

    if (!user || !validPassword) {
      return res.status(401).json({
        error: "Incorrect username or password."
      });
    }

    // Regenerate the session after successful authentication.
    req.session.regenerate((error) => {
      if (error) return next(error);

      req.session.user = {
        id: user.id,
        fullName: user.full_name,
        username: user.username,
        role: user.role
      };

      req.session.save((saveError) => {
        if (saveError) return next(saveError);

        res.json({
          success: true,
          user: req.session.user,
          redirect: user.role === "admin"
            ? "admin.html"
            : "dashboard.html"
        });
      });
    });
  } catch (error) {
    next(error);
  }
});

// Check who is logged in.
app.get("/api/me", requireLogin, (req, res) => {
  res.json({ user: req.session.user });
});

// Logout.
app.post("/api/logout", requireLogin, (req, res, next) => {
  req.session.destroy((error) => {
    if (error) return next(error);

    res.clearCookie("ths.sid", {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production"
    });

    res.json({ success: true, message: "You have logged out." });
  });
});

// Student can only view their own results.
app.get("/api/results/me", requireLogin, (req, res) => {
  if (req.session.user.role !== "student") {
    return res.status(403).json({
      error: "Log in with a student account to view student results."
    });
  }

  const student = db.prepare(`
    SELECT id, student_class
    FROM students
    WHERE user_id = ?
  `).get(req.session.user.id);

  if (!student) {
    return res.status(404).json({ error: "Student record not found." });
  }

  const results = db.prepare(`
    SELECT subject, term, session_name AS session, score
    FROM results
    WHERE student_id = ?
    ORDER BY session_name DESC, term, subject
  `).all(student.id);

  res.json({
    studentClass: student.student_class,
    results
  });
});

// Administrator can list student records.
app.get("/api/admin/students", requireLogin, requireAdmin, (req, res) => {
  const students = db.prepare(`
    SELECT
      u.id AS userId,
      u.full_name AS fullName,
      u.username,
      u.email,
      s.student_class AS studentClass,
      s.phone,
      s.gender,
      u.created_at AS registeredAt
    FROM users u
    JOIN students s ON s.user_id = u.id
    ORDER BY u.created_at DESC
  `).all();

  res.json({ students });
});

// Administrator can add or update a student's subject result.
app.post("/api/admin/results", requireLogin, requireAdmin, (req, res) => {
  const username = cleanText(req.body.username, 40);
  const subject = cleanText(req.body.subject, 80);
  const term = cleanText(req.body.term, 40);
  const sessionName = cleanText(req.body.session, 30);
  const score = Number(req.body.score);

  if (
    !username || !subject || !term || !sessionName ||
    !Number.isFinite(score) || score < 0 || score > 100
  ) {
    return res.status(400).json({
      error: "Provide a username, subject, term, session, and score from 0 to 100."
    });
  }

  const student = db.prepare(`
    SELECT s.id
    FROM students s
    JOIN users u ON u.id = s.user_id
    WHERE u.username = ?
  `).get(username);

  if (!student) {
    return res.status(404).json({
      error: "No student was found with that username."
    });
  }

  db.prepare(`
    INSERT INTO results (student_id, subject, term, session_name, score)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(student_id, subject, term, session_name)
    DO UPDATE SET score = excluded.score
  `).run(student.id, subject, term, sessionName, score);

  res.status(201).json({
    success: true,
    message: "Student result saved."
  });
});

// Administrator can see all results.
app.get("/api/admin/results", requireLogin, requireAdmin, (req, res) => {
  const results = db.prepare(`
    SELECT
      u.full_name AS fullName,
      u.username,
      s.student_class AS studentClass,
      r.subject,
      r.term,
      r.session_name AS session,
      r.score
    FROM results r
    JOIN students s ON s.id = r.student_id
    JOIN users u ON u.id = s.user_id
    ORDER BY u.full_name, r.session_name DESC, r.subject
  `).all();

  res.json({ results });
});

// Serve the existing website files.
app.use(express.static(__dirname));

app.use((err, req, res, next) => {
  console.error("Server error:", err.message);

  if (res.headersSent) return next(err);

  res.status(500).json({ error: "An unexpected server error occurred." });
});

app.listen(PORT, () => {
  console.log(`Titusjane High School is running at http://localhost:${PORT}`);
});

app.use((req, res, next) => {
  const privateFiles = [
    "/server.js",
    "/package.json",
    "/package-lock.json",
    "/.env",
    "/.gitignore",
    "/school.db",
    "/school.db-shm",
    "/school.db-wal"
  ];

  if (privateFiles.includes(req.path)) {
    return res.sendStatus(404);
  }

  next();
});
