import express from "express";
import db from "./db.js";
import {
  getBookUserSkillData,
  updateUserBookPages,
  updateUserSkill,
} from "./db-queries.js";
import {
  calculateReqExpToNext,
  isValidPagesReadUpdate,
  calculateLevelUp,
} from "./utils.js";
import {
  initializeLoginMiddleWare,
  attachUserAccountEndpoints,
  setupPassport,
  ensureAuthenticated,
} from "./user-accounts.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;
const MAX_LEVEL = 99;
const EXP_PER_PAGE = 1;

// Middleware
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
initializeLoginMiddleWare(app);

// API Routes
app.get("/api/home", ensureAuthenticated, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT b.*, ub.PagesRead, us.ExpGained, us.ExpToNext
     FROM UserBook ub
     JOIN Book b ON ub.ISBN = b.ISBN
     JOIN UserSkill us ON us.UserID = ub.UserID AND us.SkillName = ub.SkillName
     WHERE ub.UserID = $1
     ORDER BY ub.LastUpdated DESC
     LIMIT 3`,
      [req.user.id]
    );
    res.json({ data: result.rows, user: req.user });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/api/library", ensureAuthenticated, async (req, res) => {
  try {
    // Get incomplete books
    const incomplete = await db.query(
      `SELECT b.*, ub.PagesRead, us.ExpGained, us.ExpToNext
       FROM UserBook ub
       JOIN Book b ON ub.ISBN = b.ISBN
       JOIN UserSkill us ON us.UserID = ub.UserID AND us.SkillName = ub.SkillName
       WHERE ub.UserID = $1 AND ub.PagesRead < b.Pages
       ORDER BY ub.LastUpdated DESC`,
      [req.user.id]
    );
    // Get completed books
    const completed = await db.query(
      `SELECT b.*, ub.PagesRead, us.ExpGained, us.ExpToNext
       FROM UserBook ub
       JOIN Book b ON ub.ISBN = b.ISBN
       JOIN UserSkill us ON us.UserID = ub.UserID AND us.SkillName = ub.SkillName
       WHERE ub.UserID = $1 AND ub.PagesRead = b.Pages
       ORDER BY ub.LastUpdated DESC`,
      [req.user.id]
    );
    res.json({
      data: incomplete.rows,
      completed: completed.rows,
      user: req.user,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/api/user", (req, res) => {
  res.json({ user: req.user });
});

app.get("/api/skills", ensureAuthenticated, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT SkillName, SkillLevel, ExpGained, ExpToNext
       FROM UserSkill
       WHERE UserID = $1
       ORDER BY SkillName ASC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching skills:", err);
    res.status(500).json([]);
  }
});

app.get("/skills", async (req, res) => {
  try {
    const result = await db.query(
      "SELECT SkillName FROM Skill ORDER BY SkillName ASC"
    );
    const skills = result.rows.map((row) => row.skillname);
    res.json(skills);
  } catch (err) {
    console.error("Error fetching skills:", err);
    res.status(500).json([]);
  }
});

app.post("/library/update", ensureAuthenticated, async (req, res) => {
  const pagesRead = Number(req.body.pagesRead);
  const isbn = req.body.isbn;
  try {
    const bookData = await getBookUserSkillData(req.user.id, isbn);

    if (
      !isValidPagesReadUpdate(pagesRead, bookData.pagesread, bookData.pages)
    ) {
      return res.status(400).json({ error: "Invalid pages read update." });
    }

    await updateUserBookPages(req.user.id, isbn, pagesRead);

    if (bookData.skilllevel === MAX_LEVEL) {
      return res.json({
        expGained: 0,
        skill: bookData.skillname,
        levelUp: false,
      });
    }

    const pagesDelta = pagesRead - bookData.pagesread;
    const { totalExp, nextExp, level, leveledUp } = calculateLevelUp(
      bookData.expgained,
      bookData.exptonext,
      bookData.skilllevel,
      MAX_LEVEL,
      pagesDelta
    );

    await updateUserSkill(
      req.user.id,
      bookData.skillname,
      totalExp,
      nextExp,
      level
    );

    res.json({
      expGained: pagesDelta,
      skill: bookData.skillname,
      levelUp: leveledUp || level > bookData.skilllevel,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/library/add", ensureAuthenticated, async (req, res) => {
  try {
    const { title, author, coverurl, pages, subject, isbn } = req.body;
    if (!title || !subject || !isbn || !pages || pages < 1) {
      return res.status(400).json({ error: "Missing or invalid book data." });
    }

    const bookResult = await db.query(
      `INSERT INTO Book (ISBN, Title, Author, CoverURL, Pages)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (ISBN) DO NOTHING
       RETURNING *`,
      [isbn, title, author, coverurl, pages]
    );

    await db.query(
      `INSERT INTO Skill (SkillName)
       VALUES ($1)
       ON CONFLICT (SkillName) DO NOTHING`,
      [subject]
    );

    const userBookResult = await db.query(
      `INSERT INTO UserBook (UserID, ISBN, SkillName, PagesRead, LastUpdated)
       VALUES ($1, $2, $3, 0, NOW())
       ON CONFLICT (UserID, ISBN) DO NOTHING
       RETURNING *`,
      [req.user.id, isbn, subject]
    );

    const initialLevel = 1;
    const initialExp = 0;
    const expToNext = calculateReqExpToNext(initialLevel);
    await db.query(
      `INSERT INTO UserSkill (UserID, SkillName, ExpGained, ExpToNext, SkillLevel)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (UserID, SkillName) DO NOTHING`,
      [req.user.id, subject, initialExp, expToNext, initialLevel]
    );

    if (userBookResult.rowCount === 0) {
      return res.status(409).json({ error: "Book already in your library." });
    }

    res.status(200).json({ success: true, message: "Book added to library" });
  } catch (err) {
    console.error("Error adding book:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Setup Passport and user account endpoints
setupPassport(db);
attachUserAccountEndpoints(app, db);

// Serve React app for all other routes
// Commented out during development - React app runs on separate port
// app.get("*", (req, res) => {
//   res.sendFile(path.join(__dirname, "frontend", "dist", "index.html"));
// });

app.listen(port, () => {
  console.log(`Knowledge Quest running on port ${[port]}.`);
});
