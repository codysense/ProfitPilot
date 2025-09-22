import { Router } from 'express';
import { AssetsController } from '../controllers/assets';
import { authenticate, authorize, requireRole } from '../middleware/auth';
import { auditLogger } from '../middleware/audit';

const router = Router();
const assetsController = new AssetsController();

// Apply authentication to all routes
router.use(authenticate);

// Asset Categories (CFO and GM only)
router.get('/categories', requireRole(['General Manager']), assetsController.getAssetCategories);
router.post('/categories', requireRole(['General Manager']), auditLogger('CREATE', 'ASSET_CATEGORY'), assetsController.createAssetCategory);

// Assets
router.get('/',requireRole(['General Manager']), assetsController.getAssets);
router.post('/', requireRole(['General Manager']), auditLogger('CREATE', 'ASSET'), assetsController.createAsset);
router.put('/:id', requireRole(['General Manager']), auditLogger('UPDATE', 'ASSET'), assetsController.updateAsset);
router.delete('/:id', requireRole(['General Manager']), auditLogger('DELETE', 'ASSET'), assetsController.deleteAsset);

// Capitalization
router.get('/purchase-orders', requireRole(['General Manager']), assetsController.getPurchaseOrdersForCapitalization);
router.post('/capitalize', requireRole(['General Manager']), auditLogger('CAPITALIZE', 'ASSET'), assetsController.capitalizeFromPurchase);

// Depreciation
router.post('/depreciation/run', requireRole(['General Manager']), auditLogger('RUN_DEPRECIATION', 'ASSET'), assetsController.runDepreciation);
router.get('/:id/depreciation', requireRole(['General Manager']), assetsController.getDepreciationSchedule);

// Disposal
router.post('/:id/dispose', requireRole(['General Manager']), auditLogger('DISPOSE', 'ASSET'), assetsController.disposeAsset);

// Reports
router.get('/register', requireRole(['General Manager']), assetsController.getAssetRegister);
router.get('/valuation', requireRole(['General Manager']), assetsController.getAssetValuation);

export default router;