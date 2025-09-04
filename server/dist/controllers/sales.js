"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SalesController = void 0;
const client_1 = require("@prisma/client");
const sales_1 = require("../types/sales");
const costing_1 = require("../services/costing");
const gl_1 = require("../services/gl");
const prisma = new client_1.PrismaClient();
const costingService = new costing_1.CostingService();
const glService = new gl_1.GeneralLedgerService();
class SalesController {
    async getSales(req, res) {
        try {
            const { page = 1, limit = 10, status, customerId } = req.query;
            const skip = (Number(page) - 1) * Number(limit);
            const where = {};
            if (status)
                where.status = status;
            if (customerId)
                where.customerId = customerId;
            const [sales, total] = await Promise.all([
                prisma.sale.findMany({
                    where,
                    skip,
                    take: Number(limit),
                    include: {
                        customer: {
                            select: { code: true, name: true }
                        },
                        saleLines: {
                            include: {
                                item: {
                                    select: { sku: true, name: true, uom: true }
                                }
                            }
                        }
                    },
                    orderBy: { createdAt: 'desc' }
                }),
                prisma.sale.count({ where })
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
        }
        catch (error) {
            console.error('Get sales error:', error);
            res.status(500).json({ error: 'Failed to fetch sales' });
        }
    }
    async createSale(req, res) {
        try {
            const validatedData = sales_1.createSaleSchema.parse(req.body);
            const sale = await prisma.$transaction(async (tx) => {
                // Generate order number
                const count = await tx.sale.count();
                const orderNo = `SO${String(count + 1).padStart(6, '0')}`;
                console.log(orderNo);
                // Calculate total amount
                const totalAmount = validatedData.saleLines.reduce((sum, line) => {
                    return sum + (line.qty * line.unitPrice);
                }, 0);
                // Create sale
                const newSale = await tx.sale.create({
                    data: {
                        orderNo,
                        customerId: validatedData.customerId,
                        orderDate: new Date(validatedData.orderDate),
                        totalAmount,
                        notes: validatedData.notes,
                        status: 'CONFIRMED'
                    }
                });
                // Create sale lines
                for (const line of validatedData.saleLines) {
                    await tx.saleLine.create({
                        data: {
                            saleId: newSale.id,
                            itemId: line.itemId,
                            qty: line.qty,
                            unitPrice: line.unitPrice,
                            lineTotal: line.qty * line.unitPrice
                        }
                    });
                }
                return newSale;
            });
            res.status(201).json(sale);
        }
        catch (error) {
            console.error('Create sale error:', error);
            res.status(400).json({ error: 'Failed to create sale' });
        }
    }
    async deliverSale(req, res) {
        try {
            const { id } = req.params;
            const validatedData = sales_1.deliverSaleSchema.parse(req.body);
            await prisma.$transaction(async (tx) => {
                // Update sale status
                await tx.sale.update({
                    where: { id },
                    data: { status: 'DELIVERED' }
                });
                // Process each delivery line
                for (const deliveryLine of validatedData.deliveryLines) {
                    const saleLine = await tx.saleLine.findUnique({
                        where: { id: deliveryLine.saleLineId },
                        include: { item: true }
                    });
                    if (!saleLine) {
                        throw new Error(`Sale line ${deliveryLine.saleLineId} not found`);
                    }
                    // Issue inventory using costing service
                    await costingService.issueInventory(saleLine.itemId, deliveryLine.warehouseId, deliveryLine.qtyDelivered, 'SALE', id, req.user.id);
                }
                // Post to general ledger
                const sale = await tx.sale.findUnique({
                    where: { id },
                    include: { saleLines: { include: { item: true } } }
                });
                if (sale) {
                    const totalCogs = await calculateCogs(sale.saleLines, validatedData.deliveryLines);
                    await glService.postJournal([
                        { accountCode: '1200', debit: Number(sale.totalAmount), credit: 0, refType: 'SALE', refId: id },
                        { accountCode: '4000', debit: 0, credit: Number(sale.totalAmount), refType: 'SALE', refId: id },
                        { accountCode: '5000', debit: totalCogs, credit: 0, refType: 'SALE', refId: id },
                        { accountCode: '1350', debit: 0, credit: totalCogs, refType: 'SALE', refId: id }
                    ], `Sale delivery: ${sale.orderNo}`, req.user.id);
                }
            });
            res.json({ message: 'Sale delivered successfully' });
        }
        catch (error) {
            console.error('Deliver sale error:', error);
            res.status(400).json({ error: 'Failed to deliver sale' });
        }
    }
    async invoiceSale(req, res) {
        try {
            const { id } = req.params;
            await prisma.sale.update({
                where: { id },
                data: { status: 'INVOICED' }
            });
            res.json({ message: 'Sale invoiced successfully' });
        }
        catch (error) {
            console.error('Invoice sale error:', error);
            res.status(400).json({ error: 'Failed to invoice sale' });
        }
    }
    async getCustomers(req, res) {
        try {
            const { page = 1, limit = 10, search } = req.query;
            const skip = (Number(page) - 1) * Number(limit);
            const where = {};
            if (search) {
                where.OR = [
                    { name: { contains: search, mode: 'insensitive' } },
                    { code: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } }
                ];
            }
            const [customers, total] = await Promise.all([
                prisma.customer.findMany({
                    where,
                    skip,
                    take: Number(limit),
                    orderBy: { createdAt: 'desc' }
                }),
                prisma.customer.count({ where })
            ]);
            res.json({
                customers,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    pages: Math.ceil(total / Number(limit))
                }
            });
        }
        catch (error) {
            console.error('Get customers error:', error);
            res.status(500).json({ error: 'Failed to fetch customers' });
        }
    }
    async createCustomer(req, res) {
        try {
            const customer = await prisma.customer.create({
                data: req.body
            });
            res.status(201).json(customer);
        }
        catch (error) {
            console.error('Create customer error:', error);
            res.status(400).json({ error: 'Failed to create customer' });
        }
    }
    async updateSale(req, res) {
        try {
            const { id } = req.params;
            const { customerId, orderDate, notes, saleLines } = req.body;
            // Check if sale can be edited
            const existingSale = await prisma.sale.findUnique({
                where: { id },
                select: { status: true }
            });
            if (!existingSale || !['DRAFT', 'CONFIRMED'].includes(existingSale.status)) {
                return res.status(400).json({ error: 'Cannot edit sale in current status' });
            }
            const sale = await prisma.$transaction(async (tx) => {
                // Calculate new total
                const totalAmount = saleLines.reduce((sum, line) => {
                    return sum + (line.qty * line.unitPrice);
                }, 0);
                // Update sale
                const updatedSale = await tx.sale.update({
                    where: { id },
                    data: {
                        customerId,
                        orderDate: new Date(orderDate),
                        totalAmount,
                        notes
                    }
                });
                // Delete existing lines
                await tx.saleLine.deleteMany({
                    where: { saleId: id }
                });
                // Create new lines
                for (const line of saleLines) {
                    await tx.saleLine.create({
                        data: {
                            saleId: id,
                            itemId: line.itemId,
                            qty: line.qty,
                            unitPrice: line.unitPrice,
                            lineTotal: line.qty * line.unitPrice
                        }
                    });
                }
                return updatedSale;
            });
            res.json(sale);
        }
        catch (error) {
            console.error('Update sale error:', error);
            res.status(400).json({ error: 'Failed to update sale' });
        }
    }
    async deleteSale(req, res) {
        try {
            const { id } = req.params;
            // Check if sale can be deleted
            const sale = await prisma.sale.findUnique({
                where: { id },
                select: { status: true, orderNo: true }
            });
            if (!sale || !['DRAFT', 'CONFIRMED'].includes(sale.status)) {
                return res.status(400).json({ error: 'Cannot delete sale in current status' });
            }
            await prisma.sale.delete({
                where: { id }
            });
            res.json({ message: 'Sale deleted successfully' });
        }
        catch (error) {
            console.error('Delete sale error:', error);
            res.status(400).json({ error: 'Failed to delete sale' });
        }
    }
    async printSaleInvoice(req, res) {
        try {
            const { id } = req.params;
            const sale = await prisma.sale.findUnique({
                where: { id },
                include: {
                    customer: true,
                    saleLines: {
                        include: {
                            item: true
                        }
                    }
                }
            });
            if (!sale) {
                return res.status(404).json({ error: 'Sale not found' });
            }
            if (!['INVOICED', 'PAID'].includes(sale.status)) {
                return res.status(400).json({ error: 'Sale must be invoiced to print' });
            }
            res.json({
                sale,
                printData: {
                    title: 'SALES INVOICE',
                    documentNo: sale.orderNo,
                    date: sale.orderDate,
                    customer: sale.customer,
                    lines: sale.saleLines,
                    total: sale.totalAmount
                }
            });
        }
        catch (error) {
            console.error('Print sale invoice error:', error);
            res.status(500).json({ error: 'Failed to generate invoice' });
        }
    }
}
exports.SalesController = SalesController;
// Helper function for COGS calculation
async function calculateCogs(saleLines, deliveryLines) {
    let totalCogs = 0;
    for (const deliveryLine of deliveryLines) {
        const saleLine = saleLines.find(sl => sl.id === deliveryLine.saleLineId);
        if (saleLine) {
            // Get current inventory value for COGS calculation
            const inventoryValue = await costingService.getInventoryValue(saleLine.itemId, deliveryLine.warehouseId);
            totalCogs += deliveryLine.qtyDelivered * inventoryValue.avgCost;
        }
    }
    return totalCogs;
}
