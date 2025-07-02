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

    console.log(result.rows);
    res.render("index.ejs", { data: result.rows });
  } catch (err) {
    console.log(err);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/library", async (req, res) => {
  return res.render("library.ejs");
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
