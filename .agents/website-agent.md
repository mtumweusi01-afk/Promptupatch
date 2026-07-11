# Website Agent — PromptuPatch

You maintain the **PromptuPatch** (https://promptupatch.com) site itself. See
`.agents/seo-agent.md` for the product description. Project root in your
checkout mirrors:
- `public_html/` — the live site (static prerendered HTML pages +
  `assets/index-BLFRjWRo.js` React SPA bundle; `.htaccess` serves the matching
  `.html` file for a path when one exists, else falls back to the SPA).
- `api/` — the Express proxy to the Anthropic API (`server.js`). Its real,
  running copy lives OUTSIDE `public_html`, in a separate app root
  (`/home/promzqei/promptupatch-api` at time of writing), managed by cPanel
  Node.js App / Passenger. `public_html/api/.htaccess` only holds Passenger
  routing + env var config — it is not the app itself.
- `drafts/` — new pages from the Content agent, not live yet.
- `agent-output/seo/` — technical-fix backlog from the SEO agent.
- `deploy-notes/DEPLOY.md` — the deploy runbook a previous cycle wrote; keep it
  updated if the upload process changes.

**FTP deploy is wired in for both directories, via two separate scoped
accounts** — credentials are provided directly in your routine prompt each
run (never commit them to this repo; it is public). One account is jailed to
`public_html`, the other to the `promptupatch-api` app root.

## What to do this cycle (public_html — routine weekly work)

1. Read the latest `agent-output/seo/<date>-report.md`, section
   `## Technical fixes` — apply each one directly to the relevant file(s) in
   `public_html/` (fix meta descriptions, add missing sitemap entries, fix
   internal links, etc.). Small, targeted edits — don't restructure pages.
2. Check `drafts/` for any content-agent output ready to go live. If present,
   move it into the matching `public_html/` path (e.g. `drafts/tools/foo.html` →
   `public_html/tools/foo.html`), and:
   - Add the new URL to `public_html/sitemap.xml` (match the existing
     `<url>` entry format, `lastmod` = today).
   - Confirm `public_html/robots.txt` doesn't block it.
   - Add a link to it from a sensible existing page (e.g. a new tool page
     should be linked from `tools.html` and the homepage's tool list; a new
     blog post from `blog.html` and the homepage's "Latest from the blog" list).
3. Sanity-check your own changes: every internal link you touched should point
   to a real file; every page you added to the sitemap should exist.
4. Deploy via the `public_html`-scoped FTP account: upload only the files that
   changed this cycle (diff against the previous commit). Never delete
   remotely. Never touch `api/` through this account beyond leaving its
   `.htaccess` alone.
5. Verify with `curl -sI` on the homepage and every changed/new URL — expect
   200 on each. If anything doesn't come back 200, stop, do not proceed as if
   it succeeded, and prefix your commit message `DEPLOY FAILED:` with the
   exact error — this is the one thing the project owner wants to be
   interrupted for.
6. Also zip the current `public_html/` into
   `agent-output/deploy/<YYYY-MM-DD>-upload.zip` as a standing backup/record,
   and commit + push (`git add -A`, `git commit`, `git push origin main`).

## Touching `api/server.js` — only when there's a specific, understood reason

This file also drives the contact form and payment-confirmation email — it is
not just SEO/content surface. Do **not** proactively refactor, "clean up," or
speculatively improve it. Only touch it when a specific task tells you to
(e.g. "update the model string," "fix bug X") or when the SEO/technical
backlog explicitly calls out something here.

When you do:

1. **Always download the live file first** via the `promptupatch-api`-scoped
   FTP account and diff it against this repo's `api/server.js` before changing
   anything. They can and do diverge — a prior cycle found the live copy had
   a production hotfix (SMTP host pointed at the actual server hostname
   instead of `mail.promptupatch.com`, to match the SSL cert) that this repo
   didn't have. If live differs from the repo in ways unrelated to your task,
   **merge deliberately** (keep the live-only fix, apply your change on top)
   — never blindly overwrite live with the repo's version or vice versa.
2. **Never modify environment variables** (`ANTHROPIC_API_KEY`,
   `CONTACT_SMTP_USER`, `CONTACT_SMTP_PASS`, `CONTACT_TO`, `SMTP_HOST`) — those
   live in cPanel's Node.js App config / `public_html/api/.htaccess` and are
   handled by the project owner directly, not by you.
3. Upload the merged file to the `promptupatch-api` app root via FTP.
4. Trigger a Passenger restart by uploading/touching `tmp/restart.txt` on that
   same FTP account (standard Passenger convention — no cPanel UI needed).
5. Wait a few seconds, then `curl https://promptupatch.com/api/health` and
   confirm `{"ok":true, ...}` with `mail` still `"configured"` (or whatever
   its pre-change value was). If the health check fails, or `mail` flips to
   `"not configured"` when it wasn't before, treat this as critical: prefix
   your commit `DEPLOY FAILED:` and describe exactly what broke.
6. Commit the merged `api/server.js` to this repo and push, same as any other
   change — the repo should always reflect what's actually live.

## Guardrails
- Never modify the AdSense loader tag, the SPA `<script type="module">` tag, or
  the JSON-LD schema blocks beyond what's needed for the specific fix — these
  are load-bearing for ads and for the SPA hydrating on top of the prerendered
  HTML.
- Keep `.htaccess` changes minimal and additive; if a rule must change,
  explain why in the summary the way `deploy-notes/htaccess-ADD-THIS.txt` did.
- Never delete anything, locally or remotely, without a clear reason noted in
  your commit/summary.
- Never commit FTP credentials, API keys, or any secret value to this repo —
  it is public. Credentials only ever live in your routine prompt, never in a
  file.
