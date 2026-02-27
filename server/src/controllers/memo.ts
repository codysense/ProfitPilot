import { Request, Response } from "express";
import { PrismaClient, MemoType, MemoModule } from "@prisma/client";
import { AuthRequest } from "../middleware/auth";
import { Decimal } from "@prisma/client/runtime/library";
// import { Prisma } from '../../prisma/generated/client';
import { GeneralLedgerService } from "../services/gl";
import { CostingService } from "../services/costing";
import { ca } from "zod/v4/locales";

const prisma = new PrismaClient();
const glService = new GeneralLedgerService();
const costingService = new CostingService();
// console.log('Prisma export member',Object.keys(Prisma).includes('MemoType')? Object.keys(Prisma):'Not found');
export class MemoController {
  // GET /api/v1/memos
  async listMemos(req: AuthRequest, res: Response) {
    try {
      const { customerId, vendorId, type, from, to } = req.query;

      const memos = await prisma.memo.findMany({
        where: {
          customerId: customerId ? String(customerId) : undefined,
          vendorId: vendorId ? String(vendorId) : undefined,
          memoType: type ? (type as MemoType) : undefined,
          createdAt: {
            gte: from ? new Date(String(from)) : undefined,
            lte: to ? new Date(String(to)) : undefined,
          },
        },
        include: {
          account: true,
          customer: true,
          vendor: true,
        },
        orderBy: { createdAt: "desc" },
      });

      res.json(memos);
    } catch (error) {
      console.error("List memos error:", error);
      res.status(400).json({ error: "Failed to list memos" });
    }
  }

  async getMemos(req: AuthRequest, res: Response) {
    try {
      // const { id } = req.params;

      const memo = await prisma.memo.findMany({
        include: {
          account: true,
          customer: true,
          vendor: true,
          user: true,
          sale: { include: { saleLines: { include: { item: true } } } },
          purchase: { include: { purchaseLines: { include: { item: true } } } },
        },
        orderBy: { createdAt: "desc" },
      });

      if (!memo) {
        return res.status(404).json({ error: "Memo not found" });
      }

      // console.log("Fetched memos:", memo);

      res.json(memo);
    } catch (error) {
      console.error("Get memo error:", error);
      res.status(400).json({ error: error.message });
    }
  }

