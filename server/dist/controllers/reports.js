"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportsController = void 0;
const client_1 = require("@prisma/client");
const reports_1 = require("../types/reports");
const reports_2 = require("../services/reports");
const prisma = new client_1.PrismaClient();
const reportsService = new reports_2.ReportsService();
class ReportsController {
    // Financial Reports
    async getBalanceSheet(req, res) {
        try {
            const { asOfDate } = reports_1.balanceSheetSchema.parse(req.query);
            const report = await reportsService.getBalanceSheet(new Date(asOfDate));
            res.json(report);
        }
        catch (error) {
            console.error('Balance sheet error:', error);
            res.status(400).json({ error: 'Failed to generate balance sheet' });
        }
    }
    async getProfitAndLoss(req, res) {
        try {
            const { dateFrom, dateTo } = reports_1.profitLossSchema.parse(req.query);
            const report = await reportsService.getProfitAndLoss(new Date(dateFrom), new Date(dateTo));
            res.json(report);
        }
        catch (error) {
            console.error('Profit and loss error:', error);
            res.status(400).json({ error: 'Failed to generate profit and loss statement' });
        }
    }
    async getTrialBalance(req, res) {
        try {
            const { asOfDate = new Date().toISOString() } = req.query;
            const report = await reportsService.getTrialBalance(new Date(asOfDate));
            res.json(report);
        }
        catch (error) {
            console.error('Trial balance error:', error);
            res.status(400).json({ error: 'Failed to generate trial balance' });
        }
    }
    async getGeneralLedger(req, res) {
        try {
            const { dateFrom, dateTo, accountId } = req.query;
            if (!dateFrom || !dateTo) {
                return res.status(400).json({ error: 'Date range is required' });
            }
            const report = await reportsService.getGeneralLedger(new Date(dateFrom), new Date(dateTo), accountId);
            res.json(report);
        }
        catch (error) {
            console.error('General ledger error:', error);
            res.status(400).json({ error: 'Failed to generate general ledger' });
        }
    }
    async getCashFlow(req, res) {
        try {
            const { dateFrom, dateTo } = req.query;
            if (!dateFrom || !dateTo) {
                return res.status(400).json({ error: 'Date range is required' });
            }
            const report = await reportsService.getCashFlow(new Date(dateFrom), new Date(dateTo));
            res.json(report);
        }
        catch (error) {
            console.error('Cash flow error:', error);
            res.status(400).json({ error: 'Failed to generate cash flow statement' });
        }
    }
    async getVendorBalances(req, res) {
        try {
            const { asOfDate } = req.query;
            if (!asOfDate) {
                return res.status(400).json({ error: 'Date range is required' });
            }
            const report = await reportsService.getVendorBalances(new Date(asOfDate));
            res.json(report);
        }
        catch (error) {
            console.error('Vendor Balances  error:', error);
            res.status(400).json({ error: 'Failed to generate Vendor Balances Report' });
        }
    }
    async getCustomerLedger(req, res) {
        try {
            const { dateFrom, dateTo, customerId } = req.query;
            if (!dateFrom || !dateTo || !customerId) {
                return res.status(400).json({ error: 'Date range is required' });
            }
            const report = await reportsService.getCustomerLedger(new Date(dateFrom), new Date(dateTo), customerId);
            res.json(report);
        }
        catch (error) {
            console.error('Customer Ledger  error:', error);
            res.status(400).json({ error: 'Failed to generate Customer Ledger Report' });
        }
    }
    async getVendorLedger(req, res) {
        try {
            const { dateFrom, dateTo, vendorId } = req.query;
            if (!dateFrom || !dateTo || !vendorId) {
                return res.status(400).json({ error: 'Date range is required' });
            }
            const report = await reportsService.getVendorLedger(new Date(dateFrom), new Date(dateTo), vendorId);
            res.json(report);
        }
        catch (error) {
            console.error('Vendor Ledger  error:', error);
            res.status(400).json({ error: 'Failed to generate Vendor Ledger Report' });
        }
    }
    async getCustomerBalances(req, res) {
        try {
            const { asOfDate } = req.query;
            if (!asOfDate) {
                return res.status(400).json({ error: 'Date  is required' });
            }
            const report = await reportsService.getCustomerBalances(new Date(asOfDate));
            res.json(report);
        }
        catch (error) {
            console.error('Customer Balances error:', error);
            res.status(400).json({ error: 'Failed to generate Customer Balances Report' });
        }
    }
    // Operational Reports
    async getInventoryAging(req, res) {
        try {
            const { asOfDate, warehouseId } = reports_1.inventoryAgingSchema.parse(req.query);
            const report = await reportsService.getInventoryAging(new Date(asOfDate), warehouseId);
            res.json(report);
        }
        catch (error) {
            console.error('Inventory aging error:', error);
            res.status(400).json({ error: 'Failed to generate inventory aging report' });
        }
    }
    async getStockCard(req, res) {
        try {
            const { itemId, warehouseId, dateFrom, dateTo } = req.query;
            if (!itemId) {
                return res.status(400).json({ error: 'Item ID is required' });
            }
            const report = await reportsService.getStockCard(itemId, warehouseId, dateFrom ? new Date(dateFrom) : undefined, dateTo ? new Date(dateTo) : undefined);
            res.json(report);
        }
        catch (error) {
            console.error('Stock card error:', error);
            res.status(400).json({ error: 'Failed to generate stock card' });
        }
    }
    async getProductionVariance(req, res) {
        try {
            const { dateFrom, dateTo } = req.query;
            if (!dateFrom || !dateTo) {
                return res.status(400).json({ error: 'Date range is required' });
            }
            const report = await reportsService.getProductionVariance(new Date(dateFrom), new Date(dateTo));
            res.json(report);
        }
        catch (error) {
            console.error('Production variance error:', error);
            res.status(400).json({ error: 'Failed to generate production variance report' });
        }
    }
    async getSalesByItem(req, res) {
        try {
            const { dateFrom, dateTo } = req.query;
            if (!dateFrom || !dateTo) {
                return res.status(400).json({ error: 'Date range is required' });
            }
            const report = await reportsService.getSalesByItem(new Date(dateFrom), new Date(dateTo));
            res.json(report);
        }
        catch (error) {
            console.error('Sales by item error:', error);
            res.status(400).json({ error: 'Failed to generate sales by item report' });
        }
    }
    async getSalesByCustomer(req, res) {
        try {
            const { dateFrom, dateTo } = req.query;
            if (!dateFrom || !dateTo) {
                return res.status(400).json({ error: 'Date range is required' });
            }
            const report = await reportsService.getSalesByCustomer(new Date(dateFrom), new Date(dateTo));
            res.json(report);
        }
        catch (error) {
            console.error('Sales by customer error:', error);
            res.status(400).json({ error: 'Failed to generate sales by customer report' });
        }
    }
    async getPurchasesByVendor(req, res) {
        try {
            const { dateFrom, dateTo } = req.query;
            if (!dateFrom || !dateTo) {
                return res.status(400).json({ error: 'Date range is required' });
            }
            const report = await reportsService.getPurchasesByVendor(new Date(dateFrom), new Date(dateTo));
            res.json(report);
        }
        catch (error) {
            console.error('Purchases by vendor error:', error);
            res.status(400).json({ error: 'Failed to generate purchases by vendor report' });
        }
    }
    async getArApAging(req, res) {
        try {
            const { asOfDate, type } = reports_1.arApAgingSchema.parse(req.query);
            const report = await reportsService.getArApAging(new Date(asOfDate), type);
            res.json(report);
        }
        catch (error) {
            console.error('AR/AP aging error:', error);
            res.status(400).json({ error: 'Failed to generate AR/AP aging report' });
        }
    }
    async getProductionSummary(req, res) {
        try {
            const { dateFrom, dateTo } = req.query;
            if (!dateFrom || !dateTo) {
                return res.status(400).json({ error: 'Date range is required' });
            }
            const report = await reportsService.getProductionSummary(new Date(dateFrom), new Date(dateTo));
            res.json(report);
        }
        catch (error) {
            console.error('Production summary error:', error);
            res.status(400).json({ error: 'Failed to generate production summary report' });
        }
    }
    async getProductionReport(req, res) {
        try {
            const { dateFrom, dateTo } = req.query;
            if (!dateFrom || !dateTo) {
                return res.status(400).json({ error: 'Date range is required' });
            }
            const report = await reportsService.getProductionReport(new Date(dateFrom), new Date(dateTo));
            res.json(report);
        }
        catch (error) {
            console.error('Production report error:', error);
            res.status(400).json({ error: 'Failed to generate production  report' });
        }
    }
    async getMaterialUsage(req, res) {
        try {
            const { dateFrom, dateTo } = req.query;
            if (!dateFrom || !dateTo) {
                return res.status(400).json({ error: 'Date range is required' });
            }
            const report = await reportsService.getMaterialUsage(new Date(dateFrom), new Date(dateTo));
            res.json(report);
        }
        catch (error) {
            console.error('Material Material Usage error:', error);
            res.status(400).json({ error: 'Failed to generate Material Material Usage report' });
        }
    }
}
exports.ReportsController = ReportsController;
