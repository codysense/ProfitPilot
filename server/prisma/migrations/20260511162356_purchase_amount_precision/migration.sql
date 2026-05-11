/*
  Warnings:

  - You are about to alter the column `totalAmount` on the `purchases` table. The data in that column could be lost. The data in that column will be cast from `Decimal(15,2)` to `Decimal(15,4)`.
  - You are about to alter the column `amountPaid` on the `purchases` table. The data in that column could be lost. The data in that column will be cast from `Decimal(15,2)` to `Decimal(15,4)`.
  - You are about to alter the column `balanceAmount` on the `purchases` table. The data in that column could be lost. The data in that column will be cast from `Decimal(15,2)` to `Decimal(15,4)`.

*/
-- AlterTable
ALTER TABLE "purchases" ALTER COLUMN "totalAmount" SET DATA TYPE DECIMAL(15,4),
ALTER COLUMN "amountPaid" SET DATA TYPE DECIMAL(15,4),
ALTER COLUMN "balanceAmount" SET DATA TYPE DECIMAL(15,4);

-- CreateIndex
CREATE INDEX "idx_bom_itemid" ON "boms"("itemId");

-- CreateIndex
CREATE INDEX "idx_inventoryledger_item_wh_posted" ON "inventory_ledger"("itemId", "warehouseId", "postedAt" DESC);
