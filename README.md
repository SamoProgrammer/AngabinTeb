# Angabin Teb — انگبین طب

Persian health platform — booking (doctors/clinics/services by type), nutrition (body→calorie + food diary + diet), content (articles/videos/FAQ by topic). 3 locales (fa/en/ar), phone-OTP auth.

> **For AI agents:** read `AGENTS.md` first — it is the handoff. Specs live in `docs/superpowers/specs/`.

## Quick start

```bash
bun install
cp .env.example .env          # set DATABASE_URL
docker compose up -d          # Postgres 17
bun run db:migrate
bun run db:seed               # + bun run db:seed:nutrition / :content / :rehab
bun run dev                   # http://localhost:3000
```

## Docs

- Product (what): `angabin-teb-product-spec.md`
- Design (how): `docs/superpowers/specs/2026-08-31-angabin-teb-design.md` + purge delta `2026-09-02-angabin-teb-purge-design.md`
- Plans: `docs/superpowers/plans/`
- Decisions deferred: `OPEN_QUESTIONS.md`

## Commands

`bun run dev` · `bun run db:generate` · `bun run db:migrate` · `bun run db:seed` · `bunx tsc --noEmit` · `bun run lint` · `bun run test` · `bunx playwright test`
