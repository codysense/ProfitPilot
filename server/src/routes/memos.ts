import express from "express";
import {
  createSalesMemo,
  getSalesMemos,
  createPurchaseMemo,
  getPurchaseMemos,
} from "../controllers/memos";

import { authenticate,authorize} from '../middleware/auth';
import { auditLogger } from "../middleware/audit";

const router = express.Router();


// Apply authentication to all routes
router.use(authenticate);

// Sales memos
router.post("/sales", authorize('sales.memo.post'),auditLogger('CREATE', 'SALES_MEMO'), createSalesMemo);
router.get("/sales" ,authorize('sales.memo.read') ,getSalesMemos);

// Purchase memos
router.post("/purchase",authorize('purchase.memo.post'),auditLogger('CREATE', 'PURCHASE_MEMO'), createPurchaseMemo);
router.get("/purchase",authorize('purchase.memo.read'), getPurchaseMemos);

export default router;

