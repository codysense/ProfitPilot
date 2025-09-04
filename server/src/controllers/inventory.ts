import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { 
  createItemSchema, 
  createBomSchema, 
  inventoryAdjustmentSchema, 
  inventoryTransferSchema,
  createLocationSchema,
  createWarehouseSchema
} from '../types/inventory';
import { AuthRequest } from '../middleware/auth';
import { CostingService } from '../services/costing';
import { GeneralLedgerService } from '../services/gl';

const prisma = new PrismaClient();
const costingService = new CostingService();
const glService = new GeneralLedgerService();

export class InventoryController {
  async getItems(req: AuthRequest, res: Response) {
    try {
      const { page = 1, limit = 10, type, search, includeStock } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const where: any = {};
      if (type) where.type = type;
      if (search) {
        where.OR = [
          { sku: { contains: search as string, mode: 'insensitive' } },
          { name: { contains: search as string, mode: 'insensitive' } }
        ];
      }

      const [items, total] = await Promise.all([
        prisma.item.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' }
        }),
        prisma.item.count({ where })
      ]);

      // Include stock quantities if requested
      let itemsWithStock = items;
      if (includeStock === 'true') {
        itemsWithStock = await Promise.all(
          items.map(async (item) => {
            const stockEntries = await prisma.inventoryLedger.findMany({
              where: { itemId: item.id },
              orderBy: { postedAt: 'desc' },
              take: 1
            });
            
            const stockQty = stockEntries[0]?.runningQty || 0;
            return { ...item, stockQty: Number(stockQty) };
          })
        );
      }

      res.json({
        items: itemsWithStock,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      console.error('Get items error:', error);
      res.status(500).json({ error: 'Failed to fetch items' });
    }
  }

  // async createItem(req: AuthRequest, res: Response) {
  //   try {
  //     const validatedData = createItemSchema.parse(req.body);

  //     await prisma.item.upsert({
  //     where: { sku: validatedData.sku },
  //     update: { ...validatedData },
  //     create: { ...validatedData },
  //     });

      
  //     const item = await prisma.item.create({
  //       data: validatedData
  //     });

  //     res.status(201).json(item);
  //   } catch (error) {
  //     console.error('Create item error:', error);
  //     res.status(400).json({ error: 'Failed to create item' });
  //   }
  // }


  async deleteItem(req: AuthRequest, res: Response) {
      try {
        const { sku } = req.params;
  
        // Check if item can be deleted
        const item = await prisma.item.findUnique({
          where: { sku },
          select: { isActive: true}
        });
  
        if (!item ) {
          return res.status(400).json({ error: 'Cannot delete item in current status' });
        }
  
        await prisma.item.delete({
          where: { sku }
        });
  
        res.json({ message: 'item deleted successfully' });
      } catch (error) {
        console.error('Delete item error:', error);
        res.status(400).json({ error: 'Failed to delete purchase' });
      }
    }
  

  async createItem(req: AuthRequest, res: Response) {
  try {
    const validatedData = createItemSchema.parse(req.body);

    console.log(req.body)

    const item = await prisma.item.upsert({
      where: { sku: validatedData.sku },
      update: { ...validatedData },
      create: { ...validatedData },
    });

    res.status(201).json(item);
  } catch (error) {
    console.error('Create/Update item error:', error);
    res.status(400).json({ error: 'Failed to create or update item' });
  }
}


