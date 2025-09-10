import { Router } from 'express';
import { PosController } from '../controllers/pos';
import { authenticate, authorize } from '../middleware/auth';
import { auditLogger } from '../middleware/audit';

const router = Router();
const posController = new PosController();

// Apply authentication to all routes
router.use(authenticate);

// POS Sessions
router.post('/sessions', authorize('pos.session.manage'), auditLogger('CREATE', 'POS_SESSION'), posController.createSession);
router.patch('/sessions/:id/close', authorize('pos.session.manage'), auditLogger('CLOSE', 'POS_SESSION'), posController.closeSession);
router.get('/sessions/current', authorize('pos.sale.read'), posController.getCurrentSession);

// POS Sales
router.post('/sales', authorize('pos.sale.create'), auditLogger('CREATE', 'POS_SALE'), posController.createSale);
router.get('/sales', authorize('pos.sale.read'), posController.getSales);
router.get('/sales/:id/print', authorize('pos.sale.read'), posController.printReceipt);

// POS Returns
router.post('/returns', authorize('pos.return.create'), auditLogger('CREATE', 'POS_RETURN'), posController.createReturn);

// Customers with balances
router.get('/customers-with-balances', authorize('sales.customer.read'), posController.getCustomersWithBalances);

export default router;