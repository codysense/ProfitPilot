import { Router } from 'express';
import { InventoryController } from '../controllers/inventory';
import { authenticate, authorize, requireRole } from '../middleware/auth';
import { auditLogger } from '../middleware/audit';

const router = Router();
const inventoryController = new InventoryController();

// Apply authentication to all routes
router.use(authenticate);

// Items
router.get('/items', authorize('inventory.item.read'), inventoryController.getItems);
router.post('/items', authorize('inventory.item.create'), auditLogger('CREATE', 'ITEM'), inventoryController.createItem);

// BOMs
router.get('/boms', authorize('inventory.bom.read'), inventoryController.getBoms);
router.post('/boms', authorize('inventory.bom.create'), auditLogger('CREATE', 'BOM'), inventoryController.createBom);

// Inventory transactions
router.post('/adjust', authorize('inventory.item.create'), auditLogger('ADJUST', 'INVENTORY'), inventoryController.adjustInventory);
router.post('/transfer', requireRole('CFO'), auditLogger('TRANSFER', 'INVENTORY'), inventoryController.transferInventory);
router.get('/inventory/transfers', authorize('inventory.item.read'), inventoryController.getInventoryTransfers);


// Reports
router.get('/ledger', authorize('inventory.item.read'), inventoryController.getInventoryLedger);
router.get('/ledger/export', authorize('inventory.item.read'), inventoryController.exportInventoryLedger);
router.get('/valuation', authorize('inventory.item.read'), inventoryController.getInventoryValuation);

// Warehouses
router.get('/warehouses', authorize('inventory.item.read'), inventoryController.getWarehouses);
router.get('/warehouses/list', authorize('inventory.item.read'), inventoryController.getWarehousesList);
router.post('/warehouses', authorize('inventory.item.create'), auditLogger('CREATE', 'WAREHOUSE'), inventoryController.createWarehouse);
router.put('/warehouses/:id', authorize('inventory.item.create'), auditLogger('UPDATE', 'WAREHOUSE'), inventoryController.updateWarehouse);

// Locations
router.get('/locations', authorize('inventory.item.read'), inventoryController.getLocations);
router.post('/locations', authorize('inventory.item.create'), auditLogger('CREATE', 'LOCATION'), inventoryController.createLocation);
router.put('/locations/:id', authorize('inventory.item.create'), auditLogger('UPDATE', 'LOCATION'), inventoryController.updateLocation);

// Inventory transfers
router.get('/transfers', authorize('inventory.item.read'), inventoryController.getInventoryTransfers);

// Item stock by warehouse
router.get('/stock/:itemId/:warehouseId', authorize('inventory.item.read'), inventoryController.getItemStock);

export default router;