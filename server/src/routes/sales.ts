import { Router } from "express";
import { SalesController } from "../controllers/sales";
import { authenticate, authorize, requireRole } from "../middleware/auth";
import { auditLogger } from "../middleware/audit";

const router = Router();
const salesController = new SalesController();

// Apply authentication to all routes
router.use(authenticate);

// Sales Orders
router.get(
  "/orders",
  requireRole(["Accountant", "POS User"]),
  salesController.getSales
);
router.post(
  "/orders",
  requireRole(["Accountant", "POS User"]),
  auditLogger("CREATE", "SALES_ORDER"),
  salesController.createSale
);
router.put(
  "/orders/:id",
  requireRole(["Accountant", "POS User"]),
  auditLogger("UPDATE", "SALES_ORDER"),
  salesController.updateSale
);
router.delete(
  "/orders/:id",
  requireRole(["Accountant", "POS User"]),
  auditLogger("DELETE", "SALES_ORDER"),
  salesController.deleteSale
);
router.get(
  "/orders/:id/print",
  requireRole(["Accountant", "POS User"]),
  salesController.printSaleInvoice
);

// Sales Delivery and Invoicing
router.post(
  "/orders/:id/deliver",
  requireRole(["Accountant", "POS User"]),
  auditLogger("DELIVER", "SALES_ORDER"),
  salesController.deliverSale
);
router.post(
  "/orders/:id/invoice",
  requireRole(["Accountant", "POS User"]),
  auditLogger("INVOICE", "SALES_ORDER"),
  salesController.invoiceSale
);

// Customers
router.get(
  "/customers",
  requireRole(["Accountant", "POS User"]),
  salesController.getCustomers
);
// router.get('/customers', authorize('sales.customer.read'), salesController.getCustomers);
router.post(
  "/customers",
  requireRole(["Accountant", "POS User"]),
  auditLogger("CREATE", "CUSTOMER"),
  salesController.createCustomer
);
router.post(
  "/customer-groups",
  requireRole(["Accountant", "POS User"]),
  auditLogger("CREATE", "CUSTOMER-GROUP"),
  salesController.createCustomerGroup
);
router.get(
  "/customer-groups",
  requireRole(["Accountant", "POS User"]),
  salesController.getCustomerGroups
);
router.put(
  "/customer-groups/:id",
  requireRole(["Accountant", "POS User"]),
  auditLogger("UPDATE", "CUSTOMER-GROUP"),
  salesController.updateCustomerGroup
);

export default router;
