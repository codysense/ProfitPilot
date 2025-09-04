import { Router } from 'express';
import { ProductionController } from '../controllers/production';
import { authenticate, authorize, requireRole } from '../middleware/auth';
import { auditLogger } from '../middleware/audit';

const router = Router();
const productionController = new ProductionController();

// Apply authentication to all routes
router.use(authenticate);

// Production Orders
router.get('/orders', authorize('production.order.read'), productionController.getProductionOrders);
router.post('/orders', authorize('production.order.create'), auditLogger('CREATE', 'PRODUCTION_ORDER'), productionController.createProductionOrder);
router.put('/orders/:id', authorize('production.order.create'), auditLogger('UPDATE', 'PRODUCTION_ORDER'), productionController.updateProductionOrder);
router.delete('/orders/:id', authorize('production.order.create'), auditLogger('DELETE', 'PRODUCTION_ORDER'), productionController.deleteProductionOrder);
router.get('/orders/:id/print', authorize('production.order.read'), productionController.printProductionOrder);
router.post('/orders/:id/release', authorize('production.order.release'), auditLogger('RELEASE', 'PRODUCTION_ORDER'), productionController.releaseProductionOrder);

// Material Operations
router.post('/orders/:id/issue-materials', authorize('production.order.create'), auditLogger('ISSUE_MATERIALS', 'PRODUCTION_ORDER'), productionController.issueMaterials);

// Labor and Overhead
router.post('/orders/:id/add-labor', authorize('production.order.create'), auditLogger('ADD_LABOR', 'PRODUCTION_ORDER'), productionController.addLabor);
router.post('/orders/:id/add-overhead', authorize('production.order.create'), auditLogger('ADD_OVERHEAD', 'PRODUCTION_ORDER'), productionController.addOverhead);

// Finished Goods Receipt
router.post('/orders/:id/receive-fg', authorize('production.order.create'), auditLogger('RECEIVE_FG', 'PRODUCTION_ORDER'), productionController.receiveFinishedGoods);

// Reports
router.get('/wip-summary', authorize('production.order.read'), productionController.getWipSummary);

export default router;