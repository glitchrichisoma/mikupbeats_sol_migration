import { Router } from "express";
import { OAuth2Client } from "google-auth-library";
import { pool } from "../db/pool.js";
import { requireAuth, requireAdmin, signToken, isAdminEmail } from "../middleware/auth.js";
import { v4 as uuid } from "uuid";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const s3 = new S3Client({
  endpoint: process.env.B2_ENDPOINT,
  region: process.env.B2_REGION || "us-west-004",
  credentials: { accessKeyId: process.env.B2_KEY_ID!, secretAccessKey: process.env.B2_APP_KEY! },
});
const BUCKET = process.env.B2_BUCKET_NAME!;

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authRouter = Router();

authRouter.post("/google", async (req, res) => {
  try {
    const { idToken } = req.body;
    const ticket = await googleClient.verifyIdToken({ idToken, audience: process.env.GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
    if (!payload?.email) return res.status(400).json({ error: "Invalid token" });
    const { email, name, picture, sub: googleId } = payload;
    const admin = isAdminEmail(email);
    const result = await pool.query(
      `INSERT INTO users (id,email,display_name,avatar_url,google_id,is_admin)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (google_id) DO UPDATE SET email=EXCLUDED.email,is_admin=$6
       RETURNING id,email,display_name,avatar_url,is_admin`,
      [uuid(), email, name, picture, googleId, admin]
    );
    const user = result.rows[0];
    res.json({ token: signToken(user), user });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

authRouter.get("/me", requireAuth, async (req, res) => {
  const r = await pool.query("SELECT id,email,display_name,avatar_url,is_admin FROM users WHERE id=$1", [req.user!.id]);
  res.json(r.rows[0] || null);
});

// ── Beats ─────────────────────────────────────────────────────────────────────
export const beatsRouter = Router();

beatsRouter.get("/", async (_req, res) => {
  const r = await pool.query("SELECT * FROM beats ORDER BY created_at DESC");
  res.json(r.rows);
});
beatsRouter.get("/featured", async (_req, res) => {
  const r = await pool.query("SELECT * FROM beats WHERE is_featured=TRUE LIMIT 1");
  res.json(r.rows[0] || null);
});
beatsRouter.get("/:id", async (req, res) => {
  const r = await pool.query("SELECT * FROM beats WHERE id=$1", [req.params.id]);
  res.json(r.rows[0] || null);
});
beatsRouter.post("/filter", async (req, res) => {
  // Simple filter — extend as needed
  const { category, style, texture } = req.body || {};
  let q = "SELECT * FROM beats WHERE 1=1";
  const params: any[] = [];
  if (category) { params.push(category); q += ` AND category=$${params.length}`; }
  if (style) { params.push(style); q += ` AND style=$${params.length}`; }
  if (texture) { params.push(texture); q += ` AND texture=$${params.length}`; }
  q += " ORDER BY created_at DESC";
  const r = await pool.query(q, params);
  res.json(r.rows);
});
beatsRouter.post("/", requireAdmin, async (req, res) => {
  const { id, title, artist, category, style, texture, deliveryMethod, coverArt, preview, rightsFolders } = req.body;
  const r = await pool.query(
    `INSERT INTO beats(id,title,artist,category,style,texture,delivery_method,cover_art,preview,rights_folders)
     VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [id||uuid(), title, artist, category, style, texture, deliveryMethod||"zipFiles",
     JSON.stringify(coverArt||[]), JSON.stringify(preview||{}), JSON.stringify(rightsFolders||[])]
  );
  res.json(r.rows[0]);
});
beatsRouter.put("/:id", requireAdmin, async (req, res) => {
  const { title, artist, category, style, texture, deliveryMethod, coverArt, preview, rightsFolders } = req.body;
  const r = await pool.query(
    `UPDATE beats SET title=$1,artist=$2,category=$3,style=$4,texture=$5,
     delivery_method=$6,cover_art=$7,preview=$8,rights_folders=$9,updated_at=NOW() WHERE id=$10 RETURNING *`,
    [title, artist, category, style, texture, deliveryMethod,
     JSON.stringify(coverArt), JSON.stringify(preview), JSON.stringify(rightsFolders), req.params.id]
  );
  res.json(r.rows[0]);
});
beatsRouter.delete("/:id", requireAdmin, async (req, res) => {
  await pool.query("DELETE FROM beats WHERE id=$1", [req.params.id]);
  res.json({ ok: true });
});
beatsRouter.post("/:id/featured", requireAdmin, async (req, res) => {
  await pool.query("UPDATE beats SET is_featured=FALSE");
  await pool.query("UPDATE beats SET is_featured=TRUE WHERE id=$1", [req.params.id]);
  res.json({ ok: true });
});
beatsRouter.delete("/featured/clear", requireAdmin, async (_req, res) => {
  await pool.query("UPDATE beats SET is_featured=FALSE");
  res.json({ ok: true });
});
beatsRouter.post("/:id/unmark-rights", requireAdmin, async (req, res) => {
  const { rightsType } = req.body;
  const beat = await pool.query("SELECT rights_folders FROM beats WHERE id=$1", [req.params.id]);
  const folders = beat.rows[0]?.rights_folders || [];
  const updated = folders.map((f: any) => f.rightsType === rightsType ? { ...f, soldExclusive: false } : f);
  await pool.query("UPDATE beats SET rights_folders=$1 WHERE id=$2", [JSON.stringify(updated), req.params.id]);
  res.json({ ok: true });
});

// ── Showcases ─────────────────────────────────────────────────────────────────
export const showcasesRouter = Router();

showcasesRouter.get("/highlights", async (_req, res) => {
  const r = await pool.query(`SELECT sh.*,s.song_name,s.artist_name,s.audio_url,s.cover_art_url
    FROM showcase_highlights sh JOIN showcases s ON sh.showcase_id=s.id ORDER BY sh.pinned_at DESC`);
  res.json(r.rows);
});
showcasesRouter.post("/highlights", requireAdmin, async (req, res) => {
  const { id, showcaseId } = req.body;
  const r = await pool.query("INSERT INTO showcase_highlights(id,showcase_id) VALUES($1,$2) RETURNING *", [id||uuid(), showcaseId]);
  res.json(r.rows[0]);
});
showcasesRouter.delete("/highlights/:id", requireAdmin, async (req, res) => {
  await pool.query("DELETE FROM showcase_highlights WHERE id=$1", [req.params.id]);
  res.json({ ok: true });
});
showcasesRouter.get("/approved", async (_req, res) => {
  const r = await pool.query(`SELECT s.*,u.display_name as uploader_name FROM showcases s
    LEFT JOIN users u ON s.uploader_id=u.id WHERE s.approved=TRUE ORDER BY s.created_at DESC`);
  res.json(r.rows);
});
showcasesRouter.get("/pending", requireAdmin, async (_req, res) => {
  const r = await pool.query(`SELECT s.*,u.display_name as uploader_name FROM showcases s
    LEFT JOIN users u ON s.uploader_id=u.id WHERE s.approved=FALSE ORDER BY s.created_at DESC`);
  res.json(r.rows);
});
showcasesRouter.post("/", requireAuth, async (req, res) => {
  const { id, songName, artistName, category, style, texture, beatId, audioUrl, coverArtUrl, externalLink } = req.body;
  const r = await pool.query(
    `INSERT INTO showcases(id,song_name,artist_name,category,style,texture,beat_id,audio_url,cover_art_url,external_link,uploader_id)
     VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
    [id||uuid(), songName, artistName, category, style, texture, beatId, audioUrl, coverArtUrl, externalLink, req.user!.id]
  );
  res.json(r.rows[0]);
});
showcasesRouter.post("/:id/approve", requireAdmin, async (req, res) => {
  await pool.query("UPDATE showcases SET approved=TRUE WHERE id=$1", [req.params.id]);
  res.json({ ok: true });
});
showcasesRouter.delete("/:id", requireAdmin, async (req, res) => {
  await pool.query("DELETE FROM showcases WHERE id=$1", [req.params.id]);
  res.json({ ok: true });
});

// ── Mixtapes ──────────────────────────────────────────────────────────────────
export const mixtapesRouter = Router();

mixtapesRouter.get("/", async (_req, res) => {
  const r = await pool.query("SELECT * FROM mixtapes WHERE approved=TRUE ORDER BY created_at DESC");
  res.json(r.rows);
});
mixtapesRouter.get("/pending", requireAdmin, async (_req, res) => {
  const r = await pool.query("SELECT * FROM mixtapes WHERE approved=FALSE ORDER BY created_at DESC");
  res.json(r.rows);
});
mixtapesRouter.post("/", requireAuth, async (req, res) => {
  const { id, title, artistName, description, coverArtUrl, songUrls, externalLinks } = req.body;
  const r = await pool.query(
    `INSERT INTO mixtapes(id,title,artist_name,description,cover_art_url,song_urls,external_links,uploader_id)
     VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [id||uuid(), title, artistName, description, coverArtUrl, JSON.stringify(songUrls||[]), JSON.stringify(externalLinks||[]), req.user!.id]
  );
  res.json(r.rows[0]);
});
mixtapesRouter.post("/:id/approve", requireAdmin, async (req, res) => {
  await pool.query("UPDATE mixtapes SET approved=TRUE WHERE id=$1", [req.params.id]);
  res.json({ ok: true });
});
mixtapesRouter.delete("/:id", requireAdmin, async (req, res) => {
  await pool.query("DELETE FROM mixtapes WHERE id=$1", [req.params.id]);
  res.json({ ok: true });
});

// ── Shows ─────────────────────────────────────────────────────────────────────
export const showsRouter = Router();
showsRouter.get("/", async (_req, res) => {
  const r = await pool.query("SELECT * FROM shows ORDER BY date ASC");
  res.json(r.rows);
});
showsRouter.post("/", requireAdmin, async (req, res) => {
  const { id, title, date, time, description } = req.body;
  const r = await pool.query("INSERT INTO shows(id,title,date,time,description) VALUES($1,$2,$3,$4,$5) RETURNING *", [id||uuid(), title, date, time, description]);
  res.json(r.rows[0]);
});
showsRouter.put("/:id", requireAdmin, async (req, res) => {
  const { title, date, time, description } = req.body;
  const r = await pool.query("UPDATE shows SET title=$1,date=$2,time=$3,description=$4 WHERE id=$5 RETURNING *", [title, date, time, description, req.params.id]);
  res.json(r.rows[0]);
});
showsRouter.delete("/:id", requireAdmin, async (req, res) => {
  await pool.query("DELETE FROM shows WHERE id=$1", [req.params.id]);
  res.json({ ok: true });
});

// ── Milestones ────────────────────────────────────────────────────────────────
export const milestonesRouter = Router();
milestonesRouter.get("/", async (_req, res) => {
  const r = await pool.query("SELECT * FROM milestones ORDER BY sort_order ASC");
  res.json(r.rows);
});
milestonesRouter.post("/", requireAdmin, async (req, res) => {
  const { id, title, description, date, completed, sort_order } = req.body;
  const r = await pool.query("INSERT INTO milestones(id,title,description,date,completed,sort_order) VALUES($1,$2,$3,$4,$5,$6) RETURNING *", [id||uuid(), title, description, date, !!completed, sort_order||0]);
  res.json(r.rows[0]);
});
milestonesRouter.put("/:id", requireAdmin, async (req, res) => {
  const { title, description, date, completed, sort_order } = req.body;
  const r = await pool.query("UPDATE milestones SET title=$1,description=$2,date=$3,completed=$4,sort_order=$5 WHERE id=$6 RETURNING *", [title, description, date, !!completed, sort_order, req.params.id]);
  res.json(r.rows[0]);
});
milestonesRouter.delete("/:id", requireAdmin, async (req, res) => {
  await pool.query("DELETE FROM milestones WHERE id=$1", [req.params.id]);
  res.json({ ok: true });
});

// ── Forum ─────────────────────────────────────────────────────────────────────
export const forumRouter = Router();
forumRouter.get("/sections", async (_req, res) => {
  const r = await pool.query("SELECT * FROM forum_sections ORDER BY created_at ASC");
  res.json(r.rows);
});
forumRouter.post("/sections", requireAdmin, async (req, res) => {
  const { id, title, description } = req.body;
  const r = await pool.query("INSERT INTO forum_sections(id,title,description) VALUES($1,$2,$3) RETURNING *", [id||uuid(), title, description]);
  res.json(r.rows[0]);
});
forumRouter.delete("/sections/:id", requireAdmin, async (req, res) => {
  await pool.query("DELETE FROM forum_sections WHERE id=$1", [req.params.id]);
  res.json({ ok: true });
});
forumRouter.get("/sections/:id/threads", async (req, res) => {
  const r = await pool.query(`SELECT t.*,u.display_name as author_name FROM forum_threads t LEFT JOIN users u ON t.author_id=u.id WHERE t.section_id=$1 ORDER BY t.created_at DESC`, [req.params.id]);
  res.json(r.rows);
});
forumRouter.post("/threads", requireAuth, async (req, res) => {
  const { id, sectionId, title } = req.body;
  const r = await pool.query("INSERT INTO forum_threads(id,section_id,title,author_id) VALUES($1,$2,$3,$4) RETURNING *", [id||uuid(), sectionId, title, req.user!.id]);
  res.json(r.rows[0]);
});
forumRouter.get("/threads/:id/messages", async (req, res) => {
  const r = await pool.query(`SELECT m.*,u.display_name as author_name,u.avatar_url FROM forum_messages m LEFT JOIN users u ON m.author_id=u.id WHERE m.thread_id=$1 ORDER BY m.created_at ASC`, [req.params.id]);
  res.json(r.rows);
});
forumRouter.post("/messages", requireAuth, async (req, res) => {
  const { id, threadId, content } = req.body;
  const r = await pool.query("INSERT INTO forum_messages(id,thread_id,author_id,content) VALUES($1,$2,$3,$4) RETURNING *", [id||uuid(), threadId, req.user!.id, content]);
  res.json(r.rows[0]);
});
forumRouter.patch("/messages/:id", requireAuth, async (req, res) => {
  const { content } = req.body;
  await pool.query("UPDATE forum_messages SET content=$1,updated_at=NOW() WHERE id=$2 AND author_id=$3", [content, req.params.id, req.user!.id]);
  res.json({ ok: true });
});
forumRouter.delete("/messages/:id", requireAuth, async (req, res) => {
  await pool.query("DELETE FROM forum_messages WHERE id=$1 AND author_id=$2", [req.params.id, req.user!.id]);
  res.json({ ok: true });
});

// ── Profile ───────────────────────────────────────────────────────────────────
export const profileRouter = Router();
profileRouter.get("/", requireAuth, async (req, res) => {
  const r = await pool.query("SELECT id,email,display_name,avatar_url,is_admin FROM users WHERE id=$1", [req.user!.id]);
  res.json(r.rows[0] || null);
});
profileRouter.get("/:id", async (req, res) => {
  const r = await pool.query("SELECT id,display_name,avatar_url FROM users WHERE id=$1", [req.params.id]);
  res.json(r.rows[0] || null);
});
profileRouter.patch("/", requireAuth, async (req, res) => {
  const { display_name, avatar_url } = req.body;
  const r = await pool.query("UPDATE users SET display_name=COALESCE($1,display_name),avatar_url=COALESCE($2,avatar_url) WHERE id=$3 RETURNING id,email,display_name,avatar_url,is_admin", [display_name, avatar_url, req.user!.id]);
  res.json(r.rows[0]);
});

// ── Analytics ─────────────────────────────────────────────────────────────────
export const analyticsRouter = Router();
analyticsRouter.post("/visit", requireAuth, async (req, res) => {
  await pool.query("INSERT INTO page_visits(page,user_id) VALUES($1,$2)", [req.body.page, req.user!.id]);
  res.json({ ok: true });
});

// ── MVA ───────────────────────────────────────────────────────────────────────
export const mvaRouter = Router();
mvaRouter.get("/", async (_req, res) => {
  const r = await pool.query("SELECT * FROM mva_entries ORDER BY created_at DESC");
  res.json(r.rows);
});
mvaRouter.post("/", requireAdmin, async (req, res) => {
  const { id, title, url, type } = req.body;
  const r = await pool.query("INSERT INTO mva_entries(id,title,url,type) VALUES($1,$2,$3,$4) RETURNING *", [id||uuid(), title, url, type]);
  res.json(r.rows[0]);
});
mvaRouter.delete("/:id", requireAdmin, async (req, res) => {
  await pool.query("DELETE FROM mva_entries WHERE id=$1", [req.params.id]);
  res.json({ ok: true });
});

// ── Music Links ───────────────────────────────────────────────────────────────
export const musicLinksRouter = Router();
musicLinksRouter.get("/", async (_req, res) => {
  const r = await pool.query("SELECT * FROM music_links ORDER BY sort_order ASC");
  res.json(r.rows);
});
musicLinksRouter.post("/", requireAdmin, async (req, res) => {
  const { id, url, title, platform, cover_art_url, release_date } = req.body;
  const r = await pool.query("INSERT INTO music_links(id,url,title,platform,cover_art_url,release_date) VALUES($1,$2,$3,$4,$5,$6) RETURNING *", [id||uuid(), url, title, platform, cover_art_url, release_date]);
  res.json(r.rows[0]);
});
musicLinksRouter.delete("/:id", requireAdmin, async (req, res) => {
  await pool.query("DELETE FROM music_links WHERE id=$1", [req.params.id]);
  res.json({ ok: true });
});

// ── Admin ─────────────────────────────────────────────────────────────────────
export const adminRouter = Router();
adminRouter.use(requireAdmin);

adminRouter.get("/toggles", async (_req, res) => {
  const r = await pool.query("SELECT * FROM platform_toggles WHERE id=1");
  res.json(r.rows[0]);
});
adminRouter.patch("/toggles", async (req, res) => {
  const { games_mode, wallet_mode, show_header_coin_balance, show_public_ledger } = req.body;
  const r = await pool.query(
    `UPDATE platform_toggles SET games_mode=COALESCE($1,games_mode),wallet_mode=COALESCE($2,wallet_mode),
     show_header_coin_balance=COALESCE($3,show_header_coin_balance),show_public_ledger=COALESCE($4,show_public_ledger)
     WHERE id=1 RETURNING *`,
    [games_mode, wallet_mode, show_header_coin_balance, show_public_ledger]
  );
  res.json(r.rows[0]);
});
adminRouter.get("/token-settings", async (_req, res) => {
  const r = await pool.query("SELECT * FROM token_settings WHERE id=1");
  res.json(r.rows[0]);
});
adminRouter.patch("/token-settings", async (req, res) => {
  const { token_enabled, token_symbol, discount_percent, sol_address } = req.body;
  const r = await pool.query(
    `UPDATE token_settings SET token_enabled=COALESCE($1,token_enabled),token_symbol=COALESCE($2,token_symbol),
     discount_percent=COALESCE($3,discount_percent),sol_address=COALESCE($4,sol_address) WHERE id=1 RETURNING *`,
    [token_enabled, token_symbol, discount_percent, sol_address]
  );
  res.json(r.rows[0]);
});
adminRouter.get("/stripe-config", async (_req, res) => {
  const r = await pool.query("SELECT id,allowed_countries FROM stripe_config WHERE id=1");
  res.json(r.rows[0]);
});
adminRouter.patch("/stripe-config", async (req, res) => {
  const { secret_key, allowed_countries } = req.body;
  const r = await pool.query(
    `UPDATE stripe_config SET secret_key=COALESCE($1,secret_key),allowed_countries=COALESCE($2,allowed_countries) WHERE id=1 RETURNING id,allowed_countries`,
    [secret_key, allowed_countries ? JSON.stringify(allowed_countries) : null]
  );
  res.json(r.rows[0]);
});
adminRouter.get("/youtube-config", async (_req, res) => {
  const r = await pool.query("SELECT * FROM youtube_config WHERE id=1");
  res.json(r.rows[0]);
});
adminRouter.patch("/youtube-config", async (req, res) => {
  const { channel_id, api_key, playlist_id } = req.body;
  const r = await pool.query(
    `UPDATE youtube_config SET channel_id=COALESCE($1,channel_id),api_key=COALESCE($2,api_key),playlist_id=COALESCE($3,playlist_id) WHERE id=1 RETURNING *`,
    [channel_id, api_key, playlist_id]
  );
  res.json(r.rows[0]);
});
adminRouter.get("/funding-milestone", async (_req, res) => {
  const r = await pool.query("SELECT * FROM funding_milestone WHERE id=1");
  res.json(r.rows[0]);
});
adminRouter.patch("/funding-milestone", async (req, res) => {
  const { goal_usd, current_usd, label, visible } = req.body;
  const r = await pool.query(
    `UPDATE funding_milestone SET goal_usd=COALESCE($1,goal_usd),current_usd=COALESCE($2,current_usd),label=COALESCE($3,label),visible=COALESCE($4,visible) WHERE id=1 RETURNING *`,
    [goal_usd, current_usd, label, visible]
  );
  res.json(r.rows[0]);
});
adminRouter.get("/mixtape-fee", async (_req, res) => {
  const r = await pool.query("SELECT * FROM mixtape_fee_config WHERE id=1");
  res.json(r.rows[0]);
});
adminRouter.patch("/mixtape-fee", async (req, res) => {
  const { enabled, fee_usd } = req.body;
  const r = await pool.query("UPDATE mixtape_fee_config SET enabled=COALESCE($1,enabled),fee_usd=COALESCE($2,fee_usd) WHERE id=1 RETURNING *", [enabled, fee_usd]);
  res.json(r.rows[0]);
});
adminRouter.get("/licenses", async (_req, res) => {
  const r = await pool.query("SELECT * FROM license_templates ORDER BY rights_type");
  res.json(r.rows);
});
adminRouter.get("/licenses/:type", async (req, res) => {
  const r = await pool.query("SELECT * FROM license_templates WHERE rights_type=$1", [req.params.type]);
  res.json(r.rows[0] || null);
});
adminRouter.put("/licenses/:type", async (req, res) => {
  const { content } = req.body;
  const r = await pool.query(
    `INSERT INTO license_templates(rights_type,content) VALUES($1,$2) ON CONFLICT(rights_type) DO UPDATE SET content=$2,updated_at=NOW() RETURNING *`,
    [req.params.type, content]
  );
  res.json(r.rows[0]);
});
adminRouter.get("/analytics", async (_req, res) => {
  const visits = await pool.query("SELECT page,COUNT(*) as count FROM page_visits GROUP BY page");
  const daily = await pool.query(`SELECT DATE(visited_at) as date,COUNT(*) as count FROM page_visits WHERE visited_at>NOW()-INTERVAL '30 days' GROUP BY DATE(visited_at) ORDER BY date DESC`);
  const totals = await pool.query("SELECT COUNT(*) as total,COUNT(DISTINCT user_id) as unique_visitors FROM page_visits");
  res.json({ pageVisits: visits.rows, dailyVisits: daily.rows, ...totals.rows[0] });
});
adminRouter.get("/users", async (_req, res) => {
  const r = await pool.query("SELECT id,email,display_name,avatar_url,is_admin,is_approved,created_at FROM users ORDER BY created_at DESC");
  res.json(r.rows);
});
adminRouter.patch("/users/:id", async (req, res) => {
  const { is_approved, is_admin } = req.body;
  const r = await pool.query("UPDATE users SET is_approved=COALESCE($1,is_approved),is_admin=COALESCE($2,is_admin) WHERE id=$3 RETURNING id,email,display_name,is_admin,is_approved", [is_approved, is_admin, req.params.id]);
  res.json(r.rows[0]);
});

// ── Uploads (Backblaze B2) ─────────────────────────────────────────────────────
export const uploadsRouter = Router();
uploadsRouter.post("/presign", requireAuth, async (req, res) => {
  const { fileType, folder = "uploads" } = req.body;
  const allowed = req.user?.is_admin
    ? ["beats","covers","uploads","showcases","mixtapes","previews","mva","music-links"]
    : ["showcases","mixtapes"];
  if (!allowed.includes(folder)) return res.status(403).json({ error: "Folder not allowed" });
  const ext = fileType?.split("/")[1] || "bin";
  const key = `${folder}/${uuid()}.${ext}`;
  const cmd = new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: fileType });
  const uploadUrl = await getSignedUrl(s3, cmd, { expiresIn: 3600 });
  const publicUrl = `${process.env.B2_PUBLIC_URL}/${key}`;
  res.json({ uploadUrl, publicUrl, key });
});
uploadsRouter.post("/presign-download", requireAuth, async (req, res) => {
  const { key } = req.body;
  const cmd = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  const downloadUrl = await getSignedUrl(s3, cmd, { expiresIn: 300 });
  res.json({ downloadUrl });
});

// ── Stripe ────────────────────────────────────────────────────────────────────
export const stripeRouter = Router();
stripeRouter.post("/create-session", requireAuth, async (req, res) => {
  try {
    const { beatId, rightsType } = req.body;
    const cfg = await pool.query("SELECT secret_key FROM stripe_config WHERE id=1");
    const sk = cfg.rows[0]?.secret_key;
    if (!sk) return res.status(400).json({ error: "Stripe not configured" });
    const { default: Stripe } = await import("stripe");
    const stripe = new Stripe(sk);
    const beatR = await pool.query("SELECT * FROM beats WHERE id=$1", [beatId]);
    const beat = beatR.rows[0];
    if (!beat) return res.status(404).json({ error: "Beat not found" });
    const folder = (beat.rights_folders||[]).find((f: any) => f.rightsType === rightsType);
    if (!folder) return res.status(404).json({ error: "Rights tier not found" });
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{ price_data: { currency: "usd", product_data: { name: `${beat.title} — ${rightsType}` }, unit_amount: Math.round(folder.price*100) }, quantity: 1 }],
      mode: "payment",
      success_url: `${process.env.FRONTEND_URL}/purchase-history?session_id={CHECKOUT_SESSION_ID}&beat_id=${beatId}&rights_type=${rightsType}`,
      cancel_url: `${process.env.FRONTEND_URL}/beat/${beatId}`,
      metadata: { beatId, rightsType, userId: req.user!.id },
    });
    res.json({ url: session.url });
  } catch(e: any) { res.status(500).json({ error: e.message }); }
});
stripeRouter.get("/session/:sessionId", requireAuth, async (req, res) => {
  const cfg = await pool.query("SELECT secret_key FROM stripe_config WHERE id=1");
  const sk = cfg.rows[0]?.secret_key;
  if (!sk) return res.status(400).json({ error: "Stripe not configured" });
  const { default: Stripe } = await import("stripe");
  const stripe = new Stripe(sk);
  const session = await stripe.checkout.sessions.retrieve(req.params.sessionId);
  res.json({ status: session.payment_status, metadata: session.metadata });
});
