import { Router } from 'express';
import { PurchaseController } from '../controllers/purchase';
import { authenticate, authorize } from '../middleware/auth';
import { auditLogger } from '../middleware/audit';

const router = Router();
const purchaseController = new PurchaseController();

// Apply authentication to all routes
router.use(authenticate);

// Purchase Orders
router.get('/orders', authorize('purchase.order.read'), purchaseController.getPurchases);
router.post('/orders', authorize('purchase.order.create'), auditLogger('CREATE', 'PURCHASE_ORDER'), purchaseController.createPurchase);
router.put('/orders/:id', authorize('purchase.order.create'), auditLogger('UPDATE', 'PURCHASE_ORDER'), purchaseController.updatePurchase);
router.delete('/orders/:id', authorize('purchase.order.create'), auditLogger('DELETE', 'PURCHASE_ORDER'), purchaseController.deletePurchase);
router.get('/orders/:id/print', authorize('purchase.order.read'), purchaseController.printPurchaseOrder);

// Purchase Receipts and Invoices
router.post('/orders/:id/receive', authorize('purchase.order.create'), auditLogger('RECEIVE', 'PURCHASE_ORDER'), purchaseController.receivePurchase);
router.post('/orders/:id/invoice', authorize('purchase.order.create'), auditLogger('INVOICE', 'PURCHASE_ORDER'), purchaseController.invoicePurchase);

// Vendors
router.get('/vendors', authorize('purchase.vendor.read'), purchaseController.getVendors);
router.post('/vendors', authorize('purchase.vendor.create'), auditLogger('CREATE', 'VENDOR'), purchaseController.createVendor);

export default router;