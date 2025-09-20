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
router.post("/sales", authorize('sales.order.create'),auditLogger('CREATE', 'SALES_MEMO'), createSalesMemo);
router.get("/sales" ,authorize('sales.order.read') ,getSalesMemos);

// Purchase memos
router.post("/purchase",authorize('purchase.order.create'),auditLogger('CREATE', 'PURCHASE_MEMO'), createPurchaseMemo);
router.get("/purchase",authorize('purchase.order.read'), getPurchaseMemos);

export default router;

