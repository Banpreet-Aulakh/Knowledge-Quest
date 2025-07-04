import express from "express";
import db from "./db.js";
import { getBookUserSkillData, updateUserBookPages, updateUserSkill } from "./db-queries.js";
import { calculateReqExpToNext, isValidPagesReadUpdate, calculateLevelUp } from "./utils.js";


const app = express();
const port = 3000;
const MAX_LEVEL = 99;
const EXP_PER_PAGE = 1;
let userId = 1; // placeholder for more users

app.use(express.static("public")); 
app.use(express.urlencoded({ extended: true })); 
app.use(express.json());

app.get("/", async (req, res) => {
  try {
    const result = await db.query(
      `SELECT b.*, ub.PagesRead, us.ExpGained, us.ExpToNext
     FROM UserBook ub
     JOIN Book b ON ub.ISBN = b.ISBN
     JOIN UserSkill us ON us.UserID = ub.UserID AND us.SkillName = ub.SkillName
     WHERE ub.UserID = $1
     ORDER BY ub.LastUpdated DESC
     LIMIT 3`,
      [userId]
    );
    res.render("index.ejs", { data: result.rows });
  } catch (err) {
    console.log(err);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/library", async (req, res) => {
  try {
    const result = await db.query(
      `SELECT b.*, ub.PagesRead, us.ExpGained, us.ExpToNext
       FROM UserBook ub
       JOIN Book b ON ub.ISBN = b.ISBN
       JOIN UserSkill us ON us.UserID = ub.UserID AND us.SkillName = ub.SkillName
       WHERE ub.UserID = $1
       ORDER BY ub.LastUpdated DESC`,
      [userId]
    );
    res.render("library.ejs", { data: result.rows });
  } catch (err) {
    console.log(err);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/library/update", async (req, res) => {
  const pagesRead = Number(req.body.pagesRead);
  const isbn = req.body.isbn;
  try {
    const bookData = await getBookUserSkillData(userId, isbn);

    if (
      !isValidPagesReadUpdate(pagesRead, bookData.pagesread, bookData.pages)
    ) {
      return res.status(400).send("Invalid pages read update.");
    }

    await updateUserBookPages(userId, isbn, pagesRead);

    if (bookData.skilllevel === MAX_LEVEL) {
      return res.redirect("/library");
    }

    const pagesDelta = pagesRead - bookData.pagesread;
    const { totalExp, nextExp, level } = calculateLevelUp(
      bookData.expgained,
      bookData.exptonext,
      bookData.skilllevel,
      MAX_LEVEL,
      pagesDelta
    );

    await updateUserSkill(userId, bookData.skillname, totalExp, nextExp, level);

    res.redirect("/library");
  } catch (err) {
    console.log(err);
    return res.status(500).send("Internal Server Error");
  }
});

app.post("/library/add", async (req, res) => {
  try {
    const { title, author, coverurl, pages, subject, isbn } = req.body;
    if (!title || !subject || !isbn || !pages || pages < 1) {
      return res.status(400).send("Missing or invalid book data.");
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
      [userId, isbn, subject]
    );

    const initialLevel = 1;
    const initialExp = 0;
    const expToNext = calculateReqExpToNext(initialLevel);
    await db.query(
      `INSERT INTO UserSkill (UserID, SkillName, ExpGained, ExpToNext, SkillLevel)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (UserID, SkillName) DO NOTHING`,
      [userId, subject, initialExp, expToNext, initialLevel]
    );

    if (userBookResult.rowCount === 0) {
      return res.status(409).send("Book already in your library.");
    }

    res.status(200).redirect("/library");
  } catch (err) {
    console.error("Error adding book:", err);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/search", async (req, res) => {
  return res.render("search.ejs");
});

app.get("/progress", async (req, res) => {
  return res.render("progress.ejs");
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

app.get("/api/skills", async (req, res) => {
  try {
    const result = await db.query(
      `SELECT SkillName, SkillLevel, ExpGained, ExpToNext
       FROM UserSkill
       WHERE UserID = $1
       ORDER BY SkillName ASC`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching skills:", err);
    res.status(500).json([]);
  }
});

app.listen(port, () => {
  console.log(`Knowledge Quest running on port ${[port]}.`);
});

