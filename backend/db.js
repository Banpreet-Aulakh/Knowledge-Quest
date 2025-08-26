import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);

const config = hasDatabaseUrl
  ? {
      connectionString: process.env.DATABASE_URL,
      // Render's managed Postgres requires SSL; disable cert validation for convenience
      ssl: { rejectUnauthorized: false },
    }
  : {
      host: process.env.DB_HOST || "localhost",
      port: Number(process.env.DB_PORT) || 5432,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ...(process.env.DB_SSL === "true"
        ? { ssl: { rejectUnauthorized: false } }
        : {}),
    };

const db = new pg.Pool(config);

db.on("connect", () => {
  console.log("Connected to Postgres");
});

db.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
  // Exit so the host (Render) can restart the service
  process.exit(1);
});

db.connect();

export default db;
