import { Router } from "express";
import { PosController } from "../controllers/pos";
import { authenticate, authorize, requireRole } from "../middleware/auth";
import { auditLogger } from "../middleware/audit";

const router = Router();
const posController = new PosController();

// Apply authentication to all routes
router.use(authenticate);

// POS Sessions
router.post(
  "/sessions",
  requireRole(["POS User", "Accountant"]),
  auditLogger("CREATE", "POS_SESSION"),
  posController.createSession,
);
router.patch(
  "/sessions/:id/close",
  requireRole(["POS User", "Accountant"]),
  auditLogger("CLOSE", "POS_SESSION"),
  posController.closeSession,
);
router.get(
  "/sessions/current",
  requireRole(["POS User", "Accountant"]),
  posController.getCurrentSession,
);

// POS Sales
router.post(
  "/sales",
  requireRole(["POS User", "Accountant"]),
  auditLogger("CREATE", "POS_SALE"),
  posController.createSale,
);
router.get(
  "/sales",
  requireRole(["POS User", "Accountant"]),
  posController.getSales,
);
router.get(
  "/sales/:id/print",
  requireRole(["POS User", "Accountant"]),
  posController.printReceipt,
);

//PosSale Payment
router.get(
  "/sales/:id/payments",
  requireRole(["POS User", "Accountant"]),
  posController.getPOSsalePayments,
);

// POS Returns
router.post(
  "/returns",
  requireRole(["POS User", "Accountant"]),
  auditLogger("CREATE", "POS_RETURN"),
  posController.createReturn,
);
router.get(
  "/returns",
  requireRole(["POS User", "Accountant"]),
  posController.getReturns,
);

// Customers with balances
router.get(
  "/customers-with-balances",
  requireRole(["POS User", "Accountant"]),
  posController.getCustomersWithBalances,
);

export default router;
