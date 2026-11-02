# Dibesh Oli — Portfolio

A fast, secure, database-driven personal portfolio for a Data Analyst & Informatics Engineer.

🔗 **Live site:** https://dibesholi.vercel.app

---

## 👋 What is this?

This is my personal portfolio website. On the surface it's a single, smooth-scrolling
page that introduces who I am, the tools I work with, the roles I've held, and the
projects I've built. Under the surface, it's a small full-stack app: the content lives
in a real database, the site is hosted on a global network, and it's protected by
proper web-security rules.

In plain terms: **it looks like a simple website, but it's wired up like a real product.**

---

## ✨ Highlights

- **Calm, intentional design** — a dark navy hero over a portrait, warm off-white page,
  and a blue accent used with purpose (not just decoration).
- **Motion that feels alive** — a hero headline that splits apart as you scroll, an
  "Experience" folder whose cards flip through as you move down the page, and a
  "Selected Work" gallery you can **drag** or **glide** through with your cursor.
- **Content from a database** — projects, experience, and skills are loaded live from
  the database, so they can be updated without touching any code.
- **Never looks broken** — if the database is ever unreachable, the site falls back to a
  built-in copy of the content, so visitors always see a complete page.
- **Accessible & polite** — respects "reduce motion" settings, keyboard focus is clear,
  and the fancy cursor turns off on touch devices.
- **Fast** — lightweight bundle, lazy-loaded sections, and images/fonts tuned for speed.

---

## 🧰 Built with

| Thing | What it is (in plain words) |
|---|---|
| **React + Vite** | The toolkit that builds the interactive page. |
| **Plain CSS** | Hand-written styles — no CSS framework. |
| **Supabase** | The database + security layer (hosted PostgreSQL). |
| **Vercel** | The host — puts the site online and redeploys it automatically. |

No heavy UI libraries — the look and the animations are all hand-built.

---

## 🗺️ How it fits together

```
   YOU edit content                         VISITORS
         │                                      │
         ▼                                      ▼
  ┌──────────────┐     reads published    ┌──────────────┐
  │   SUPABASE   │◀──────content──────────│  Site on     │
  │  (database)  │                        │  VERCEL      │
  └──────────────┘                        └──────▲───────┘
                                                 │ auto-deploys on
                                                 │ every code push
                                          ┌──────┴───────┐
                                          │   GitHub     │
                                          └──────▲───────┘
                                                 │ git push
                                            YOUR COMPUTER
```

1. Code lives on **GitHub**.
2. **Vercel** watches GitHub and rebuilds the live site every time the code changes.
3. The site asks **Supabase** for the latest content when a visitor opens it.
4. **Security rules** in the database make sure visitors can only *read* published
   content — nobody can edit anything from their browser.

---

## 📁 Project structure

```
react-app/
├── index.html              # Page shell (fonts, meta tags)
├── vercel.json             # Hosting config + security headers
├── .env.example            # Template for the two settings you need
├── supabase/
│   └── schema.sql          # Database tables + security rules (run once)
└── src/
    ├── main.jsx            # App entry point
    ├── App.jsx             # Page layout + scroll behaviours
    ├── index.css           # All styling + design tokens
    ├── lib/
    │   └── content.js      # Reads content from the database
    ├── hooks/              # Reusable behaviours (reveal-on-scroll, magnetic buttons)
    └── components/         # Hero, About, Experience, Projects, Contact, Nav, Footer…
```

---

## 🚀 Run it on your own machine

**You'll need:** [Node.js](https://nodejs.org) 18+ installed.

```bash
# 1. Install the dependencies
npm install

# 2. Start the dev server (opens http://localhost:5173)
npm run dev

# 3. Build the production version (output goes to dist/)
npm run build

# 4. Preview the production build locally
npm run preview
```

The site runs fine **without** any database configured — it just shows the built-in
fallback content. To connect your own database, see below.

---

## 🔑 Settings (environment variables)

Copy `.env.example` to `.env` and fill in two values from your Supabase project
(**Supabase → Project Settings → API**):

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-publishable-key
```

> **Is it safe that the key is public?** Yes. This is the *publishable* key — it's meant
> to be seen by browsers. The database's security rules (not the secrecy of the key) are
> what protect your data. The private `service_role` key is **never** used here.

When deploying on Vercel, add these same two values under
**Settings → Environment Variables**, then redeploy.

---

## 🗄️ The database (Supabase)

**One-time setup:**
1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor**, paste the contents of [`supabase/schema.sql`](supabase/schema.sql),
   and run it. This creates the tables, the security rules, and seeds the starter content.

**Editing content later** — no code required:
- **Supabase → Table Editor** → pick a table and edit it like a spreadsheet:
  - `projects` — the "Selected Work" cards
  - `experience_roles` — the experience timeline
  - `skill_blocks` — the skills groups
- Untick `is_published` to hide something; change `sort_order` to reorder.
- Changes appear on the live site the next time the page is loaded.

**How security works:** every table has *Row Level Security*. The public can **read only
published rows**. Writing (add/edit/delete) is limited to the admin account, and the admin
flag is stored in a protected table that no browser can modify — so nobody can promote
themselves or tamper with the data through developer tools.

---

## ☁️ Deployment

Hosted on **Vercel**, connected to this GitHub repo:
- Every push to the `main` branch triggers an automatic rebuild and deploy.
- `vercel.json` adds strong security headers (HTTPS enforcement, a Content-Security-Policy,
  clickjacking protection, and more).

To deploy your own copy: import the repo at [vercel.com/new](https://vercel.com/new),
add the two environment variables above, and click Deploy.

---

## 🔒 Security at a glance

- **HTTPS everywhere** + HSTS (forces secure connections).
- **Content-Security-Policy** with a strict `script-src 'self'` (blocks injected scripts).
- **Clickjacking protection** (`X-Frame-Options: DENY`).
- **Database-enforced access** — the server, not the browser, decides who can read or write.
- **No secrets in the code** — only the public URL and publishable key are exposed.

---

## 📬 Contact

**Dibesh Oli** — Data Analyst & Informatics Engineer, London, UK
Reach out through the contact section on the [live site](https://dibesholi.vercel.app).

---

<sub>Designed & built by hand. No page-builders, no templates.</sub>
