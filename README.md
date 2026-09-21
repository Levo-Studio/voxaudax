# Vox Audax

Website and editorial system of **Vox Audax**, the student newspaper of the
Uhland-Gymnasium. Public readers get a statically rendered newspaper; the
editorial team gets a writing, review and publishing workflow behind a login at
`/admin`.

Built by [Levo Studio](https://levo-studio.com) — concept, design and
implementation.

## What it does

**Public.** Home, article detail, archive, editorial team, memes, contact,
imprint, privacy, RSS. Everything is server-rendered and cached, so an article
arrives complete in the first HTML response — no client-side content loading.

**Editorial.** Authors write in a rich-text or Markdown editor and submit;
editors and admins approve; approved work goes live without a deploy. Admins
invite members, assign roles and manage supporters.

**Roles.** `autor` writes and submits. `redakteur` additionally sees other
people's drafts and approves articles, memes and supporters. `admin`
additionally invites members, assigns roles and resets passwords. Nobody
approves their own submission. Every rule is enforced on the server, not only in
the interface.

## Stack

| Concern | Choice |
|---|---|
| Framework | Next.js 15, App Router, React Server Components |
| Language | TypeScript, `strict` |
| Styling | Tailwind CSS v4, design tokens as CSS custom properties |
| Database | PostgreSQL via Drizzle ORM, reached through one `DATABASE_URL` |
| Authentication | [`@velve/auth`](https://github.com/velve-dev/velve-auth) — runs in process, users live in this database |
| Object storage | RustFS, S3-compatible, addressed with `forcePathStyle` |
| Images | Delivered from `cdn.levo-studio.com`; the database stores object keys, never URLs |
| Mail | Resend, templates written with `react-email` |
| Fonts | Bricolage Grotesque, Inter Tight and JetBrains Mono, self-hosted |

No runtime request leaves the server except to Resend and the object storage.
There is no tracking, no analytics and no third-party font or script.

## Requirements

- Node 20.19 or newer
- pnpm 10
- PostgreSQL 14 or newer
- An S3-compatible RustFS bucket
- A Resend API key with a verified sender domain

## Getting started

```sh
pnpm install
cp .env.example .env.local   # then fill in the values
pnpm dev
```

The app listens on **port 7896** in every environment — development, container
and production alike.

### Environment

Every variable is required and declared in one Zod schema. Validation runs the
first time the environment is read rather than at import, so a build that never
reaches the database still succeeds; a missing or malformed value then stops the
process with a message naming the key. `.env.example` lists every key and
carries no secret — only the two settings whose value is the same everywhere.

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | The only database connection. Migrations use it too. |
| `S3_ENDPOINT`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_BUCKET`, `S3_REGION`, `S3_FORCE_PATH_STYLE` | RustFS object storage |
| `CDN_BASE_URL` | Prefix an object key is joined to in order to build an image URL |
| `RESEND_API_KEY`, `MAIL_FROM`, `MAIL_TO_EDITORIAL` | Transactional mail and the contact form recipient |
| `AUTH_SECRET` | Root key for `@velve/auth`; at least 32 bytes |
| `HEALTH_TOKEN` | Bearer token guarding the detailed health route |
| `NEXT_PUBLIC_SITE_URL` | Canonical origin, used for metadata, RSS and mail links |

## Scripts

| Script | What it does |
|---|---|
| `pnpm dev` | Development server on port 7896 |
| `pnpm build` | Production build, `standalone` output |
| `pnpm start` | Serve the production build |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm lint` | ESLint |

## Health

| Route | Purpose |
|---|---|
| `GET /api/health` | Public. Answers 200 while the process is alive, touching no dependency. The container health check points here. |
| `GET /api/health/detailed` | Guarded by `HEALTH_TOKEN`. Runs one check per dependency, each under a 2 s timeout, and never reports a host, a port or a driver message. 200 when healthy or degraded, 503 when a critical check fails. Currently checks the database; object storage and pending migrations join it with the data layer. |

## Deployment

`Dockerfile.dokploy` builds and runs the app for Dokploy; routing, TLS and
environment variables are configured in Dokploy itself. Pushing to `main` builds
the image, pushes it to GHCR, verifies the package exists and only then triggers
the deployment webhook.

## Design

The interface follows a fixed design specification, kept outside the repository
as the client's source of record. Where the implementation departs from it, or
fills a gap it leaves open, the decision and its origin are recorded in
`EXTRAPOLATION.md`.

## Licence

[MIT](./LICENSE) © 2026 Levo Studio
