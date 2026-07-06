# SteadyHand v2.0

One angle. One shot. Steady wins.

Progressive Web App skill game — tilt your phone to a secret daily angle and hold it perfectly still.

## Stack

- **Frontend:** Next.js 16 + React 19 + Tailwind CSS 4
- **Auth:** Better Auth (Apple + Google OAuth) on Supabase Postgres
- **Database:** Supabase PostgreSQL via Drizzle ORM
- **Anti-cheat:** Supabase Edge Functions (server-side tremor validation)
- **PWA:** Serwist service worker
- **Hosting:** Vercel

## Setup

### 1. Environment

```bash
cp .env.example .env.local
```

Fill in:
- `DATABASE_URL` — Supabase pooler connection string (transaction mode)
- `BETTER_AUTH_SECRET` — `openssl rand -base64 32`
- `BETTER_AUTH_URL` — `http://localhost:3000`
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
- `APPLE_CLIENT_ID` / `APPLE_CLIENT_SECRET`
- `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`

### 2. Database

```bash
# Apply migration
npm run db:push

# Or generate + migrate with Drizzle
npm run db:generate
npm run db:migrate
```

### 3. OAuth redirect URIs

Configure in Apple/Google developer consoles:
- `http://localhost:3000/api/auth/callback/google`
- `http://localhost:3000/api/auth/callback/apple`

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 5. Deploy Edge Functions

```bash
supabase functions deploy validate-attempt
supabase functions deploy medal-ceremony
```

### 6. Seed beta data (optional)

```bash
DATABASE_URL=... npx tsx scripts/seed-beta.ts
```

## Game Flow

1. **Home** — See today's date, tap START
2. **Shake gate** — Move phone for 2.5s to confirm in-hand
3. **Angle reveal** — Target angle flashes for 1.75s
4. **Targeting** — Tilt toward target; lock after 0.5s within ±2°
5. **Hold** — 10 second hold timer; drift weighted in score
6. **Score** — Weighted MAD in degrees; percentile rank shown

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run db:push` | Push schema to database |
| `npm run db:generate` | Generate Drizzle migration |
| `npm run db:migrate` | Apply migrations |
| `npm run db:studio` | Open Drizzle Studio |

## License

Private — SteadyHand PRD v2.0
