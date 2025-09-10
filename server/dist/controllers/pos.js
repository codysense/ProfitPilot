"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PosController = void 0;
const client_1 = require("@prisma/client");
const pos_1 = require("../types/pos");
const costing_1 = require("../services/costing");
const gl_1 = require("../services/gl");
const library_1 = require("@prisma/client/runtime/library");
const prisma = new client_1.PrismaClient();
const costingService = new costing_1.CostingService();
const glService = new gl_1.GeneralLedgerService();
class PosController {
    // POS Sessions
    async createSession(req, res) {
        try {
            const validatedData = pos_1.createPosSessionSchema.parse(req.body);
            // Check if user has an open session
            const openSession = await prisma.posSession.findFirst({
                where: {
                    userId: req.user.id,
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
                        userId: req.user.id,
                        warehouseId: validatedData.warehouseId,
                        cashAccountId: validatedData.cashAccountId,
                        openingBalance: new library_1.Decimal(validatedData.openingBalance)
                    }
                });
            }, {
                maxWait: 5000, // 5s wait for connection
                timeout: 20000 // 20s max runtime
            });
            res.status(201).json(session);
        }
        catch (error) {
            console.error('Create POS session error:', error);
            res.status(400).json({ error: 'Failed to create POS session' });
        }
    }
    async closeSession(req, res) {
        try {
            const { id } = req.params;
            const validatedData = pos_1.closePosSessionSchema.parse(req.body);
            const session = await prisma.posSession.update({
                where: { id },
                data: {
                    closingBalance: new library_1.Decimal(validatedData.closingBalance),
                    closedAt: new Date(),
                    status: 'CLOSED'
                }
            });
            res.json(session);
        }
        catch (error) {
            console.error('Close POS session error:', error);
            res.status(400).json({ error: 'Failed to close POS session' });
        }
    }
    async getCurrentSession(req, res) {
        try {
            const session = await prisma.posSession.findFirst({
                where: {
                    userId: req.user.id,
                    status: 'OPEN'
                },
                include: {
                    warehouse: { select: { code: true, name: true } },
                    cashAccount: { select: { code: true, name: true } }
                }
            });
            res.json({ session });
        }
        catch (error) {
            console.error('Get current session error:', error);
            res.status(500).json({ error: 'Failed to fetch current session' });
        }
    }
    // POS Sales
    async createSale(req, res) {
        try {
            const validatedData = pos_1.createPosSaleSchema.parse(req.body);
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
                        cashAccountId: session.cashAccountId,
                        subtotal: new library_1.Decimal(validatedData.subtotal),
                        taxAmount: new library_1.Decimal(validatedData.taxAmount),
                        discountAmount: new library_1.Decimal(validatedData.discountAmount),
                        totalAmount: new library_1.Decimal(validatedData.totalAmount),
                        amountPaid: new library_1.Decimal(validatedData.amountPaid),
                        changeAmount: new library_1.Decimal(validatedData.changeAmount),
                        paymentMethod: validatedData.paymentMethod,
                        notes: validatedData.notes,
                        userId: req.user.id
                    }
                });
                // Create sale lines and issue inventory
                for (const line of validatedData.saleLines) {
                    await tx.posSaleLine.create({
                        data: {
                            posSaleId: newSale.id,
                            itemId: line.itemId,
                            qty: new library_1.Decimal(line.qty),
                            unitPrice: new library_1.Decimal(line.unitPrice),
                            discountPercent: new library_1.Decimal(line.discountPercent),
                            lineTotal: new library_1.Decimal(line.qty * line.unitPrice * (1 - line.discountPercent / 100))
                        }
                    });
                    // Issue inventory
                    await costingService.issueInventory(line.itemId, session.warehouseId, line.qty, 'POS_SALE', newSale.id, req.user.id);
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
                    where: { id: session.cashAccountId },
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
                        cashAccountId: session.cashAccountId,
                        transactionType: 'RECEIPT',
                        amount: new library_1.Decimal(validatedData.totalAmount),
                        description: `POS Sale: ${saleNo}`,
                        transactionDate: new Date(),
                        reference: saleNo,
                        refType: 'POS_SALE',
                        refId: newSale.id,
                        userId: req.user.id
                    }
                });
                // Post to general ledger
                const totalCogs = await calculateCogs(validatedData.saleLines, session.warehouseId);
                await glService.postJournal([
                    { accountCode: '1100', debit: validatedData.totalAmount, credit: 0, refType: 'POS_SALE', refId: newSale.id },
                    { accountCode: '4000', debit: 0, credit: validatedData.totalAmount, refType: 'POS_SALE', refId: newSale.id },
                    { accountCode: '5000', debit: totalCogs, credit: 0, refType: 'POS_SALE', refId: newSale.id },
                    { accountCode: '1350', debit: 0, credit: totalCogs, refType: 'POS_SALE', refId: newSale.id }
                ], `POS Sale: ${saleNo}`, req.user.id);
                return newSale;
            }, {
                maxWait: 5000, // 5s wait for connection
                timeout: 20000 // 20s max runtime
            });
            res.status(201).json(sale);
        }
        catch (error) {
            console.error('Create POS sale error:', error);
            res.status(400).json({ error: 'Failed to create POS sale' });
        }
    }
    async getSales(req, res) {
        try {
            const { page = 1, limit = 20, sessionId, customerId, dateFrom, dateTo } = req.query;
            const skip = (Number(page) - 1) * Number(limit);
            const where = {};
            // Warehouse-based filtering for POS users
            if (!req.user.roles.includes('CFO') && !req.user.roles.includes('General Manager')) {
                const user = await prisma.user.findUnique({
                    where: { id: req.user.id },
                    select: { warehouseId: true }
                });
                if (user?.warehouseId) {
                    where.warehouseId = user.warehouseId;
                }
            }
            if (sessionId)
                where.sessionId = sessionId;
            if (customerId)
                where.customerId = customerId;
            if (dateFrom || dateTo) {
                where.createdAt = {};
                if (dateFrom)
                    where.createdAt.gte = new Date(dateFrom);
                if (dateTo)
                    where.createdAt.lte = new Date(dateTo);
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
        }
        catch (error) {
            console.error('Get POS sales error:', error);
            res.status(500).json({ error: 'Failed to fetch POS sales' });
        }
    }
    // POS Returns
    async createReturn(req, res) {
        try {
            const validatedData = pos_1.createPosReturnSchema.parse(req.body);
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
                        totalAmount: new library_1.Decimal(returnTotal),
                        refundAmount: new library_1.Decimal(returnTotal),
                        reason: validatedData.reason,
                        userId: req.user.id
                    }
                });
                // Create return lines and reverse inventory
                for (const line of validatedData.returnLines) {
                    await tx.posReturnLine.create({
                        data: {
                            posReturnId: newReturn.id,
                            originalLineId: line.originalLineId,
                            itemId: line.itemId,
                            qtyReturned: new library_1.Decimal(line.qtyReturned),
                            unitPrice: new library_1.Decimal(line.unitPrice),
                            lineTotal: new library_1.Decimal(line.qtyReturned * line.unitPrice)
                        }
                    });
                    // Return inventory to stock
                    await costingService.receiveInventory(line.itemId, originalSale.warehouseId, line.qtyReturned, line.unitPrice, 'POS_RETURN', newReturn.id, req.user.id);
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
                        amount: new library_1.Decimal(returnTotal),
                        description: `POS Return: ${returnNo}`,
                        transactionDate: new Date(),
                        reference: returnNo,
                        refType: 'POS_RETURN',
                        refId: newReturn.id,
                        userId: req.user.id
                    }
                });
                // Reverse GL entries
                await glService.postJournal([
                    { accountCode: '4000', debit: returnTotal, credit: 0, refType: 'POS_RETURN', refId: newReturn.id },
                    { accountCode: '1100', debit: 0, credit: returnTotal, refType: 'POS_RETURN', refId: newReturn.id },
                    { accountCode: '1350', debit: returnTotal, credit: 0, refType: 'POS_RETURN', refId: newReturn.id },
                    { accountCode: '5000', debit: 0, credit: returnTotal, refType: 'POS_RETURN', refId: newReturn.id }
                ], `POS Return: ${returnNo}`, req.user.id);
                return newReturn;
            }, {
                maxWait: 5000, // 5s wait for connection
                timeout: 20000 // 20s max runtime
            });
            res.status(201).json(returnRecord);
        }
        catch (error) {
            console.error('Create POS return error:', error);
            res.status(400).json({ error: 'Failed to create POS return' });
        }
    }
    // Get customers with outstanding balances
    async getCustomersWithBalances(req, res) {
        try {
            const customers = await prisma.$queryRaw `
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
        }
        catch (error) {
            console.error('Get customers with balances error:', error);
            res.status(500).json({ error: 'Failed to fetch customers with balances' });
        }
    }
    // Print POS receipt
    async printReceipt(req, res) {
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
                const balanceResult = await prisma.$queryRaw `
          SELECT COALESCE(
            (SELECT SUM(s."totalAmount") FROM sales s WHERE s."customerId" = ${sale.customerId} AND s.status IN ('INVOICED', 'PAID')) -
            (SELECT SUM(sr."amountReceived") FROM sales_receipts sr WHERE sr."customerId" = ${sale.customerId}), 
            0
          ) as balance
        `;
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
        }
        catch (error) {
            console.error('Print POS receipt error:', error);
            res.status(500).json({ error: 'Failed to generate receipt' });
        }
    }
}
exports.PosController = PosController;
async function calculateCogs(saleLines, warehouseId) {
    let totalCogs = 0;
    for (const line of saleLines) {
        const inventoryValue = await costingService.getInventoryValue(line.itemId, warehouseId);
        totalCogs += line.qty * inventoryValue.avgCost;
    }
    return totalCogs;
}
