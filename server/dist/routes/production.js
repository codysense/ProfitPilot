"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const production_1 = require("../controllers/production");
const auth_1 = require("../middleware/auth");
const audit_1 = require("../middleware/audit");
const router = (0, express_1.Router)();
const productionController = new production_1.ProductionController();
// Apply authentication to all routes
router.use(auth_1.authenticate);
// Production Orders
router.get('/orders', (0, auth_1.authorize)('production.order.read'), productionController.getProductionOrders);
router.post('/orders', (0, auth_1.authorize)('production.order.create'), (0, audit_1.auditLogger)('CREATE', 'PRODUCTION_ORDER'), productionController.createProductionOrder);
router.put('/orders/:id', (0, auth_1.authorize)('production.order.create'), (0, audit_1.auditLogger)('UPDATE', 'PRODUCTION_ORDER'), productionController.updateProductionOrder);
router.delete('/orders/:id', (0, auth_1.authorize)('production.order.create'), (0, audit_1.auditLogger)('DELETE', 'PRODUCTION_ORDER'), productionController.deleteProductionOrder);
router.get('/orders/:id/print', (0, auth_1.authorize)('production.order.read'), productionController.printProductionOrder);
router.post('/orders/:id/release', (0, auth_1.authorize)('production.order.release'), (0, audit_1.auditLogger)('RELEASE', 'PRODUCTION_ORDER'), productionController.releaseProductionOrder);
// Material Operations
router.post('/orders/:id/issue-materials', (0, auth_1.authorize)('production.order.create'), (0, audit_1.auditLogger)('ISSUE_MATERIALS', 'PRODUCTION_ORDER'), productionController.issueMaterials);
// Labor and Overhead
router.post('/orders/:id/add-labor', (0, auth_1.authorize)('production.order.create'), (0, audit_1.auditLogger)('ADD_LABOR', 'PRODUCTION_ORDER'), productionController.addLabor);
router.post('/orders/:id/add-overhead', (0, auth_1.authorize)('production.order.create'), (0, audit_1.auditLogger)('ADD_OVERHEAD', 'PRODUCTION_ORDER'), productionController.addOverhead);
// Finished Goods Receipt
router.post('/orders/:id/receive-fg', (0, auth_1.authorize)('production.order.create'), (0, audit_1.auditLogger)('RECEIVE_FG', 'PRODUCTION_ORDER'), productionController.receiveFinishedGoods);
// Reports
router.get('/wip-summary', (0, auth_1.authorize)('production.order.read'), productionController.getWipSummary);
exports.default = router;
