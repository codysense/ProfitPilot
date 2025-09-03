"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const reports_1 = require("../controllers/reports");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const reportsController = new reports_1.ReportsController();
// Apply authentication to all routes
router.use(auth_1.authenticate);
// Financial Reports
router.get('/balance-sheet', (0, auth_1.authorize)('inventory.item.read'), reportsController.getBalanceSheet);
router.get('/profit-loss', (0, auth_1.authorize)('inventory.item.read'), reportsController.getProfitAndLoss);
router.get('/trial-balance', (0, auth_1.authorize)('inventory.item.read'), reportsController.getTrialBalance);
router.get('/general-ledger', (0, auth_1.authorize)('inventory.item.read'), reportsController.getGeneralLedger);
router.get('/cash-flow', (0, auth_1.authorize)('inventory.item.read'), reportsController.getCashFlow);
router.get('/vendor-balances', (0, auth_1.authorize)('inventory.item.read'), reportsController.getVendorBalances);
router.get('/customer-balances', (0, auth_1.authorize)('inventory.item.read'), reportsController.getCustomerBalances);
router.get('/customer-ledger', (0, auth_1.authorize)('inventory.item.read'), reportsController.getCustomerLedger);
router.get('/vendor-ledger', (0, auth_1.authorize)('inventory.item.read'), reportsController.getVendorLedger);
// Operational Reports
router.get('/inventory-aging', (0, auth_1.authorize)('inventory.item.read'), reportsController.getInventoryAging);
router.get('/stock-card', (0, auth_1.authorize)('inventory.item.read'), reportsController.getStockCard);
router.get('/production-variance', (0, auth_1.authorize)('production.order.read'), reportsController.getProductionVariance);
router.get('/sales-by-item', (0, auth_1.authorize)('sales.order.read'), reportsController.getSalesByItem);
router.get('/sales-by-customer', (0, auth_1.authorize)('sales.order.read'), reportsController.getSalesByCustomer);
router.get('/purchases-by-vendor', (0, auth_1.authorize)('purchase.order.read'), reportsController.getPurchasesByVendor);
router.get('/ar-ap-aging', (0, auth_1.authorize)('inventory.item.read'), reportsController.getArApAging);
router.get('/production-summary', (0, auth_1.authorize)('production.order.read'), reportsController.getProductionSummary);
router.get('/production-report', (0, auth_1.authorize)('production.order.read'), reportsController.getProductionReport);
router.get('/material-usage', (0, auth_1.authorize)('inventory.item.read'), reportsController.getMaterialUsage);
exports.default = router;
