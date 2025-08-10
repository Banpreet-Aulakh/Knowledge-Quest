import bcrypt from "bcrypt";
import passport from "passport";
import session from "express-session";
import { Strategy } from "passport-local";

const saltRounds = 10;

export function initializeLoginMiddleWare(app) {
  app.use(
    session({
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: true,
      cookie: {
        maxAge: 1000 * 60 * 60 * 24,
      },
    })
  );
  app.use(passport.initialize());
  app.use(passport.session());
}

export function attachUserAccountEndpoints(app, db) {
  app.post("/register", async (req, res) => {
    const email = req.body.username; // Frontend sends username, but we'll use it as email
    const password = req.body.password;
    try {
      const checkResult = await db.query(
        "SELECT * FROM AppUser WHERE email = $1",
        [email]
      );
      if (checkResult.rows.length > 0) {
        return res.status(400).json({ error: "Email already exists" });
      } else {
        bcrypt.hash(password, saltRounds, async (err, hash) => {
          if (err) {
            console.error("Error hashing password:", err);
            return res.status(500).json({ error: "Internal server error" });
          } else {
            try {
              const result = await db.query(
                "INSERT INTO AppUser (email, password) VALUES ($1, $2) RETURNING *",
                [email, hash]
              );
              const user = result.rows[0];
              req.login(user, (err) => {
                if (err) {
                  console.log(err);
                  return res.status(500).json({ error: "Error logging in after registration" });
                }
                res.json({ user: user });
              });
            } catch (insertErr) {
              console.log(insertErr);
              return res.status(500).json({ error: "Error creating user" });
            }
          }
        });
      }
    } catch (err) {
      console.log(err);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post(
    "/login",
    passport.authenticate("local", { session: true }),
    (req, res) => {
      res.json({ user: req.user });
    }
  );

  app.post("/logout", (req, res, next) => {
    req.logout(function (err) {
      if (err) {
        return next(err);
      }
      res.json({ success: true });
    });
  });
}

export function setupPassport(db) {
  passport.use(
    "local",
    new Strategy({ usernameField: "username" }, async (username, password, cb) => {
      try {
        const result = await db.query(
          "SELECT * FROM AppUser WHERE email = $1",
          [username] // Frontend sends username, but we'll use it as email
        );
        console.log("LOGGING IN");
        if (result.rows.length > 0) {
          const user = result.rows[0];
          const storedHashedPassword = user.password;
          bcrypt.compare(password, storedHashedPassword, (err, result) => {
            if (err) {
              return cb(err);
            } else {
              if (result) {
                return cb(null, user);
              } else {
                return cb(null, false);
              }
            }
          });
        } else {
          return cb("User not found");
        }
      } catch (err) {
        return cb(err);
      }
    })
  );
  passport.serializeUser((user, cb) => {
    cb(null, user.id); // Save only the user ID
  });

  passport.deserializeUser(async (id, cb) => {
    try {
      const result = await db.query("SELECT * FROM AppUser WHERE id = $1", [
        id,
      ]);
      if (result.rows.length > 0) {
        cb(null, result.rows[0]);
      } else {
        cb("User not found");
      }
    } catch (err) {
      cb(err);
    }
  });
}

export function ensureAuthenticated(req, res, next) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  next();
}
