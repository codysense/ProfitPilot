import { Router } from 'express';
import { AssetsController } from '../controllers/assets';
import { authenticate, authorize, requireRole } from '../middleware/auth';
import { auditLogger } from '../middleware/audit';

const router = Router();
const assetsController = new AssetsController();

// Apply authentication to all routes
router.use(authenticate);

// Asset Categories (CFO and GM only)
router.get('/categories', requireRole('CFO'), assetsController.getAssetCategories);
router.post('/categories', requireRole('CFO'), auditLogger('CREATE', 'ASSET_CATEGORY'), assetsController.createAssetCategory);

// Assets
router.get('/', authorize('inventory.item.read'), assetsController.getAssets);
router.post('/', authorize('inventory.item.create'), auditLogger('CREATE', 'ASSET'), assetsController.createAsset);
router.put('/:id', authorize('inventory.item.create'), auditLogger('UPDATE', 'ASSET'), assetsController.updateAsset);
router.delete('/:id', requireRole('CFO'), auditLogger('DELETE', 'ASSET'), assetsController.deleteAsset);

// Capitalization
router.get('/purchase-orders', authorize('purchase.order.read'), assetsController.getPurchaseOrdersForCapitalization);
router.post('/capitalize', authorize('inventory.item.create'), auditLogger('CAPITALIZE', 'ASSET'), assetsController.capitalizeFromPurchase);

// Depreciation
router.post('/depreciation/run', requireRole('CFO'), auditLogger('RUN_DEPRECIATION', 'ASSET'), assetsController.runDepreciation);
router.get('/:id/depreciation', authorize('inventory.item.read'), assetsController.getDepreciationSchedule);

// Disposal
router.post('/:id/dispose', requireRole('CFO'), auditLogger('DISPOSE', 'ASSET'), assetsController.disposeAsset);

// Reports
router.get('/register', authorize('inventory.item.read'), assetsController.getAssetRegister);
router.get('/valuation', authorize('inventory.item.read'), assetsController.getAssetValuation);

export default router;