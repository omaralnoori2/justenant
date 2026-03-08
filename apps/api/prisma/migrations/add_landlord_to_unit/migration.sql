-- Add landlordId column to Unit table
ALTER TABLE "Unit" ADD COLUMN "landlordId" TEXT;

-- Add foreign key constraint
ALTER TABLE "Unit" ADD CONSTRAINT "Unit_landlordId_fkey" FOREIGN KEY ("landlordId") REFERENCES "LandlordProfile"("id") ON DELETE SET NULL;
