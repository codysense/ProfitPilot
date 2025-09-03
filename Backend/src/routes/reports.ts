import { Router } from 'express';
import { ReportsController } from '../controllers/reports';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
const reportsController = new ReportsController();

// Apply authentication to all routes
router.use(authenticate);

// Financial Reports
router.get('/balance-sheet', authorize('inventory.item.read'), reportsController.getBalanceSheet);
router.get('/profit-loss', authorize('inventory.item.read'), reportsController.getProfitAndLoss);
router.get('/trial-balance', authorize('inventory.item.read'), reportsController.getTrialBalance);
router.get('/general-ledger', authorize('inventory.item.read'), reportsController.getGeneralLedger);
router.get('/cash-flow', authorize('inventory.item.read'), reportsController.getCashFlow);
router.get('/vendor-balances', authorize('inventory.item.read'), reportsController.getVendorBalances);
router.get('/customer-balances', authorize('inventory.item.read'), reportsController.getCustomerBalances);
router.get('/customer-ledger', authorize('inventory.item.read'), reportsController.getCustomerLedger);
router.get('/vendor-ledger', authorize('inventory.item.read'), reportsController.getVendorLedger);

// Operational Reports
router.get('/inventory-aging', authorize('inventory.item.read'), reportsController.getInventoryAging);
router.get('/stock-card', authorize('inventory.item.read'), reportsController.getStockCard);
router.get('/production-variance', authorize('production.order.read'), reportsController.getProductionVariance);
router.get('/sales-by-item', authorize('sales.order.read'), reportsController.getSalesByItem);
router.get('/sales-by-customer', authorize('sales.order.read'), reportsController.getSalesByCustomer);
router.get('/purchases-by-vendor', authorize('purchase.order.read'), reportsController.getPurchasesByVendor);
router.get('/ar-ap-aging', authorize('inventory.item.read'), reportsController.getArApAging);
router.get('/production-summary', authorize('production.order.read'), reportsController.getProductionSummary);
router.get('/production-report', authorize('production.order.read'), reportsController.getProductionReport);
router.get('/material-usage', authorize('inventory.item.read'), reportsController.getMaterialUsage);


export default router;