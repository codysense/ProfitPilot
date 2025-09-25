import { Router } from 'express';
import { AdjustmentController } from '../controllers/stockAdjustment';
import { authenticate,  requireRole } from '../middleware/auth';
import { auditLogger } from '../middleware/audit';

const router = Router();
const adjustmentController = new AdjustmentController();
router.post('/', authenticate, requireRole(['Auditor']), auditLogger('CREATE', 'ADJUSTMENT'), (req, res) => adjustmentController.adjustStock(req, res));
router.get('/', authenticate, requireRole(['Auditor']),  (req, res) => adjustmentController.getStockAdjustment(req, res));

export default router