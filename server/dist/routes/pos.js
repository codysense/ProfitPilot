"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const pos_1 = require("../controllers/pos");
const auth_1 = require("../middleware/auth");
const audit_1 = require("../middleware/audit");
const router = (0, express_1.Router)();
const posController = new pos_1.PosController();
// Apply authentication to all routes
router.use(auth_1.authenticate);
// POS Sessions
router.post('/sessions', (0, auth_1.authorize)('pos.session.manage'), (0, audit_1.auditLogger)('CREATE', 'POS_SESSION'), posController.createSession);
router.patch('/sessions/:id/close', (0, auth_1.authorize)('pos.session.manage'), (0, audit_1.auditLogger)('CLOSE', 'POS_SESSION'), posController.closeSession);
router.get('/sessions/current', (0, auth_1.authorize)('pos.sale.read'), posController.getCurrentSession);
// POS Sales
router.post('/sales', (0, auth_1.authorize)('pos.sale.create'), (0, audit_1.auditLogger)('CREATE', 'POS_SALE'), posController.createSale);
router.get('/sales', (0, auth_1.authorize)('pos.sale.read'), posController.getSales);
router.get('/sales/:id/print', (0, auth_1.authorize)('pos.sale.read'), posController.printReceipt);
// POS Returns
router.post('/returns', (0, auth_1.authorize)('pos.return.create'), (0, audit_1.auditLogger)('CREATE', 'POS_RETURN'), posController.createReturn);
// Customers with balances
router.get('/customers-with-balances', (0, auth_1.authorize)('sales.customer.read'), posController.getCustomersWithBalances);
exports.default = router;
