ALTER TABLE "ContactSubmission" ADD COLUMN "countryCode" TEXT;
ALTER TABLE "ContactSubmission" ADD COLUMN "projectId" TEXT;
ALTER TABLE "ContactSubmission" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'NEW';
ALTER TABLE "ContactSubmission" ADD COLUMN "notes" TEXT;
CREATE INDEX "ContactSubmission_status_idx" ON "ContactSubmission"("status");
