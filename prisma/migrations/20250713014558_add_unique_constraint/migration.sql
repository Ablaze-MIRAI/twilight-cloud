/*
  Warnings:

  - A unique constraint covering the columns `[externalUid]` on the table `OAuthAccount` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "OAuthAccount_externalUid_key" ON "OAuthAccount"("externalUid");
