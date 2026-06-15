/*
  Warnings:

  - You are about to drop the column `scoreQuality` on the `reviews` table. All the data in the column will be lost.
  - You are about to drop the column `scoreSupport` on the `reviews` table. All the data in the column will be lost.
  - You are about to drop the column `scoreValue` on the `reviews` table. All the data in the column will be lost.
  - Added the required column `scoreFiyat` to the `reviews` table without a default value. This is not possible if the table is not empty.
  - Added the required column `scoreKalite` to the `reviews` table without a default value. This is not possible if the table is not empty.
  - Added the required column `scorePerformans` to the `reviews` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "reviews" DROP COLUMN "scoreQuality",
DROP COLUMN "scoreSupport",
DROP COLUMN "scoreValue",
ADD COLUMN     "scoreFiyat" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "scoreKalite" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "scorePerformans" DOUBLE PRECISION NOT NULL;
