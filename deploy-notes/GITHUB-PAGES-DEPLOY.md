# PromptuPatch — GitHub Pages + Vercel deploy

Replaces the manual cPanel/Namecheap process in `DEPLOY.md` (kept as historical
reference). The site now deploys on every push to `main`.

## Architecture

- **Static site** (`public_html/`) → GitHub Pages, served at `promptupatch.com`
  and `www.promptupatch.com` (redirects to apex).
- **API** (`api/`) → Vercel serverless functions, served at
  `api.promptupatch.com`. Same Express app as before (`server.js`), routes
  unchanged: `POST /api/claude`, `POST /api/contact`, `GET /api/health`.

## How a deploy happens

- Push to `main` touching `public_html/**` → `.github/workflows/pages.yml`
  runs automatically and publishes to GitHub Pages. No build step — the
  workflow copies `public_html/` as-is, adds `.nojekyll`, `CNAME`, a
  `404.html` (SPA fallback), and duplicates each `<route>.html` into
  `<route>/index.html` for clean-URL support.
- Push to `main` touching `api/**` → Vercel auto-deploys (the Vercel project
  is configured with Root Directory = `api`, watching this same repo).

## One-time setup (already done, recorded here for reference)

- GitHub repo Settings → Pages → Source: "GitHub Actions"
- GitHub repo Settings → Pages → Custom domain: `promptupatch.com`
- Vercel project imported from `mtumweusi01-afk/Promptupatch`, Root
  Directory = `api`, env vars `ANTHROPIC_API_KEY`, `CONTACT_SMTP_USER`,
  `CONTACT_SMTP_PASS`, `CONTACT_TO` set in the Vercel dashboard.
- Vercel project → Domains → `api.promptupatch.com` added.
- Namecheap Advanced DNS: 4 A records for `@` → GitHub Pages IPs
  (185.199.108/109/110/111.153), CNAME `www` → `mtumweusi01-afk.github.io`,
  CNAME `api` → Vercel's assigned target. MX / `mail` records untouched.

## Known limitation

`public_html/assets/index-BLFRjWRo.js` is a built bundle with no source
checked into this repo — the original React/Vite project isn't here. The
`/api/claude` and `/api/contact` fetch URLs were patched directly in that
built file to point at `https://api.promptupatch.com/...`. If the site is
ever rebuilt from original source, that source needs the API base URL
pointed at `api.promptupatch.com` (ideally via an env var) before rebuilding,
or this patch needs to be reapplied to the new bundle.

## Verify after a deploy

    curl -sI https://promptupatch.com/                 # 200
    curl -sI https://www.promptupatch.com/              # 301 -> apex
    curl -s  https://promptupatch.com/tools/chatgpt      # prerendered page
    curl -s  https://api.promptupatch.com/api/health     # {"ok":true,...}
