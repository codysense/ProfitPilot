import { Router } from 'express';
import { ManagementController } from '../controllers/management';
import { authenticate, authorize, requireRole } from '../middleware/auth';
import { auditLogger } from '../middleware/audit';

const router = Router();
const managementController = new ManagementController();

// Apply authentication to all routes
router.use(authenticate);

// Company Settings (CFO and GM only)
router.get('/company', requireRole('CFO'), managementController.getCompanySettings);
router.put('/company', requireRole('CFO'), auditLogger('UPDATE', 'COMPANY_SETTINGS'), managementController.updateCompanySettings);

// System Settings (CFO and GM only)
router.get('/settings', requireRole('CFO'), managementController.getSystemSettings);
router.put('/settings', requireRole('CFO'), auditLogger('UPDATE', 'SYSTEM_SETTING'), managementController.updateSystemSetting);

// Costing Policy (CFO and GM only)
router.get('/costing-policy', authorize('inventory.item.read'), managementController.getCostingPolicy);
router.put('/costing-policy', requireRole('CFO'), auditLogger('UPDATE', 'COSTING_POLICY'), managementController.updateCostingPolicy);

// Fiscal Calendar (CFO and GM only)
router.get('/fiscal-years', authorize('inventory.item.read'), managementController.getFiscalYears);
router.post('/fiscal-years', requireRole('CFO'), auditLogger('CREATE', 'FISCAL_YEAR'), managementController.createFiscalYear);
router.get('/fiscal-periods', authorize('inventory.item.read'), managementController.getFiscalPeriods);
router.patch('/fiscal-periods/:id/activate', requireRole('CFO'), auditLogger('ACTIVATE', 'FISCAL_PERIOD'), managementController.activateFiscalPeriod);
router.patch('/fiscal-periods/:id/close', requireRole('CFO'), auditLogger('CLOSE', 'FISCAL_PERIOD'), managementController.closeFiscalPeriod);

// Approval Workflows (CFO and GM only)
router.get('/approval-workflows', requireRole('CFO'), managementController.getApprovalWorkflows);
router.post('/approval-workflows', requireRole('CFO'), auditLogger('CREATE', 'APPROVAL_WORKFLOW'), managementController.createApprovalWorkflow);
router.get('/approval-requests', authorize('inventory.item.read'), managementController.getApprovalRequests);
router.post('/approval-requests/:id/action', authorize('inventory.item.create'), auditLogger('APPROVAL_ACTION', 'APPROVAL_REQUEST'), managementController.processApprovalAction);

// Enhanced Role Management (CFO and GM only)
router.get('/roles', requireRole('CFO'), managementController.getRolesWithPermissions);
router.post('/roles', requireRole('CFO'), auditLogger('CREATE', 'ROLE'), managementController.createRole);
router.put('/roles/:id', requireRole('CFO'), auditLogger('UPDATE', 'ROLE'), managementController.updateRole);
router.delete('/roles/:id', requireRole('CFO'), auditLogger('DELETE', 'ROLE'), managementController.deleteRole);
router.get('/permissions', requireRole('CFO'), managementController.getAllPermissions);

// Enhanced User Management (CFO and GM only)
router.get('/users', requireRole('CFO'), managementController.getUsersWithDetails);
router.put('/users/:id/roles', requireRole('CFO'), auditLogger('UPDATE', 'USER_ROLES'), managementController.updateUserRoles);

// Chart of Accounts Management (CFO and GM only)
router.get('/chart-of-accounts', requireRole('CFO'), managementController.getChartOfAccounts);
router.post('/chart-of-accounts', requireRole('CFO'), auditLogger('CREATE', 'CHART_ACCOUNT'), managementController.createChartAccount);
router.put('/chart-of-accounts/:id', requireRole('CFO'), auditLogger('UPDATE', 'CHART_ACCOUNT'), managementController.updateChartAccount);
router.delete('/chart-of-accounts/:id', requireRole('CFO'), auditLogger('DELETE', 'CHART_ACCOUNT'), managementController.deleteChartAccount);

// Cash Account Management (CFO and GM only)
router.get('/cash-accounts', requireRole('CFO'), managementController.getCashAccountsManagement);
router.post('/cash-accounts', requireRole('CFO'), auditLogger('CREATE', 'CASH_ACCOUNT'), managementController.createCashAccountManagement);
router.put('/cash-accounts/:id', requireRole('CFO'), auditLogger('UPDATE', 'CASH_ACCOUNT'), managementController.updateCashAccountManagement);
router.delete('/cash-accounts/:id', requireRole('CFO'), auditLogger('DELETE', 'CASH_ACCOUNT'), managementController.deleteCashAccountManagement);

export default router;