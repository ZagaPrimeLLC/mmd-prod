<div align="center">

# MMD Community Care

**Public website + internal operations CRM**

New Jersey DDD approved statewide provider · South Plainfield, NJ

[![Next.js](https://img.shields.io/badge/Next.js-14-000000?logo=next.js&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres-3FCF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![Cloudflare Pages](https://img.shields.io/badge/Cloudflare-Pages-F38020?logo=cloudflare&logoColor=white)](https://pages.cloudflare.com)

</div>

---

## Overview

One Next.js application serving two audiences from a single codebase and a single database.

| Surface | Route | Audience |
| :--- | :--- | :--- |
| **Public website** | `/` | Families, guardians, support coordinators |
| **Internal CRM** | `/dashboard` | The five-person MMD operations team |

Keeping them together means one `job_posts` row renders the public Careers listing *and* generates the column on the applicant board. Splitting them would mean two deploys, two schemas, and a synchronisation problem.

---

## Stack

| Layer | Choice | Why |
| :--- | :--- | :--- |
| Framework | Next.js 14 (App Router) · TypeScript · Tailwind | Server rendering is what makes the SEO goals reachable |
| Hosting | Cloudflare Pages | Free tier **permits commercial use**; accepts a custom domain by CNAME from external DNS |
| Database | Supabase — shared host, schema `proj_mmd` | Standing rule: no new Supabase project |
| Auth | Supabase Auth (magic link) | Scoped by `hub.is_member('mmd')` |
| Files | Supabase Storage — private bucket `mmd-resumes` | Signed URLs only, never public |

> [!NOTE]
> **Vercel was evaluated and rejected.** The Hobby tier forbids commercial use and MMD is a trading business; Pro at $20/month defeats the point of replacing a $204/year Wix plan.
>
> **Pages rather than Workers.** Workers custom domains require the zone to sit on Cloudflare DNS, which is blocked until the domain is recovered from GoDaddy. Pages accepts a CNAME from the existing Wix DNS panel today.

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
| `npm run typecheck` | `tsc --noEmit` |
| `npm run pages:build` | Cloudflare Pages build |

---

## Database

Schema lives in Supabase project `vcwvrtxbmgtwemsqdmch`, schema `proj_mmd`.

```bash
supabase link --project-ref vcwvrtxbmgtwemsqdmch
supabase db pull --schema proj_mmd
```

### Tables

**Team** — `cases` · `job_posts` · `applicants` · `applications` · `screenings` · `handoffs` · `tasks` · `comments` · `activity_log`

**Public forms** — `inquiries` · `bookings` · `newsletter_subscribers`

### Access model

> [!IMPORTANT]
> Team tables use **member read + member write** — deliberately *not* `hub.secure_table`, whose default is owner-writes-own-rows. A board where only the creator can move a card is unusable for a five-person team.

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

Held in `hub.memberships`. Roles drive routing and defaults, not access locks — at five people, a permission matrix adds friction and prevents nothing.

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
