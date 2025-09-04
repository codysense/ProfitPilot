"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const inventory_1 = require("../controllers/inventory");
const auth_1 = require("../middleware/auth");
const audit_1 = require("../middleware/audit");
const router = (0, express_1.Router)();
const inventoryController = new inventory_1.InventoryController();
// Apply authentication to all routes
router.use(auth_1.authenticate);
// Items
router.get('/items', (0, auth_1.authorize)('inventory.item.read'), inventoryController.getItems);
router.post('/items', (0, auth_1.authorize)('inventory.item.create'), (0, audit_1.auditLogger)('CREATE', 'ITEM'), inventoryController.createItem);
// BOMs
router.get('/boms', (0, auth_1.authorize)('inventory.bom.read'), inventoryController.getBoms);
router.post('/boms', (0, auth_1.authorize)('inventory.bom.create'), (0, audit_1.auditLogger)('CREATE', 'BOM'), inventoryController.createBom);
// Inventory transactions
router.post('/adjust', (0, auth_1.authorize)('inventory.item.create'), (0, audit_1.auditLogger)('ADJUST', 'INVENTORY'), inventoryController.adjustInventory);
router.post('/transfer', (0, auth_1.requireRole)('CFO'), (0, audit_1.auditLogger)('TRANSFER', 'INVENTORY'), inventoryController.transferInventory);
router.get('/inventory/transfers', (0, auth_1.authorize)('inventory.item.read'), inventoryController.getInventoryTransfers);
// Reports
router.get('/ledger', (0, auth_1.authorize)('inventory.item.read'), inventoryController.getInventoryLedger);
router.get('/ledger/export', (0, auth_1.authorize)('inventory.item.read'), inventoryController.exportInventoryLedger);
router.get('/valuation', (0, auth_1.authorize)('inventory.item.read'), inventoryController.getInventoryValuation);
// Warehouses
router.get('/warehouses', (0, auth_1.authorize)('inventory.item.read'), inventoryController.getWarehouses);
router.get('/warehouses/list', (0, auth_1.authorize)('inventory.item.read'), inventoryController.getWarehousesList);
router.post('/warehouses', (0, auth_1.authorize)('inventory.item.create'), (0, audit_1.auditLogger)('CREATE', 'WAREHOUSE'), inventoryController.createWarehouse);
router.put('/warehouses/:id', (0, auth_1.authorize)('inventory.item.create'), (0, audit_1.auditLogger)('UPDATE', 'WAREHOUSE'), inventoryController.updateWarehouse);
// Locations
router.get('/locations', (0, auth_1.authorize)('inventory.item.read'), inventoryController.getLocations);
router.post('/locations', (0, auth_1.authorize)('inventory.item.create'), (0, audit_1.auditLogger)('CREATE', 'LOCATION'), inventoryController.createLocation);
router.put('/locations/:id', (0, auth_1.authorize)('inventory.item.create'), (0, audit_1.auditLogger)('UPDATE', 'LOCATION'), inventoryController.updateLocation);
// Inventory transfers
router.get('/transfers', (0, auth_1.authorize)('inventory.item.read'), inventoryController.getInventoryTransfers);
// Item stock by warehouse
router.get('/stock/:itemId/:warehouseId', (0, auth_1.authorize)('inventory.item.read'), inventoryController.getItemStock);
exports.default = router;
