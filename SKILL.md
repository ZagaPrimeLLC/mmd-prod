---
name: zagaprime-security-check
description: Run ZagaPrime's pre-launch gate on any client build before it goes live — database exposure and RLS, secrets and API keys, rate limiting, prompt injection, dependency and auth vulnerabilities, AI-search and SEO discoverability, lead capture and attribution, and legal/sector compliance. Use when a ZagaPrime or client project is about to launch, go live, ship, or be handed over; when the user asks for a launch checklist, pre-launch review, security review, "is this safe to launch", "did we miss anything", or a go/no-go; and before any first deploy to a client's production domain. Also use when auditing a site that is already live but was never gated.
---

# ZagaPrime Security Check

The bookend to `zagaprime-build-standard`. That skill governs what happens before code is written; this one governs what happens before a client's URL is given to the public.

## The one rule

**Every item is PASS, FAIL, or N/A, and every PASS carries evidence.** Evidence is a query result, a grep of the built output, a curl response, or a screenshot — never "the code looks right" or "we set that up." Most launch incidents come from an item someone believed was handled. Reading the source is not evidence; the deployed artifact is.

If an item cannot be proven, it is FAIL. If a gate has any FAIL in it, the launch is NO-GO until it clears or the client signs off on the specific risk in writing.

Work gate by gate. Do not batch-assert a whole gate as passing.

---

## Gate 1 — Security (blocking)

### 1.1 Database exposure

ZagaPrime runs client projects as `proj_<slug>` schemas inside one shared Supabase host project. That makes this gate different from a normal single-tenant audit: **a table with RLS off is not one client's problem, it is every client's problem.** Treat any miss here as a cross-client incident.

- Every table in the project's schema has RLS enabled. Verify directly:
  ```sql
  select schemaname, tablename, rowsecurity
  from pg_tables
  where schemaname = 'proj_<slug>'
  order by rowsecurity, tablename;
  ```
  Anything with `rowsecurity = false` is a FAIL.
- Every RLS-enabled table has policies that actually scope rows. RLS on with zero policies denies everything (safe, but the app is broken). RLS on with `using (true)` is wide open while *looking* configured — grep every policy for `true` and justify each one.
- Prove it from the outside, not the inside: hit PostgREST with the **anon** key and try to read a table that should be private. A 200 with rows is a FAIL.
- Storage buckets: list them, confirm each is public or private on purpose. Signed URLs where files are client data (contracts, IDs, medical, e-sign artifacts).
- Run Supabase's own security advisors and clear or explain every finding.
- Cross-schema check: confirm this project's role/policies cannot reach another `proj_` schema.

### 1.2 Secrets and API keys

- Grep the **built** client bundle, not the repo, for `service_role`, `sk_live`, `sk_test`, private keys, and connection strings. Anything found is a FAIL and the key is burned — rotate it, do not just remove it.
- Audit every `NEXT_PUBLIC_` / `VITE_` env var. That prefix means the value ships to the browser. Confirm each one is meant to be public.
- Confirm `.env` is gitignored **and** was never committed — check history, not just the working tree.
- Rotate any key that has ever appeared in a repo, a screenshot, a support thread, a Base44 preview, or a chat with an AI tool.
- Server-side-only checks: service_role key used only in server routes, edge functions, or n8n — never in a client component or a Base44 frontend action.

### 1.3 Rate limiting on APIs

Not just forms — **every route the public can reach.** Unlimited endpoints are how a small site becomes a large invoice, an empty database, or a credential-stuffed auth table.

**Enumerate first.** List every route: `/api/*`, server actions, Supabase edge functions, n8n webhooks, and the PostgREST surface. Assign each one a limit. A route nobody assigned a limit to does not ship. This list goes in the evidence log.

**Tier the limits by what the route costs when abused:**

