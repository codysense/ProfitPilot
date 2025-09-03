"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CostingService = void 0;
const client_1 = require("@prisma/client");
const library_1 = require("@prisma/client/runtime/library");
const prisma = new client_1.PrismaClient();
class CostingService {
    async getCostingMethod(itemId) {
        const item = await prisma.item.findUnique({
            where: { id: itemId },
            select: { costingMethod: true }
        });
        if (!item) {
            throw new Error(`Item ${itemId} not found`);
        }
        if (item.costingMethod === client_1.CostingMethod.GLOBAL) {
            // Get global costing policy
            const policy = await prisma.policy.findUnique({
                where: { key: 'global_costing_method' }
            });
            return policy?.valueJson || client_1.CostingMethod.WEIGHTED_AVG;
        }
        return item.costingMethod;
    }
    async issueInventory(itemId, warehouseId, qty, refType, refId, userId) {
        const costingMethod = await this.getCostingMethod(itemId);
        if (costingMethod === client_1.CostingMethod.WEIGHTED_AVG) {
            return this.issueWeightedAverage(itemId, warehouseId, qty, refType, refId, userId);
        }
        else {
            return this.issueFifo(itemId, warehouseId, qty, refType, refId, userId);
        }
    }
    async receiveInventory(itemId, warehouseId, qty, unitCost, refType, refId, userId) {
        await prisma.$transaction(async (tx) => {
            const costingMethod = await this.getCostingMethod(itemId);
            // Get current running totals
            const lastEntry = await tx.inventoryLedger.findFirst({
                where: { itemId, warehouseId },
                orderBy: { postedAt: 'desc' }
            });
            const currentQty = lastEntry?.runningQty || new library_1.Decimal(0);
            const currentValue = lastEntry?.runningValue || new library_1.Decimal(0);
            const newQty = currentQty.plus(qty);
            const newValue = currentValue.plus(new library_1.Decimal(qty).mul(unitCost));
            const newAvgCost = newQty.gt(0) ? newValue.div(newQty) : new library_1.Decimal(0);
            // Create inventory ledger entry
            await tx.inventoryLedger.create({
                data: {
                    itemId,
                    warehouseId,
                    refType,
                    refId,
                    direction: client_1.LedgerDirection.IN,
                    qty: new library_1.Decimal(qty),
                    unitCost: new library_1.Decimal(unitCost),
                    value: new library_1.Decimal(qty).mul(unitCost),
                    runningQty: newQty,
                    runningValue: newValue,
                    runningAvgCost: newAvgCost,
                    userId: userId
                }
            });
            // For FIFO, create inventory batch
            if (costingMethod === client_1.CostingMethod.FIFO) {
                await tx.inventoryBatch.create({
                    data: {
                        itemId,
                        warehouseId,
                        qtyOnHand: new library_1.Decimal(qty),
                        unitCost: new library_1.Decimal(unitCost),
                        receivedAt: new Date()
                    }
                });
            }
        });
    }
    async issueWeightedAverage(itemId, warehouseId, qty, refType, refId, userId) {
        const result = await prisma.$transaction(async (tx) => {
            // Get current running totals
            const lastEntry = await tx.inventoryLedger.findFirst({
                where: { itemId, warehouseId },
                orderBy: { postedAt: 'desc' }
            });
            if (!lastEntry || lastEntry.runningQty.lt(qty)) {
                throw new Error(`Insufficient stock. Available: ${lastEntry?.runningQty || 0}, Required: ${qty}`);
            }
            const currentQty = lastEntry.runningQty;
            const currentValue = lastEntry.runningValue;
            const currentAvgCost = lastEntry.runningAvgCost;
            const issueValue = new library_1.Decimal(qty).mul(currentAvgCost);
            const newQty = currentQty.minus(qty);
            const newValue = currentValue.minus(issueValue);
            const newAvgCost = newQty.gt(0) ? newValue.div(newQty) : new library_1.Decimal(0);
            // Create inventory ledger entry
            const ledgerEntry = await tx.inventoryLedger.create({
                data: {
                    itemId,
                    warehouseId,
                    refType,
                    refId,
                    direction: client_1.LedgerDirection.OUT,
                    qty: new library_1.Decimal(qty),
                    unitCost: currentAvgCost,
                    value: issueValue.neg(),
                    runningQty: newQty,
                    runningValue: newValue,
                    runningAvgCost: newAvgCost,
                    userId: userId
                }
            });
            return {
                unitCost: currentAvgCost.toNumber(),
                value: issueValue.toNumber(),
                ledgerEntries: [ledgerEntry]
            };
        });
        return result;
    }
    async issueFifo(itemId, warehouseId, qty, refType, refId, userId) {
        const result = await prisma.$transaction(async (tx) => {
            // Get available batches ordered by received date (FIFO)
            const batches = await tx.inventoryBatch.findMany({
                where: {
                    itemId,
                    warehouseId,
                    qtyOnHand: { gt: 0 }
                },
                orderBy: { receivedAt: 'asc' }
            });
            const totalAvailable = batches.reduce((sum, batch) => sum.plus(batch.qtyOnHand), new library_1.Decimal(0));
            if (totalAvailable.lt(qty)) {
                throw new Error(`Insufficient stock. Available: ${totalAvailable}, Required: ${qty}`);
            }
            let remainingQty = new library_1.Decimal(qty);
            let totalValue = new library_1.Decimal(0);
            let weightedUnitCost = new library_1.Decimal(0);
            const ledgerEntries = [];
            // Get current running totals
            const lastEntry = await tx.inventoryLedger.findFirst({
                where: { itemId, warehouseId },
                orderBy: { postedAt: 'desc' }
            });
            let runningQty = lastEntry?.runningQty || new library_1.Decimal(0);
            let runningValue = lastEntry?.runningValue || new library_1.Decimal(0);
            // Issue from batches in FIFO order
            for (const batch of batches) {
                if (remainingQty.lte(0))
                    break;
                const qtyToTake = library_1.Decimal.min(remainingQty, batch.qtyOnHand);
                const issueValue = qtyToTake.mul(batch.unitCost);
                totalValue = totalValue.plus(issueValue);
                remainingQty = remainingQty.minus(qtyToTake);
                runningQty = runningQty.minus(qtyToTake);
                runningValue = runningValue.minus(issueValue);
                const runningAvgCost = runningQty.gt(0) ? runningValue.div(runningQty) : new library_1.Decimal(0);
                // Create ledger entry for this batch consumption
                const ledgerEntry = await tx.inventoryLedger.create({
                    data: {
                        itemId,
                        warehouseId,
                        refType,
                        refId,
                        direction: client_1.LedgerDirection.OUT,
                        qty: qtyToTake,
                        unitCost: batch.unitCost,
                        value: issueValue.neg(),
                        runningQty,
                        runningValue,
                        runningAvgCost,
                        batchId: batch.id,
                        userId: userId
                    }
                });
                ledgerEntries.push(ledgerEntry);
                // Update batch quantity
                await tx.inventoryBatch.update({
                    where: { id: batch.id },
                    data: { qtyOnHand: batch.qtyOnHand.minus(qtyToTake) }
                });
            }
            // Calculate weighted average unit cost for the total issue
            weightedUnitCost = new library_1.Decimal(qty).gt(0) ? totalValue.div(qty) : new library_1.Decimal(0);
            return {
                unitCost: weightedUnitCost.toNumber(),
                value: totalValue.toNumber(),
                ledgerEntries
            };
        });
        return result;
    }
    async getInventoryValue(itemId, warehouseId) {
        const costingMethod = await this.getCostingMethod(itemId);
        if (costingMethod === client_1.CostingMethod.WEIGHTED_AVG) {
            const lastEntry = await prisma.inventoryLedger.findFirst({
                where: { itemId, warehouseId },
                orderBy: { postedAt: 'desc' }
            });
            return {
                qty: lastEntry?.runningQty.toNumber() || 0,
                value: lastEntry?.runningValue.toNumber() || 0,
                avgCost: lastEntry?.runningAvgCost.toNumber() || 0
            };
        }
        else {
            // FIFO - sum all batches
            const batches = await prisma.inventoryBatch.findMany({
                where: {
                    itemId,
                    warehouseId,
                    qtyOnHand: { gt: 0 }
                }
            });
            const totalQty = batches.reduce((sum, batch) => sum + batch.qtyOnHand.toNumber(), 0);
            const totalValue = batches.reduce((sum, batch) => sum + (batch.qtyOnHand.toNumber() * batch.unitCost.toNumber()), 0);
            const avgCost = totalQty > 0 ? totalValue / totalQty : 0;
            return { qty: totalQty, value: totalValue, avgCost };
        }
    }
}
exports.CostingService = CostingService;
