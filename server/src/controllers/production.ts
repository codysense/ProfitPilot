import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { 
  createProductionOrderSchema, 
  issueMaterialsSchema, 
  addLaborSchema, 
  addOverheadSchema, 
  receiveFinishedGoodsSchema 
} from '../types/production';
import { AuthRequest } from '../middleware/auth';
import { CostingService } from '../services/costing';
import { GeneralLedgerService } from '../services/gl';

const prisma = new PrismaClient();
const costingService = new CostingService();
const glService = new GeneralLedgerService();

export class ProductionController {
  async getProductionOrders(req: AuthRequest, res: Response) {
    try {
      const { page = 1, limit = 10, status } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const where: any = {};
      if (status) where.status = status;

      const [orders, total] = await Promise.all([
        prisma.productionOrder.findMany({
          where,
          skip,
          take: Number(limit),
          include: {
            item: {
              select: { sku: true, name: true, type: true }
            },
            warehouse: {
              select: { code: true, name: true }
            },
            bom: {
              include: {
                bomLines: {
                  include: {
                    componentItem: {
                      select: { sku: true, name: true, uom: true }
                    }
                  }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }),
        prisma.productionOrder.count({ where })
      ]);

      res.json({
        orders,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      console.error('Get production orders error:', error);
      res.status(500).json({ error: 'Failed to fetch production orders' });
    }
  }

  async createProductionOrder(req: AuthRequest, res: Response) {
    try {
      const validatedData = createProductionOrderSchema.parse(req.body);

      const order = await prisma.$transaction(async (tx) => {
        // Generate order number
        const count = await tx.productionOrder.count();
        const orderNo = `MO${String(count + 1).padStart(6, '0')}`;

        // Create production order
        const newOrder = await tx.productionOrder.create({
          data: {
            orderNo,
            itemId: validatedData.itemId,
            qtyTarget: validatedData.qtyTarget,
            warehouseId: validatedData.warehouseId,
            bomId: validatedData.bomId || null
          }
        });

        return newOrder;
      });

      res.status(201).json(order);
    } catch (error) {
      console.error('Create production order error:', error);
      res.status(400).json({ error: 'Failed to create production order' });
    }
  }

  async releaseProductionOrder(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const order = await prisma.productionOrder.update({
        where: { id },
        data: { 
          status: 'RELEASED',
          startedAt: new Date()
        }
      });

      res.json(order);
    } catch (error) {
      console.error('Release production order error:', error);
      res.status(400).json({ error: 'Failed to release production order' });
    }
  }

  async issueMaterials(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const validatedData = issueMaterialsSchema.parse(req.body);

      await prisma.$transaction(async (tx) => {
        let totalIssueValue = 0;

        // Issue each material
        for (const material of validatedData.materials) {
          const result = await costingService.issueInventory(
            material.itemId,
            (await tx.productionOrder.findUnique({ where: { id }, select: { warehouseId: true } }))!.warehouseId,
            material.qty,
            'PRODUCTION',
            id,
            req.user!.id
          );

          totalIssueValue += result.value;

          // Record in WIP ledger
          await tx.wipLedger.create({
            data: {
              productionOrderId: id,
              type: 'ISSUE',
              amount: result.value
            }
          });
        }

        // Update production order status
        await tx.productionOrder.update({
          where: { id },
          data: { status: 'IN_PROGRESS' }
        });

        // Post to general ledger
        const order = await tx.productionOrder.findUnique({
          where: { id },
          select: { orderNo: true }
        });

        await glService.postJournal([
          { accountCode: '1400', debit: totalIssueValue, credit: 0, refType: 'PRODUCTION', refId: id },
          { accountCode: '1300', debit: 0, credit: totalIssueValue, refType: 'PRODUCTION', refId: id }
        ], `Material issue: ${order?.orderNo}`, req.user!.id);
      });

      res.json({ message: 'Materials issued successfully' });
    } catch (error) {
      console.error('Issue materials error:', error);
      res.status(400).json({ error: 'Failed to issue materials' });
    }
  }

  async addLabor(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const validatedData = addLaborSchema.parse(req.body);

      await prisma.$transaction(async (tx) => {
        const amount = validatedData.hours * validatedData.rate;

        // Record labor time
        await tx.laborTime.create({
          data: {
            productionOrderId: id,
            hours: validatedData.hours,
            rate: validatedData.rate,
            amount,
            employeeName: validatedData.employeeName
          }
        });

        // Record in WIP ledger
        await tx.wipLedger.create({
          data: {
            productionOrderId: id,
            type: 'LABOR',
            amount
          }
        });

        // Post to general ledger
        const order = await tx.productionOrder.findUnique({
          where: { id },
          select: { orderNo: true }
        });

        await glService.postJournal([
          { accountCode: '1400', debit: amount, credit: 0, refType: 'PRODUCTION', refId: id },
          { accountCode: '2100', debit: 0, credit: amount, refType: 'PRODUCTION', refId: id }
        ], `Labor cost: ${order?.orderNo}`, req.user!.id);
      });

      res.json({ message: 'Labor cost added successfully' });
    } catch (error) {
      console.error('Add labor error:', error);
      res.status(400).json({ error: 'Failed to add labor cost' });
    }
  }

  async addOverhead(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const validatedData = addOverheadSchema.parse(req.body);

      await prisma.$transaction(async (tx) => {
        // Record in WIP ledger
        await tx.wipLedger.create({
          data: {
            productionOrderId: id,
            type: 'OVERHEAD',
            amount: validatedData.amount,
            note: validatedData.note
          }
        });

        // Post to general ledger
        const order = await tx.productionOrder.findUnique({
          where: { id },
          select: { orderNo: true }
        });

        await glService.postJournal([
          { accountCode: '1400', debit: validatedData.amount, credit: 0, refType: 'PRODUCTION', refId: id },
          { accountCode: '5200', debit: 0, credit: validatedData.amount, refType: 'PRODUCTION', refId: id }
        ], `Overhead: ${order?.orderNo} - ${validatedData.note || 'Manufacturing overhead'}`, req.user!.id);
      });

      res.json({ message: 'Overhead cost added successfully' });
    } catch (error) {
      console.error('Add overhead error:', error);
      res.status(400).json({ error: 'Failed to add overhead cost' });
    }
  }

  async receiveFinishedGoods(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const validatedData = receiveFinishedGoodsSchema.parse(req.body);

      await prisma.$transaction(async (tx) => {
        const order = await tx.productionOrder.findUnique({
          where: { id },
          include: { item: true }
        });

        if (!order) {
          throw new Error('Production order not found');
        }

        // Calculate WIP cost per unit
        const wipEntries = await tx.wipLedger.findMany({
          where: { productionOrderId: id }
        });

        const totalWipCost = wipEntries.reduce((sum, entry) => sum + Number(entry.amount), 0);
        const totalProduced = validatedData.qtyGood + validatedData.qtyScrap;
        const unitCost = totalProduced > 0 ? totalWipCost / totalProduced : 0;

        // Receive good units into inventory
        if (validatedData.qtyGood > 0) {
          await costingService.receiveInventory(
            order.itemId,
            order.warehouseId,
            validatedData.qtyGood,
            unitCost,
            'PRODUCTION',
            id,
            req.user!.id
          );
        }

        // Record scrap loss if any
        if (validatedData.qtyScrap > 0) {
          const scrapValue = validatedData.qtyScrap * unitCost;
          
          await glService.postJournal([
            { accountCode: '5150', debit: scrapValue, credit: 0, refType: 'PRODUCTION', refId: id },
            { accountCode: '1400', debit: 0, credit: scrapValue, refType: 'PRODUCTION', refId: id }
          ], `Scrap loss: ${order.orderNo}`, req.user!.id);
        }

        // Record finished goods receipt in WIP ledger
        await tx.wipLedger.create({
          data: {
            productionOrderId: id,
            type: 'RECEIPT',
            amount: -totalWipCost // Negative to clear WIP
          }
        });

        // Update production order
        const newQtyProduced = Number(order.qtyProduced) + validatedData.qtyGood;
        const newStatus = newQtyProduced >= Number(order.qtyTarget) ? 'FINISHED' : 'IN_PROGRESS';

        await tx.productionOrder.update({
          where: { id },
          data: {
            qtyProduced: newQtyProduced,
            status: newStatus,
            ...(newStatus === 'FINISHED' && { finishedAt: new Date() })
          }
        });

        // Post finished goods to general ledger
        const goodsValue = validatedData.qtyGood * unitCost;
        await glService.postJournal([
          { accountCode: '1350', debit: goodsValue, credit: 0, refType: 'PRODUCTION', refId: id },
          { accountCode: '1400', debit: 0, credit: goodsValue, refType: 'PRODUCTION', refId: id }
        ], `Finished goods receipt: ${order.orderNo}`, req.user!.id);
      });

      res.json({ message: 'Finished goods received successfully' });
    } catch (error) {
      console.error('Receive finished goods error:', error);
      res.status(400).json({ error: 'Failed to receive finished goods' });
    }
  }

  async finishProductionOrder(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const order = await prisma.productionOrder.update({
        where: { id },
        data: { 
          status: 'CLOSED',
          finishedAt: new Date()
        }
      });

      res.json(order);
    } catch (error) {
      console.error('Finish production order error:', error);
      res.status(400).json({ error: 'Failed to finish production order' });
    }
  }

