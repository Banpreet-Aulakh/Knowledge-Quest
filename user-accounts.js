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
    const email = req.body.email;
    const password = req.body.password;
    try {
      const checkResult = await db.query(
        "SELECT * FROM AppUser WHERE email = $1",
        [email]
      );
      if (checkResult.rows.length > 0) {
        req.login(checkResult, (err) => {
          console.log(err);
          res.status(500).send("Account found but error logging in.");
        });
      } else {
        bcrypt.hash(password, saltRounds, async (err, hash) => {
          if (err) {
            console.error("Error hashing password:", err);
          } else {
            const result = await db.query(
              "INSERT INTO AppUser (email, password) VALUES ($1, $2) RETURNING *",
              [email, hash]
            );
            const user = result.rows[0];
            req.login(user, (err) => {
              console.log(err);
              res.redirect("/register");
            });
          }
        });
      }
    } catch (err) {
      console.log(err);
    }
  });

  app.post(
    "/login",
    passport.authenticate("local", {
      successRedirect: "/",
      failureRedirect: "/login",
    })
  );

  app.post("/logout", (req, res) => {
    req.logout(function (err) {
      if (err) {
        return next(err);
      }
      res.redirect("/");
    });
  });
}
export function setupPassport(db) {
  passport.use(
    "local",
    new Strategy({ usernameField: "email" }, async (email, password, cb) => {
      try {
        const result = await db.query(
          "SELECT * FROM AppUser WHERE email = $1",
          [email]
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
  if (!req.user || !req.user.id) {
    return res.redirect("/login");
  }
  next();
}
