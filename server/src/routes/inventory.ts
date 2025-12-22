import { Router } from "express";
import { InventoryController } from "../controllers/inventory";
import { authenticate, authorize, requireRole } from "../middleware/auth";
import { auditLogger } from "../middleware/audit";

const router = Router();
const inventoryController = new InventoryController();

// Apply authentication to all routes
router.use(authenticate);

// Items
router.get(
  "/items",
  requireRole([
    "Accountant",
    "POS User",
    "Production Manager",
    "Inventory Manager",
    "Assistant Inventory Manager",
  ]),
  inventoryController.getItems
);
// router.get('/items', authorize('inventory.item.read'), inventoryController.getItems);
router.post(
  "/items",
  requireRole(["Inventory Manager"]),
  auditLogger("CREATE", "ITEM"),
  inventoryController.createItem
);

// BOMs
router.get(
  "/boms",
  requireRole([
    "Inventory Manager",
    "Assistant Inventory Manager",
    "Production Manager",
  ]),
  inventoryController.getBoms
);
router.post(
  "/boms",
  requireRole(["Inventory Manager"]),
  auditLogger("CREATE", "BOM"),
  inventoryController.createBom
);

// Inventory transactions
router.post(
  "/adjust",
  requireRole(["Inventory Manager"]),
  auditLogger("ADJUST", "INVENTORY"),
  inventoryController.adjustInventory
);
router.post(
  "/transfer",
  requireRole(["Inventory Manager"]),
  auditLogger("TRANSFER", "INVENTORY"),
  inventoryController.transferInventoryBulk
);
router.get(
  "/inventory/transfers",
  requireRole(["Inventory Manager", "Assistant Inventory Manager"]),
  inventoryController.getInventoryTransfers
);



// Reports
router.get(
  "/ledger",
  requireRole(["Inventory Manager", "Assistant Inventory Manager"]),
  inventoryController.getInventoryLedger
);
router.get(
  "/ledger/export",
  requireRole(["Inventory Manager", "Assistant Inventory Manager"]),
  inventoryController.exportInventoryLedger
);
router.get(
  "/valuation",
  requireRole(["Inventory Manager", "Assistant Inventory Manager"]),
  inventoryController.getInventoryValuation
);

// Warehouses
router.get(
  "/warehouses",
  requireRole([
    "Inventory Manager",
    "Assistant Inventory Manager",
    "Accountant",
    "POS User",
    "Production Manager",
  ]),
  inventoryController.getWarehouses
);
router.get(
  "/warehouses/list",
  requireRole(["Inventory Manager", "Assistant Inventory Manager"]),
  inventoryController.getWarehousesList
);
router.post(
  "/warehouses",
  requireRole(["Inventory Manager"]),
  auditLogger("CREATE", "WAREHOUSE"),
  inventoryController.createWarehouse
);
router.put(
  "/warehouses/:id",
  requireRole(["Inventory Manager"]),
  auditLogger("UPDATE", "WAREHOUSE"),
  inventoryController.updateWarehouse
);

// Locations
router.get(
  "/locations",
  requireRole(["Inventory Manager", "Assistant Inventory Manager"]),
  inventoryController.getLocations
);
router.post(
  "/locations",
  requireRole(["Inventory Manager"]),
  auditLogger("CREATE", "LOCATION"),
  inventoryController.createLocation
);
router.put(
  "/locations/:id",
  requireRole(["Inventory Manager"]),
  auditLogger("UPDATE", "LOCATION"),
  inventoryController.updateLocation
);

//UOMs
router.get(
  "/uoms",
  requireRole([
    "Inventory Manager",
    "Assistant Inventory Manager",
    "Accountant",
    ,
    "Production Manager",
  ]),
  inventoryController.getUOMs
);
router.post(
  "/uoms",
  requireRole(["Inventory Manager", "Assistant Inventory Manager"]),
  auditLogger("CREATE", "UOM"),
  inventoryController.createUOM
);
router.put(
  "/uoms/:id",
  requireRole(["Inventory Manager", "Assistant Inventory Manager"]),
  auditLogger("UPDATE", "UOM"),
  inventoryController.updateUOM
);
router.delete(
  "/uoms/:id",
  requireRole(["Inventory Manager", "Assistant Inventory Manager"]),
  auditLogger("DELETE", "UOM"),
  inventoryController.deleteUOM
);

// Inventory transfers
router.get(
  "/transfers",
  requireRole(["Inventory Manager", "Assistant Inventory Manager"]),
  inventoryController.getInventoryTransfers
);

//Print Inventory Transfer
router.get(
  "/transfers/print/:id",
  requireRole(["Inventory Manager", "Assistant Inventory Manager"]),
  inventoryController.printInventoryTransfer
);

// Item stock by warehouse
router.get(
  "/stock/:itemId/:warehouseId",
  requireRole([
    "Inventory Manager",
    "Production Manager",
    "Assistant Inventory Manager",
    "POS User",
    "Accountant",
  ]),
  inventoryController.getItemStock
);

export default router;
