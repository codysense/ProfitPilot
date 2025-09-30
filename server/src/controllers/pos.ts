import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { 
  createPosSessionSchema,
  closePosSessionSchema,
  createPosSaleSchema,
  createPosReturnSchema
} from '../types/pos';
import { AuthRequest } from '../middleware/auth';
import { CostingService } from '../services/costing';
import { GeneralLedgerService } from '../services/gl';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();
const costingService = new CostingService();
const glService = new GeneralLedgerService();

export class PosController {


  // POS Sessions
  async createSession(req: AuthRequest, res: Response) {
    try {
      const validatedData = createPosSessionSchema.parse(req.body);

      // Check if user has an open session
      const openSession = await prisma.posSession.findFirst({
        where: {
          userId: req.user!.id,
          status: 'OPEN'
        }
      });

      if (openSession) {
        return res.status(400).json({ error: 'You already have an open POS session' });
      }

      const session = await prisma.$transaction(async (tx) => {
        const count = await tx.posSession.count();
        const sessionNo = `POS${String(count + 1).padStart(6, '0')}`;
        return await tx.posSession.create({
          data: {
            sessionNo,
            user: {
      connect: { id: req.user!.id }
    },
    warehouse: {
      connect: { id: validatedData.warehouseId }
    }
            // userId: req.user!.id,
            // warehouseId: validatedData.warehouseId,
            // cashAccountId: validatedData.cashAccountId,
            // openingBalance: new Decimal(validatedData.openingBalance)
          }
        });
      },
    {
  maxWait: 5000,  // 5s wait for connection
  timeout: 20000  // 20s max runtime
});

      res.status(201).json(session);
    } catch (error) {
      console.error('Create POS session error:', error);
      res.status(400).json({ error: 'Failed to create POS session' });
    }
  }

