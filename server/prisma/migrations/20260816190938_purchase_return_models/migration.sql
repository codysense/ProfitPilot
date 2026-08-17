-- CreateEnum
CREATE TYPE "PurchaseReturnStatus" AS ENUM ('DRAFT', 'CONFIRMED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PurchaseReturnSettlementMethod" AS ENUM ('REFUND_CASH', 'SUPPLIER_CREDIT');

-- CreateTable
CREATE TABLE "purchase_returns" (
    "id" TEXT NOT NULL,
    "returnNo" TEXT NOT NULL,
    "purchaseId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "returnDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT,
    "status" "PurchaseReturnStatus" NOT NULL DEFAULT 'DRAFT',
    "subtotal" DECIMAL(15,2) NOT NULL,
    "tax" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(15,2) NOT NULL,
    "inventoryValue" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "costVariance" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "settlementMethod" "PurchaseReturnSettlementMethod",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "preparedBy" TEXT NOT NULL,
    "confirmedBy" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "cancelledBy" TEXT,
    "cancelledAt" TIMESTAMP(3),

    CONSTRAINT "purchase_returns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_return_lines" (
    "id" TEXT NOT NULL,
    "purchaseReturnId" TEXT NOT NULL,
    "purchaseLineId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "qty" DECIMAL(15,4) NOT NULL,
    "unitPrice" DECIMAL(15,4) NOT NULL,
    "unitCost" DECIMAL(15,4) NOT NULL DEFAULT 0,
    "lineTotal" DECIMAL(15,2) NOT NULL,

    CONSTRAINT "purchase_return_lines_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "purchase_returns_returnNo_key" ON "purchase_returns"("returnNo");

-- AddForeignKey
ALTER TABLE "purchase_returns" ADD CONSTRAINT "purchase_returns_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "purchases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_returns" ADD CONSTRAINT "purchase_returns_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_returns" ADD CONSTRAINT "purchase_returns_preparedBy_fkey" FOREIGN KEY ("preparedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_returns" ADD CONSTRAINT "purchase_returns_confirmedBy_fkey" FOREIGN KEY ("confirmedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_returns" ADD CONSTRAINT "purchase_returns_cancelledBy_fkey" FOREIGN KEY ("cancelledBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_return_lines" ADD CONSTRAINT "purchase_return_lines_purchaseReturnId_fkey" FOREIGN KEY ("purchaseReturnId") REFERENCES "purchase_returns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_return_lines" ADD CONSTRAINT "purchase_return_lines_purchaseLineId_fkey" FOREIGN KEY ("purchaseLineId") REFERENCES "purchase_lines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_return_lines" ADD CONSTRAINT "purchase_return_lines_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
