import { Router } from 'express';
import { CashController } from '../controllers/cash';
import { authenticate, authorize } from '../middleware/auth';
import { auditLogger } from '../middleware/audit';

const router = Router();
const cashController = new CashController();

// Apply authentication to all routes
router.use(authenticate);

// Cash Accounts
router.get('/accounts', authorize('inventory.item.read'), cashController.getCashAccounts);
router.post('/accounts', authorize('inventory.item.create'), auditLogger('CREATE', 'CASH_ACCOUNT'), cashController.createCashAccount);
router.put('/accounts/:id', authorize('inventory.item.create'), auditLogger('UPDATE', 'CASH_ACCOUNT'), cashController.updateCashAccount);
router.delete('/accounts/:id', authorize('inventory.item.create'), auditLogger('DELETE', 'CASH_ACCOUNT'), cashController.deleteCashAccount);

// Cash Transactions
router.get('/transactions', authorize('inventory.item.read'), cashController.getCashTransactions);
router.post('/transactions', authorize('inventory.item.create'), auditLogger('CREATE', 'CASH_TRANSACTION'), cashController.createCashTransaction);

// Customer Payments
router.post('/customer-payments', authorize('sales.order.create'), auditLogger('CREATE', 'CUSTOMER_PAYMENT'), cashController.createCustomerPayment);

// Sales Receipts (alias for customer payments)
router.get('/sales-receipts', authorize('inventory.item.read'), cashController.getSalesReceipts);
router.post('/sales-receipts', authorize('sales.order.create'), auditLogger('CREATE', 'SALES_RECEIPT'), cashController.createSalesReceipt);

// Vendor Payments
router.post('/vendor-payments', authorize('purchase.order.create'), auditLogger('CREATE', 'VENDOR_PAYMENT'), cashController.createVendorPayment);

// Purchase Payments (alias for vendor payments)
router.get('/purchase-payments', authorize('inventory.item.read'), cashController.getPurchasePayments);
router.post('/purchase-payments', authorize('purchase.order.create'), auditLogger('CREATE', 'PURCHASE_PAYMENT'), cashController.createPurchasePayment);

// Cashbook
router.get('/cashbook', authorize('inventory.item.read'), cashController.getCashbook);
router.get('/cashbook/export', authorize('inventory.item.read'), cashController.exportCashbook);

// Bank Reconciliation
//router.get('/reconciliation', authorize('inventory.item.read'), cashController.getBankReconciliation);
// router.post('/reconciliation', authorize('inventory.item.create'), auditLogger('RECONCILE', 'BANK_RECONCILIATION'), cashController.reconcileTransactions);

// Bank Statement Import
//router.post('/import-statement', authorize('inventory.item.create'), auditLogger('IMPORT', 'BANK_STATEMENT'), cashController.importBankStatement);

export default router;