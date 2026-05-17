import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { pool } from "./db/pool.js";
import {
  authRouter, beatsRouter, showcasesRouter, mixtapesRouter,
  showsRouter, milestonesRouter, forumRouter, profileRouter,
  analyticsRouter, mvaRouter, musicLinksRouter, adminRouter,
  uploadsRouter, stripeRouter,
} from "./routes/all.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:5173", credentials: true }));
app.use(express.json({ limit: "50mb" }));

app.get("/health", (_req, res) => res.json({ ok: true, version: "1.0.0" }));

app.use("/api/auth", authRouter);
app.use("/api/beats", beatsRouter);
app.use("/api/showcases", showcasesRouter);
app.use("/api/mixtapes", mixtapesRouter);
app.use("/api/shows", showsRouter);
app.use("/api/milestones", milestonesRouter);
app.use("/api/forum", forumRouter);
app.use("/api/profile", profileRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/mva", mvaRouter);
app.use("/api/music-links", musicLinksRouter);
app.use("/api/admin", adminRouter);
app.use("/api/uploads", uploadsRouter);
app.use("/api/stripe", stripeRouter);

app.listen(PORT, () => {
  console.log(`✅ MikupBeats backend on port ${PORT}`);
  pool.connect()
    .then(c => { console.log("✅ PostgreSQL connected"); c.release(); })
    .catch(e => console.error("❌ DB connection failed:", e.message));
});
