-- AlterTable
ALTER TABLE "User" ADD COLUMN "password" TEXT;

-- CreateIndex (if not exists)
CREATE INDEX IF NOT EXISTS "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");
CREATE INDEX IF NOT EXISTS "AuditLog_userId_createdAt_idx" ON "AuditLog"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "AuditLog_isSuspicious_idx" ON "AuditLog"("isSuspicious");
