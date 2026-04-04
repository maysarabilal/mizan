# Mizan (ميزان)

أول نظام إدارة مكاتب محاماة سحابي مصمم خصيصاً للمحامين.

Multi-tenant SaaS platform for managing law offices — cases, court sessions, clients, tasks, teams, subscriptions, and billing. Arabic RTL interface. Currency: ILS.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2.1 (App Router, React Compiler) |
| UI | React 19.2.4 + Tailwind CSS v4 + shadcn/ui |
| Backend | Supabase (PostgreSQL 15, Auth, RLS) |
| Validation | Zod v4 + react-hook-form v7 |
| Language | TypeScript ^5 |
| Font | IBM Plex Sans Arabic |

## Getting Started

### Prerequisites

- Node.js (LTS recommended)
- npm
- Supabase project with migrations applied

### Setup

```bash
# 1. Clone the repository
git clone <repo-url>
cd mizan

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env.local
# Fill in your Supabase credentials

# 4. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start local dev server |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run lint` | Run ESLint |

## Project Structure

```
src/
├── app/                    # Next.js App Router (routes)
│   ├── (auth)/             # Login, Register, Forgot Password
│   ├── (onboarding)/setup/ # Office creation or join-by-code
│   ├── dashboard/          # Tenant product area (10 modules)
│   ├── (admin-panel)/admin/# Platform admin panel
│   └── api/                # API routes
├── components/             # Shared components (layout, ui, notifications)
├── lib/                    # Actions, validations, Supabase clients, utils
├── emails/                 # react-email templates
├── types/                  # TypeScript type definitions
└── middleware.ts           # Auth + route protection
```

## Documentation

| Document | Purpose |
|---|---|
| `CLAUDE.md` | AI agent operational guide |
| `AGENTS.md` | Repository agent rules |
| `ARCHITECTURE.md` | System architecture |
| `DB_SCHEMA.md` | Database schema reference |
| `API_CONTRACT.md` | Server action contracts |
| `PRODUCT_RULES.md` | Business rules |
| `TESTING.md` | Testing approach |
| `TROUBLESHOOTING.md` | Common issues & fixes |
| `CODE_QUALITY.md` | Code quality standards |

## Environment Variables

See `.env.example` for required variables.

## License

Private — all rights reserved.
