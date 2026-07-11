# PromptuPatch — SEO deploy pack

## What's in here
- 38 prerendered `.html` files mirroring every route in your sitemap
- `sitemap.xml` — now with `lastmod`, `changefreq`, `priority`
- `robots.txt` — with AI-crawler allowances and `/checkout` excluded
- `htaccess-ADD-THIS.txt` — rules to paste (do NOT replace your .htaccess)

## Upload order (nothing here touches `api/` or the Passenger binding)
1. Upload every `.html` file into `public_html`, preserving the `tools/` and `blog/` folders.
   `index.html` at the root **replaces** your current one.
2. Upload `sitemap.xml` and `robots.txt` to `public_html`, overwriting.
3. Open `public_html/.htaccess` in File Manager. Paste Block A over your existing
   `<IfModule mod_rewrite.c>` section only. Append Block B at the bottom.
   Leave any cPanel/Passenger lines exactly where they are.
4. Do **not** touch `public_html/api/`. Do not restart the Node app — nothing changed server-side.

## Verify in 4 curl commands
    curl -sI https://promptupatch.com/tools/chatgpt | head -1        # expect 200
    curl -s  https://promptupatch.com/tools/chatgpt | grep canonical # expect .../tools/chatgpt
    curl -sI https://promptupatch.com/api/health    | head -1        # expect 200, API still alive
    curl -sI https://www.promptupatch.com/          | head -1        # expect 301

Then in the browser: load `/tools/midjourney`, confirm the React app still renders
normally and the tab title stays "Midjourney — What It's Good For…".

## Then, in Google Search Console
1. Sitemaps → resubmit `sitemap.xml`
2. URL Inspection on `/tools/chatgpt` → "Test live URL" → confirm
   *User-declared canonical* now matches the URL → Request Indexing
3. Repeat for `/blog/we-tested-deep-links` and `/tools`