  async getWipSummary(req: AuthRequest, res: Response) {
    try {
      const { productionOrderId } = req.query;

      const where: any = {};
      if (productionOrderId) where.id = productionOrderId;

      const orders = await prisma.productionOrder.findMany({
        where: {
          ...where,
          status: { in: ['RELEASED', 'IN_PROGRESS', 'FINISHED'] }
        },
        include: {
          item: {
            select: { sku: true, name: true }
          },
          wipLedger: true
        }
      });

      const wipSummary = orders.map(order => {
        const issues = order.wipLedger
          .filter(w => w.type === 'ISSUE')
          .reduce((sum, w) => sum + Number(w.amount), 0);
        
        const labor = order.wipLedger
          .filter(w => w.type === 'LABOR')
          .reduce((sum, w) => sum + Number(w.amount), 0);
        
        const overhead = order.wipLedger
          .filter(w => w.type === 'OVERHEAD')
          .reduce((sum, w) => sum + Number(w.amount), 0);
        
        const receipts = Math.abs(order.wipLedger
          .filter(w => w.type === 'RECEIPT')
          .reduce((sum, w) => sum + Number(w.amount), 0));

        const balance = issues + labor + overhead - receipts;

        return {
          orderNo: order.orderNo,
          item: order.item,
          issues,
          labor,
          overhead,
          receipts,
          balance
        };
      });

      res.json(wipSummary);
    } catch (error) {
      console.error('Get WIP summary error:', error);
      res.status(500).json({ error: 'Failed to fetch WIP summary' });
    }
  }

