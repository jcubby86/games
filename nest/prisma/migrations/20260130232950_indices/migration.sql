-- CreateIndex
CREATE INDEX "NameEntry_gameId_idx" ON "NameEntry"("gameId");

-- CreateIndex
CREATE INDEX "NameEntry_playerId_idx" ON "NameEntry"("playerId");

-- CreateIndex
CREATE INDEX "Player_gameId_idx" ON "Player"("gameId");

-- CreateIndex
CREATE INDEX "StoryEntry_gameId_idx" ON "StoryEntry"("gameId");

-- CreateIndex
CREATE INDEX "StoryEntry_playerId_idx" ON "StoryEntry"("playerId");

-- CreateIndex
CREATE INDEX "Suggestion_category_idx" ON "Suggestion"("category");
