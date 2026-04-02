import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs/promises";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const DB_PATH = path.join(process.cwd(), "users.json");
const JWT_SECRET = process.env.JWT_SECRET || "cozy_secret_key";

async function readDb() {
  try {
    const data = await fs.readFile(DB_PATH, "utf-8");
    return JSON.parse(data);
  } catch {
    return { users: [] };
  }
}

async function writeDb(db: any) {
  await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2));
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.post("/api/register", async (req, res) => {
    const { email, username, password } = req.body;
    const db = await readDb();
    
    if (db.users.find((u: any) => u.email === email || u.username === username)) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = { id: Date.now().toString(), email, username, password: hashedPassword };
    db.users.push(newUser);
    await writeDb(db);

    const token = jwt.sign({ userId: newUser.id }, JWT_SECRET);
    res.json({ token, user: { id: newUser.id, email, username } });
  });

  app.post("/api/login", async (req, res) => {
    const { identity, password } = req.body;
    const db = await readDb();
    const user = db.users.find((u: any) => u.email === identity || u.username === identity);

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET);
    res.json({ token, user: { id: user.id, email: user.email, username: user.username } });
  });

  app.get("/api/users/search", async (req, res) => {
    const { q } = req.query;
    if (!q) return res.status(400).json({ message: "Query required" });

    const db = await readDb();
    const user = db.users.find((u: any) => 
      u.email.toLowerCase() === (q as string).toLowerCase() || 
      u.username.toLowerCase() === (q as string).toLowerCase()
    );

    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ user: { email: user.email, username: user.username } });
  });

  // Vite middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
