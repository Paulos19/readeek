-- CreateTable
CREATE TABLE "UserDictionary" (
    "id" TEXT NOT NULL,
    "word" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'pt_BR',
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserDictionary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserDictionary_userId_idx" ON "UserDictionary"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserDictionary_userId_word_key" ON "UserDictionary"("userId", "word");

-- AddForeignKey
ALTER TABLE "UserDictionary" ADD CONSTRAINT "UserDictionary_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
