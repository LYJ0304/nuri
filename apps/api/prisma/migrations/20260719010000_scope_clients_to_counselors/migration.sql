ALTER TABLE "Client" ADD COLUMN "counselorId" TEXT;

DO $$
DECLARE
  existing_client_count INTEGER;
  existing_user_count INTEGER;
  sole_user_id TEXT;
BEGIN
  SELECT COUNT(*) INTO existing_client_count FROM "Client";

  IF existing_client_count > 0 THEN
    SELECT COUNT(*), MIN("id") INTO existing_user_count, sole_user_id FROM "User";

    IF existing_user_count <> 1 THEN
      RAISE EXCEPTION 'Cannot infer Client ownership: expected exactly one existing User, found %', existing_user_count;
    END IF;

    UPDATE "Client" SET "counselorId" = sole_user_id WHERE "counselorId" IS NULL;
  END IF;
END $$;

ALTER TABLE "Client" ALTER COLUMN "counselorId" SET NOT NULL;

CREATE INDEX "Client_counselorId_createdAt_idx" ON "Client"("counselorId", "createdAt");

ALTER TABLE "Client"
ADD CONSTRAINT "Client_counselorId_fkey"
FOREIGN KEY ("counselorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
