-- Make cmtId optional in Property table to allow Super Admin to create properties without assigning a CMT initially
ALTER TABLE "Property" ALTER COLUMN "cmtId" DROP NOT NULL;

-- Update foreign key constraint to allow NULL values
ALTER TABLE "Property" DROP CONSTRAINT "Property_cmtId_fkey";

ALTER TABLE "Property" ADD CONSTRAINT "Property_cmtId_fkey" FOREIGN KEY ("cmtId") REFERENCES "CmtProfile"("id") ON DELETE SET NULL;
