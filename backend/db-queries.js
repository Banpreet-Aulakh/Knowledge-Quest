import db from "./db.js";

export async function getBookUserSkillData(userId, isbn) {
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

export async function updateUserBookPages(userId, isbn, pagesRead) {
  await db.query(
    `UPDATE UserBook
     SET PagesRead = $1, LastUpdated = NOW()
     WHERE UserID = $2 AND ISBN = $3`,
    [pagesRead, userId, isbn]
  );
}

export async function updateUserSkill(userId, skillName, expGained, expToNext, skillLevel) {
  await db.query(
    `UPDATE UserSkill
     SET ExpGained = $1, ExpToNext = $2, SkillLevel = $3
     WHERE UserID = $4 AND SkillName = $5`,
    [expGained, expToNext, skillLevel, userId, skillName]
  );
}