  async getBoms(req: AuthRequest, res: Response) {
    try {
      const { itemId } = req.query;

      const where: any = {};
      if (itemId) where.itemId = itemId;

      const boms = await prisma.bom.findMany({
        where,
        include: {
          item: {
            select: { sku: true, name: true }
          },
          bomLines: {
            include: {
              componentItem: {
                select: { sku: true, name: true, uom: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      res.json(boms);
    } catch (error) {
      console.error('Get BOMs error:', error);
      res.status(500).json({ error: 'Failed to fetch BOMs' });
    }
  }

  async createBom(req: AuthRequest, res: Response) {
    try {
      const validatedData = createBomSchema.parse(req.body);

      const bom = await prisma.$transaction(async (tx) => {
        // Deactivate existing BOMs for this item
        await tx.bom.updateMany({
          where: { itemId: validatedData.itemId },
          data: { isActive: false }
        });

        // Create new BOM
        const newBom = await tx.bom.create({
          data: {
            itemId: validatedData.itemId,
            version: validatedData.version,
            bomLines: {
              create: validatedData.bomLines
            }
          }
        });

        return newBom;
      });

      res.status(201).json(bom);
    } catch (error) {
      console.error('Create BOM error:', error);
      res.status(400).json({ error: 'Failed to create BOM' });
    }
  }

  async adjustInventory(req: AuthRequest, res: Response) {
    try {
      const validatedData = inventoryAdjustmentSchema.parse(req.body);

      await prisma.$transaction(async (tx) => {
        if (validatedData.adjustmentType === 'IN') {
          // Inventory increase
          await costingService.receiveInventory(
            validatedData.itemId,
            validatedData.warehouseId,
            validatedData.qty,
            validatedData.unitCost || 0,
            'ADJUSTMENT',
            `ADJ-${Date.now()}`,
            req.user!.id
          );

          // Post to general ledger
          const value = validatedData.qty * (validatedData.unitCost || 0);
          await glService.postJournal([
            { accountCode: '1300', debit: value, credit: 0, refType: 'ADJUSTMENT', refId: `ADJ-${Date.now()}` },
            { accountCode: '8100', debit: 0, credit: value, refType: 'ADJUSTMENT', refId: `ADJ-${Date.now()}` }
          ], `Inventory adjustment: ${validatedData.reason}`, req.user!.id);
        } else {
          // Inventory decrease
          const result = await costingService.issueInventory(
            validatedData.itemId,
            validatedData.warehouseId,
            validatedData.qty,
            'ADJUSTMENT',
            `ADJ-${Date.now()}`,
            req.user!.id
          );

          // Post to general ledger
          await glService.postJournal([
            { accountCode: '8100', debit: result.value, credit: 0, refType: 'ADJUSTMENT', refId: `ADJ-${Date.now()}` },
            { accountCode: '1300', debit: 0, credit: result.value, refType: 'ADJUSTMENT', refId: `ADJ-${Date.now()}` }
          ], `Inventory adjustment: ${validatedData.reason}`, req.user!.id);
        }
      });

      res.json({ message: 'Inventory adjusted successfully' });
    } catch (error) {
      console.error('Adjust inventory error:', error);
      res.status(400).json({ error: 'Failed to adjust inventory' });
    }
  }

  async transferInventory(req: AuthRequest, res: Response) {
  try {
    const validatedData = inventoryTransferSchema.parse(req.body);

    // Generate ONE refId for both OUT and IN entries
    const refId = `TRF-${Date.now()}`;

    await prisma.$transaction(async (tx) => {
      // Issue from source warehouse (OUT)
      const result = await costingService.issueInventory(
        validatedData.itemId,
        validatedData.fromWarehouseId,
        validatedData.qty,
        'TRANSFER',
        refId,
        req.user!.id,
        // tx // pass the transaction client if service supports it
      );

      // Receive into destination warehouse (IN)
      await costingService.receiveInventory(
        validatedData.itemId,
        validatedData.toWarehouseId,
        validatedData.qty,
        result.unitCost,
        'TRANSFER',
        refId,
        req.user!.id,
        // tx
      );
    });

    res.json({ message: 'Inventory transferred successfully', refId });
  } catch (error) {
    console.error('Transfer inventory error:', error);
    res.status(400).json({ error: 'Failed to transfer inventory' });
  }
}


  async getInventoryLedger(req: AuthRequest, res: Response) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        itemId, 
        warehouseId, 
        userId,
        itemType,
        refType,
        direction,
        dateFrom,
        dateTo
      } = req.query;
      
      const skip = (Number(page) - 1) * Number(limit);

      const where: any = {};
      if (itemId) where.itemId = itemId;
      if (warehouseId) where.warehouseId = warehouseId;
      if (userId) where.userId = userId;
      if (refType) where.refType = refType;
      if (direction) where.direction = direction;
      if (dateFrom || dateTo) {
        where.postedAt = {};
        if (dateFrom) where.postedAt.gte = new Date(dateFrom as string);
        if (dateTo) where.postedAt.lte = new Date(dateTo as string);
      }
      if (itemType) {
        where.item = { type: itemType };
      }

      const [entries, total] = await Promise.all([
        prisma.inventoryLedger.findMany({
          where,
          skip,
          take: Number(limit),
          include: {
            item: {
              select: { sku: true, name: true, type: true, uom: true }
            },
            warehouse: {
              select: { code: true, name: true }
            },
            user: {
              select: { name: true, email: true }
            }
          },
          orderBy: { postedAt: 'desc' }
        }),
        prisma.inventoryLedger.count({ where })
      ]);

      res.json({
        entries,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      console.error('Get inventory ledger error:', error);
      res.status(500).json({ error: 'Failed to fetch inventory ledger' });
    }
  }

  async exportInventoryLedger(req: AuthRequest, res: Response) {
    try {
      const { 
        format = 'csv',
        itemId, 
        warehouseId, 
        userId,
        itemType,
        refType,
        direction,
        dateFrom,
        dateTo
      } = req.query;

      const where: any = {};
      if (itemId) where.itemId = itemId;
      if (warehouseId) where.warehouseId = warehouseId;
      if (userId) where.userId = userId;
      if (refType) where.refType = refType;
      if (direction) where.direction = direction;
      if (dateFrom || dateTo) {
        where.postedAt = {};
        if (dateFrom) where.postedAt.gte = new Date(dateFrom as string);
        if (dateTo) where.postedAt.lte = new Date(dateTo as string);
      }
      if (itemType) {
        where.item = { type: itemType };
      }

      const entries = await prisma.inventoryLedger.findMany({
        where,
        take: 10000, // Limit to prevent memory issues
        include: {
          item: {
            select: { sku: true, name: true, type: true, uom: true }
          },
          warehouse: {
            select: { code: true, name: true }
          },
          user: {
            select: { name: true, email: true }
          }
        },
        orderBy: { postedAt: 'desc' }
      });

      if (format === 'csv') {
        // Generate CSV
        const headers = [
          'Date',
          'Item SKU',
          'Item Name',
          'Item Type',
          'Warehouse',
          'Reference Type',
          'Direction',
          'Quantity',
          'UOM',
          'Unit Cost',
          'Value',
          'Running Qty',
          'Running Value',
          'Running Avg Cost',
          'User'
        ];

        const csvRows = entries.map(entry => [
          new Date(entry.postedAt).toLocaleDateString(),
          entry.item.sku,
          entry.item.name,
          entry.item.type,
          entry.warehouse.name,
          entry.refType,
          entry.direction,
          entry.qty.toString(),
          entry.item.uom,
          entry.unitCost.toString(),
          entry.value.toString(),
          entry.runningQty.toString(),
          entry.runningValue.toString(),
          entry.runningAvgCost.toString(),
          entry.user?.name || 'System'
        ]);

        const csvContent = [headers, ...csvRows]
          .map(row => row.map(field => `"${field}"`).join(','))
          .join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="inventory-ledger-${new Date().toISOString().split('T')[0]}.csv"`);
        res.send(csvContent);
      } else {
        // Return JSON for Excel/PDF processing
        res.json({ entries });
      }
    } catch (error) {
      console.error('Export inventory ledger error:', error);
      res.status(500).json({ error: 'Failed to export inventory ledger' });
    }
  }

  async getInventoryValuation(req: AuthRequest, res: Response) {
    try {
      const { warehouseId } = req.query;

      // Get all items with their latest inventory positions
      const items = await prisma.item.findMany({
        where: { isActive: true },
        select: {
          id: true,
          sku: true,
          name: true,
          type: true,
          costingMethod: true
        }
      });

      const valuation = [];
      let totalValue = 0;

      for (const item of items) {
        // Get warehouses to check
        const warehouseFilter = warehouseId ? { id: warehouseId } : { isActive: true };
        const warehouses = await prisma.warehouse.findMany({
          where: warehouseFilter,
          select: { id: true }
        });

        for (const warehouse of warehouses) {
          // Get latest ledger entry for this item-warehouse combination
          const latestEntry = await prisma.inventoryLedger.findFirst({
            where: {
              itemId: item.id,
              warehouseId: warehouse.id
            },
            orderBy: { postedAt: 'desc' }
          });

          if (latestEntry && Number(latestEntry.runningQty) > 0) {
            const itemValuation = {
              itemId: item.id,
              sku: item.sku,
              name: item.name,
              type: item.type,
              costingMethod: item.costingMethod,
              qty: Number(latestEntry.runningQty),
              unitCost: Number(latestEntry.runningAvgCost),
              totalValue: Number(latestEntry.runningValue)
            };
            
            valuation.push(itemValuation);
            totalValue += itemValuation.totalValue;
          }
        }
      }

      res.json({
        valuation,
        totalValue,
        asOfDate: new Date().toISOString()
      });
    } catch (error) {
      console.error('Get inventory valuation error:', error);
      res.status(500).json({ error: 'Failed to fetch inventory valuation' });
    }
  }

  async getWarehouses(req: AuthRequest, res: Response) {
    try {
      const warehouses = await prisma.warehouse.findMany({
        where: { isActive: true },
        select: {
          id: true,
          code: true,
          name: true
        },
        orderBy: { name: 'asc' }
      });

      res.json({ warehouses });
    } catch (error) {
      console.error('Get warehouses error:', error);
      res.status(500).json({ error: 'Failed to fetch warehouses' });
    }
  }

  async getWarehousesList(req: AuthRequest, res: Response) {
    try {
      const { page = 1, limit = 10, search } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const where: any = {};
      if (search) {
        where.OR = [
          { code: { contains: search as string, mode: 'insensitive' } },
          { name: { contains: search as string, mode: 'insensitive' } }
        ];
      }

      const [warehouses, total] = await Promise.all([
        prisma.warehouse.findMany({
          where,
          skip,
          take: Number(limit),
          include: {
            location: {
              select: { code: true, name: true, city: true, state: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        }),
        prisma.warehouse.count({ where })
      ]);

      res.json({
        warehouses,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      console.error('Get warehouses list error:', error);
      res.status(500).json({ error: 'Failed to fetch warehouses' });
    }
  }

  async createWarehouse(req: AuthRequest, res: Response) {
    try {
      const validatedData = createWarehouseSchema.parse(req.body);
      
      const warehouse = await prisma.warehouse.create({
        data: validatedData,
        include: {
          location: {
            select: { code: true, name: true, city: true, state: true }
          }
        }
      });

      res.status(201).json(warehouse);
    } catch (error) {
      console.error('Create warehouse error:', error);
      res.status(400).json({ error: 'Failed to create warehouse' });
    }
  }

  async updateWarehouse(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      
      const warehouse = await prisma.warehouse.update({
        where: { id },
        data: req.body,
        include: {
          location: {
            select: { code: true, name: true, city: true, state: true }
          }
        }
      });

      res.json(warehouse);
    } catch (error) {
      console.error('Update warehouse error:', error);
      res.status(400).json({ error: 'Failed to update warehouse' });
    }
  }

  async getLocations(req: AuthRequest, res: Response) {
    try {
      const { page = 1, limit = 10, search } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const where: any = {};
      if (search) {
        where.OR = [
          { code: { contains: search as string, mode: 'insensitive' } },
          { name: { contains: search as string, mode: 'insensitive' } },
          { city: { contains: search as string, mode: 'insensitive' } }
        ];
      }

      const [locations, total] = await Promise.all([
        prisma.location.findMany({
          where,
          skip,
          take: Number(limit),
          include: {
            _count: {
              select: { warehouses: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        }),
        prisma.location.count({ where })
      ]);

      res.json({
        locations,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      console.error('Get locations error:', error);
      res.status(500).json({ error: 'Failed to fetch locations' });
    }
  }

  async createLocation(req: AuthRequest, res: Response) {
    try {
      const validatedData = createLocationSchema.parse(req.body);
      
      const location = await prisma.location.create({
        data: validatedData
      });

      res.status(201).json(location);
    } catch (error) {
      console.error('Create location error:', error);
      res.status(400).json({ error: 'Failed to create location' });
    }
  }

  async updateLocation(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      
      const location = await prisma.location.update({
        where: { id },
        data: req.body
      });

      res.json(location);
    } catch (error) {
      console.error('Update location error:', error);
      res.status(400).json({ error: 'Failed to update location' });
    }
  }

  async getInventoryTransfers(req: AuthRequest, res: Response) {
    try {
      const { page = 1, limit = 10, itemId, fromWarehouseId, toWarehouseId, dateFrom, dateTo } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const where: any = { refType: 'TRANSFER' };
      if (itemId) where.itemId = itemId;
      if (fromWarehouseId || toWarehouseId) {
        // For warehouse filtering, we need to check both directions
        if (fromWarehouseId && toWarehouseId) {
          where.OR = [
            { warehouseId: fromWarehouseId, direction: 'OUT' },
            { warehouseId: toWarehouseId, direction: 'IN' }
          ];
        } else if (fromWarehouseId) {
          where.warehouseId = fromWarehouseId;
          where.direction = 'OUT';
        } else if (toWarehouseId) {
          where.warehouseId = toWarehouseId;
          where.direction = 'IN';
        }
      }
      if (dateFrom || dateTo) {
        where.postedAt = {};
        if (dateFrom) where.postedAt.gte = new Date(dateFrom as string);
        if (dateTo) where.postedAt.lte = new Date(dateTo as string);
      }

      // Get all transfer entries
      const allTransferEntries = await prisma.inventoryLedger.findMany({
        where,
        include: {
          item: {
            select: { sku: true, name: true, uom: true }
          },
          warehouse: {
            select: { code: true, name: true }
          },
          user: {
            select: { name: true }
          }
        },
        orderBy: { postedAt: 'desc' }
      });

      // Group by refId to create complete transfer records
      const transferMap = new Map();
      allTransferEntries.forEach(entry => {
        if (!transferMap.has(entry.refId)) {
          transferMap.set(entry.refId, {
            id: entry.refId,
            transferDate: entry.postedAt.toISOString(),
            item: entry.item,
            qty: Math.abs(Number(entry.qty)),
            fromWarehouse: null,
            toWarehouse: null,
            user: entry.user
          });
        }
        
        const transfer = transferMap.get(entry.refId);
        if (entry.direction === 'OUT') {
          transfer.fromWarehouse = entry.warehouse;
        } else {
          transfer.toWarehouse = entry.warehouse;
        }
      });

      // Filter complete transfers and apply pagination
      const completeTransfers = Array.from(transferMap.values())
        .filter(t => t.fromWarehouse && t.toWarehouse)
        .sort((a, b) => new Date(b.transferDate).getTime() - new Date(a.transferDate).getTime());

      const total = completeTransfers.length;
      const paginatedTransfers = completeTransfers.slice(skip, skip + Number(limit));



      res.json({
        transfers: paginatedTransfers,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      console.error('Get inventory transfers error:', error);
      res.status(500).json({ error: 'Failed to fetch inventory transfers' });
    }
  }

  async getItemStock(req: AuthRequest, res: Response) {
    try {
      const { itemId, warehouseId } = req.params;

      const lastEntry = await prisma.inventoryLedger.findFirst({
        where: { itemId, warehouseId },
        orderBy: { postedAt: 'desc' }
      });

      const stock = {
        qty: lastEntry?.runningQty ? Number(lastEntry.runningQty) : 0,
        value: lastEntry?.runningValue ? Number(lastEntry.runningValue) : 0,
        avgCost: lastEntry?.runningAvgCost ? Number(lastEntry.runningAvgCost) : 0
      };

      res.json(stock);
    } catch (error) {
      console.error('Get item stock error:', error);
      res.status(500).json({ error: 'Failed to fetch item stock' });
    }
  }
}