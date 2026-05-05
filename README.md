# Gym Routine Manager

A web app for building and managing gym routines with an AI-powered machine analyzer. Point your camera at any gym equipment and the app identifies the machine, lists the muscle groups it targets, and generates step-by-step exercises for it. Those machines then surface automatically inside your routines based on the muscles you're training that day.

---

## Features

- **Routine builder** — create weekly routines with named days, each targeting specific muscle groups
- **AI machine analyzer** — upload a photo of any gym machine; Claude Vision identifies it, suggests exercises, and saves it to your library
- **Smart machine matching** — when viewing a routine day, the app shows every machine in your library that matches that day's target muscles
- **Machine library** — browse all analyzed machines with muscle group tags and exercise details
- **Auth with OTP** — sign-up and login with email + one-time code verification

---

## How to use

1. **Sign up** at `/signup` with a username, email, and password — you'll receive a 6-digit OTP to verify your email
2. **Create a routine** at `/routines/new` — give it a name, add days of the week, and select the muscle groups for each day
3. **Analyze a machine** at `/analyze` — upload a photo of gym equipment (requires `analyzerEnabled` on your account; ask an admin to enable it)
4. The analyzed machine is saved to your library and will appear automatically inside any routine day that targets its muscles
5. **View a routine day** to see which machines from your library are relevant, then tap a machine for full exercise instructions

---

## Local development

```bash
# Install dependencies
npm install

# Copy env file and fill in values
cp .env.example .env.local

# Push database schema
npm run db:push

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | Neon (PostgreSQL) connection string |
| `ANTHROPIC_API_KEY` | Anthropic API key for the machine analyzer |
| `RESEND_API_KEY` | Resend API key for OTP emails |
| `JWT_SECRET` | Secret used to sign session tokens |
| `R2_ACCOUNT_ID` | Cloudflare account ID |
| `R2_ACCESS_KEY_ID` | R2 API token — access key |
| `R2_SECRET_ACCESS_KEY` | R2 API token — secret key |
| `R2_BUCKET_NAME` | R2 bucket name |
| `R2_PUBLIC_URL` | Public base URL of the R2 bucket |
| `MOCK_ANALYZE` | Set to `true` to skip real Claude calls during development |

### Useful scripts

```bash
npm run dev          # development server
npm run build        # production build
npm run lint         # ESLint
npm run format       # Prettier (formats all files)
npm run db:push      # push Drizzle schema to the database
npm run db:studio    # open Drizzle Studio (DB browser)
```

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 |
| UI components | shadcn/ui (Radix primitives) |
| Database | Neon — serverless PostgreSQL |
| ORM | Drizzle ORM (`neon-serverless` WebSocket driver) |
| Image storage | Cloudflare R2 (S3-compatible) |
| AI | Anthropic Claude (`claude-sonnet-4-6`) via `@anthropic-ai/sdk` |
| Auth | JWT sessions via `jose`, OTP emails via Resend |
| Formatter | Prettier |

### Project structure

```
app/              Next.js App Router pages and API routes
  api/            REST endpoints (auth, routines, machines, analyze)
components/       Shared UI components (Navbar, shadcn/ui wrappers)
constants/        Static data — muscle groups, weekday labels
services/         Domain logic — users, otp, machines, routines
db/               Drizzle schema and database client
lib/              Infrastructure utilities — auth, email, R2, utils
hooks/            React hooks (useConfirm — promise-based modal)
```

### Architecture notes

- **Two-phase AI analysis** — a cheap first call identifies the machine name only; if the machine is already cached in the DB the result is returned immediately without a second call. A full analysis (exercises, execution steps) only runs on cache miss.
- **Drizzle transactions** — `createRoutine`, `updateRoutine`, and `saveMachine` use `db.transaction()`, which requires the `neon-serverless` WebSocket driver. The HTTP driver (`neon-http`) does not support transactions.
- **Image storage** — machine images are uploaded directly to Cloudflare R2 and the public URL is stored in the DB. Nothing is written to disk, making the app stateless and safe to run on multiple instances.
- **`analyzerEnabled` flag** — the AI analyzer is gated per user. Set `analyzer_enabled = true` in the `users` table (or via Drizzle Studio) to grant access to a specific account.
