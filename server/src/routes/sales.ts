import { Router } from 'express';
import { SalesController } from '../controllers/sales';
import { authenticate, authorize } from '../middleware/auth';
import { auditLogger } from '../middleware/audit';

const router = Router();
const salesController = new SalesController();

// Apply authentication to all routes
router.use(authenticate);

// Sales Orders
router.get('/orders', authorize('sales.order.read'), salesController.getSales);
router.post('/orders', authorize('sales.order.create'), auditLogger('CREATE', 'SALES_ORDER'), salesController.createSale);
router.put('/orders/:id', authorize('sales.order.create'), auditLogger('UPDATE', 'SALES_ORDER'), salesController.updateSale);
router.delete('/orders/:id', authorize('sales.order.create'), auditLogger('DELETE', 'SALES_ORDER'), salesController.deleteSale);
router.get('/orders/:id/print', authorize('sales.order.read'), salesController.printSaleInvoice);

// Sales Delivery and Invoicing
router.post('/orders/:id/deliver', authorize('sales.order.create'), auditLogger('DELIVER', 'SALES_ORDER'), salesController.deliverSale);
router.post('/orders/:id/invoice', authorize('sales.order.create'), auditLogger('INVOICE', 'SALES_ORDER'), salesController.invoiceSale);

// Customers
router.get('/customers', authorize('sales.customer.read'), salesController.getCustomers);
router.post('/customers', authorize('sales.customer.create'), auditLogger('CREATE', 'CUSTOMER'), salesController.createCustomer);

export default router;