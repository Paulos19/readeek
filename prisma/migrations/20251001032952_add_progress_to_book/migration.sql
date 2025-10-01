-- AlterTable
ALTER TABLE "Book" ADD COLUMN     "currentLocation" TEXT,
ADD COLUMN     "progress" INTEGER NOT NULL DEFAULT 0;
