<p align="center">
	<img src="public/anl-logo.png" alt="African Nations League" width="240" />
</p>

# African Nations League 2026 Platform

Next.js 16 application backed by Firebase that powers the African Nations League tournament experience. The platform has two primary personas: federation representatives who manage their squads and administrators who control the knockout bracket.

---

## Quick Facts

- **Live URL:** `https://<render-app-url>`
- **Administrator Login:** `admin@gmail.com
- **Representative Login (optional):** `<rep-email> / <rep-password>`
 - **Live URL:** `https://<render-app-url>`
 - **Administrator Login (placeholder):** `admin@example.com / <admin-password>`
 - **Representative Login (optional placeholder):** `rep@example.com / <rep-password>`

(Replace the placeholders above with the credentials supplied in your submission pack.)

---

## Core User Journeys

### Federation Representative
- Registers or signs in via email/password.
- Completes a multi-step team registration form with 23-player validation, inline rating guidance, and squad auto-fill helpers.
- Can return later to edit squad details before the tournament locks in.

### Tournament Administrator
- Accesses the admin console (guarded by role checks in Firestore).
- Reviews registered teams and selects the eight qualifiers for the bracket using the manual seeding tool.
- Runs match simulations:
	- **Quick Sim** for deterministic instant results.
	- **Play Match** to generate AI commentary (OpenAI) and richer key moments.
- Sees the bracket update live and a champion banner appear on the public site when the final concludes.
- Automatically emails federation contacts after each match when Resend credentials are present.

### Public Fan Experience
- Hero and live stats section shows federation counts, top goal scorers (driven by match data), and the reigning champion badge.
- Bracket page displays quarter-final to final progression with real-time commentary snippets.
- News and analytics pages surface simulation summaries and player insight.

## User tour (what to expect on each page)

- **/** (Home): Hero message, federation count, live goal-scorer feed, and champion banner once the tournament finishes.
- **/bracket**: Public knockout tree with quarter/semi/final rounds, match scorelines, commentary snippets, and champion highlight.
- **/goal-scorers**: Leaderboard of players ranked by goals, podium highlights, and chasing pack table refreshed in real time.
- **/news**: Latest match stories auto-generated during simulations; links back to bracket fixtures.
- **/dashboard** (admin only): Tournament control center featuring seeding widget, live bracket visualisation, match inspector, and simulation controls.
- **/teams** (representative focus): Directory of registered federations showcasing ratings and contact info.
- **/signup** and **/login**: Entry points for federation representatives and administrators.
- **/analytics/[teamId]**: Optional deep-dive for team analysts with charts powered by match data.

---

## Technology Highlights

- **Next.js 16 App Router** for server actions and API routes (`/app/api/**`).
- **Firebase Auth & Firestore** for authentication, team data, matches, and real-time listeners.
- **Firebase Admin SDK** powers secure server-side mutations (seeding, simulations, news generation).
- **OpenAI API** generates commentary lines in play mode; offline fallback ensures resilience.
- **Resend** delivers match result emails to federation contacts.

## Rationale (design goals)

- Security first: server-side API routes perform privileged Firestore writes using the Firebase Admin SDK; client code avoids privileged writes.
- Observability: match documents include structured fields (score, goalscorers, commentary, completedAt) so public pages and analytics can render deterministic views.
- Resilience: AI commentary is optional — the system falls back to a deterministic summary when OpenAI is unavailable.
- Modularity: match simulation, email, and seeding logic live in `lib/` to keep API routes thin and testable.

## System components

- Next.js app (server + client) — pages, API routes, server helpers
- Firebase Auth & Firestore — user accounts, teams, players, matches, news
- Firebase Admin SDK — secure server-side operations (seeding, simulation, news write)
- Match Engine (`lib/matchEngine.js`) — simulation algorithm, extra time, penalties
- Email service (`lib/emailService.js`) — Resend wrapper and templates
- AI service (OpenAI) — optional commentary generation invoked from server API


---

## Rough Architecture

```
			 [Client - Browser]
				  |
				  |  (1) reads / listens
				  v
			  Next.js App (pages + API)
			   /         |        \
	  (2) admin calls /   (3) server   (4) server-side
	  secure API routes      logic       side-effects
	     |                   |              |
	     v                   v              v
     Firebase Admin SDK ---> Firestore   OpenAI / Resend (external)
				  (teams, matches, news)

components/  - UI (bracket, admin console, live stats)
lib/         - matchEngine, bracket logic, email templates, helpers
services/    - client-side wrappers calling `app/api/*`
```

---

## What To Expect During Review

- Sign in with the administrator account → visit `/dashboard` for the control panel.
- Seed the tournament (if not already seeded), simulate matches, and observe bracket advancement.
- Visit `/goal-scorers` and the home page to confirm public stats update without additional refreshes.
- Inspect the API route code under `app/api/**` for security and validation patterns.

If you need assistance while marking, contact banelegumede444@gmail.com.
