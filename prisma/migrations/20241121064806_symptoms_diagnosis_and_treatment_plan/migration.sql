/*
  Warnings:

  - You are about to drop the column `content` on the `Reports` table. All the data in the column will be lost.
  - Added the required column `diagnosis` to the `Reports` table without a default value. This is not possible if the table is not empty.
  - Added the required column `symptoms` to the `Reports` table without a default value. This is not possible if the table is not empty.
  - Added the required column `treatmentplan` to the `Reports` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `Reports` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Reports" DROP COLUMN "content",
ADD COLUMN     "diagnosis" TEXT NOT NULL,
ADD COLUMN     "symptoms" TEXT NOT NULL,
ADD COLUMN     "treatmentplan" TEXT NOT NULL,
ADD COLUMN     "type" TEXT NOT NULL;