| Route class | Guide | Why |
|---|---|---|
| Public reads | generous | Abuse costs bandwidth |
| Writes (forms, uploads, comments) | tight | Abuse costs storage and cleanup |
| Auth (sign-in, reset, OTP) | tightest | Abuse is credential stuffing and SMS/email spend |
| AI / LLM routes | tightest, plus a hard daily cap | Abuse is an unbounded bill charged to ZagaPrime |
| Payments, e-sign | tightest | Abuse is fraud and per-envelope cost |

**Key the limit on IP *and* authenticated user id.** IP alone over-blocks real users behind carrier NAT — a live problem for the Nigeria-facing clients, where a whole city can share egress. User id alone lets anonymous traffic through untouched. Use both, take the stricter.

**Two layers:**
- **Edge** — Cloudflare WAF rate-limiting rules on the client's domain, or Vercel firewall. This is the one that matters for cost, because it rejects before the function runs and bills.
- **Application** — a per-route limiter with a shared store (Upstash Redis or Vercel KV) so the count survives across serverless instances. An in-memory counter in a serverless function counts nothing; it resets per cold start.

**Behavior on limit:**
- Return `429` with a `Retry-After` header. Not a 200 with an error body, and not a 500.
- **Fail closed.** If the limiter's store is unreachable, reject the request. A limiter that passes traffic through when Redis blips is a limiter that is off exactly when you are under load.
- Never leak the limit or the remaining count to unauthenticated callers beyond standard headers.

**The routes teams miss:**
- **n8n webhooks** — public and unauthenticated by default. Add a token and a limit, or the workflow is an open endpoint into the business.
- **Supabase PostgREST** — it is a public API. A permissive RLS policy plus no limit means a table can be paged out at speed. Put Cloudflare in front where the Supabase domain is customised.
- **Stripe webhooks** — verify the signature, and do not rate-limit legitimate Stripe retries into failure. Limit by signature validity, not volume.
- Preview and staging deployments, which usually inherit none of the production rules.

**Supabase auth settings:** leaked-password protection on, sensible OTP expiry, email confirmation required.

**Bot check** (Turnstile) on any public form that writes to the database or triggers an email.

**Prove it.** Fire ~100 rapid requests at each tier from a script, confirm 429s appear at the expected threshold, and confirm the database and the AI spend are untouched afterwards. Log every 429 and alert on spikes — a limiter nobody watches only tells you about the attack after the invoice.

### 1.4 Prompt injection

Applies to anything with a model in the loop — ZagaVoice, an EMR assistant, a site chatbot, an n8n agent, a Base44 AI action.

- Retrieved and user-supplied content is **data, never instructions**. A model reading a patient note, an inbound email, a scraped page, or a form field must not act on text inside it.
- No secrets, keys, or internal URLs in system prompts. Assume the system prompt is extractable.
- Any tool the model can call that writes, sends, pays, deletes, or emails is either behind explicit human confirmation or not exposed to the model at all.
- Model output rendered into the page is escaped. An injected `<script>` or `<img onerror>` in a model response is stored XSS.
- Scope the model's data access to the current user's rows. A RAG layer that queries with the service_role key defeats every RLS policy in 1.1.

### 1.5 Vulnerability scan

- Dependency audit clean of high/critical, or each exception documented. Dependabot or equivalent enabled going forward.
- Static scan across the repo before handover.
- Auth flows tested by hand: password reset token single-use and expiring, sessions expire, sign-out actually invalidates.
- IDOR sweep: for every `/api/<thing>/[id]` route, sign in as user A and request user B's id. A 200 is a FAIL.
- Security headers present on the domain: HSTS, X-Content-Type-Options, a real CSP, Referrer-Policy.

---

## Gate 2 — Found by AI and search

Buyers increasingly ask an assistant before they search. A site that only renders under JavaScript is invisible to most of them.

