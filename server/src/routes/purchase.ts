import { Router } from 'express';
import { PurchaseController } from '../controllers/purchase';
import { authenticate, authorize, requireRole } from '../middleware/auth';
import { auditLogger } from '../middleware/audit';

const router = Router();
const purchaseController = new PurchaseController();

// Apply authentication to all routes
router.use(authenticate);

// Purchase Orders
router.get('/orders', requireRole(['Inventory Manager']), purchaseController.getPurchases);
router.post('/orders', requireRole(['Inventory Manager']), auditLogger('CREATE', 'PURCHASE_ORDER'), purchaseController.createPurchase);
router.put('/orders/:id', requireRole(['Inventory Manager']), auditLogger('UPDATE', 'PURCHASE_ORDER'), purchaseController.updatePurchase);
router.delete('/orders/:id', requireRole(['Inventory Manager']), auditLogger('DELETE', 'PURCHASE_ORDER'), purchaseController.deletePurchase);
router.get('/orders/:id/print', requireRole(['Inventory Manager']), purchaseController.printPurchaseOrder);

// Purchase Receipts and Invoices
router.post('/orders/:id/receive', requireRole(['Inventory Manager']), auditLogger('RECEIVE', 'PURCHASE_ORDER'), purchaseController.receivePurchase);
router.post('/orders/:id/invoice', requireRole(['Inventory Manager']), auditLogger('INVOICE', 'PURCHASE_ORDER'), purchaseController.invoicePurchase);

// Vendors
router.get('/vendors', requireRole([ 'Inventory Manager', 'Accountant']), purchaseController.getVendors);
router.post('/vendors', requireRole(['Inventory Manager']), auditLogger('CREATE', 'VENDOR'), purchaseController.createVendor);

export default router;