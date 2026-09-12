<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# ScaleupResume — scaleupresume.com

AI-powered resume optimization app (React + Vite frontend, Vercel serverless
API, Supabase auth/database, Stripe + Razorpay payments, Brevo email, Google
Reviews).

## Run Locally

**Prerequisites:** Node.js 20+

1. Install dependencies: `npm install`
2. Copy `.env.local.example` to `.env.local` and fill in `GEMINI_API_KEY`,
   `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `GOOGLE_PLACES_API_KEY`, `GOOGLE_PLACE_ID`.
3. Run the app: `npm run dev`

The payment/email API routes under `/api` are Vercel serverless functions and
only run when deployed to Vercel (or via `vercel dev` locally).

## Production Setup Checklist

### Security requirements

- Keep the GitHub repository **private** and restrict organization/team access.
- Never commit `.env.local`, API keys, service-role keys, payment secrets, or
  webhook signing secrets. Rotate any secret that has ever appeared in a
  public commit or client bundle.
- Gemini calls run through the authenticated `/api/gemini` serverless route;
  keep `GEMINI_API_KEY` configured only in Vercel server environment variables.
- Enable Vercel deployment protection for preview deployments and require
  protected branch reviews in GitHub.
- Enable Supabase email confirmation, MFA for administrators, RLS, and database
  backups. Keep the service-role key server-only.
- Add server-side rate limiting and request-size limits to AI, job-search,
  email, and payment endpoints before launch.

### 1. Supabase (auth + database)
1. Create a project at https://supabase.com.
2. In the SQL Editor, run [`supabase/schema.sql`](supabase/schema.sql) — this
   creates the `profiles`, `transactions`, and `reviews` tables with Row Level
   Security policies, plus a trigger that auto-creates a profile on signup.
3. In **Authentication → Providers**, ensure Email provider is enabled, and
   enable "Email OTP" for the 2FA login step.
   New signups receive an email OTP before the account session is completed.
4. Copy your **Project URL** and **anon public key** into `.env.local`
   (`SUPABASE_URL`, `SUPABASE_ANON_KEY`).
   For local password recovery testing, add `http://127.0.0.1:3000` and
   `http://localhost:3000` under **Authentication → URL Configuration →
   Redirect URLs** in Supabase.
   Password recovery is enabled for every account, including
   `veenbd9@gmail.com`; the super-admin still receives the separate OTP
   challenge when signing in after the password is reset.
5. Add a valid `GEMINI_API_KEY` to the local/server environment before using
   Health Check or resume analysis. This key must remain server-side.
6. Copy the **service_role key** (Project Settings → API) into your Vercel
   environment variables as `SUPABASE_SERVICE_ROLE_KEY` — never expose this
   key in frontend code or commit it to git.

### 2. Vercel (hosting)
1. Push this repo to GitHub, then import it at https://vercel.com/new.
2. Framework preset: Vite (auto-detected via `vercel.json`).
3. Add all environment variables listed in `.env.local.example` under
   Project Settings → Environment Variables (both the public `VITE`-style
   ones and the server-only secrets).
4. Deploy. Vercel automatically builds `/api/*.ts` files as serverless
   functions.

### 3. Namecheap (domain)
1. Buy `scaleupresume.com` on https://www.namecheap.com.
2. In Vercel, go to Project → Settings → Domains → Add `scaleupresume.com`.
3. In Namecheap's DNS settings for the domain, add the DNS records Vercel
   shows you (typically an `A` record to `76.76.21.21` and a `CNAME` for
   `www` pointing to `cname.vercel-dns.com`).
4. Wait for DNS propagation (up to 24-48h), then Vercel auto-issues an SSL
   certificate.

### 4. Stripe (international card payments)
1. Create an account at https://dashboard.stripe.com.
2. Get your **Secret key** (Developers → API keys) → set as
   `STRIPE_SECRET_KEY` in Vercel.
3. After deploying, create a webhook endpoint in Stripe pointing to
   `https://scaleupresume.com/api/stripe-webhook` listening for
   `checkout.session.completed`. Copy its **signing secret** → set as
   `STRIPE_WEBHOOK_SECRET` in Vercel.

### 5. Razorpay (UPI / PhonePe / Google Pay / Indian cards)
1. Create an account at https://dashboard.razorpay.com and complete KYC to
   go live (test mode works immediately for development).
