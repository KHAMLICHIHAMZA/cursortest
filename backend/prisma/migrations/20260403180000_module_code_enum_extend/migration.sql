-- Align PostgreSQL enum "ModuleCode" with schema.prisma (prod DBs created from
-- 20241215000000_add_saas_models only had 6 values). Without these, any row or
-- dependency using NOTIFICATIONS / CHARGES / etc. causes 22P02 on read.

ALTER TYPE "ModuleCode" ADD VALUE IF NOT EXISTS 'GPS';
ALTER TYPE "ModuleCode" ADD VALUE IF NOT EXISTS 'CONTRACTS';
ALTER TYPE "ModuleCode" ADD VALUE IF NOT EXISTS 'JOURNAL';
ALTER TYPE "ModuleCode" ADD VALUE IF NOT EXISTS 'CHARGES';
ALTER TYPE "ModuleCode" ADD VALUE IF NOT EXISTS 'NOTIFICATIONS';
