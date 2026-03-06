# JusTenant

> Multi-tenant Real Estate & Tenant Management SaaS Platform

**Portal:** `portal.justanent.com`

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router, TypeScript, Tailwind) |
| Backend | NestJS (TypeScript) |
| Database | PostgreSQL + Prisma ORM |
| Auth | JWT + Refresh Tokens |
| Storage | AWS S3 / Cloudflare R2 |
| Email | SendGrid |
| WhatsApp | Meta WhatsApp Business API |

## Monorepo Structure

```
justenant/
├── apps/
│   ├── api/          ← NestJS backend
│   └── web/          ← Next.js frontend
├── docker-compose.yml
└── .env.example
```

## Quick Start

### 1. Start the database
```bash
docker-compose up -d
```

### 2. Backend
```bash
cd apps/api
cp .env.example .env
npm install
npx prisma migrate dev
npx prisma db seed
npm run start:dev
```

### 3. Frontend
```bash
cd apps/web
cp .env.example .env.local
npm install
npm run dev
```

## User Roles

| Level | Role |
|-------|------|
| 1 | Super Admin |
| 2 | Portal Management Team |
| 3 | Compound Management Team (CMT) |
| 4 | Landlord |
| 5 | Tenant |
| 5 | Service Provider |

## Development Phases

- **Phase 1** ✅ Foundation — Auth, RBAC, Super Admin, Portal Team, CMT registration
- **Phase 2** 🔄 Core CMT — Properties, Units, Landlord/Tenant/SP flows, Maintenance
- **Phase 3** ⏳ Portals — Tenant, Landlord, Service Provider
- **Phase 4** ⏳ Communications — Email + WhatsApp
- **Phase 5** ⏳ Reporting & Analytics
- **Phase 6** ⏳ Mobile App (React Native)
- **Phase 7** ⏳ QA, Security & Launch
