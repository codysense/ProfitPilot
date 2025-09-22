import { Router } from 'express';
import { ProductionController } from '../controllers/production';
import { authenticate, requireRole } from '../middleware/auth';
import { auditLogger } from '../middleware/audit';

const router = Router();
const productionController = new ProductionController();

// Apply authentication to all routes
router.use(authenticate);

// Production Orders Production Manager
router.get('/orders', requireRole(['Production Manager']), productionController.getProductionOrders);
router.post('/orders', requireRole(['Production Manager']), auditLogger('CREATE', 'PRODUCTION_ORDER'), productionController.createProductionOrder);
router.put('/orders/:id', requireRole(['Production Manager']), auditLogger('UPDATE', 'PRODUCTION_ORDER'), productionController.updateProductionOrder);
router.delete('/orders/:id', requireRole(['Production Manager']), auditLogger('DELETE', 'PRODUCTION_ORDER'), productionController.deleteProductionOrder);
router.get('/orders/:id/print', requireRole(['Production Manager']), productionController.printProductionOrder);
router.post('/orders/:id/release', requireRole(['Production Manager']), auditLogger('RELEASE', 'PRODUCTION_ORDER'), productionController.releaseProductionOrder);

// Material Operations
router.post('/orders/:id/issue-materials', requireRole(['Production Manager', 'Inventory Manager']), auditLogger('ISSUE_MATERIALS', 'PRODUCTION_ORDER'), productionController.issueMaterials);

// Labor and Overhead
router.post('/orders/:id/add-labor', requireRole(['Production Manager']), auditLogger('ADD_LABOR', 'PRODUCTION_ORDER'), productionController.addLabor);
router.post('/orders/:id/add-overhead', requireRole(['Production Manager']), auditLogger('ADD_OVERHEAD', 'PRODUCTION_ORDER'), productionController.addOverhead);

// Finished Goods Receipt
router.post('/orders/:id/receive-fg', requireRole(['Inventory Manager','Production Manager']), auditLogger('RECEIVE_FG', 'PRODUCTION_ORDER'), productionController.receiveFinishedGoods);

// Reports
router.get('/wip-summary', requireRole(['Production Manager']), productionController.getWipSummary);

export default router;