-- CreateIndex
CREATE INDEX "items_userId_updatedAt_idx" ON "items"("userId", "updatedAt" DESC);
