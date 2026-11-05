-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "app";

-- CreateEnum
CREATE TYPE "app"."PlatformRole" AS ENUM ('SUPER_ADMIN', 'SUPPORT', 'SALES', 'AUDITOR');

-- CreateEnum
CREATE TYPE "app"."OrgRole" AS ENUM ('OWNER', 'MANAGER', 'AUDITOR');

-- CreateEnum
CREATE TYPE "app"."FacilityRole" AS ENUM ('MANAGER', 'ATTENDANT', 'CASHIER', 'AUDITOR');

-- CreateEnum
CREATE TYPE "app"."OnboardingStatus" AS ENUM ('PENDING_DOCUMENTS', 'UNDER_REVIEW', 'TECHNICAL_SETUP', 'PILOT_READY', 'ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "app"."FacilityType" AS ENUM ('INDEPENDENT_LOT', 'MALL', 'CONDOMINIUM', 'COMMERCIAL_BUILDING', 'HOSPITAL', 'OTHER');

-- CreateEnum
CREATE TYPE "app"."FacilityVisibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- CreateEnum
CREATE TYPE "app"."FacilityStatus" AS ENUM ('ACTIVE', 'PAUSED');

-- CreateTable
CREATE TABLE "app"."platform_memberships" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" "app"."PlatformRole" NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMPTZ(6),

    CONSTRAINT "platform_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."organizations" (
    "id" UUID NOT NULL,
    "legal_name" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "onboarding_status" "app"."OnboardingStatus" NOT NULL DEFAULT 'PENDING_DOCUMENTS',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."org_memberships" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" "app"."OrgRole" NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMPTZ(6),

    CONSTRAINT "org_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."facilities" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "facility_type" "app"."FacilityType" NOT NULL,
    "visibility" "app"."FacilityVisibility" NOT NULL DEFAULT 'PRIVATE',
    "status" "app"."FacilityStatus" NOT NULL DEFAULT 'ACTIVE',
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Manila',
    "address_line" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "facilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."facility_memberships" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "facility_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" "app"."FacilityRole" NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMPTZ(6),

    CONSTRAINT "facility_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."audit_logs" (
    "id" UUID NOT NULL,
    "organization_id" UUID,
    "actor_user_id" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" TEXT,
    "request_id" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "platform_memberships_user_id_key" ON "app"."platform_memberships"("user_id");

-- CreateIndex
CREATE INDEX "org_memberships_user_id_idx" ON "app"."org_memberships"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "org_memberships_organization_id_user_id_key" ON "app"."org_memberships"("organization_id", "user_id");

-- CreateIndex
CREATE INDEX "facilities_organization_id_idx" ON "app"."facilities"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "facilities_id_organization_id_key" ON "app"."facilities"("id", "organization_id");

-- CreateIndex
CREATE INDEX "facility_memberships_user_id_idx" ON "app"."facility_memberships"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "facility_memberships_facility_id_user_id_key" ON "app"."facility_memberships"("facility_id", "user_id");

-- CreateIndex
CREATE INDEX "audit_logs_organization_id_created_at_idx" ON "app"."audit_logs"("organization_id", "created_at");

-- AddForeignKey
ALTER TABLE "app"."org_memberships" ADD CONSTRAINT "org_memberships_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "app"."organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app"."facilities" ADD CONSTRAINT "facilities_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "app"."organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app"."facility_memberships" ADD CONSTRAINT "facility_memberships_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "app"."organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app"."facility_memberships" ADD CONSTRAINT "facility_memberships_facility_id_organization_id_fkey" FOREIGN KEY ("facility_id", "organization_id") REFERENCES "app"."facilities"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app"."audit_logs" ADD CONSTRAINT "audit_logs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "app"."organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ===== Hand-written below: protections Prisma schema cannot express (ADR-001, ADR-007) =====

-- Audit log is append-only at the database level, not just by convention.
CREATE FUNCTION "app"."reject_audit_log_change"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'app.audit_logs is append-only';
END;
$$;
CREATE TRIGGER "audit_logs_no_update_delete" BEFORE UPDATE OR DELETE ON "app"."audit_logs"
  FOR EACH ROW EXECUTE FUNCTION "app"."reject_audit_log_change"();
CREATE TRIGGER "audit_logs_no_truncate" BEFORE TRUNCATE ON "app"."audit_logs"
  FOR EACH STATEMENT EXECUTE FUNCTION "app"."reject_audit_log_change"();

-- Defence in depth: RLS on with no policies = deny for every non-owner role.
-- The API connects as the table owner, so its access is governed by API authorization, not RLS.
ALTER TABLE "app"."platform_memberships" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "app"."organizations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "app"."org_memberships" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "app"."facilities" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "app"."facility_memberships" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "app"."audit_logs" ENABLE ROW LEVEL SECURITY;

-- Supabase's public API roles must never reach app data (they only exist on Supabase, not plain Postgres).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON SCHEMA "app" FROM anon, authenticated;
    REVOKE ALL ON ALL TABLES IN SCHEMA "app" FROM anon, authenticated;
    REVOKE ALL ON ALL FUNCTIONS IN SCHEMA "app" FROM anon, authenticated;
    ALTER DEFAULT PRIVILEGES IN SCHEMA "app" REVOKE ALL ON TABLES FROM anon, authenticated;
    ALTER DEFAULT PRIVILEGES IN SCHEMA "app" REVOKE ALL ON FUNCTIONS FROM anon, authenticated;
  END IF;
END;
$$;
