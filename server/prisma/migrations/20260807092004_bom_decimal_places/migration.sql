/*
  Warnings:

  - You are about to alter the column `qtyPer` on the `bom_lines` table. The data in that column could be lost. The data in that column will be cast from `Decimal(15,4)` to `Decimal(15,7)`.

*/
-- AlterTable
ALTER TABLE "bom_lines" ALTER COLUMN "qtyPer" SET DATA TYPE DECIMAL(15,7);
