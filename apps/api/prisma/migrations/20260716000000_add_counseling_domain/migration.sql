CREATE TYPE "RiskLevel" AS ENUM ('NONE', 'ATTENTION', 'URGENT');
CREATE TYPE "SummaryStatus" AS ENUM ('NOT_REQUESTED', 'PENDING', 'COMPLETED');

CREATE TABLE "Client" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "birthDate" TIMESTAMP(3),
  "gender" TEXT,
  "occupation" TEXT,
  "phoneNumber" TEXT,
  "address" TEXT,
  "protectionCategory" TEXT,
  "householdType" TEXT,
  "hasDisability" TEXT,
  "longTermCare" TEXT,
  "emergencyContact" TEXT,
  "housingType" TEXT,
  "housingOwnership" TEXT,
  "familyRelationship" TEXT,
  "familyName" TEXT,
  "familyGender" TEXT,
  "familyBirthDate" TIMESTAMP(3),
  "familyOccupation" TEXT,
  "familyCohabitation" TEXT,
  "familyNotes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CounselingRecord" (
  "id" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "sessionDate" TIMESTAMP(3) NOT NULL,
  "sessionType" TEXT NOT NULL,
  "sessionNumber" INTEGER,
  "presentingConcern" TEXT NOT NULL,
  "sessionContent" TEXT NOT NULL,
  "counselorObservation" TEXT,
  "intervention" TEXT,
  "riskLevel" "RiskLevel" NOT NULL DEFAULT 'NONE',
  "followUpPlan" TEXT,
  "summaryStatus" "SummaryStatus" NOT NULL DEFAULT 'NOT_REQUESTED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CounselingRecord_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CounselingRecord_clientId_sessionDate_idx" ON "CounselingRecord"("clientId", "sessionDate");
ALTER TABLE "CounselingRecord" ADD CONSTRAINT "CounselingRecord_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
