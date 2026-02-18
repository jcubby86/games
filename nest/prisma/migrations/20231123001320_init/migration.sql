-- CreateEnum
CREATE TYPE "GamePhase" AS ENUM ('JOIN', 'PLAY', 'READ', 'END');

-- CreateEnum
CREATE TYPE "GameType" AS ENUM ('STORY', 'NAME');

-- CreateEnum
CREATE TYPE "Category" AS ENUM ('FEMALE_NAME', 'MALE_NAME', 'PAST_ACTION', 'PRESENT_ACTION', 'STATEMENT');

-- CreateTable
CREATE TABLE "Game" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" "GameType" NOT NULL,
    "phase" "GamePhase" NOT NULL DEFAULT 'JOIN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "hostId" INTEGER,
    "successorId" INTEGER,

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Player" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "gameId" INTEGER,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NameEntry" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "normalized" TEXT NOT NULL,
    "gameId" INTEGER NOT NULL,
    "playerId" INTEGER NOT NULL,

    CONSTRAINT "NameEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoryEntry" (
    "id" SERIAL NOT NULL,
    "values" TEXT[],
    "finalValue" TEXT NOT NULL,
    "gameId" INTEGER NOT NULL,
    "playerId" INTEGER NOT NULL,

    CONSTRAINT "StoryEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Suggestion" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "category" "Category" NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Suggestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "permissions" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Game_uuid_key" ON "Game"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "Game_code_key" ON "Game"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Game_successorId_key" ON "Game"("successorId");

-- CreateIndex
CREATE INDEX "Game_code_idx" ON "Game"("code");

-- CreateIndex
CREATE INDEX "Game_uuid_idx" ON "Game"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "Player_uuid_key" ON "Player"("uuid");

-- CreateIndex
CREATE INDEX "Player_uuid_idx" ON "Player"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "Player_gameId_nickname_key" ON "Player"("gameId", "nickname");

-- CreateIndex
CREATE UNIQUE INDEX "NameEntry_gameId_normalized_key" ON "NameEntry"("gameId", "normalized");

-- CreateIndex
CREATE UNIQUE INDEX "NameEntry_gameId_playerId_key" ON "NameEntry"("gameId", "playerId");

-- CreateIndex
CREATE UNIQUE INDEX "StoryEntry_gameId_playerId_key" ON "StoryEntry"("gameId", "playerId");

-- CreateIndex
CREATE UNIQUE INDEX "Suggestion_uuid_key" ON "Suggestion"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "Suggestion_category_value_key" ON "Suggestion"("category", "value");

-- CreateIndex
CREATE UNIQUE INDEX "User_uuid_key" ON "User"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_successorId_fkey" FOREIGN KEY ("successorId") REFERENCES "Game"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NameEntry" ADD CONSTRAINT "NameEntry_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NameEntry" ADD CONSTRAINT "NameEntry_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryEntry" ADD CONSTRAINT "StoryEntry_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryEntry" ADD CONSTRAINT "StoryEntry_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
