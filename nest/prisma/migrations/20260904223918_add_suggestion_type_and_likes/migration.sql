-- CreateEnum
CREATE TYPE "SuggestionType" AS ENUM ('HUMAN', 'AI');

-- AlterTable
ALTER TABLE "Suggestion" ADD COLUMN     "likes" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "type" "SuggestionType" NOT NULL DEFAULT 'HUMAN';

-- CreateIndex
CREATE INDEX "Suggestion_category_type_idx" ON "Suggestion"("category", "type");
