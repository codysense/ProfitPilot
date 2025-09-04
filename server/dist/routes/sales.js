"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const sales_1 = require("../controllers/sales");
const auth_1 = require("../middleware/auth");
const audit_1 = require("../middleware/audit");
const router = (0, express_1.Router)();
const salesController = new sales_1.SalesController();
// Apply authentication to all routes
router.use(auth_1.authenticate);
// Sales Orders
router.get('/orders', (0, auth_1.authorize)('sales.order.read'), salesController.getSales);
router.post('/orders', (0, auth_1.authorize)('sales.order.create'), (0, audit_1.auditLogger)('CREATE', 'SALES_ORDER'), salesController.createSale);
router.put('/orders/:id', (0, auth_1.authorize)('sales.order.create'), (0, audit_1.auditLogger)('UPDATE', 'SALES_ORDER'), salesController.updateSale);
router.delete('/orders/:id', (0, auth_1.authorize)('sales.order.create'), (0, audit_1.auditLogger)('DELETE', 'SALES_ORDER'), salesController.deleteSale);
router.get('/orders/:id/print', (0, auth_1.authorize)('sales.order.read'), salesController.printSaleInvoice);
// Sales Delivery and Invoicing
router.post('/orders/:id/deliver', (0, auth_1.authorize)('sales.order.create'), (0, audit_1.auditLogger)('DELIVER', 'SALES_ORDER'), salesController.deliverSale);
router.post('/orders/:id/invoice', (0, auth_1.authorize)('sales.order.create'), (0, audit_1.auditLogger)('INVOICE', 'SALES_ORDER'), salesController.invoiceSale);
// Customers
router.get('/customers', (0, auth_1.authorize)('sales.customer.read'), salesController.getCustomers);
router.post('/customers', (0, auth_1.authorize)('sales.customer.create'), (0, audit_1.auditLogger)('CREATE', 'CUSTOMER'), salesController.createCustomer);
exports.default = router;
