-- AlterTable AdminUser
ALTER TABLE "AdminUser" ADD COLUMN "username" TEXT;
ALTER TABLE "AdminUser" ADD COLUMN "updatedAt" DATETIME;

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_username_key" ON "AdminUser"("username");
