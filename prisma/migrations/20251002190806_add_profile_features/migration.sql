-- CreateEnum
CREATE TYPE "ProfileVisibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- CreateEnum
CREATE TYPE "InsigniaType" AS ENUM ('FREE', 'PREMIUM');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "about" TEXT,
ADD COLUMN     "profileVisibility" "ProfileVisibility" NOT NULL DEFAULT 'PUBLIC';

-- CreateTable
CREATE TABLE "Insignia" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "type" "InsigniaType" NOT NULL DEFAULT 'FREE',

    CONSTRAINT "Insignia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InsigniasOnUsers" (
    "userId" TEXT NOT NULL,
    "insigniaId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InsigniasOnUsers_pkey" PRIMARY KEY ("userId","insigniaId")
);

-- AddForeignKey
ALTER TABLE "InsigniasOnUsers" ADD CONSTRAINT "InsigniasOnUsers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsigniasOnUsers" ADD CONSTRAINT "InsigniasOnUsers_insigniaId_fkey" FOREIGN KEY ("insigniaId") REFERENCES "Insignia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