2. Get your **Key ID** and **Key Secret** (Settings → API Keys) → set as
   `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in Vercel.
3. No separate PhonePe/Google Pay integration is required — Razorpay
   Checkout automatically offers all UPI apps installed on the customer's
   device, along with cards and netbanking.

### 6. Adzuna (job search)
1. Register for an API account at https://developer.adzuna.com.
2. Copy the application ID and key into `ADZUNA_APP_ID` and `ADZUNA_APP_KEY`
   in Vercel. Keep these values server-side; the Jobs tab accesses them through
   `/api/jobs`.
3. The app currently searches Adzuna's India endpoint and preserves each
   provider's application URL for the Apply and Track workflows.

### 7. Brevo (customer emails)
1. Create an account at https://www.brevo.com.
2. Verify a sender identity/domain (e.g. `noreply@scaleupresume.com`) under
   Senders & IP → Senders.
3. Get an **API key** (SMTP & API → API Keys) → set as `BREVO_API_KEY` in
   Vercel, and set `BREVO_SENDER_EMAIL` to your verified sender address.
4. Transactional emails (payment confirmations, etc.) are sent via
   `POST /api/send-email`, see [`services/paymentService.ts`](services/paymentService.ts).

### 8. Google Reviews widget
1. Create/claim your Google Business Profile for ScaleupResume.
2. Get a **Places API key** in Google Cloud Console (enable the "Places API")
   → set as `GOOGLE_PLACES_API_KEY` in Vercel.
3. Find your **Place ID** using Google's
   [Place ID Finder](https://developers.google.com/maps/documentation/places/web-service/place-id)
   → set as `GOOGLE_PLACE_ID` in both `.env.local` (build-time, used for the
   "Leave a review" link) and Vercel (server-side, used to fetch reviews).
4. The widget renders automatically at the bottom of the app via
   [`components/ReviewsSection.tsx`](components/ReviewsSection.tsx).

### 9. Gmail OAuth (Jobs tab "Connect Gmail" for Auto Apply)
Job Search **Auto Apply** emails a hiring manager/recruiter directly, so it
must be sent from the user's own Gmail account (never from
scaleupresume.com) for deliverability and trust. This requires a one-time
Google Cloud OAuth setup (separate from Brevo, which is only used for our own
payment-confirmation emails):
1. In [Google Cloud Console](https://console.cloud.google.com), create or
   reuse a project (the same one used for the Gemini API key is fine).
2. **APIs & Services → Library** → enable the **Gmail API**.
3. **APIs & Services → OAuth consent screen**:
   - User type: External.
   - Add the scope `https://www.googleapis.com/auth/gmail.send` (and
     `.../auth/userinfo.email`).
   - While in **Testing** mode, add each real user's Gmail address under
     "Test users" (Google caps this at 100 and shows an "unverified app"
     warning screen users must click through). Submit Google's app
     verification/CASA security review when ready to open this to the
     public beyond test users — `gmail.send` is a restricted scope, so this
     can take from a few days up to several weeks and may involve a paid
     third-party security assessment.
4. **APIs & Services → Credentials → Create Credentials → OAuth client ID**
   (Application type: Web application). Add an **Authorized redirect URI**
   of `https://scaleupresume.com/api/gmail-oauth-callback` (and
   `http://localhost:3000/api/gmail-oauth-callback` / `:3001` for local dev).
5. Copy the **Client ID** and **Client Secret** →set as `GOOGLE_OAUTH_CLIENT_ID`
   / `GOOGLE_OAUTH_CLIENT_SECRET` in Vercel, and set
   `GOOGLE_OAUTH_REDIRECT_URI` to the production redirect URI from step 4.
6. In Supabase SQL Editor, re-run [`supabase/schema.sql`](supabase/schema.sql)
   (it's additive/idempotent) so the `email_connections` table exists.
7. Users click "Connect Gmail" on the Jobs tab, approve the Google consent
   screen, and are redirected back with Gmail connected — see
   [`services/gmailService.ts`](services/gmailService.ts),
   [`lib/googleOAuth.ts`](lib/googleOAuth.ts), and the
   `api/gmail-oauth-start.ts` / `api/gmail-oauth-callback.ts` /
   `api/gmail-status.ts` / `api/gmail-disconnect.ts` /
   `api/send-job-application-email.ts` serverless functions.
