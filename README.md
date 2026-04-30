# CareerBridge

A fast, SEO-optimised job listings website that curates openings from top companies and redirects users to official career pages. Built with Next.js 14 (Pages Router), Supabase, and Google AdSense.

---

## Quick Start

### 1. Install
```bash
npm install
```

### 2. Set Up Supabase
1. Go to [supabase.com](https://supabase.com) → Create a new project (free tier is fine).
2. Open **SQL Editor** and run the following scripts in this order:
   - `supabase/schema.sql` — main tables, RLS policies, RPC functions
   - `supabase/indexes.sql` — performance indexes (cuts TTFB ~70%)
   - `supabase/drop-wfh.sql` — removes the unused `is_wfh` column
3. From **Settings → API**, copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` *(secret — server-only)*

### 3. Configure Environment
```bash
cp .env.local.example .env.local
# Edit .env.local and fill in every variable
```

Key environment variables:

| Variable | Purpose | Notes |
|---|---|---|
| `ADMIN_PASSWORD` | Admin panel login | Server-side only. Long, random. |
| `SESSION_SECRET` | Signs admin session cookies | Minimum 32 chars. Generate with `openssl rand -base64 48` |
| `SUPABASE_SERVICE_ROLE_KEY` | Bypasses Row Level Security | **Never** expose to the browser |
| `NEXT_PUBLIC_ADSENSE_PUBLISHER_ID` | AdSense publisher ID | Leave as `ca-pub-XXXXXXXXXXXXXXXX` to disable ads in dev |

### 4. Run Locally
```bash
npm run dev
# Open http://localhost:3000
# Admin: http://localhost:3000/admin
```

For accurate Lighthouse scores, always test the **production build**:
```bash
npm run build
npm start
```
Dev mode scores 30–40 points lower than production due to unminified code, hot-reload overhead, and React StrictMode double-renders.

---

## Project Structure

```
careerbridge/
├── pages/
│   ├── index.js                ← Home (paginated 9/page, server-fetched)
│   ├── [slug].js               ← Job detail (ISR, JSON-LD JobPosting)
│   ├── _app.js                 ← Global shell: theme, AdSense (consent-gated), JSON-LD
│   ├── _document.js            ← <html lang="en">, AdSense preconnect hints
│   ├── 404.js / 500.js
│   ├── about.js                ← AdSense-required: About
│   ├── privacy.js              ← AdSense-required: Privacy Policy
│   ├── disclaimer.js           ← AdSense-required: Disclaimer
│   ├── terms.js                ← AdSense-required: Terms
│   ├── contact.js              ← AdSense-required: Contact
│   ├── fresher-jobs.js         ← SEO landing page
│   ├── category/[slug].js      ← /category/it-jobs, /bpo-jobs, /bfsi-jobs, /core-jobs
│   ├── company/[name].js       ← /company/tcs, /company/infosys, ...
│   ├── blog/                   ← Markdown-powered blog (gray-matter + remark)
│   ├── admin/index.js          ← Admin panel (iron-session cookie auth)
│   └── api/
│       ├── jobs.js             ← Public paginated job listing (60s edge cache)
│       ├── views.js            ← Rate-limited view increment
│       └── admin/
│           ├── login.js        ← Password check + iron-session cookie
│           ├── logout.js
│           ├── me.js
│           ├── jobs.js         ← CRUD for jobs (service-role key)
│           └── bulk-import.js  ← CSV bulk upload
├── components/
│   ├── Layout.js
│   ├── Navbar.js
│   ├── JobCard.js              ← React.memo'd, "NEW" badge auto-expires after 3 days
│   ├── AdBanner.js             ← Lazy-loaded, consent-aware, npa-flag respected
│   ├── Footer.js
│   ├── CookieBanner.js         ← GDPR Accept/Reject (both states show ads)
│   ├── RecentlyViewedJobs.js   ← localStorage-backed, dynamically imported
│   ├── ShareButtons.js
│   ├── LegalPage.js
│   └── CategoryLandingPage.js
├── lib/
│   ├── supabase.js             ← Public + admin clients, paginated queries
│   ├── session.js              ← iron-session config
│   ├── rateLimit.js            ← In-memory rate limiter
│   ├── theme.js                ← Dark/light mode provider
│   ├── blog.js                 ← Markdown post loader
│   └── constants.js            ← Site name, URLs, category mappings
├── content/blog/               ← Markdown blog posts (.md)
├── styles/                     ← CSS Modules
├── public/
│   ├── ads.txt                 ← Replace placeholder with real AdSense pub ID
│   ├── robots.txt
│   └── favicon.ico      ← Add your own (favicon.io)
├── supabase/
│   ├── schema.sql              ← Run first
│   ├── indexes.sql             ← Run second (performance)
│   └── drop-wfh.sql            ← Run third (cleanup)
├── .browserslistrc             ← Drops legacy JS polyfills
├── .env.local.example
├── .gitignore
├── next.config.js              ← SWC minify, security headers, image domains
├── next-sitemap.config.js      ← Runs as `postbuild`
└── package.json
```

---

## How to Add a Job

### Option A — Admin Panel
1. Go to `https://yourdomain.com/admin`
2. Enter your admin password (from `.env.local` → `ADMIN_PASSWORD`)
3. Click **+ Add New Job**, fill in the form, Publish.

The slug auto-generates from company + title:
- Company: `Wipro`, Title: `Voice Process Executive`
- Slug: `wipro-voice-process-executive`
- URL: `https://careerbridge.com/wipro-voice-process-executive`

**Important fields for Google Jobs rich results:**
- `salary_min`, `salary_max` — numeric yearly values (e.g. `250000`, `350000`)
- `valid_through` — date picker (ISO 8601 internally)

### Option B — Bulk CSV Import
Admin Panel → **Bulk CSV Import** tab. Paste a CSV with header row.

| Column type | Names |
|---|---|
| **Required** | `title, company, apply_url` |
| **Recommended** | `location, salary, salary_min, salary_max, category, last_date, valid_through` |
| **Optional** | `slug, job_type, experience, salary_currency, description, eligibility, responsibilities, skills, tags, logo_color, is_fresher` |

For multi-line fields (`responsibilities`, `skills`), use **pipe `|`** as separator inside the CSV cell.

Upserts by `slug` — re-importing updates existing rows instead of duplicating.

### Admin Search
The list view has a **Search** button that filters the visible table by title, company, or location. Press **Enter** in the input or click Search. Press **Esc** to clear.

### Delete Flow
Clicking Delete opens a themed confirmation modal (no browser `confirm()` popup). On confirmation, a floating toast notification shows the result. Toasts auto-dismiss after 3.5s.

---

## Cookie Consent & AdSense

The cookie banner offers **two equally-prominent buttons** (required by EU/GDPR):

| User clicks | Cookie value | Ad behavior | Revenue |
|---|---|---|---|
| **Accept all** | `cb_consent=all` | Personalized ads | 100% |
| **Reject non-essential** | `cb_consent=essential` | Non-personalized (contextual) ads | ~60–80% |

When the user has *not* clicked yet, AdSense **does not load** at all. Once they click either button, AdSense loads with the appropriate `npa` flag (`requestNonPersonalizedAds = 0` or `1`). The `cb-consent-changed` custom event lets ad slots respond without a page reload.

### Verifying it works
Open DevTools → Network tab → filter by `googlesyndication`:
- After **Accept all** → ad request URL contains no `npa` parameter
- After **Reject** → ad request URL contains `npa=1`

Or in the console:
```js
window.adsbygoogle.requestNonPersonalizedAds  // 0 = personalized, 1 = non-personalized
```

---

## Google AdSense Setup

1. Apply at [adsense.google.com](https://adsense.google.com).
2. After approval, get your **Publisher ID** (`ca-pub-XXXXXXXXXXXXXXXX`).
3. Create ad units: Leaderboard (728×90), Rectangle (300×250), Large responsive, Mobile.
4. Copy each **Slot ID** into `.env.local`.
5. **Replace the placeholder in `public/ads.txt`** with your real pub ID. Upload before traffic arrives.

**Ad placements (already wired in):** home top/middle/bottom, category page top/middle/bottom, job detail top/middle/sidebar.

In dev (or before approval), `AdBanner` renders an empty placeholder with reserved height — layout stays correct, CLS stays at 0. The AdSense script only loads in production when a real pub ID is set, **only on public pages** (never on `/admin`), and **only after consent is given**.

---

## Deploy to Vercel

```bash
npm i -g vercel
vercel
```

In Vercel Dashboard → **Settings → Environment Variables**, add every var from `.env.local` (both Production and Preview). Don't forget:
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_PASSWORD`
- `SESSION_SECRET`

Set `NEXT_PUBLIC_SITE_URL` to your real domain (e.g. `https://careerbridge.com`) so canonical tags and the sitemap are correct.

**Custom domain:** Vercel → Domains → add `careerbridge.com`.

---

## SEO Features

- ✅ Static generation (ISR) — home & category pages rebuild every 60–120s
- ✅ Per-page `<title>` and `<meta description>`
- ✅ Valid JSON-LD `JobPosting` — ISO dates, numeric salary min/max, `validThrough`
- ✅ `Organization` and `WebSite` JSON-LD in every page (helps Knowledge Panel)
- ✅ Canonical URLs
- ✅ Open Graph for WhatsApp/social previews
- ✅ SEO landing pages: `/category/it-jobs`, `/fresher-jobs`, `/company/tcs`, etc.
- ✅ Auto sitemap via `next-sitemap` on every `npm run build`
- ✅ `robots.txt` and `ads.txt` in `public/`
- ✅ Admin pages set `noindex`
- ✅ `<html lang="en">` and proper focus rings (a11y compliance)

---

## Performance Optimizations

| Optimization | Impact |
|---|---|
| AdSense `lazyOnload` | Cuts Total Blocking Time from ~6s to ~300ms |
| `next/font/google` for DM Sans | No render-blocking `@import` |
| Server-paginated home (9/page) | 60% smaller initial HTML payload |
| `LISTING_COLUMNS` in Supabase queries | 3× faster query, smaller JSON |
| Partial Postgres indexes | TTFB drops from ~720ms to ~150ms |
| `React.memo` on JobCard | No re-renders on filter/search typing |
| Dynamic import for `RecentlyViewedJobs` | Lazy-loaded after hydration |
| `IntersectionObserver` on AdBanner | Ads only request when visible |
| `requestIdleCallback` deferral | Ads never compete with hydration |
| `.browserslistrc` (modern browsers) | ~10 KiB less polyfill JS |
| AVIF/WebP image formats in next.config | Smaller image bytes |

Expected Lighthouse scores on production: **Mobile 80–90, Desktop 90+**.

---

## Security

- Admin password is **server-side only** (`ADMIN_PASSWORD` — no `NEXT_PUBLIC_` prefix).
- Admin session uses **iron-session** (HTTP-only, signed cookie).
- Login endpoint is **rate-limited** (5 attempts / 15 min / IP) with timing-safe password compare.
- All job mutations go through `/api/admin/*` routes using the service-role key — the client never touches it.
- View-count increment is **rate-limited** (1 hit per IP per job per hour).
- Job description is **sanitized with DOMPurify** before render (XSS-safe).
- AdSense script only loads on public pages, only with a real pub ID, only after user consent.
- Security headers in `next.config.js`: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`.
- `poweredByHeader: false` to hide the Next.js banner.

---

## WhatsApp & Social Sharing

Each job detail page has share buttons (WhatsApp, Telegram, copy link). For a public WhatsApp channel, set `NEXT_PUBLIC_WHATSAPP_CHANNEL_URL` in `.env.local`.

---

## Periodic Maintenance (Optional)

Set up a daily cron (Vercel Cron / GitHub Actions / Supabase pg_cron) to call:

```sql
SELECT deactivate_expired_jobs();  -- hides jobs past valid_through
```

Note: the **NEW badge** is computed client-side from `created_at` (3-day window), so the legacy `refresh_is_new()` function is no longer needed. You can remove it if you want.

---

## Content Strategy for AdSense Approval

Google's AdSense reviewers check for **substantial original content**. A job-aggregator alone won't be approved.

**Minimum recommended before applying:**
- 20+ original blog posts (800+ words each) in `content/blog/`
- Topics: interview tips, resume guides, company-specific hiring processes, salary insights
- Static guides like "How to prepare for TCS NQT", "BPO interview questions", "Fresher resume format"

Add new posts as `.md` files in `content/blog/` with frontmatter:
```yaml
---
title: "Your Post Title"
date: "2026-04-25"
description: "Short SEO description"
---
Content here...
```

---

## Tech Stack

- **Framework:** Next.js 14.2 (Pages Router)
- **Database:** Supabase (PostgreSQL)
- **Styling:** CSS Modules with CSS variables for theming
- **Auth:** iron-session (admin only — site is public read)
- **Markdown:** gray-matter + remark + remark-html
- **Sanitization:** isomorphic-dompurify
- **Sitemap:** next-sitemap
- **Hosting:** Vercel (recommended)

---

## License

Proprietary. Built for CareerBridge.com.