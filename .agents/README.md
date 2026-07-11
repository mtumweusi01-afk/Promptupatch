# PromptuPatch growth agents

Four role prompts that turn the SEO / content / social / website-upkeep work into a
repeatable, self-contained job. Each file in this folder is written to be handed
to a fresh Claude Code session with zero other context — it re-establishes what
it needs by reading the project files themselves.

## Roles

- `seo-agent.md` — competitor + keyword research, technical SEO audit. Read-only:
  writes a report, never edits site files.
- `content-agent.md` — drafts new blog posts / tool pages from the SEO backlog.
  Writes only into `drafts/`, never touches `public_html/` directly.
- `social-agent.md` — turns content into platform-ready posts. Writes only into
  `agent-output/social/`. No posting — no API keys are configured yet.
- `website-agent.md` — implements approved technical fixes and drafts into
  `public_html/`, then packages an upload-ready zip for cPanel. Never deploys by
  itself (no FTP/SSH credentials configured yet).

## Guardrails (apply to all four)

- Organic growth only. No bot traffic, click farms, incentivized clicks, or
  anything that reads as AdSense invalid-traffic — that risks the whole account,
  which already has Auto Ads live (`ca-pub-3038027031767147`).
- Never publish/deploy/post directly. Every run produces a reviewable artifact
  (report, draft, or zip) under `agent-output/` or `drafts/`. A human uploads,
  posts, or merges.
- Competitor research is for positioning and content-gap-finding — no scraping
  that violates a site's ToS, no disparagement in copy.
- Stay in the project folder (`C:\Users\Administrator\Documents\promptupatch-site`).
  Don't touch other parts of the machine.

## Running a cycle

Each prompt file is meant to be pasted as-is into a new agent/session. Recommended
order for a full weekly cycle: SEO → Content → Social → Website, since Content and
Website both read the SEO report, and Social reads whatever Content produced.

## Current scheduling status

There's no persistent "runs forever" scheduler wired up yet:
- Real unsupervised recurring execution needs a **cloud routine**, which requires
  pushing this project to a GitHub repo (cloud agents can't see this local
  machine). Not set up yet — no GitHub account provided.
- In the meantime, cycles run on demand (manually, or via a session-bound
  `CronCreate` timer that only lives as long as one chat stays open and expires
  after 7 days — a stopgap, not real automation).
- When ready for true hands-off operation: get a GitHub account, and the project
  can be pushed there and wired to weekly cloud routines for all four roles.
