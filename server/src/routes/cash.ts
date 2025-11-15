import { Router } from 'express';
import { CashController } from '../controllers/cash';
import { authenticate, authorize, requireRole } from '../middleware/auth';
import { auditLogger } from '../middleware/audit';

const router = Router();
const cashController = new CashController();

// Apply authentication to all routes
router.use(authenticate);

// Cash Accounts
// router.get('/accounts', authorize('inventory.item.read'), cashController.getCashAccounts);
router.get('/accounts', requireRole(['Accountant','POS User']), cashController.getCashAccounts);
// router.post('/accounts', authorize('inventory.item.create'), auditLogger('CREATE', 'CASH_ACCOUNT'), cashController.createCashAccount);
router.post('/accounts', requireRole(['Accountant']), auditLogger('CREATE', 'CASH_ACCOUNT'), cashController.createCashAccount);
router.put('/accounts/:id', requireRole(['Accountant']), auditLogger('UPDATE', 'CASH_ACCOUNT'), cashController.updateCashAccount);
// router.put('/accounts/:id', authorize('inventory.item.create'), auditLogger('UPDATE', 'CASH_ACCOUNT'), cashController.updateCashAccount);
// router.delete('/accounts/:id', authorize('inventory.item.create'), auditLogger('DELETE', 'CASH_ACCOUNT'), cashController.deleteCashAccount);
router.delete('/accounts/:id', requireRole(['Accountant']), auditLogger('DELETE', 'CASH_ACCOUNT'), cashController.deleteCashAccount);

// Cash Transactions
// router.get('/transactions', authorize('inventory.item.read'), cashController.getCashTransactions);
router.get('/transactions', requireRole(['Accountant', 'POS User']), cashController.getCashTransactions);
// router.post('/transactions', authorize('inventory.item.create'), auditLogger('CREATE', 'CASH_TRANSACTION'), cashController.createCashTransaction);
router.post('/transactions', requireRole(['Accountant', 'POS User']), auditLogger('CREATE', 'CASH_TRANSACTION'), cashController.createCashTransaction);
router.post('/transactions/:id/approve', requireRole(['Accountant', 'POS User']), auditLogger('APPROVE', 'CASH_TRANSACTION'), cashController.approveCashTransaction)
router.post('/transactions/:id/authorize', requireRole(['Accountant', 'POS User']), auditLogger('AUTHORIZE', 'CASH_TRANSACTION'), cashController.authorizeCashTransaction)
router.post('/transactions/:id/pay', requireRole(['Accountant', 'POS User']), auditLogger('PAY', 'CASH_TRANSACTION'), cashController.payCashTransaction)
router.put('/transactions/:id/update', requireRole(['Accountant', 'POS User']), auditLogger('UPDATE', 'CASH_TRANSACTION'), cashController.updateCashTransaction)
router.delete('/transactions/:id/', requireRole(['Accountant', 'POS User']), auditLogger('DELETE', 'CASH_TRANSACTION'), cashController.deleteCashTransaction)

// router.post('/transactions', authorize('inventory.item.create'), auditLogger('CREATE', 'CASH_TRANSACTION'), cashController.createCashTransaction);

// Customer Payments
// router.post('/customer-payments', authorize('sales.order.create'), auditLogger('CREATE', 'CUSTOMER_PAYMENT'), cashController.createCustomerPayment);
router.get('/customer-payments', requireRole(['Accountant']),  cashController.getCustomerPayments);
router.get('/customer-payment/:id', requireRole(['Accountant']),  cashController.getCustomerPayment);

router.post('/customer-payments', requireRole(['Accountant']), auditLogger('CREATE', 'CUSTOMER_PAYMENT'), cashController.createCustomerPayment);
router.post('/customer-payments/:id/approve', requireRole(['Accountant']), auditLogger('APPROVE', 'CASH_TRANSACTION'), cashController.approveCustomerPayment)
router.post('/customer-payments/:id/authorize', requireRole(['Accountant']), auditLogger('AUTHORIZE', 'CASH_TRANSACTION'), cashController.authorizeCustomerPayment)
router.post('/customer-payments/:id/pay', requireRole(['Accountant']), auditLogger('PAY', 'CASH_TRANSACTION'), cashController.payCustomerPayment)
router.put('/customer-payments/:id/update', requireRole(['Accountant']), auditLogger('UPDATE', 'CASH_TRANSACTION'), cashController.updateCustomerPayment)
router.delete('/customer-payments/:id/', requireRole(['Accountant']), auditLogger('DELETE', 'CASH_TRANSACTION'), cashController.deleteCustomerPayment)
router.post('/customer-refunds', requireRole(['Accountant']), auditLogger('CREATE', 'CUSTOMER_REFUND'), cashController.createCustomerRefund);
router.get('/customer-refunds', requireRole(['Accountant']), cashController.getCustomerRefunds);
// Sales Receipts (alias for customer payments)
// router.get('/sales-receipts', authorize('inventory.item.read'), cashController.getSalesReceipts);
router.get('/sales-receipts', requireRole(['Accountant']), cashController.getSalesReceipts);
router.post('/sales-receipts', requireRole(['Accountant']), auditLogger('CREATE', 'SALES_RECEIPT'), cashController.createSalesReceipt);
// router.post('/sales-receipts', authorize('sales.order.create'), auditLogger('CREATE', 'SALES_RECEIPT'), cashController.createSalesReceipt);

// Vendor Payments
router.post('/vendor-payments', requireRole(['Accountant']), auditLogger('CREATE', 'VENDOR_PAYMENT'), cashController.createVendorPayment);
router.post('/vendor-refunds', requireRole(['Accountant']), auditLogger('CREATE', 'VENDOR_REFUND'), cashController.createVendorRefund);
router.get('/vendor-refunds', requireRole(['Accountant']),  cashController.getVendorRefunds);


// router.post('/vendor-payments', authorize('purchase.order.create'), auditLogger('CREATE', 'VENDOR_PAYMENT'), cashController.createVendorPayment);

// Purchase Payments (alias for vendor payments)
router.get('/purchase-payments', requireRole(['Accountant']), cashController.getPurchasePayments);
// router.get('/purchase-payments', authorize('inventory.item.read'), cashController.getPurchasePayments);
router.post('/purchase-payments', requireRole(['Accountant']), auditLogger('CREATE', 'PURCHASE_PAYMENT'), cashController.createPurchasePayment);
// router.post('/purchase-payments', authorize('purchase.order.create'), auditLogger('CREATE', 'PURCHASE_PAYMENT'), cashController.createPurchasePayment);

// Cashbook
// router.get('/cashbook', authorize('inventory.item.read'), cashController.getCashbook);
router.get('/cashbook', requireRole(['Accountant']), cashController.getCashbook);
// router.get('/cashbook/export', requireRole(['Accountant']), cashController.exportCashbook);
// router.get('/cashbook/export', authorize('inventory.item.read'), cashController.exportCashbook);

// Bank Reconciliation
//router.get('/reconciliation', authorize('inventory.item.read'), cashController.getBankReconciliation);
// router.post('/reconciliation', authorize('inventory.item.create'), auditLogger('RECONCILE', 'BANK_RECONCILIATION'), cashController.reconcileTransactions);

// Bank Statement Import
//router.post('/import-statement', authorize('inventory.item.create'), auditLogger('IMPORT', 'BANK_STATEMENT'), cashController.importBankStatement);

export default router;