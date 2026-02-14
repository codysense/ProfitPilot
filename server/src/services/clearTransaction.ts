import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function clearTransactions() {
  console.log("⚠️  STARTING TRANSACTION CLEANUP...");

  await prisma.$transaction(async (tx) => {
    /* ---------------- SALES ---------------- */

    await tx.customerPaymentPosting.deleteMany();
    await tx.customerPaymentLine.deleteMany();
    await tx.customerPayment.deleteMany();

    await tx.salesRefund.deleteMany();
    await tx.salesReceipt.deleteMany();

    await tx.saleLine.deleteMany();
    await tx.sale.deleteMany();

    await tx.posSalePayment.deleteMany();
    await tx.posReturnLine.deleteMany();
    await tx.posReturn.deleteMany();
    await tx.posSaleLine.deleteMany();
    await tx.posSale.deleteMany();
    await tx.posSession.deleteMany();

    /* ---------------- PURCHASES ---------------- */

    await tx.vendorPaymentPosting.deleteMany();
    await tx.vendorPaymentLine.deleteMany();
    await tx.vendorPayment.deleteMany();

    await tx.purchaseRefund.deleteMany();
    await tx.purchasePayment.deleteMany();

    await tx.purchaseLine.deleteMany();
    await tx.purchase.deleteMany();

    /* ---------------- INVENTORY ---------------- */

    await tx.inventoryLedger.deleteMany();
    await tx.inventoryBatch.deleteMany();

    await tx.inventoryTransferItem.deleteMany();
    await tx.inventoryTransfer.deleteMany();

    /* ---------------- PRODUCTION ---------------- */

    await tx.wipLedger.deleteMany();
    await tx.laborTime.deleteMany();
    await tx.productionOrder.deleteMany();

    /* ---------------- ACCOUNTING ---------------- */

    await tx.cashTransactionPosting.deleteMany();
    await tx.cashTransactionLine.deleteMany();
    await tx.cashTransaction.deleteMany();

    await tx.journalLine.deleteMany();
    await tx.journal.deleteMany();

    /* ---------------- APPROVALS ---------------- */

    await tx.approvalAction.deleteMany();
    await tx.approvalRequest.deleteMany();

    /* ---------------- MEMOS ---------------- */

    await tx.journalLine.deleteMany({});
    await tx.journal.deleteMany({});

    await tx.memo.deleteMany({});
    // await tx.memo.deleteMany({});

    await tx.stockAdjustment.deleteMany({});
    // await tx.stockAdjustment.deleteMany({});

    await tx.cashAccount.updateMany({
      data: { balance: 0 },
    });
  });

  console.log("✅ TRANSACTION CLEANUP COMPLETE");
}

clearTransactions()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
