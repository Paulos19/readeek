-- DropForeignKey
ALTER TABLE "public"."InsigniasOnUsers" DROP CONSTRAINT "InsigniasOnUsers_insigniaId_fkey";

-- DropForeignKey
ALTER TABLE "public"."InsigniasOnUsers" DROP CONSTRAINT "InsigniasOnUsers_userId_fkey";

-- CreateTable
CREATE TABLE "Follows" (
    "followerId" TEXT NOT NULL,
    "followingId" TEXT NOT NULL,

    CONSTRAINT "Follows_pkey" PRIMARY KEY ("followerId","followingId")
);

-- AddForeignKey
ALTER TABLE "Follows" ADD CONSTRAINT "Follows_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Follows" ADD CONSTRAINT "Follows_followingId_fkey" FOREIGN KEY ("followingId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsigniasOnUsers" ADD CONSTRAINT "InsigniasOnUsers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsigniasOnUsers" ADD CONSTRAINT "InsigniasOnUsers_insigniaId_fkey" FOREIGN KEY ("insigniaId") REFERENCES "Insignia"("id") ON DELETE CASCADE ON UPDATE CASCADE;
