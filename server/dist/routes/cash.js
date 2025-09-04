"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const cash_1 = require("../controllers/cash");
const auth_1 = require("../middleware/auth");
const audit_1 = require("../middleware/audit");
const router = (0, express_1.Router)();
const cashController = new cash_1.CashController();
// Apply authentication to all routes
router.use(auth_1.authenticate);
// Cash Accounts
router.get('/accounts', (0, auth_1.authorize)('inventory.item.read'), cashController.getCashAccounts);
router.post('/accounts', (0, auth_1.authorize)('inventory.item.create'), (0, audit_1.auditLogger)('CREATE', 'CASH_ACCOUNT'), cashController.createCashAccount);
router.put('/accounts/:id', (0, auth_1.authorize)('inventory.item.create'), (0, audit_1.auditLogger)('UPDATE', 'CASH_ACCOUNT'), cashController.updateCashAccount);
router.delete('/accounts/:id', (0, auth_1.authorize)('inventory.item.create'), (0, audit_1.auditLogger)('DELETE', 'CASH_ACCOUNT'), cashController.deleteCashAccount);
// Cash Transactions
router.get('/transactions', (0, auth_1.authorize)('inventory.item.read'), cashController.getCashTransactions);
router.post('/transactions', (0, auth_1.authorize)('inventory.item.create'), (0, audit_1.auditLogger)('CREATE', 'CASH_TRANSACTION'), cashController.createCashTransaction);
// Customer Payments
router.post('/customer-payments', (0, auth_1.authorize)('sales.order.create'), (0, audit_1.auditLogger)('CREATE', 'CUSTOMER_PAYMENT'), cashController.createCustomerPayment);
// Sales Receipts (alias for customer payments)
router.get('/sales-receipts', (0, auth_1.authorize)('inventory.item.read'), cashController.getSalesReceipts);
router.post('/sales-receipts', (0, auth_1.authorize)('sales.order.create'), (0, audit_1.auditLogger)('CREATE', 'SALES_RECEIPT'), cashController.createSalesReceipt);
// Vendor Payments
router.post('/vendor-payments', (0, auth_1.authorize)('purchase.order.create'), (0, audit_1.auditLogger)('CREATE', 'VENDOR_PAYMENT'), cashController.createVendorPayment);
// Purchase Payments (alias for vendor payments)
router.get('/purchase-payments', (0, auth_1.authorize)('inventory.item.read'), cashController.getPurchasePayments);
router.post('/purchase-payments', (0, auth_1.authorize)('purchase.order.create'), (0, audit_1.auditLogger)('CREATE', 'PURCHASE_PAYMENT'), cashController.createPurchasePayment);
// Cashbook
router.get('/cashbook', (0, auth_1.authorize)('inventory.item.read'), cashController.getCashbook);
router.get('/cashbook/export', (0, auth_1.authorize)('inventory.item.read'), cashController.exportCashbook);
// Bank Reconciliation
//router.get('/reconciliation', authorize('inventory.item.read'), cashController.getBankReconciliation);
// router.post('/reconciliation', authorize('inventory.item.create'), auditLogger('RECONCILE', 'BANK_RECONCILIATION'), cashController.reconcileTransactions);
// Bank Statement Import
//router.post('/import-statement', authorize('inventory.item.create'), auditLogger('IMPORT', 'BANK_STATEMENT'), cashController.importBankStatement);
exports.default = router;
