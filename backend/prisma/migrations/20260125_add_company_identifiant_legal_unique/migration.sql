-- Add unique constraint for identifiantLegal
CREATE UNIQUE INDEX IF NOT EXISTS "Company_identifiantLegal_key"
ON "Company"("identifiantLegal");
