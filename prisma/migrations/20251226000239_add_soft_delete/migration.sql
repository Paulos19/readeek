-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "deletedForIds" TEXT[] DEFAULT ARRAY[]::TEXT[];
