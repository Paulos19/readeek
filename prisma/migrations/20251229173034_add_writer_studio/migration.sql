-- CreateEnum
CREATE TYPE "DraftStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'PUBLISHED');

-- CreateTable
CREATE TABLE "BookDraft" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "synopsis" TEXT,
    "coverUrl" TEXT,
    "genre" TEXT,
    "status" "DraftStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "BookDraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DraftChapter" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "draftId" TEXT NOT NULL,

    CONSTRAINT "DraftChapter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DraftCharacter" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT,
    "description" TEXT,
    "imageUrl" TEXT,
    "draftId" TEXT NOT NULL,

    CONSTRAINT "DraftCharacter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DraftLore" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "draftId" TEXT NOT NULL,

    CONSTRAINT "DraftLore_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "BookDraft" ADD CONSTRAINT "BookDraft_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DraftChapter" ADD CONSTRAINT "DraftChapter_draftId_fkey" FOREIGN KEY ("draftId") REFERENCES "BookDraft"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DraftCharacter" ADD CONSTRAINT "DraftCharacter_draftId_fkey" FOREIGN KEY ("draftId") REFERENCES "BookDraft"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DraftLore" ADD CONSTRAINT "DraftLore_draftId_fkey" FOREIGN KEY ("draftId") REFERENCES "BookDraft"("id") ON DELETE CASCADE ON UPDATE CASCADE;