  async updateProductionOrder(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { itemId, qtyTarget, warehouseId, bomId } = req.body;

      // Check if production order can be edited
      const existingOrder = await prisma.productionOrder.findUnique({
        where: { id },
        select: { status: true }
      });

      if (!existingOrder || !['PLANNED', 'RELEASED'].includes(existingOrder.status)) {
        return res.status(400).json({ error: 'Cannot edit production order in current status' });
      }

      const order = await prisma.productionOrder.update({
        where: { id },
        data: {
          itemId,
          qtyTarget,
          warehouseId,
          bomId: bomId || null
        }
      });

      res.json(order);
    } catch (error) {
      console.error('Update production order error:', error);
      res.status(400).json({ error: 'Failed to update production order' });
    }
  }

  async deleteProductionOrder(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      // Check if production order can be deleted
      const order = await prisma.productionOrder.findUnique({
        where: { id },
        select: { status: true, orderNo: true }
      });

      if (!order || !['PLANNED', 'RELEASED'].includes(order.status)) {
        return res.status(400).json({ error: 'Cannot delete production order in current status' });
      }

      await prisma.productionOrder.delete({
        where: { id }
      });

      res.json({ message: 'Production order deleted successfully' });
    } catch (error) {
      console.error('Delete production order error:', error);
      res.status(400).json({ error: 'Failed to delete production order' });
    }
  }

  async printProductionOrder(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const order = await prisma.productionOrder.findUnique({
        where: { id },
        include: {
          item: true,
          warehouse: true,
          bom: {
            include: {
              bomLines: {
                include: {
                  componentItem: true
                }
              }
            }
          }
        }
      });

      if (!order) {
        return res.status(404).json({ error: 'Production order not found' });
      }

      if (!['RELEASED', 'IN_PROGRESS', 'FINISHED'].includes(order.status)) {
        return res.status(400).json({ error: 'Production order must be released to print' });
      }

      res.json({
        order,
        printData: {
          title: 'PRODUCTION ORDER',
          documentNo: order.orderNo,
          item: order.item,
          qtyTarget: order.qtyTarget,
          warehouse: order.warehouse,
          bom: order.bom,
          status: order.status
        }
      });
    } catch (error) {
      console.error('Print production order error:', error);
      res.status(500).json({ error: 'Failed to generate production order' });
    }
  }
}