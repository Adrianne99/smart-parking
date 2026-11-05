# @smart-parking/database

Prisma 7 schema, migrations and the server-side client. **Owner: DB/Auth lead.** Server-only: never import from web or mobile code.

All tables live in the private Postgres schema `app`. Supabase's REST/GraphQL API cannot reach it (it only exposes `public`), RLS is enabled with no policies, and Supabase's `anon`/`authenticated` roles have no grants. The API connects as the owner and enforces tenancy itself (ADR-001).

## Commands (run from this folder, local Supabase running)

```bash
cp .env.example .env          # once
pnpm migrate:dev --name <change>   # create + apply a migration (development only)
pnpm migrate:deploy           # apply committed migrations (CI / staging / production)
pnpm seed                     # 2 demo operators × 2 facilities (idempotent)
pnpm generate                 # regenerate the client (Turbo does this automatically)
```

Never run `prisma migrate reset` or `db push` against anything but a throwaway local database.

## Signing in locally as a real user

Demo users in `src/demo-tenants.ts` are fixed UUIDs, not Supabase Auth accounts. To use the apps as yourself:

1. Sign up in your local stack (e.g. Studio → Authentication → Add user, http://127.0.0.1:54323) and copy the user's UUID.
2. Grant yourself a role, e.g. owner of demo operator A, in Studio's SQL editor:

```sql
insert into app.org_memberships (id, organization_id, user_id, role)
values (gen_random_uuid(), '10000000-0000-4000-8000-00000000000a', '<your-user-uuid>', 'OWNER');
```

Use `app.platform_memberships` (role `SUPER_ADMIN`) to act as a platform administrator.
