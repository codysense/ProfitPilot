-- CreateEnum
CREATE TYPE "TransferStatus" AS ENUM ('INITIATED', 'RECEIVED');

-- AlterTable
ALTER TABLE "InventoryTransfer" ADD COLUMN     "status" "TransferStatus" NOT NULL DEFAULT 'INITIATED';
