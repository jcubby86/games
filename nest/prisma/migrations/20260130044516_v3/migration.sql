/*
  Warnings:

  - You are about to drop the column `hostId` on the `Game` table. All the data in the column will be lost.
  - You are about to drop the column `successorId` on the `Game` table. All the data in the column will be lost.
  - You are about to drop the column `finalValue` on the `StoryEntry` table. All the data in the column will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Game" DROP CONSTRAINT "Game_hostId_fkey";

-- DropForeignKey
ALTER TABLE "Game" DROP CONSTRAINT "Game_successorId_fkey";

-- DropIndex
DROP INDEX "Game_successorId_key";

-- AlterTable
ALTER TABLE "Game" DROP COLUMN "hostId",
DROP COLUMN "successorId";

-- AlterTable
ALTER TABLE "StoryEntry" DROP COLUMN "finalValue",
ADD COLUMN     "story" TEXT;

-- DropTable
DROP TABLE "User";
