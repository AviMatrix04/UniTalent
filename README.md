# UNI-TALENT

UNI-TALENT is a student-to-student marketplace for verified San Diego State University students. Students can discover services, publish their own offerings, showcase portfolio work, and contact providers directly.

## What it includes

- SDSU-only sign-up with email confirmation and protected routes
- Searchable service listings with pricing, categories, skills, and lifecycle states
- Student profiles with configurable contact methods and avatars
- Portfolio images stored in Supabase Storage
- Reporting and administrator review workflows
- Row-level security policies and database tests for application data

## Get started

### Requirements

- Node.js 20.19 or newer; the included `.nvmrc` selects 20.20.2
- npm 10
- Docker-compatible container runtime for the local Supabase stack

Install dependencies and create your local environment file:

```bash
nvm use
npm ci
cp .env.example .env.local
```

Start the local Supabase services, then use `npx supabase status` to find the local API URL and publishable key. Add them to `.env.local` as `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Keep `NEXT_PUBLIC_APP_URL` set to `http://localhost:3000`; `SUPABASE_SECRET_KEY` is not needed for normal application use.

```bash
npm run supabase:start
npx supabase status
npm run db:reset
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Local demo accounts and passwords are documented in [the database guide](docs/database.md).

Stop the local Supabase stack when you are done:

```bash
npm run supabase:stop
```

### Local demo accounts

After `npm run db:reset`, the seed creates fictional accounts for a photography provider, tutor, designer, and administrator. They all use the password `UniTalentDemo123!`. See [docs/database.md](docs/database.md) for the email addresses and account details.

## Environment

The committed [`.env.example`](.env.example) lists the variables used by the app. Keep actual values in `.env.local` for local development and configure them separately in Vercel Preview and Production. Preview should use non-production Supabase resources.

`NEXT_PUBLIC_` values are included in browser bundles and must never contain secrets. `SUPABASE_SECRET_KEY` bypasses row-level security; keep it server-only and use it only for narrowly scoped administrative work. Ordinary user requests should use the authenticated session and database policies.

## Database

Supabase configuration, seed data, and timestamped migrations are maintained in `supabase/`. The local Auth setup requires email confirmation and allows redirects under `http://localhost:3000`. Row-level security limits application data to confirmed SDSU students and enforces owner and administrator permissions.

See [the database guide](docs/database.md) for the schema, security model, local demo accounts, database tests, and migration workflow.

## Checks

Run formatting, lint, type, and unit checks together:

```bash
npm run check
```

Run the production build separately:

```bash
npm run build
```

The individual checks are `npm run format:check`, `npm run lint`, `npm run typecheck`, and `npm run test`. Database checks are available through `npm run db:test` and `npm run db:lint` while the local Supabase stack is running.

## Project structure

```text
src/app/                 Next.js routes, pages, and server actions
src/components/          Reusable feature and UI components
src/lib/                 Validation, Supabase, and domain services
supabase/migrations/     Timestamped schema and security changes
supabase/seed.sql        Fictional local development data
supabase/tests/          Database access-policy tests
docs/database.md         Schema, security, and migration guide
```

## Contribution workflow

1. Create a feature branch.
2. Make schema changes in a new timestamped migration when needed.
3. Run `npm run check`, plus the database checks when changing Supabase code.
4. Run `npm run build` before opening a pull request.

Do not commit `.env.local`, production credentials, or real student data.

## Tech stack

- Next.js 16 App Router, React 19, and TypeScript
- Tailwind CSS 4 and shadcn/ui
- Supabase PostgreSQL, Auth, and Storage
- Vitest and Testing Library
- Vercel and GitHub Actions
