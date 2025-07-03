import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import pg from "pg";

dotenv.config();

const app = express();
const port = 3000;

const db = new pg.Client({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

db.connect();

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

const MAX_LEVEL = 99;
const EXP_PER_PAGE = 1;

let userId = 1; // placeholder for more users

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

app.get("/search", async (req, res) => {
  return res.render("search.ejs");
});

app.get("/progress", async (req, res) => {
  return res.render("progress.ejs");
});

app.listen(port, () => {
  console.log(`Knowledge Quest running on port ${[port]}.`);
});

function calculateReqExpToNext(skillLevel) {
  return 0.55 * skillLevel * skillLevel;
}

async function getBookUserSkillData(userId, isbn) {
  const result = await db.query(
    `SELECT b.*, ub.PagesRead, us.ExpGained, us.ExpToNext, us.SkillLevel, us.SkillName
     FROM UserBook ub
     JOIN Book b ON ub.ISBN = b.ISBN
     JOIN UserSkill us ON us.UserID = ub.UserID AND us.SkillName = ub.SkillName
     WHERE ub.UserID = $1 AND b.ISBN = $2`,
    [userId, isbn]
  );
  return result.rows[0];
}

function isValidPagesReadUpdate(newPagesRead, currentPagesRead, totalPages) {
  return (
    Number(newPagesRead) > Number(currentPagesRead) &&
    Number(newPagesRead) <= Number(totalPages)
  );
}

function calculateLevelUp(
  expGained,
  expToNext,
  skillLevel,
  maxLevel,
  pagesDelta
) {
  let totalExp = Number(expGained) + Number(pagesDelta);
  let level = Number(skillLevel);
  let nextExp = Number(expToNext);

  while (totalExp >= nextExp && level < maxLevel) {
    totalExp -= nextExp;
    level += 1;
    nextExp = calculateReqExpToNext(level);
  }

  if (level >= maxLevel) {
    level = maxLevel;
    totalExp = 0;
    nextExp = 0;
  }

  return { totalExp, nextExp, level };
}

async function updateUserBookPages(userId, isbn, pagesRead) {
  await db.query(
    `UPDATE UserBook
     SET PagesRead = $1, LastUpdated = NOW()
     WHERE UserID = $2 AND ISBN = $3`,
    [pagesRead, userId, isbn]
  );
}

async function updateUserSkill(
  userId,
  skillName,
  expGained,
  expToNext,
  skillLevel
) {
  await db.query(
    `UPDATE UserSkill
     SET ExpGained = $1, ExpToNext = $2, SkillLevel = $3
     WHERE UserID = $4 AND SkillName = $5`,
    [expGained, expToNext, skillLevel, userId, skillName]
  );
}
