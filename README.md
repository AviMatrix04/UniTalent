# UNI-TALENT

UNI-TALENT is a directory where verified SDSU students can discover student services, showcase portfolio work, and contact providers directly.

## Local setup

Requirements:

- Node.js 20.19 or newer (`.nvmrc` uses 20.20.2)
- npm 10

Install dependencies and create your local environment file:

```bash
nvm use
npm ci
cp .env.example .env.local
```

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Quality checks

```bash
npm run format:check
npm run lint
npm run typecheck
npm run test
npm run build
```

Run all non-build checks with `npm run check`.

## Environment conventions

- **Local:** values belong in `.env.local`, copied from `.env.example`.
- **Preview:** values belong in the Vercel Preview environment and should point to non-production Supabase resources.
- **Production:** values belong in the Vercel Production environment and should point to production resources.
- Variables prefixed with `NEXT_PUBLIC_` are bundled for the browser and must never contain secrets.
- `SUPABASE_SECRET_KEY` is server-only and is reserved for narrowly scoped administrative work. Ordinary user requests must rely on the authenticated session and row-level security.

## Local database

The version-controlled Supabase configuration and migrations live in `supabase/`. A Docker-compatible container runtime is required to run the complete local stack.

```bash
npm run supabase:start
npm run db:reset
npm run db:lint
npm run supabase:stop
```

The local Auth configuration requires email confirmation and accepts redirects under `http://localhost:3000`. Row-level security policies restrict application data to confirmed SDSU students and enforce owner/admin permissions.

See [the database guide](docs/database.md) for the entity relationships, security model, local demo accounts, and migration workflow.

## Stack

- Next.js 16 with the App Router
- React 19 and TypeScript
- Tailwind CSS 4 and shadcn/ui
- Supabase PostgreSQL, Auth, and Storage
- Vitest and Testing Library
- Vercel and GitHub Actions

## Repository notes

`PLAN.md` is intentionally local-only and excluded from Git. Product code and durable project documentation should live in tracked files such as this README and future database documentation.
