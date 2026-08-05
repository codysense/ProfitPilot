/*
  Warnings:

  - You are about to alter the column `qty` on the `InventoryTransferItem` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(15,7)`.
  - You are about to alter the column `unitCost` on the `InventoryTransferItem` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(15,4)`.
  - You are about to alter the column `qtyOnHand` on the `inventory_batches` table. The data in that column could be lost. The data in that column will be cast from `Decimal(15,4)` to `Decimal(15,7)`.
  - You are about to alter the column `qty` on the `inventory_ledger` table. The data in that column could be lost. The data in that column will be cast from `Decimal(15,4)` to `Decimal(15,7)`.
  - You are about to alter the column `qtyTarget` on the `production_orders` table. The data in that column could be lost. The data in that column will be cast from `Decimal(15,4)` to `Decimal(15,7)`.
  - You are about to alter the column `qtyProduced` on the `production_orders` table. The data in that column could be lost. The data in that column will be cast from `Decimal(15,4)` to `Decimal(15,7)`.

*/
-- AlterTable
ALTER TABLE "InventoryTransferItem" ALTER COLUMN "qty" SET DATA TYPE DECIMAL(15,7),
ALTER COLUMN "unitCost" SET DATA TYPE DECIMAL(15,4);

-- AlterTable
ALTER TABLE "inventory_batches" ALTER COLUMN "qtyOnHand" SET DATA TYPE DECIMAL(15,7);

-- AlterTable
ALTER TABLE "inventory_ledger" ALTER COLUMN "qty" SET DATA TYPE DECIMAL(15,7);

-- AlterTable
ALTER TABLE "production_orders" ALTER COLUMN "qtyTarget" SET DATA TYPE DECIMAL(15,7),
ALTER COLUMN "qtyProduced" SET DATA TYPE DECIMAL(15,7);