- `robots.txt` makes a **deliberate** decision on GPTBot, ClaudeBot, PerplexityBot, OAI-SearchBot, and Google-Extended. Default-blocked by a framework template is a FAIL — decide, then document the decision for the client.
- **Content exists without JavaScript.** `curl` the page and confirm the headline, services, and contact details are in the HTML. This is the single most common miss on Base44 and SPA builds.
- `llms.txt` at the root: what the business is, what it offers, who it serves, how to contact it.
- schema.org JSON-LD, matched to the client: `Organization` plus `LocalBusiness`, `MedicalBusiness`/`MedicalClinic`, `HomeAndConstructionBusiness`, or `Product` as fits. Validate it, don't just ship it.
- Unique `<title>` and meta description per page. No "Home | Home".
- `sitemap.xml` submitted, canonical tags set, no stray `noindex` left over from staging.
- Name, address, phone identical across the site, Google Business Profile, and the client's social profiles.
- Real test: ask ChatGPT, Claude, and Perplexity a buyer-shaped question in the client's category and city. Record whether the client appears. That's the baseline to beat at the 30-day review.

---

## Gate 3 — Leads and attribution

A launch that captures leads but cannot say where they came from spends the client's money blind.

- Every form writes to a durable store — a Supabase table or the ZagaPrime CRM — **before** it sends an email. Email-only capture loses leads silently.
- SPF, DKIM, and DMARC on the sending domain, or notification email lands in spam and nobody notices for a week.
- The lead row stores `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`, plus referrer, landing page, and timestamp. Capture on first touch and persist it through to submit.
- Conversion event fires on the thank-you state, and analytics is installed and receiving.
- Click tracking on phone, WhatsApp, and email links — on a service business those outnumber form fills.
- A named human owns the inbox and the response-time expectation is agreed with the client.
- **End-to-end test on a phone, on mobile data, from outside the office network.** Submit a real lead, confirm it lands in the database, the CRM, and the inbox, with attribution attached.

---

## Gate 4 — Legal and sector

- Privacy policy, terms, and — where there is EU or UK traffic — real cookie consent that blocks non-essential scripts until accepted. A banner that sets cookies before the click is worse than no banner.
- Stated lawful basis for processing and a retention period that matches what the database actually does.
- **Nigeria:** NDPA obligations and NDPC registration where the client's processing meets the threshold. Confirm status; do not assume.
- **Healthcare:** MDCN advertising rules govern what a Nigerian clinic site may claim — no guaranteed outcomes, no patient testimonials used as advertising, no comparative superiority claims. Review every headline and service page against this, not just the legal pages. NHIA obligations where they apply.
- **US homecare:** any page or form touching health information needs the handling and agreements to match; a generic contact form must not invite clinical detail.
- **Payments:** live-mode keys confirmed live, webhook signature verified, refund and cancellation policy published, receipts sending.
- **E-sign:** audit trail captured and retained, signed artifacts stored in a private bucket with signed-URL access only.
- Accessibility baseline — contrast, focus states, alt text, form labels, keyboard path through every form.

---

## Output

Produce a single Security Check Report for the client project:

```
PROJECT:   <client / domain>
DATE:      <date>          GATE RUN BY: <name>
VERDICT:   GO / NO-GO

GATE 1 SECURITY          PASS / FAIL   (n items, n failed)
GATE 2 AI + SEARCH       PASS / FAIL
GATE 3 LEADS             PASS / FAIL
GATE 4 LEGAL             PASS / FAIL

FAILURES (blocking)
  <item>  — what was found, the evidence, the fix, the owner, the date

ACCEPTED RISKS (client signed off)
  <item>  — risk, who accepted, when

EVIDENCE LOG
  <item>  — query / command / URL and its result
```

Attach the evidence log. It is what protects ZagaPrime if something goes wrong later, and it is what makes the second launch faster than the first.

## After launch

Re-run Gate 1 after any schema change, new integration, or new AI feature — not on a schedule, on a trigger. Re-run Gate 2 at 30 days against the AI-assistant baseline recorded above.
