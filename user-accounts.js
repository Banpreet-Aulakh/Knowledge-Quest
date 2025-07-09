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
          maxAge: 1000 * 60 * 60 * 24
        }
      })
    );
    app.use(passport.initialize());
    app.use(passport.session());
}
