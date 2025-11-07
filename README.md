<p align="center">
	<img src="public/anl-logo.png" alt="African Nations League" width="240" />
</p>

# African Nations League 2026 Platform

African Nations League (ANL) is a Next.js 16 application that lets African football federations register their national squads, while tournament administrators seed, simulate, and broadcast the Road to the Final. It pairs Firebase (Auth + Firestore + Admin SDK) with OpenAI-powered match commentary to deliver a high-fidelity tournament experience.

---

## Features

- Representative sign-up/login, password reset, and role-based dashboard (representative vs administrator)
- Team registration with 23-player squad builder, auto-fill generator, and squad validation
- Secured admin control panel to seed brackets, reset tournaments, and run quick or AI-powered simulations
- Deterministic match engine with extra time, penalties, and auto-rebuild of missing squads
- Live bracket view that reflects quarter/semi/final progress in real time
- Goal-scorers leaderboard aggregated from match data, including player country attribution
- Comprehensive API layering: all Firestore writes happen in `/app/api/**` via the Admin SDK

---

## Project Structure

```
uct-anl-2026-app/
├── app/            # App Router routes (pages + API)
├── components/     # Client components (forms, tables, cards)
├── context/        # React context (Auth provider)
├── lib/            # Shared utilities (firebase, bracket, match engine, auth helpers)
├── public/         # Static assets
└── README.md
```

Key modules:

- `lib/firebase.js` – Firebase client SDK initialisation
- `lib/firebase-admin.js` – Admin SDK configured via service account JSON (stored in `.env`)
- `lib/playerUtils.js` – Player generation, rating utilities, squad averaging
- `lib/matchEngine.js` – Match simulation, extra time, penalties, commentary scaffolding
- `lib/bracket.js` – Tournament seeding/reset/advancement helpers
- `app/api/**` – All server-side operations (team creation, matches, admin control)

---

## Environment Variables

Create `.env` (or populate Render environment variables) with the following entries:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account", ...}

OPENAI_API_KEY=sk-...
RESEND_API_KEY=...
RESEND_FROM_EMAIL=no-reply@anl2026.africa

NEXT_PUBLIC_SITE_URL=https://placeholder.local
PUBLIC_APP_URL=https://placeholder.local
```

> **Tip:** Ensure the `FIREBASE_SERVICE_ACCOUNT_KEY` value is a minified JSON string (no newlines) or paste it with real line breaks when using Render's secret editor. The OpenAI key is required for AI commentary when running matches in **Play match** mode. `RESEND_*` powers federation result emails, and the site URL variables are referenced in outbound links.

---

## Running Locally

```bash
npm install
npm run dev

# Lint & build checks
npm run lint
npm run build
```

Visit [http://localhost:3000](http://localhost:3000). Use Firebase Authentication emulator or production credentials as needed.

---

## Firebase Setup Checklist

1. Create a Firebase project and enable Email/Password authentication.
2. Add the web app configuration to `.env` (see above).
3. Generate a service account JSON (Project Settings → Service Accounts) and copy the JSON into `FIREBASE_SERVICE_ACCOUNT_KEY`.
4. Configure Firestore security rules to restrict team creation to authenticated representatives and admin operations to users with `role === 'administrator'`.
5. (Optional) Enable Firebase Functions / extensions if you plan to send email notifications.

---

## Deployment on Render

1. Push the repository to GitHub (branch `main`).
2. In the Render dashboard choose **New → Web Service**, connect the repo, and select branch `main`.
3. Set **Build Command** to `npm install && npm run build` and **Start Command** to `npm start`.
4. Add all environment variables listed above (including `RESEND_*`, `OPENAI_API_KEY`, and `NEXT_PUBLIC_SITE_URL`). Use a placeholder for the site URL on the first deploy.
5. Deploy. After Render provisions the service, copy the live URL and update `NEXT_PUBLIC_SITE_URL` (and `PUBLIC_APP_URL` if used) to that value, then redeploy using **Deploy latest commit**.
6. Run smoke tests on the live URL:
	 - Representative signup + team registration
	 - Admin seeding + simulations (both quick and AI commentary)
	 - Bracket view and goal-scorers leaderboard
	 - Auth redirects when logged out

---

## Test Plan (Excerpt)

| Area | Scenario | Expected |
| --- | --- | --- |
| Auth | Login/logout/reset | Correct redirects, password reset email delivered |
| Team Reg | Submit 23 players / 22 players | Success vs server-side validation error |
| Admin | Start tournament with <8 teams | Error message |
| Admin | Quick sim | Immediate result, commentary summary |
| Admin | Play match sim | AI commentary generated, stored in match doc |
| Bracket | After each round | Winners advance, pending fixtures update |
| Goal Scorers | After multiple matches | Table displays cumulative goals + countries |

Document failures and re-test after each fix.

---

## Bonus: AI Commentary Workflow

The `AdminTournamentManager` offers two simulation modes:

1. **Quick result** – deterministic engine calculates the score and produces a concise summary.
2. **Play match (AI commentary)** – same engine results, followed by an OpenAI GPT request that generates 4–5 energetic sentences referencing the scoreline and scorers. Commentary is stored on the match document and surfaced in both the admin panel and bracket UI.

Ensure `OPENAI_API_KEY` is set before running Play mode.

---

## Maintenance Scripts

```bash
# Reset matches (via API) when you need a fresh tournament
curl -X DELETE "https://<your-host>/api/admin/tournament/matches?ids=<comma-separated-match-ids>" -H "Authorization: Bearer <admin-token>"

# Seed new tournament programmatically
curl -X POST "https://<your-host>/api/admin/tournament" -H "Authorization: Bearer <admin-token>"
```

---

## Credits

- Design & Engineering: ANL 2026 Dev Team
- Commentary: Powered by OpenAI GPT
- Frameworks: Next.js 16 App Router, Firebase, Tailwind (for utility styling)

---

For questions or support, reach out to the maintainers or open an issue.
