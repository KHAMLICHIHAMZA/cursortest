-- CreateTable
CREATE TABLE "PlanPricingRule" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "extraAgencyPriceMad" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "extraModulePriceMad" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "allowAgencyOverageOnCreate" BOOLEAN NOT NULL DEFAULT true,
    "allowAdditionalModulesOnCreate" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanPricingRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlanPricingRule_planId_key" ON "PlanPricingRule"("planId");

-- CreateIndex
CREATE INDEX "PlanPricingRule_planId_idx" ON "PlanPricingRule"("planId");

-- AddForeignKey
ALTER TABLE "PlanPricingRule" ADD CONSTRAINT "PlanPricingRule_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