  async closeSession(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const validatedData = closePosSessionSchema.parse(req.body);

      const session = await prisma.posSession.update({
        where: { id },
        data: {
          closingBalance: new Decimal(validatedData.closingBalance),
          closedAt: new Date(),
          status: 'CLOSED'
        }
      });

      res.json(session);
    } catch (error) {
      console.error('Close POS session error:', error);
      res.status(400).json({ error: 'Failed to close POS session' });
    }
  }

  async getCurrentSession(req: AuthRequest, res: Response) {
    try {
      const session = await prisma.posSession.findFirst({
        where: {
          userId: req.user!.id,
          status: 'OPEN'
        },
        include: {
          warehouse: { select: { code: true, name: true } },
          cashAccount: { select: { code: true, name: true } }
        }
      });

      res.json({ session });
    } catch (error) {
      console.error('Get current session error:', error);
      res.status(500).json({ error: 'Failed to fetch current session' });
    }
  }

  // POS Sales
  async createSale(req: AuthRequest, res: Response) {
    try {
      const validatedData = createPosSaleSchema.parse(req.body);
      
      const sale = await prisma.$transaction(async (tx) => {
        // Generate sale number
        const count = await tx.posSale.count();
        const saleNo = `POS${String(count + 1).padStart(8, '0')}`;

        // Get session details
        const session = await tx.posSession.findUnique({
          where: { id: validatedData.sessionId }
        });

        if (!session || session.status !== 'OPEN') {
          throw new Error('Invalid or closed POS session');
        }

        // Create POS sale
        const newSale = await tx.posSale.create({
          data: {
            saleNo,
            sessionId: validatedData.sessionId,
            customerId: validatedData.customerId,
            warehouseId: session.warehouseId,
            cashAccountId: validatedData.cashAccountId,
            subtotal: new Decimal(validatedData.subtotal),
            taxAmount: new Decimal(validatedData.taxAmount),
            discountAmount: new Decimal(validatedData.discountAmount),
            totalAmount: new Decimal(validatedData.totalAmount),
            amountPaid: new Decimal(validatedData.amountPaid),
            changeAmount: new Decimal(validatedData.changeAmount),
            paymentMethod: validatedData.paymentMethod,
            notes: validatedData.notes,
            userId: req.user!.id
          }
        });

        // Create sale lines and issue inventory
        for (const line of validatedData.saleLines) {
          await tx.posSaleLine.create({
            data: {
              posSaleId: newSale.id,
              itemId: line.itemId,
              qty: new Decimal(line.qty),
              unitPrice: new Decimal(line.unitPrice),
              discountPercent: new Decimal(line.discountPercent),
              lineTotal: new Decimal(line.qty * line.unitPrice * (1 - line.discountPercent / 100))
            }
          });

          // Issue inventory
          await costingService.issueInventory(
            line.itemId,
            session.warehouseId,
            line.qty,
            'POS_SALE',
            newSale.id,
            req.user!.id
          );
        }

        // Update session totals
        await tx.posSession.update({
          where: { id: validatedData.sessionId },
          data: {
            totalSales: {
              increment: validatedData.totalAmount
            }
          }
        });

        // Update cash account balance
        await tx.cashAccount.update({
          where: { id: validatedData.cashAccountId },
          data: {
            balance: {
              increment: validatedData.totalAmount
            }
          }
        });

        

        // Create cash transaction
        const cashTransactionCount = await tx.cashTransaction.count();
        const transactionNo = `CT${String(cashTransactionCount + 1).padStart(6, '0')}`;

        await tx.cashTransaction.create({
          data: {
            transactionNo,
            cashAccountId: validatedData.cashAccountId,
            transactionType: 'RECEIPT',
            amount: new Decimal(validatedData.totalAmount),
            description: `POS Sale: ${saleNo}`,
            transactionDate: new Date(),
            reference: saleNo,
            refType: 'POS_SALE',
            refId: newSale.id,
            userId: req.user!.id
          }
        });

    

        // Post to general ledger
        const totalCogs = await calculateCogs(validatedData.saleLines, session.warehouseId);
        
        await glService.postJournal([
          { accountCode: '1100', debit: validatedData.totalAmount, credit: 0, refType: 'POS_SALE', refId: newSale.id },
          { accountCode: '4000', debit: 0, credit: validatedData.totalAmount, refType: 'POS_SALE', refId: newSale.id },
          { accountCode: '5000', debit: totalCogs, credit: 0, refType: 'POS_SALE', refId: newSale.id },
          { accountCode: '1350', debit: 0, credit: totalCogs, refType: 'POS_SALE', refId: newSale.id }
        ], `POS Sale: ${saleNo}`, req.user!.id);

        return newSale;
      },
    {
  maxWait: 5000,  // 5s wait for connection
  timeout: 20000  // 20s max runtime
});

      res.status(201).json(sale);
    } catch (error) {
      console.error('Create POS sale error:', error);
      res.status(400).json({ error: 'Failed to create POS sale' });
    }
  }

  async getSales(req: AuthRequest, res: Response) {
    try {
      const { page = 1, limit = 20, sessionId, customerId, dateFrom, dateTo } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const where: any = {};
      
      // Warehouse-based filtering for POS users
      if (!req.user!.roles.includes('CFO') && !req.user!.roles.includes('General Manager')) {
        const user = await prisma.user.findUnique({
          where: { id: req.user!.id },
          select: { warehouseId: true }
        });
        if (user?.warehouseId) {
          where.warehouseId = user.warehouseId;
        }
      }

      if (sessionId) where.sessionId = sessionId;
      if (customerId) where.customerId = customerId;
      if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) where.createdAt.gte = new Date(dateFrom as string);
        if (dateTo) where.createdAt.lte = new Date(dateTo as string);
      }

      const [sales, total] = await Promise.all([
        prisma.posSale.findMany({
          where,
          skip,
          take: Number(limit),
          include: {
            customer: { select: { code: true, name: true } },
            warehouse: { select: { code: true, name: true } },
            session: { select: { sessionNo: true } },
            saleLines: {
              include: {
                item: { select: { sku: true, name: true, uom: true } }
              }
            },
            user: { select: { name: true } }
          },
          orderBy: { createdAt: 'desc' }
        }),
        prisma.posSale.count({ where })
      ]);

      res.json({
        sales,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      console.error('Get POS sales error:', error);
      res.status(500).json({ error: 'Failed to fetch POS sales' });
    }
  }

  //get POS returns



