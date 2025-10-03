-- DropForeignKey
ALTER TABLE "public"."CommunityFile" DROP CONSTRAINT "CommunityFile_communityId_fkey";

-- DropForeignKey
ALTER TABLE "public"."CommunityFile" DROP CONSTRAINT "CommunityFile_uploaderId_fkey";

-- DropForeignKey
ALTER TABLE "public"."CommunityMember" DROP CONSTRAINT "CommunityMember_communityId_fkey";

-- DropForeignKey
ALTER TABLE "public"."CommunityMember" DROP CONSTRAINT "CommunityMember_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."CommunityPost" DROP CONSTRAINT "CommunityPost_authorId_fkey";

-- DropForeignKey
ALTER TABLE "public"."CommunityPost" DROP CONSTRAINT "CommunityPost_communityId_fkey";

-- AddForeignKey
ALTER TABLE "CommunityMember" ADD CONSTRAINT "CommunityMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityMember" ADD CONSTRAINT "CommunityMember_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityFile" ADD CONSTRAINT "CommunityFile_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityFile" ADD CONSTRAINT "CommunityFile_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityPost" ADD CONSTRAINT "CommunityPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityPost" ADD CONSTRAINT "CommunityPost_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;
