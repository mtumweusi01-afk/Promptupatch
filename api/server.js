/**
 * PromptuPatch API proxy.
 * Keeps your Anthropic API key on the server — NEVER put the key in frontend code.
 *
 * Set the ANTHROPIC_API_KEY environment variable in cPanel's
 * "Setup Node.js App" > Environment Variables before starting.
 */
const express = require("express");

const app = express();
app.use(express.json({ limit: "1mb" }));

const API_KEY = process.env.ANTHROPIC_API_KEY;
const PORT = process.env.PORT || 3001;

// MOCK MODE: set ANTHROPIC_API_KEY to exactly "MOCK" (or leave it unset) to test
// the full deployment without any API usage or billing. Every request returns a
// canned response. Swap in your real sk-ant-... key when ready to go live.
const MOCK = !API_KEY || API_KEY === "MOCK";

// Basic per-IP rate limit so strangers can't drain your API budget.
const hits = new Map();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 20;
function rateLimit(req, res, next) {
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";
  const now = Date.now();
  const entry = hits.get(ip) || { count: 0, start: now };
  if (now - entry.start > WINDOW_MS) { entry.count = 0; entry.start = now; }
  entry.count += 1;
  hits.set(ip, entry);
  if (entry.count > MAX_PER_WINDOW) {
    return res.status(429).json({ error: "Too many requests. Slow down." });
  }
  next();
}

app.post("/api/claude", rateLimit, async (req, res) => {
  if (MOCK) {
    // Canned response shaped exactly like a real Anthropic API reply.
    const userText = JSON.stringify(req.body?.messages || "");
    // If the frontend is asking for a category classification, return one.
    const isClassify = userText.includes("Respond ONLY with the category id");
    const text = isClassify
      ? "chat"
      : "This is a MOCK response — your deployment is working end to end! The website, the /api route, and the Node.js proxy are all connected. Replace the ANTHROPIC_API_KEY environment variable with your real key (sk-ant-...) and restart the app to get real AI answers.";
    return res.json({
      id: "msg_mock",
      type: "message",
      role: "assistant",
      content: [{ type: "text", text }],
      model: "mock",
      stop_reason: "end_turn",
    });
  }
  if (!API_KEY) {
    return res.status(500).json({ error: "Server missing ANTHROPIC_API_KEY" });
  }
  try {
    const { model, max_tokens, messages } = req.body || {};
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "messages required" });
    }
    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: model || "claude-sonnet-5",
        max_tokens: Math.min(Number(max_tokens) || 700, 1500),
        messages,
      }),
    });
    const data = await upstream.json();
    res.status(upstream.status).json(data);
  } catch (err) {
    console.error("Proxy error:", err);
    res.status(502).json({ error: "Upstream request failed" });
  }
});

// ---------------- Contact / payment-confirmation email ----------------
// Requires three environment variables in cPanel's Setup Node.js App:
//   CONTACT_SMTP_USER  e.g. hello@promptupatch.com  (create in cPanel > Email Accounts)
//   CONTACT_SMTP_PASS  that email account's password
//   CONTACT_TO         where submissions should be delivered (can be the same address)
const nodemailer = require("nodemailer");
const SMTP_USER = process.env.CONTACT_SMTP_USER;
const SMTP_PASS = process.env.CONTACT_SMTP_PASS;
const CONTACT_TO = process.env.CONTACT_TO || SMTP_USER;

const mailer = SMTP_USER && SMTP_PASS
  ? nodemailer.createTransport({
      host: "mail.promptupatch.com",
      port: 465,
      secure: true,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    })
  : null;

app.post("/api/contact", rateLimit, async (req, res) => {
  const { type, name, email, message, txid, plan } = req.body || {};
  if (!email || typeof email !== "string" || !email.includes("@") || email.length > 200) {
    return res.status(400).json({ error: "valid email required" });
  }
  const clean = (v, max) => (typeof v === "string" ? v.slice(0, max) : "");

  let subject, body;
  if (type === "payment") {
    if (!txid) return res.status(400).json({ error: "txid required" });
    subject = `[PromptuPatch] Payment confirmation — ${clean(plan, 40) || "unknown plan"}`;
    body = `Payment confirmation submitted\n\nPlan: ${clean(plan, 40)}\nEmail: ${clean(email, 200)}\nTXID: ${clean(txid, 200)}\n\nVerify on tronscan.org before adding credits.`;
  } else {
    if (!message) return res.status(400).json({ error: "message required" });
    subject = `[PromptuPatch] Contact form — ${clean(name, 80) || "no name"}`;
    body = `Contact form submission\n\nName: ${clean(name, 80)}\nEmail: ${clean(email, 200)}\n\nMessage:\n${clean(message, 5000)}`;
  }

  if (!mailer) {
    console.log("CONTACT (mail not configured):\n" + body);
    return res.status(500).json({ error: "Mail not configured on server" });
  }
  try {
    await mailer.sendMail({
      from: `"PromptuPatch" <${SMTP_USER}>`,
      to: CONTACT_TO,
      replyTo: clean(email, 200),
      subject,
      text: body,
    });
    res.json({ ok: true });
  } catch (err) {
    console.error("Mail error:", err);
    res.status(502).json({ error: "Failed to send" });
  }
});

app.get("/api/health", (req, res) => res.json({ ok: true, mode: MOCK ? "mock" : "live", mail: mailer ? "configured" : "not configured" }));

app.listen(PORT, () => console.log(`API proxy listening on ${PORT}`));