async getReturns(req:AuthRequest, res:Response ) {
 try {
    const { page = 1, limit = 20, sessionId, customerId, dateFrom, dateTo } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where: any = {};
    if (sessionId) where.sessionId = String(sessionId);
    if (customerId) where.customerId = String(customerId);
    if (dateFrom && dateTo) {
      where.createdAt = {
        gte: new Date(String(dateFrom)),
        lte: new Date(String(dateTo)),
      };
    }

    const [returns, total] = await Promise.all([
      prisma.posReturn.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          customer: { select: { id: true, name: true } },
          user: { select: { id: true, name: true } },
          returnLines: {
            include: { item: { select: { id: true, name: true } } },
          },
        },
      }),
      prisma.posReturn.count({ where }),
    ]);

    // 🔑 Transform data: add itemsSummary field
    const transformed = returns.map((ret) => {
      const itemsSummary = ret.returnLines
        .map((line) => `${line.item?.name ?? "Unknown"} (x${line.qtyReturned})`)
        .join(", ");
      

      return {
        ...ret,
        itemsSummary,
      };
    });

    res.json({
      data: transformed,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("Get POS returns error:", error);
    res.status(500).json({ error: "Failed to fetch POS returns" });
  }
};


  // Create POS Returns
  async createReturn(req: AuthRequest, res: Response) {
    try {
      const validatedData = createPosReturnSchema.parse(req.body);

      const returnRecord = await prisma.$transaction(async (tx) => {
        // Generate return number
        const count = await tx.posReturn.count();
        const returnNo = `RTN${String(count + 1).padStart(6, '0')}`;

        // Get original sale
        const originalSale = await tx.posSale.findUnique({
          where: { id: validatedData.originalSaleId },
          include: {
            saleLines: true,
            session: true
          }
        });

        if (!originalSale) {
          throw new Error('Original sale not found');
        }

        // Calculate return total
        const returnTotal = validatedData.returnLines.reduce((sum, line) => {
          return sum + (line.qtyReturned * line.unitPrice);
        }, 0);

        // Create return record
        const newReturn = await tx.posReturn.create({
          data: {
            returnNo,
            originalSaleId: validatedData.originalSaleId,
            sessionId: validatedData.sessionId,
            customerId: originalSale.customerId,
            warehouseId: originalSale.warehouseId,
            totalAmount: new Decimal(returnTotal),
            refundAmount: new Decimal(returnTotal),
            reason: validatedData.reason,
            userId: req.user!.id
          }
        });

        // Create return lines and reverse inventory
        for (const line of validatedData.returnLines) {
          await tx.posReturnLine.create({
            data: {
              posReturnId: newReturn.id,
              originalLineId: line.originalLineId,
              itemId: line.itemId,
              qtyReturned: new Decimal(line.qtyReturned),
              unitPrice: new Decimal(line.unitPrice),
              lineTotal: new Decimal(line.qtyReturned * line.unitPrice)
            }
          });

          // Return inventory to stock
          await costingService.receiveInventory(
            line.itemId,
            originalSale.warehouseId,
            line.qtyReturned,
            line.unitPrice,
            'POS_RETURN',
            newReturn.id,
            req.user!.id
          );
        }

        // Update session totals
        await tx.posSession.update({
          where: { id: validatedData.sessionId },
          data: {
            totalReturns: {
              increment: returnTotal
            }
          }
        });

        // Update cash account balance (reduce by refund amount)
        await tx.cashAccount.update({
          where: { id: originalSale.cashAccountId },
          data: {
            balance: {
              decrement: returnTotal
            }
          }
        });

        // Create cash transaction for refund
        const cashTransactionCount = await tx.cashTransaction.count();
        const transactionNo = `CT${String(cashTransactionCount + 1).padStart(6, '0')}`;

        await tx.cashTransaction.create({
          data: {
            transactionNo,
            cashAccountId: originalSale.cashAccountId,
            transactionType: 'PAYMENT',
            amount: new Decimal(returnTotal),
            description: `POS Return: ${returnNo}`,
            transactionDate: new Date(),
            reference: returnNo,
            refType: 'POS_RETURN',
            refId: newReturn.id,
            userId: req.user!.id
          }
        });

        // Reverse GL entries
        await glService.postJournal([
          { accountCode: '4000', debit: returnTotal, credit: 0, refType: 'POS_RETURN', refId: newReturn.id },
          { accountCode: '1100', debit: 0, credit: returnTotal, refType: 'POS_RETURN', refId: newReturn.id },
          { accountCode: '1350', debit: returnTotal, credit: 0, refType: 'POS_RETURN', refId: newReturn.id },
          { accountCode: '5000', debit: 0, credit: returnTotal, refType: 'POS_RETURN', refId: newReturn.id }
        ], `POS Return: ${returnNo}`, req.user!.id);

        return newReturn;
      },
      {
  maxWait: 5000,  // 5s wait for connection
  timeout: 20000  // 20s max runtime
}
    );

      res.status(201).json(returnRecord);
    } catch (error) {
      console.error('Create POS return error:', error);
      res.status(400).json({ error: 'Failed to create POS return' });
    }
  }

  // Get customers with outstanding balances
  async getCustomersWithBalances(req: AuthRequest, res: Response) {
    try {
      const customers = await prisma.$queryRaw`
        SELECT 
          c.id,
          c.code,
          c.name,
          c.address,
          c.phone,
          c.email,
          c."CustomerGroup",
          COALESCE(
            (SELECT SUM(s."totalAmount") FROM sales s WHERE s."customerId" = c.id AND s.status IN ('INVOICED', 'PAID')) -
            (SELECT SUM(sr."amountReceived") FROM sales_receipts sr WHERE sr."customerId" = c.id), 
            0
          ) as "outstandingBalance"
        FROM customers c
        WHERE c."isActive" = true
        ORDER BY c.name
      `;

      res.json({ customers });
    } catch (error) {
      console.error('Get customers with balances error:', error);
      res.status(500).json({ error: 'Failed to fetch customers with balances' });
    }
  }

  // Print POS receipt
  async printReceipt(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const sale = await prisma.posSale.findUnique({
        where: { id },
        include: {
          customer: true,
          warehouse: true,
          session: true,
          saleLines: {
            include: {
              item: true
            }
          },
          user: { select: { name: true } }
        }
      });

      if (!sale) {
        return res.status(404).json({ error: 'POS sale not found' });
      }

      // Get customer outstanding balance
      let outstandingBalance = 0;
      if (sale.customerId) {
        const balanceResult = await prisma.$queryRaw`
          SELECT COALESCE(
            (SELECT SUM(s."totalAmount") FROM sales s WHERE s."customerId" = ${sale.customerId} AND s.status IN ('INVOICED', 'PAID')) -
            (SELECT SUM(sr."amountReceived") FROM sales_receipts sr WHERE sr."customerId" = ${sale.customerId}), 
            0
          ) as balance
        ` as any[];
        outstandingBalance = Number(balanceResult[0]?.balance || 0);
      }

      res.json({
        sale,
        outstandingBalance,
        printData: {
          title: 'SALES RECEIPT',
          documentNo: sale.saleNo,
          date: sale.createdAt,
          customer: sale.customer,
          warehouse: sale.warehouse,
          lines: sale.saleLines,
          subtotal: sale.subtotal,
          taxAmount: sale.taxAmount,
          discountAmount: sale.discountAmount,
          total: sale.totalAmount,
          amountPaid: sale.amountPaid,
          changeAmount: sale.changeAmount,
          paymentMethod: sale.paymentMethod,
          cashier: sale.user.name,
          outstandingBalance
        }
      });
    } catch (error) {
      console.error('Print POS receipt error:', error);
      res.status(500).json({ error: 'Failed to generate receipt' });
    }
  }

  // Helper method to calculate COGS
   

}
async function calculateCogs(saleLines: any[], warehouseId: string): Promise<number> {
      let totalCogs = 0;

    for (const line of saleLines) {
      const inventoryValue = await costingService.getInventoryValue(line.itemId, warehouseId);
      totalCogs += line.qty * inventoryValue.avgCost;
    }

    return totalCogs;
  }