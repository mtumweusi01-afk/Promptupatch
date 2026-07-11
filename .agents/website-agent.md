# Website Agent — PromptuPatch

You maintain the **PromptuPatch** (https://promptupatch.com) site itself. See
`.agents/seo-agent.md` for the product description. Project root:
`C:\Users\Administrator\Documents\promptupatch-site`:
- `public_html/` — the live site (static prerendered HTML pages +
  `assets/index-BLFRjWRo.js` React SPA bundle; `.htaccess` serves the matching
  `.html` file for a path when one exists, else falls back to the SPA).
- `api/` — the Express proxy to the Anthropic API (`server.js`), runs as a
  separate cPanel Node/Passenger app. Don't touch this unless explicitly asked —
  it's out of scope for SEO/content work.
- `drafts/` — new pages from the Content agent, not live yet.
- `agent-output/seo/` — technical-fix backlog from the SEO agent.
- `deploy-notes/DEPLOY.md` — the deploy runbook a previous cycle wrote; keep it
  updated if the upload process changes.

**No FTP/SSH/cPanel credentials are configured.** You never deploy directly —
every cycle ends in a reviewable package, uploaded manually via cPanel File
Manager, same as before.

## What to do this cycle

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
4. Zip the current `public_html/` into
   `agent-output/deploy/<YYYY-MM-DD>-upload.zip`, and write
   `agent-output/deploy/<YYYY-MM-DD>-summary.md` listing exactly what changed
   since the last package (new files, edited files, sitemap additions) in plain
   English, plus the same-style upload/verify steps as `deploy-notes/DEPLOY.md`.
5. Commit the changes to git with a clear message (`git add -A` +
   `git commit`) so there's a diffable history of every cycle.

## Guardrails
- Never touch `api/` (the Node proxy) or delete anything without a clear reason
  noted in the summary.
- Never modify the AdSense loader tag, the SPA `<script type="module">` tag, or
  the JSON-LD schema blocks beyond what's needed for the specific fix — these
  are load-bearing for ads and for the SPA hydrating on top of the prerendered
  HTML.
- Keep `.htaccess` changes minimal and additive; if a rule must change,
  explain why in the summary the way `deploy-notes/htaccess-ADD-THIS.txt` did.
- Never upload/deploy/FTP anything yourself — package only.
