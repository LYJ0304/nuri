CREATE TYPE "LoginSecurityOutcome" AS ENUM ('SUCCESS', 'FAILURE', 'BLOCKED');

CREATE TABLE "LoginSecurityEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "emailHash" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT,
    "outcome" "LoginSecurityOutcome" NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoginSecurityEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "LoginSecurityEvent_ipAddress_createdAt_idx" ON "LoginSecurityEvent"("ipAddress", "createdAt");
CREATE INDEX "LoginSecurityEvent_emailHash_outcome_createdAt_idx" ON "LoginSecurityEvent"("emailHash", "outcome", "createdAt");
CREATE INDEX "LoginSecurityEvent_userId_createdAt_idx" ON "LoginSecurityEvent"("userId", "createdAt");

ALTER TABLE "LoginSecurityEvent" ADD CONSTRAINT "LoginSecurityEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
