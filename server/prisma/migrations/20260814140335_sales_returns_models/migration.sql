-- CreateEnum
CREATE TYPE "SalesReturnStatus" AS ENUM ('DRAFT', 'CONFIRMED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ReturnSettlementMethod" AS ENUM ('REFUND_CASH', 'CUSTOMER_CREDIT', 'APPLY_TO_INVOICE');

-- CreateTable
CREATE TABLE "sales_returns" (
    "id" TEXT NOT NULL,
    "returnNo" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "returnDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT,
    "status" "SalesReturnStatus" NOT NULL DEFAULT 'DRAFT',
    "subtotal" DECIMAL(15,2) NOT NULL,
    "tax" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(15,2) NOT NULL,
    "settlementMethod" "ReturnSettlementMethod",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "preparedBy" TEXT NOT NULL,
    "confirmedBy" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "cancelledBy" TEXT,
    "cancelledAt" TIMESTAMP(3),

    CONSTRAINT "sales_returns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_return_lines" (
    "id" TEXT NOT NULL,
    "salesReturnId" TEXT NOT NULL,
    "saleLineId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "qty" DECIMAL(15,4) NOT NULL,
    "unitPrice" DECIMAL(15,4) NOT NULL,
    "unitCost" DECIMAL(15,4) NOT NULL,
    "lineTotal" DECIMAL(15,2) NOT NULL,

    CONSTRAINT "sales_return_lines_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sales_returns_returnNo_key" ON "sales_returns"("returnNo");

-- AddForeignKey
ALTER TABLE "sales_returns" ADD CONSTRAINT "sales_returns_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "sales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_returns" ADD CONSTRAINT "sales_returns_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_returns" ADD CONSTRAINT "sales_returns_preparedBy_fkey" FOREIGN KEY ("preparedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_returns" ADD CONSTRAINT "sales_returns_confirmedBy_fkey" FOREIGN KEY ("confirmedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_returns" ADD CONSTRAINT "sales_returns_cancelledBy_fkey" FOREIGN KEY ("cancelledBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_return_lines" ADD CONSTRAINT "sales_return_lines_salesReturnId_fkey" FOREIGN KEY ("salesReturnId") REFERENCES "sales_returns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_return_lines" ADD CONSTRAINT "sales_return_lines_saleLineId_fkey" FOREIGN KEY ("saleLineId") REFERENCES "sale_lines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_return_lines" ADD CONSTRAINT "sales_return_lines_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
