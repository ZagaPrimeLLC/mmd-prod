<div align="center">

# MMD Community Care

**Public website + internal operations CRM**

New Jersey DDD approved statewide provider · South Plainfield, NJ

[![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=next.js&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Tailwind](https://img.shields.io/badge/Tailwind-3.4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres-3FCF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![Vercel](https://img.shields.io/badge/Vercel-deployed-000000?logo=vercel&logoColor=white)](https://vercel.com)

</div>

---

## Overview

One Next.js application serving two audiences from a single codebase and a single database.

| Surface | Route | Audience |
| :--- | :--- | :--- |
| **Public website** | `/` | Families, guardians, support coordinators |
| **Internal CRM** | `/dashboard` | The MMD operations team |

Keeping them together means one `job_posts` row renders the public Careers listing *and* generates the column on the applicant board. Splitting them would mean two deploys, two schemas, and a synchronisation problem.

---

## Stack

| Layer | Choice |
| :--- | :--- |
| Framework | Next.js 16 (App Router) · React 19 · TypeScript · Tailwind |
| Hosting | Vercel |
| Database | Supabase — dedicated project `zwkpeksrsiaanewuzizc` (Zagaprime org), schema `proj_mmd` |
| Auth | Supabase Auth (magic link, invite-only via Settings), scoped by `hub.is_member('mmd')` |
| Files | Supabase Storage — private bucket `mmd-resumes`, signed URLs only |
| DNS | Cloudflare (planned), Wix panel until the domain transfer completes |

---

## Getting started

```bash
npm install
cp .env.example .env.local    # add the publishable key
npm run dev                   # http://localhost:3000
```

| Script | Does |
| :--- | :--- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run lint` | ESLint 9 (flat config, `eslint-config-next`) |
| `npm run typecheck` | `tsc --noEmit` |

### Environment

| Variable | Value |
| :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://zwkpeksrsiaanewuzizc.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Publishable key from Supabase → API keys |
| `NEXT_PUBLIC_SUPABASE_SCHEMA` | `proj_mmd` |

Set all three in Vercel → Project → Settings → Environment Variables for Production, Preview and Development.

> [!IMPORTANT]
> Add the deployed URL to **Supabase → Authentication → URL Configuration → Redirect URLs**, including the Vercel preview pattern, or magic-link sign-in will bounce.
>
> Team members are added by an administrator in **Settings → Team and access** (email + role). An existing account joins immediately; anyone else gets an invite that applies their role the first time they sign in at `/login`. To stop uninvited emails creating a login at all, enable **Authentication → Hooks → Before User Created → `proj_mmd.hook_before_user_created`**. Each person sets their name, title and photo on **My profile**.

---

## Database

Schema lives in Supabase project `zwkpeksrsiaanewuzizc`, schema `proj_mmd` (moved off the shared beta.zagram.store host on 2026-09-30). `proj_mmd` must be listed under **Project Settings → Data API → Exposed schemas**. The small `hub` schema holds team membership and is kept so the access rules did not change in the move.

```bash
supabase link --project-ref zwkpeksrsiaanewuzizc
supabase db pull --schema proj_mmd
```

### Tables

**Team** — `cases` · `job_posts` · `applicants` · `applications` · `screenings` · `handoffs` · `tasks` · `comments` · `activity_log`

**Public forms** — `inquiries` · `bookings` · `newsletter_subscribers`

### Access model

> [!NOTE]
> Team tables use **member read + member write** — deliberately *not* `hub.secure_table`, whose default is owner-writes-own-rows. A board where only the creator can move a card is unusable for a shared team.

| Rule | Applies to |
| :--- | :--- |
| Member read + member write | All team tables |
| Delete restricted to `admin` | `applicants`, `applications`, `screenings`, `handoffs` |
| **Append-only** — no update or delete policy for anyone | `activity_log` |
| `anon` **INSERT only**, no select policy | `inquiries`, `bookings`, `newsletter_subscribers` |

The publishable key ships in the client bundle by design. Because no anon select policy exists, that key can submit a form and cannot read a single submission back. Verified against the live REST API:

| Check | Result |
| :--- | :--- |
| Public key inserts an enquiry | `201` |
| Public key reads enquiries | `[]` |
| Public key reads applicants | `[]` |
| Public key updates an enquiry | no rows affected |

---

## The PHI boundary

> [!CAUTION]
> **Employee and applicant PII only. No PHI, ever.**
>
> Supabase's free tier carries **no BAA**. The moment protected health information lands here, it is stored on infrastructure with no agreement covering it.

`cases` holds a code, town, schedule and hours — staffing facts. No individual-served identity, no diagnoses, no care plans, no medication.

**There is no care-notes table and there must not be one.** The absence is the control. Adding one is a compliance decision requiring review, not a feature request.

The real risk is free text. Watch `handoffs.case_info` and `screenings.notes` — that is where PHI enters a system like this, written by someone being helpful about a specific individual. **Review one month after rollout.**

---

## Roles

Held in `hub.memberships`. Roles drive routing and defaults, not access locks.

`admin` · `hr` · `supervisor` · `case_manager` · `coordinator`

---

## Pipeline

```
CareerPlug → New → Screening → Ready → With Coordinator → Appointment Set → Completed
                       ↓
                   Archived (not qualified / unresponsive)
```

CareerPlug stays the system of record for applications. This dashboard is the working surface. Intake is a ladder, built so the source is swappable:

1. **CSV export** — works on any plan, ships first
2. **Notification emails parsed by n8n** — the steady state
3. **Native API / webhooks** — Grow plan only, not currently available

### Jobs

Jobs are created and published in **Dashboard → Jobs**. Publishing sets `status = 'open'` and `published = true`, which is exactly what the anon RLS policy on `job_posts` exposes, so a job appears on `/careers` and at `/careers/<slug>` the moment it is published (the pages are revalidated on every change) and disappears when it is paused or closed. The slug is fixed at creation so shared links survive title edits. Job pages carry `JobPosting` structured data for Google for Jobs.

### Applicant intake

Every way in goes through one database routine, `proj_mmd._ingest_applicant`, which recognises an existing person by CareerPlug ID, then email, then the last ten phone digits, and matches the job by id, CareerPlug job ID, then title.

| Door | Where | Who |
| :--- | :--- | :--- |
| CSV import | Dashboard → Import applicants (`import_applicants`) | admin, ops |
| Automatic feed | `POST /api/intake` with `Authorization: Bearer <key>` (`intake_applicant`) | n8n / Zapier, per key |
| Job page apply form | `/careers/<slug>` (`apply_to_job`) | the public, open jobs only |

Feed keys are created and revoked by an administrator in **Settings → Automatic applicant feed**. Only a SHA-256 of each key is stored; the key is shown once. The route holds no secrets; the database checks the key.

Schema changes live in [supabase/migrations/](supabase/migrations/).

---

## Project layout

```
src/
├── app/
│   ├── (dashboard)/dashboard/   internal CRM, auth-gated
│   ├── auth/callback/           magic-link exchange
│   ├── login/                   team sign-in
│   ├── layout.tsx
│   └── page.tsx                 public home
├── components/
├── lib/
│   ├── supabase/                browser + server clients
│   ├── pipeline.ts              stages, roles, staleness
│   └── site.ts                  site content and service copy
└── proxy.ts                     gates /dashboard (Next 16's name for middleware)
```

---

## Status

**Milestone 1 complete** — schema, RLS, storage, auth, board shell, public home page.

| Next | |
| :--- | :--- |
| Milestone 2 | CSV import · applicant detail |
| Milestone 3 | Screening flow · coordinator handoff |
| Milestone 4 | Task board · PWA · share-target capture |
| Milestone 5 | n8n intake · dashboard · WhatsApp digest |
| Milestone 6 | Adoption review · PHI audit of free-text fields |