  // PATCH /api/v1/memos/:id
  async updateMemo(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { description, amount, accountId } = req.body;

      const memo = await prisma.memo.update({
        where: { id },
        data: {
          description,
          amount: amount ? new Decimal(amount) : undefined,
          accountId,
        },
      });

      res.json(memo);
    } catch (error) {
      console.error("Update memo error:", error);
      res.status(400).json({ error: "Failed to update memo" });
    }
  }

  // POST /api/v1/memos/:id/post
  async postMemo(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const memo = await prisma.memo.findUnique({ where: { id } });
      if (!memo) {
        return res.status(404).json({ error: "Memo not found" });
      }

      const result = await prisma.$transaction(
        async (tx) => {
          // Generate journal
          const journalCount = await tx.journal.count();
          const journalNo = `J${String(journalCount + 1).padStart(6, "0")}`;

          const journal = await tx.journal.create({
            data: {
              journalNo,
              date: new Date(),
              memo: memo.description ?? `Memo ${memo.id}`,
              postedBy: req.user!.id,
            },
          });

          // Debit/Credit logic same as before
          let debitAccountId: string;
          let creditAccountId: string;

          if (memo.memoType === "CREDIT") {
            creditAccountId = memo.accountId;
            debitAccountId =
              memo.module === "SALES"
                ? (await tx.chartOfAccount.findFirst({
                    where: { code: "1200" },
                  }))!.id
                : (await tx.chartOfAccount.findFirst({
                    where: { code: "2000" },
                  }))!.id;
          } else {
            debitAccountId = memo.accountId;
            creditAccountId =
              memo.module === "SALES"
                ? (await tx.chartOfAccount.findFirst({
                    where: { code: "1200" },
                  }))!.id
                : (await tx.chartOfAccount.findFirst({
                    where: { code: "2000" },
                  }))!.id;
          }

          await tx.journalLine.createMany({
            data: [
              {
                journalId: journal.id,
                accountId: debitAccountId,
                debit: memo.amount,
                credit: new Decimal(0),
                refType: "MEMO",
                refId: memo.id,
              },
              {
                journalId: journal.id,
                accountId: creditAccountId,
                debit: new Decimal(0),
                credit: memo.amount,
                refType: "MEMO",
                refId: memo.id,
              },
            ],
          });

          return tx.memo.update({
            where: { id: memo.id },
            data: {
              /* could add status: 'POSTED' later */
            },
          });
        },
        {
          maxWait: 5000, // 5s wait for connection
          timeout: 20000, // 20s max runtime
        },
      );

      res.json(result);
    } catch (error) {
      console.error("Post memo error:", error);
      res.status(400).json({ error: "Failed to post memo" });
    }
  }

  // DELETE /api/v1/memos/:id
  async deleteMemo(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      // Add business rules check here before delete
      await prisma.memo.delete({ where: { id } });

      res.status(204).send();
    } catch (error) {
      console.error("Delete memo error:", error);
      res.status(400).json({ error: "Failed to delete memo" });
    }
  }

  async createMemo(req: AuthRequest, res: Response) {
    try {
      const {
        date,
        module,
        memoType,
        saleId,
        purchaseId,
        customerId,
        vendorId,
        amount,
        accountId,
        warehouseId,
        description,
      } = req.body;

      // console.log("request user ", req.user);

      const result = await prisma.$transaction(async (tx) => {
        // const memoCount = await tx.memo.count();
        // const memoNo = `M${String(memoCount + 1).padStart(6, "0")}`;
        // Fetch the last memo ordered by creationDate
        const lastTx = await prisma.memo.findFirst({
          orderBy: { createdAt: "desc" },
        });

        let nextNumber = 1;
        if (lastTx) {
          // Extract the numeric part of the transactionNo
          const lastNumber = parseInt(lastTx.memoNo.replace(/^M/, ""), 10);
          nextNumber = lastNumber + 1;
        }

        const memoNo = `M${String(nextNumber).padStart(6, "0")}`;

        let finalAmount = 0;
        let category: "SALES_RETURN" | "PURCHASE_RETURN" | "FINANCIAL" =
          "FINANCIAL";

        // CASE 1: LINKED TO SALE (Customer Return)

        if (saleId) {
          const sale = await tx.sale.findUnique({
            where: { id: saleId },
            include: { saleLines: true },
          });

          category = "SALES_RETURN";

          if (!sale) throw new Error("Sale not found");

          finalAmount = Number(sale.totalAmount);
          const itemType = await getItemTypeById(sale.saleLines[0]?.itemId);
          let totalCogs = 0;

          for (const line of sale.saleLines) {
            const inventoryValue = await costingService.getInventoryValue(
              line.itemId,
              warehouseId,
            );
            totalCogs += Number(inventoryValue.avgCost) * Number(line.qty);
          }

          // Reverse AR
          await glService.postJournal(
            tx,
            [
              {
                accountCode: "4000",
                debit: finalAmount,
                credit: 0,
                refType: "SALES RETURN",
                refId: sale.id,
              },
              {
                accountCode: "1200",
                debit: 0,
                credit: finalAmount,
                refType: "SALES RETURN",
                refId: sale.id,
              },
              {
                accountCode: "5000",
                debit: 0,
                credit: totalCogs,
                refType: "SALE",
                refId: sale.id,
              },
              {
                accountCode: itemType === "FINISHED_GOODS" ? "1350" : "1300",
                debit: totalCogs,
                credit: 0,
                refType: "SALE",
                refId: sale.id,
              },
            ],
            "SALES RETURN",
            req.user!.id,
          );

          // Process Inventory Return
          for (const line of sale.saleLines) {
            const inventoryValue = await costingService.getInventoryValue(
              line.itemId,
              warehouseId,
            );

            const unitCost = inventoryValue.avgCost;

            await costingService.receiveInventory(
              tx,
              line.itemId,
              warehouseId,
              Number(line.qty),
              unitCost,
              "SALES RETURN",
              sale.id,
              req.user!.id,
            );
          }

          await prisma.sale.update({
            where: { id: saleId },
            data: {
              status: "RETURNED",
            },
          });
        }

        // CASE 2: LINKED TO PURCHASE (Vendor Return)
        else if (purchaseId) {
          const purchase = await tx.purchase.findUnique({
            where: { id: purchaseId },
            include: { purchaseLines: true },
          });

          category = "PURCHASE_RETURN";

          const itemType = await getItemTypeById(
            purchase.purchaseLines[0]?.itemId,
          );

          if (!purchase) throw new Error("Purchase not found");

          finalAmount = Number(purchase.totalAmount);

          await glService.postJournal(
            tx,
            [
              {
                accountCode: "2000",
                debit: finalAmount,
                credit: 0,
                refType: "PURCHASE RETURN",
                refId: purchase.id,
              },
              {
                accountCode: itemType === "FINISHED_GOODS" ? "1350" : "1300",
                debit: 0,
                credit: finalAmount,
                refType: "PURCHASE RETURN",
                refId: purchase.id,
              },
            ],
            "PURCHASE RETURN",
            req.user!.id,
          );

          for (const line of purchase.purchaseLines) {
            if (!line.itemId) continue;

            await costingService.issueInventory(
              tx,
              line.itemId,
              warehouseId,
              Number(line.qty),
              "PURCHASE RETURN",
              purchase.id,
              req.user!.id,
            );
          }

          await prisma.purchase.update({
            where: { id: purchaseId },
            data: {
              status: "RETURNED",
            },
          });
        }

        // CASE 3: STANDALONE MEMO
        else {
          category = "FINANCIAL";
          if (!amount || !accountId)
            throw new Error("Amount and account required");

          finalAmount = Number(amount);

          const controlAccount = module === "SALES" ? "1200" : "2000";

          const coa = await tx.chartOfAccount.findFirst({
            where: { id: accountId },
          });

          if (memoType === "CREDIT") {
            await glService.postJournal(
              tx,
              [
                {
                  accountCode: coa.code,
                  debit: finalAmount,
                  credit: 0,
                  refType: "CREDIT MEMO",
                  refId: req.body.refId ?? undefined,
                },
                {
                  accountCode: controlAccount,
                  debit: 0,
                  credit: finalAmount,
                  refType: "CREDIT MEMO",
                  refId: req.body.refId ?? undefined,
                },
              ],
              `Credit Memo: ${description ?? memoNo}`,
              req.user!.id,
            );
          } else {
            await glService.postJournal(
              tx,
              [
                {
                  accountCode: controlAccount,
                  debit: finalAmount,
                  credit: 0,
                  refType: "DEBIT MEMO",
                  refId: req.body.refId ?? undefined,
                },
                {
                  accountCode: coa.code,
                  debit: 0,
                  credit: finalAmount,
                  refType: "DEBIT MEMO",
                  refId: req.body.refId ?? undefined,
                },
              ],
              `Debit Memo: ${description ?? memoNo}`,
              req.user!.id,
            );
          }
        }

        // Create Memo Record
        const memo = await tx.memo.create({
          data: {
            memoNo,
            date: new Date(date),
            module,
            memoType,
            category,
            amount: finalAmount,
            remaining: finalAmount,
            description,
            saleId,
            purchaseId,
            customerId,
            vendorId,
            accountId,
            createdBy: req.user!.id,
          },
        });

        return memo;
      });

      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // async createMemo(req: AuthRequest, res: Response) {
  //   try {
  //     const {
  //       date,
  //       module,
  //       memoType,
  //       amount,
  //       description,
  //       accountId,
  //       customerId,
  //       vendorId,
  //     } = req.body;

  //     const result = await prisma.$transaction(async (tx) => {
  //       const memoCount = await tx.memo.count();
  //       const memoNo = `M${String(memoCount + 1).padStart(6, "0")}`;

  //       // Determine control account
  //       const controlAccount = await tx.chartOfAccount.findFirst({
  //         where: {
  //           code: module === "SALES" ? "1200" : "2000",
  //         },
  //       });

  //       if (!controlAccount) {
  //         throw new Error("AR/AP control account not found");
  //       }

  //       let debitAccountId: string;
  //       let creditAccountId: string;

  //       if (memoType === "CREDIT") {
  //         // Credit Memo reduces AR/AP
  //         debitAccountId = accountId;
  //         creditAccountId = controlAccount.id;
  //       } else {
  //         // Debit Memo increases AR/AP
  //         debitAccountId = controlAccount.id;
  //         creditAccountId = accountId;
  //       }

  //       const journal = await tx.journal.create({
  //         data: {
  //           journalNo: `J${Date.now()}`,
  //           date: new Date(date),
  //           memo: description ?? memoNo,
  //           postedBy: req.user!.id,
  //           journalLines: {
  //             create: [
  //               {
  //                 accountId: debitAccountId,
  //                 debit: new Decimal(amount),
  //                 credit: new Decimal(0),
  //                 refType: "MEMO",
  //               },
  //               {
  //                 accountId: creditAccountId,
  //                 debit: new Decimal(0),
  //                 credit: new Decimal(amount),
  //                 refType: "MEMO",
  //               },
  //             ],
  //           },
  //         },
  //       });

  //       const memo = await tx.memo.create({
  //         data: {
  //           date: new Date(date),
  //           module,
  //           memoType,
  //           amount: new Decimal(amount),
  //           //remaining: new Decimal(amount),
  //           description,
  //           accountId,
  //           // journalId: journal.id,
  //           createdBy: req.user!.id,
  //           ...(customerId ? { customerId } : {}),
  //           ...(vendorId ? { vendorId } : {}),
  //         },
  //       });

  //       return memo;
  //     });

  //     res.status(201).json(result);
  //   } catch (error: any) {
  //     console.error(error);
  //     res.status(400).json({ error: error.message });
  //   }
  // }

  // Link memo to SalesReceipt or PurchasePayment using Memo Clearing Account
  // First, find the GL account with code "9999"
  // const memoClearingGlAccount = await tx.chartOfAccount.findFirst({
  //   where: { code: "9999" },
  //   select: { id: true },
  // });
  // if (!memoClearingGlAccount) {
  //   throw new Error("Memo Clearing GL account (9999) not found.");
  // }

  // const memoClearingCashAccount = await tx.cashAccount.findFirst({
  //   where: { glAccountId: memoClearingGlAccount.id }, // link by GL account id
  //   select: { id: true },
  // });

  // if (!memoClearingCashAccount) {
  //   throw new Error("Memo Clearing cash account (9999) not found.");
  // }

  // if (module === "SALES" && customerId) {
  //   // Record as SalesReceipt (non-cash)
  //   await tx.salesReceipt.create({
  //     data: {
  //       receiptNo: `MEMO-${String(Date.now())}`,
  //       saleId: null,
  //       customerId,
  //       cashAccountId: memoClearingCashAccount.id,
  //       amountReceived: new Decimal(amount),
  //       receiptDate: new Date(date),
  //       reference: `MEMO-${journal.journalNo}`,
  //       notes:
  //         memoType === "CREDIT"
  //           ? "Customer Credit Memo"
  //           : "Customer Debit Memo",
  //       userId: req.user!.id,
  //     },
  //   });
  // }

  // if (module === "PURCHASES" && vendorId) {
  //   // Record as PurchasePayment (non-cash)
  //   await tx.purchasePayment.create({
  //     data: {
  //       paymentNo: `MEMO-${String(Date.now())}`,
  //       purchaseId: null,
  //       vendorId,
  //       cashAccountId: memoClearingCashAccount.id,
  //       amountPaid: new Decimal(amount),
  //       paymentDate: new Date(date),
  //       reference: `MEMO-${journal.journalNo}`,
  //       notes:
  //         memoType === "CREDIT"
  //           ? "Vendor Credit Memo"
  //           : "Vendor Debit Memo",
  //       userId: req.user!.id,
  //     },
  //   });
  // }
}
async function getItemTypeById(itemId: string) {
  const item = await prisma.item.findUnique({
    where: { id: itemId },
    select: { type: true },
  });

  if (!item) {
    throw new Error("Item not found");
  }

  return String(item.type);
}
