import express from "express";
import { Pool } from "pg";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// To get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve React static files from build folder (adjust if your build output folder is different)
app.use(express.static(path.join(__dirname, "../dist")));

// Read environment variables for DB connection
const { DB_USER, DB_HOST, DB_DATABASE, DB_PASSWORD, DB_PORT, NODE_ENV } =
  process.env;

// Validate environment variables
if (!DB_USER || !DB_HOST || !DB_DATABASE || !DB_PASSWORD || !DB_PORT) {
  console.error("Missing one or more required DB environment variables.");
  process.exit(1);
}

// Use SSL only in production (Railway requires this)
const useSSL = NODE_ENV === "production";
console.log(DB_PORT);
const pool = new Pool({
  user: DB_USER,
  host: DB_HOST,
  database: DB_DATABASE,
  password: DB_PASSWORD,
  port: Number(DB_PORT),
  ssl: useSSL ? { rejectUnauthorized: false } : false,
});

// API routes
app.get("/posts", async (req, res) => {
  try {
    console.log(DB_HOST);
    const result = await pool.query("SELECT * FROM posts ORDER BY id DESC");
    console.log(result);
    return res.json(result.rows);
  } catch (error) {
    console.error("Error querying posts:", error);
    res.status(500).json({ error: "Database error" });
  }
});

app.post("/posts", async (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: "Title and content are required" });
  }
  try {
    const result = await pool.query(
      "INSERT INTO posts (title, content) VALUES ($1, $2) RETURNING *",
      [title, content]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error inserting post:", error);
    res.status(500).json({ error: "Database error" });
  }
});

// Catch-all handler to serve React app for all other routes (client-side routing)
// app.get("*", (req, res) => {
  //res.sendFile(path.join(__dirname, "../dist/index.html"));
// });

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
