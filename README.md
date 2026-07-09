# Leonard Rieksen Fotografie — website

Technical implementation. Requirements authority: `../documenten/WEBSITE_PROJECT_BLUEPRINT.txt`.
Operational rules: `../CLAUDE.md`. Decisions/status: `../documenten/DECISIONS.md`, `PROGRESS.md`.

## Stack (D-01a)

[Astro](https://astro.build) (`output: 'static'`) — Content Collections for the CMS-driven project
model, `astro:assets` (Sharp) for the responsive image pipeline, `@astrojs/sitemap` for the sitemap.
No client-side framework runtime is shipped by default.

## Structure

```
src/
├── content.config.ts        # Project content model (Zod schema) — R-06
├── content/projects/*/      # One folder per project: index.md + colocated images
├── layouts/BaseLayout.astro # Landmarks, skip link, per-page SEO meta
├── lib/seo.ts                # Title/canonical helpers
└── pages/                   # One file per sitemap route (see blueprint 13.90)
public/
├── admin/                   # Decap CMS (index.html + config.yml)
└── robots.txt is generated (src/pages/robots.txt.ts), not a static file
```

## Commands

| Command         | Action                                    |
| --------------- | ------------------------------------------ |
| `npm install`    | Install dependencies                        |
| `npm run dev`    | Local dev server                            |
| `npm run build`  | Production build to `./dist/`               |
| `npm run preview`| Serve the production build locally          |
| `npm run check`  | Type-check + Astro template diagnostics     |

## CMS auth — external setup still required (D-01b)

Decap CMS is configured for the direct GitHub backend + Netlify's OAuth Provider Tokens feature
(Netlify Identity and Git Gateway are both officially deprecated — not used). This repo's local
config is ready, but login has **not** been verified and cannot be until the following exist:

1. This project pushed to a real GitHub repository; update `public/admin/config.yml`'s
   `backend.repo` from the current placeholder to the real `owner/repo`.
2. A GitHub OAuth App (GitHub → Settings → Developer settings → OAuth Apps) with callback URL
   `https://api.netlify.com/auth/done`.
3. That OAuth App registered in the Netlify site's **Project configuration → Access & security →
   OAuth → Install provider**.

## Known placeholder

`astro.config.mjs`'s `site` is set to `https://example.com` (RFC 2606 reserved placeholder — not a
real or guessed domain). Replace with the confirmed production domain before go-live; this affects
the sitemap, canonical URLs, and Open Graph URLs.
