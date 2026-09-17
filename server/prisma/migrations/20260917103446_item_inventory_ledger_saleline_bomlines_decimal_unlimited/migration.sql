/*
  Warnings:

  - You are about to alter the column `runningQty` on the `inventory_ledger` table. The data in that column could be lost. The data in that column will be cast from `Decimal(15,4)` to `Decimal(15,7)`.

*/
-- AlterTable
ALTER TABLE "ItemPriceList" ALTER COLUMN "price" SET DATA TYPE DECIMAL;

-- AlterTable
ALTER TABLE "bom_lines" ALTER COLUMN "qtyPer" SET DATA TYPE DECIMAL;

-- AlterTable
ALTER TABLE "inventory_ledger" ALTER COLUMN "unitCost" SET DATA TYPE DECIMAL,
ALTER COLUMN "value" SET DATA TYPE DECIMAL,
ALTER COLUMN "runningQty" SET DATA TYPE DECIMAL(15,7),
ALTER COLUMN "runningValue" SET DATA TYPE DECIMAL,
ALTER COLUMN "runningAvgCost" SET DATA TYPE DECIMAL;

-- AlterTable
ALTER TABLE "sale_lines" ALTER COLUMN "unitPrice" SET DATA TYPE DECIMAL,
ALTER COLUMN "lineTotal" SET DATA TYPE DECIMAL;
