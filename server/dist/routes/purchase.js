"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const purchase_1 = require("../controllers/purchase");
const auth_1 = require("../middleware/auth");
const audit_1 = require("../middleware/audit");
const router = (0, express_1.Router)();
const purchaseController = new purchase_1.PurchaseController();
// Apply authentication to all routes
router.use(auth_1.authenticate);
// Purchase Orders
router.get('/orders', (0, auth_1.authorize)('purchase.order.read'), purchaseController.getPurchases);
router.post('/orders', (0, auth_1.authorize)('purchase.order.create'), (0, audit_1.auditLogger)('CREATE', 'PURCHASE_ORDER'), purchaseController.createPurchase);
router.put('/orders/:id', (0, auth_1.authorize)('purchase.order.create'), (0, audit_1.auditLogger)('UPDATE', 'PURCHASE_ORDER'), purchaseController.updatePurchase);
router.delete('/orders/:id', (0, auth_1.authorize)('purchase.order.create'), (0, audit_1.auditLogger)('DELETE', 'PURCHASE_ORDER'), purchaseController.deletePurchase);
router.get('/orders/:id/print', (0, auth_1.authorize)('purchase.order.read'), purchaseController.printPurchaseOrder);
// Purchase Receipts and Invoices
router.post('/orders/:id/receive', (0, auth_1.authorize)('purchase.order.create'), (0, audit_1.auditLogger)('RECEIVE', 'PURCHASE_ORDER'), purchaseController.receivePurchase);
router.post('/orders/:id/invoice', (0, auth_1.authorize)('purchase.order.create'), (0, audit_1.auditLogger)('INVOICE', 'PURCHASE_ORDER'), purchaseController.invoicePurchase);
// Vendors
router.get('/vendors', (0, auth_1.authorize)('purchase.vendor.read'), purchaseController.getVendors);
router.post('/vendors', (0, auth_1.authorize)('purchase.vendor.create'), (0, audit_1.auditLogger)('CREATE', 'VENDOR'), purchaseController.createVendor);
exports.default = router;
