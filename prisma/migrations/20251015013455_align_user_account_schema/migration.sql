/*
  Warnings:

  - You are about to drop the column `providerUserId` on the `Account` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[provider,accountId]` on the table `Account` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `accountId` to the `Account` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Account` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `provider` on the `Account` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('google');

-- DropIndex
DROP INDEX "public"."Account_provider_providerUserId_key";

-- AlterTable
ALTER TABLE "Account" DROP COLUMN "providerUserId",
ADD COLUMN     "accountId" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "provider",
ADD COLUMN     "provider" "AuthProvider" NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "image" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_accountId_key" ON "Account"("provider", "accountId");
