# Jarcode Technology Website

Premium, fast, fully responsive corporate website for **Jarcode Technology** — digital solutions and software development founded by **Jareer Ahmed**.

**Tagline:** Transforming Ideas Into Technology.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS v4
- Server Components by default; client JS only for interactive UI
- Optional contact delivery via Resend or webhook

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run build
npm start
```

## Central configuration

Update company details, services, portfolio placeholders, FAQs, and contact links in:

[`src/config/site.ts`](src/config/site.ts)

## Brand assets

Place production assets here:

| Asset | Path |
| --- | --- |
| Full logo | `public/images/logo.svg` (or `.png` / `.webp`) |
| Logo mark | `public/images/logo-mark.svg` |
| Founder photo | `public/images/founder.jpg` then set `founder.image` in `site.ts` |
| Portfolio screenshots | `public/images/portfolio/` + update `portfolioProjects` |

SVG placeholders are included until official files are supplied.

## Create Your Demo (shared public demos)

- Landing page: `/create-your-demo`
- Society demo: `/create-your-demo/society`
- Hospital demo: `/create-your-demo/hospital`

Both demos use **separate server-side JSON databases** in `data/demos/` (not LocalStorage). All visitors share the same Society data and the same Hospital data. Admin can reset demos from `/admin` after login.

For multi-instance cloud hosting (e.g. serverless without disk), replace the file store with a managed database while keeping the same API routes.

## Admin inquiry inbox

Website form submissions are saved for admin review.

1. Open `/admin/login`
2. Sign in with:
   - Email: `jareer@admin.com`
   - Password: `jareer1234`
3. View, add, or delete inquiries
4. Reset public Society / Hospital demo data

Change credentials in `.env.local` (`ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`).

## Contact form setup

Inquiries are always stored for the admin inbox. Optionally also configure:

1. `CONTACT_WEBHOOK_URL` — POST JSON inquiries to your endpoint  
2. `RESEND_API_KEY` + `CONTACT_TO_EMAIL` — email via [Resend](https://resend.com)

## WhatsApp

- Number: `+92 318 4429280`
- Link: `https://wa.me/923184429280`

Floating button + section CTAs use a prefilled message from `site.ts`.

## SEO

- Metadata in `src/app/layout.tsx`
- `sitemap.ts` / `robots.ts`
- Organization JSON-LD
- Privacy & Terms starter pages (marked for legal review)
- Custom `not-found` page

Set `NEXT_PUBLIC_SITE_URL` to your production domain.

## Deploy

Deploy to Vercel, Netlify, or any Node host supporting Next.js:

```bash
npm run build
```

Add the environment variables from `.env.example` in your host dashboard.

## Notes

- Portfolio cards are labeled **Design Placeholder** until real projects are added.
- The 959+ milestone is presented as a company-provided achievement, not a third-party certificate.
- Privacy Policy and Terms of Service are starter pages and need company-specific legal review.
