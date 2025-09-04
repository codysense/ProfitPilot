import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { createPurchaseSchema, receivePurchaseSchema } from '../types/purchase';
import { AuthRequest } from '../middleware/auth';
import { CostingService } from '../services/costing';
import { GeneralLedgerService } from '../services/gl';

const prisma = new PrismaClient();
const costingService = new CostingService();
const glService = new GeneralLedgerService();

export class PurchaseController {
  async getPurchases(req: AuthRequest, res: Response) {
    try {
      const { page = 1, limit = 10, status, vendorId } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const where: any = {};
      if (status) where.status = status;
      if (vendorId) where.vendorId = vendorId;

      const [purchases, total] = await Promise.all([
        prisma.purchase.findMany({
          where,
          skip,
          take: Number(limit),
          include: {
            vendor: {
              select: { code: true, name: true }
            },
            purchaseLines: {
              include: {
                item: {
                  select: { sku: true, name: true, uom: true }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }),
        prisma.purchase.count({ where })
      ]);

      res.json({
        purchases,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      console.error('Get purchases error:', error);
      res.status(500).json({ error: 'Failed to fetch purchases' });
    }
  }

  async createPurchase(req: AuthRequest, res: Response) {
    try {
      const validatedData = createPurchaseSchema.parse(req.body);

      const purchase = await prisma.$transaction(async (tx) => {
        // Generate order number
        const count = await tx.purchase.count();
        const orderNo = `PO${String(count + 1).padStart(6, '0')}`;

        // Calculate total amount
        const totalAmount = validatedData.purchaseLines.reduce((sum, line) => {
          return sum + (line.qty * line.unitPrice);
        }, 0);

        // Create purchase
        const newPurchase = await tx.purchase.create({
          data: {
            orderNo,
            vendorId: validatedData.vendorId,
            orderDate: new Date(validatedData.orderDate),
            totalAmount,
            notes: validatedData.notes,
            status: 'ORDERED'
          }
        });

        // Create purchase lines
        for (const line of validatedData.purchaseLines) {
          await tx.purchaseLine.create({
            data: {
              purchaseId: newPurchase.id,
              itemId: line.itemId,
              qty: line.qty,
              unitPrice: line.unitPrice,
              lineTotal: line.qty * line.unitPrice
            }
          });
        }

        return newPurchase;
      });

      res.status(201).json(purchase);
    } catch (error) {
      console.error('Create purchase error:', error);
      res.status(400).json({ error: 'Failed to create purchase' });
    }
  }

  async receivePurchase(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const validatedData = receivePurchaseSchema.parse(req.body);

      await prisma.$transaction(async (tx) => {
        // Update purchase status
        await tx.purchase.update({
          where: { id },
          data: { status: 'RECEIVED' }
        });

        // Process each receipt line
        for (const receiptLine of validatedData.receiptLines) {
          const purchaseLine = await tx.purchaseLine.findUnique({
            where: { id: receiptLine.purchaseLineId },
            include: { item: true }
          });

          if (!purchaseLine) {
            throw new Error(`Purchase line ${receiptLine.purchaseLineId} not found`);
          }

          // Receive inventory using costing service
          await costingService.receiveInventory(
            purchaseLine.itemId,
            receiptLine.warehouseId,
            receiptLine.qtyReceived,
            receiptLine.unitCost,
            'PURCHASE',
            id,
            req.user!.id
          );
        }

        // Post to general ledger
        const purchase = await tx.purchase.findUnique({
          where: { id },
          include: { purchaseLines: true }
        });

        if (purchase) {
          const totalValue = validatedData.receiptLines.reduce((sum, line) => {
            return sum + (line.qtyReceived * line.unitCost);
          }, 0);

          await glService.postJournal([
            { accountCode: '1300', debit: totalValue, credit: 0, refType: 'PURCHASE', refId: id },
            { accountCode: '2150', debit: 0, credit: totalValue, refType: 'PURCHASE', refId: id }
          ], `Purchase receipt: ${purchase.orderNo}`, req.user!.id);
        }
      });

      res.json({ message: 'Purchase received successfully' });
    } catch (error) {
      console.error('Receive purchase error:', error);
      res.status(400).json({ error: 'Failed to receive purchase' });
    }
  }

  async invoicePurchase(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      await prisma.$transaction(async (tx) => {
        const purchase = await tx.purchase.update({
          where: { id },
          data: { status: 'INVOICED' }
        });

        // Post invoice to general ledger
        await glService.postJournal([
          { accountCode: '2000', debit: 0, credit: Number(purchase.totalAmount), refType: 'PURCHASE', refId: id },
          { accountCode: '2150', debit: Number(purchase.totalAmount), credit: 0, refType: 'PURCHASE', refId: id }
        ], `Purchase invoice: ${purchase.orderNo}`, req.user!.id);
      });

      res.json({ message: 'Purchase invoiced successfully' });
    } catch (error) {
      console.error('Invoice purchase error:', error);
      res.status(400).json({ error: 'Failed to invoice purchase' });
    }
  }

  async getVendors(req: AuthRequest, res: Response) {
    try {
      const { page = 1, limit = 10, search } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const where: any = {};
      if (search) {
        where.OR = [
          { name: { contains: search as string, mode: 'insensitive' } },
          { code: { contains: search as string, mode: 'insensitive' } },
          { email: { contains: search as string, mode: 'insensitive' } }
        ];
      }

      const [vendors, total] = await Promise.all([
        prisma.vendor.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' }
        }),
        prisma.vendor.count({ where })
      ]);

      res.json({
        vendors,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      console.error('Get vendors error:', error);
      res.status(500).json({ error: 'Failed to fetch vendors' });
    }
  }

  async createVendor(req: AuthRequest, res: Response) {
    try {
      const vendor = await prisma.vendor.create({
        data: req.body
      });

      res.status(201).json(vendor);
    } catch (error) {
      console.error('Create vendor error:', error);
      res.status(400).json({ error: 'Failed to create vendor' });
    }
  }

  async updatePurchase(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { vendorId, orderDate, notes, purchaseLines } = req.body;

      // Check if purchase can be edited
      const existingPurchase = await prisma.purchase.findUnique({
        where: { id },
        select: { status: true }
      });

      if (!existingPurchase || !['DRAFT', 'ORDERED'].includes(existingPurchase.status)) {
        return res.status(400).json({ error: 'Cannot edit purchase in current status' });
      }

      const purchase = await prisma.$transaction(async (tx) => {
        // Calculate new total
        const totalAmount = purchaseLines.reduce((sum: number, line: any) => {
          return sum + (line.qty * line.unitPrice);
        }, 0);

        // Update purchase
        const updatedPurchase = await tx.purchase.update({
          where: { id },
          data: {
            vendorId,
            orderDate: new Date(orderDate),
            totalAmount,
            notes
          }
        });

        // Delete existing lines
        await tx.purchaseLine.deleteMany({
          where: { purchaseId: id }
        });

        // Create new lines
        for (const line of purchaseLines) {
          await tx.purchaseLine.create({
            data: {
              purchaseId: id,
              itemId: line.itemId,
              qty: line.qty,
              unitPrice: line.unitPrice,
              lineTotal: line.qty * line.unitPrice
            }
          });
        }

        return updatedPurchase;
      });

      res.json(purchase);
    } catch (error) {
      console.error('Update purchase error:', error);
      res.status(400).json({ error: 'Failed to update purchase' });
    }
  }

  async deletePurchase(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      // Check if purchase can be deleted
      const purchase = await prisma.purchase.findUnique({
        where: { id },
        select: { status: true, orderNo: true }
      });

      if (!purchase || !['DRAFT', 'ORDERED'].includes(purchase.status)) {
        return res.status(400).json({ error: 'Cannot delete purchase in current status' });
      }

      await prisma.purchase.delete({
        where: { id }
      });

      res.json({ message: 'Purchase deleted successfully' });
    } catch (error) {
      console.error('Delete purchase error:', error);
      res.status(400).json({ error: 'Failed to delete purchase' });
    }
  }

  async printPurchaseOrder(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const purchase = await prisma.purchase.findUnique({
        where: { id },
        include: {
          vendor: true,
          purchaseLines: {
            include: {
              item: true
            }
          }
        }
      });

      if (!purchase) {
        return res.status(404).json({ error: 'Purchase not found' });
      }

      res.json({
        purchase,
        printData: {
          title: 'PURCHASE ORDER',
          documentNo: purchase.orderNo,
          date: purchase.orderDate,
          vendor: purchase.vendor,
          lines: purchase.purchaseLines,
          total: purchase.totalAmount
        }
      });
    } catch (error) {
      console.error('Print purchase order error:', error);
      res.status(500).json({ error: 'Failed to generate purchase order' });
    }
  }
}