"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const assets_1 = require("../controllers/assets");
const auth_1 = require("../middleware/auth");
const audit_1 = require("../middleware/audit");
const router = (0, express_1.Router)();
const assetsController = new assets_1.AssetsController();
// Apply authentication to all routes
router.use(auth_1.authenticate);
// Asset Categories (CFO and GM only)
router.get('/categories', (0, auth_1.requireRole)('CFO'), assetsController.getAssetCategories);
router.post('/categories', (0, auth_1.requireRole)('CFO'), (0, audit_1.auditLogger)('CREATE', 'ASSET_CATEGORY'), assetsController.createAssetCategory);
// Assets
router.get('/', (0, auth_1.authorize)('inventory.item.read'), assetsController.getAssets);
router.post('/', (0, auth_1.authorize)('inventory.item.create'), (0, audit_1.auditLogger)('CREATE', 'ASSET'), assetsController.createAsset);
router.put('/:id', (0, auth_1.authorize)('inventory.item.create'), (0, audit_1.auditLogger)('UPDATE', 'ASSET'), assetsController.updateAsset);
router.delete('/:id', (0, auth_1.requireRole)('CFO'), (0, audit_1.auditLogger)('DELETE', 'ASSET'), assetsController.deleteAsset);
// Capitalization
router.get('/purchase-orders', (0, auth_1.authorize)('purchase.order.read'), assetsController.getPurchaseOrdersForCapitalization);
router.post('/capitalize', (0, auth_1.authorize)('inventory.item.create'), (0, audit_1.auditLogger)('CAPITALIZE', 'ASSET'), assetsController.capitalizeFromPurchase);
// Depreciation
router.post('/depreciation/run', (0, auth_1.requireRole)('CFO'), (0, audit_1.auditLogger)('RUN_DEPRECIATION', 'ASSET'), assetsController.runDepreciation);
router.get('/:id/depreciation', (0, auth_1.authorize)('inventory.item.read'), assetsController.getDepreciationSchedule);
// Disposal
router.post('/:id/dispose', (0, auth_1.requireRole)('CFO'), (0, audit_1.auditLogger)('DISPOSE', 'ASSET'), assetsController.disposeAsset);
// Reports
router.get('/register', (0, auth_1.authorize)('inventory.item.read'), assetsController.getAssetRegister);
router.get('/valuation', (0, auth_1.authorize)('inventory.item.read'), assetsController.getAssetValuation);
exports.default = router;
