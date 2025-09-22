import { Router } from 'express';
import { ReportsController } from '../controllers/reports';
import { authenticate, authorize, requireRole } from '../middleware/auth';

const router = Router();
const reportsController = new ReportsController();

// Apply authentication to all routes
router.use(authenticate);

// Financial Reports
router.get('/balance-sheet',requireRole(['General Manager']), reportsController.getBalanceSheet);
router.get('/profit-loss',requireRole(['General Manager']), reportsController.getProfitAndLoss);
router.get('/trial-balance',requireRole(['General Manager']), reportsController.getTrialBalance);
router.get('/general-ledger',requireRole(['General Manager']), reportsController.getGeneralLedger);
router.get('/cash-flow',requireRole(['General Manager']), reportsController.getCashFlow);
router.get('/vendor-balances', requireRole(['Production Manager']), reportsController.getVendorBalances);
router.get('/customer-balances', requireRole(['Accountant']), reportsController.getCustomerBalances);
router.get('/customer-ledger', requireRole(['Accountant']), reportsController.getCustomerLedger);
router.get('/vendor-ledger', requireRole(['Production Manager']), reportsController.getVendorLedger);
router.get('/vendor-ledger', requireRole(['Production Manager']), reportsController.getVendorLedger);
router.get('/cashAccount-balances', requireRole(['Accountant']), reportsController.getCashAccountBalances);

// Operational Reports Accountant
router.get('/inventory-aging', requireRole(['Inventory Manager', 'Assistant Inventory Manager']), reportsController.getInventoryAging);
router.get('/stock-card', requireRole(['Inventory Manager', 'Assistant Inventory Manager']), reportsController.getStockCard);
router.get('/production-variance', requireRole(['Inventory Manager', 'Assistant Inventory Manager','Production Manager']), reportsController.getProductionVariance);
router.get('/sales-by-item', requireRole(['Inventory Manager', 'Accountant']), reportsController.getSalesByItem);
router.get('/pos-sales', requireRole(['Accountant', 'POS User']), reportsController.getPOSSalesReport);
router.get('/sales-by-customer', requireRole(['Accountant', 'POS User']), reportsController.getSalesByCustomer);
router.get('/purchases-by-vendor', requireRole([ 'Production Manger']), reportsController.getPurchasesByVendor);
router.get('/ar-ap-aging', requireRole(['Accountant', 'Production Manger']), reportsController.getArApAging);
router.get('/production-summary', requireRole([ 'Production Manger']), reportsController.getProductionSummary);
router.get('/production-report', requireRole([ 'Production Manger']), reportsController.getProductionReport);
router.get('/material-usage', requireRole(['Inventory Manager','Assistant Inventory Manager', 'Production Manger']), reportsController.getMaterialUsage);


export default router;