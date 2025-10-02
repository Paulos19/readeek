-- AlterTable
ALTER TABLE "Insignia" ADD COLUMN     "price" INTEGER;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "credits" INTEGER NOT NULL DEFAULT 50;
