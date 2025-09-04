"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const management_1 = require("../controllers/management");
const auth_1 = require("../middleware/auth");
const audit_1 = require("../middleware/audit");
const router = (0, express_1.Router)();
const managementController = new management_1.ManagementController();
// Apply authentication to all routes
router.use(auth_1.authenticate);
// Company Settings (CFO and GM only)
router.get('/company', (0, auth_1.requireRole)('CFO'), managementController.getCompanySettings);
router.put('/company', (0, auth_1.requireRole)('CFO'), (0, audit_1.auditLogger)('UPDATE', 'COMPANY_SETTINGS'), managementController.updateCompanySettings);
// System Settings (CFO and GM only)
router.get('/settings', (0, auth_1.requireRole)('CFO'), managementController.getSystemSettings);
router.put('/settings', (0, auth_1.requireRole)('CFO'), (0, audit_1.auditLogger)('UPDATE', 'SYSTEM_SETTING'), managementController.updateSystemSetting);
// Costing Policy (CFO and GM only)
router.get('/costing-policy', (0, auth_1.authorize)('inventory.item.read'), managementController.getCostingPolicy);
router.put('/costing-policy', (0, auth_1.requireRole)('CFO'), (0, audit_1.auditLogger)('UPDATE', 'COSTING_POLICY'), managementController.updateCostingPolicy);
// Fiscal Calendar (CFO and GM only)
router.get('/fiscal-years', (0, auth_1.authorize)('inventory.item.read'), managementController.getFiscalYears);
router.post('/fiscal-years', (0, auth_1.requireRole)('CFO'), (0, audit_1.auditLogger)('CREATE', 'FISCAL_YEAR'), managementController.createFiscalYear);
router.get('/fiscal-periods', (0, auth_1.authorize)('inventory.item.read'), managementController.getFiscalPeriods);
router.patch('/fiscal-periods/:id/activate', (0, auth_1.requireRole)('CFO'), (0, audit_1.auditLogger)('ACTIVATE', 'FISCAL_PERIOD'), managementController.activateFiscalPeriod);
router.patch('/fiscal-periods/:id/close', (0, auth_1.requireRole)('CFO'), (0, audit_1.auditLogger)('CLOSE', 'FISCAL_PERIOD'), managementController.closeFiscalPeriod);
// Approval Workflows (CFO and GM only)
router.get('/approval-workflows', (0, auth_1.requireRole)('CFO'), managementController.getApprovalWorkflows);
router.post('/approval-workflows', (0, auth_1.requireRole)('CFO'), (0, audit_1.auditLogger)('CREATE', 'APPROVAL_WORKFLOW'), managementController.createApprovalWorkflow);
router.get('/approval-requests', (0, auth_1.authorize)('inventory.item.read'), managementController.getApprovalRequests);
router.post('/approval-requests/:id/action', (0, auth_1.authorize)('inventory.item.create'), (0, audit_1.auditLogger)('APPROVAL_ACTION', 'APPROVAL_REQUEST'), managementController.processApprovalAction);
// Enhanced Role Management (CFO and GM only)
router.get('/roles', (0, auth_1.requireRole)('CFO'), managementController.getRolesWithPermissions);
router.post('/roles', (0, auth_1.requireRole)('CFO'), (0, audit_1.auditLogger)('CREATE', 'ROLE'), managementController.createRole);
router.put('/roles/:id', (0, auth_1.requireRole)('CFO'), (0, audit_1.auditLogger)('UPDATE', 'ROLE'), managementController.updateRole);
router.delete('/roles/:id', (0, auth_1.requireRole)('CFO'), (0, audit_1.auditLogger)('DELETE', 'ROLE'), managementController.deleteRole);
router.get('/permissions', (0, auth_1.requireRole)('CFO'), managementController.getAllPermissions);
// Enhanced User Management (CFO and GM only)
router.get('/users', (0, auth_1.requireRole)('CFO'), managementController.getUsersWithDetails);
router.put('/users/:id/roles', (0, auth_1.requireRole)('CFO'), (0, audit_1.auditLogger)('UPDATE', 'USER_ROLES'), managementController.updateUserRoles);
// Chart of Accounts Management (CFO and GM only)
router.get('/chart-of-accounts', (0, auth_1.requireRole)('CFO'), managementController.getChartOfAccounts);
router.post('/chart-of-accounts', (0, auth_1.requireRole)('CFO'), (0, audit_1.auditLogger)('CREATE', 'CHART_ACCOUNT'), managementController.createChartAccount);
router.put('/chart-of-accounts/:id', (0, auth_1.requireRole)('CFO'), (0, audit_1.auditLogger)('UPDATE', 'CHART_ACCOUNT'), managementController.updateChartAccount);
router.delete('/chart-of-accounts/:id', (0, auth_1.requireRole)('CFO'), (0, audit_1.auditLogger)('DELETE', 'CHART_ACCOUNT'), managementController.deleteChartAccount);
// Cash Account Management (CFO and GM only)
router.get('/cash-accounts', (0, auth_1.requireRole)('CFO'), managementController.getCashAccountsManagement);
router.post('/cash-accounts', (0, auth_1.requireRole)('CFO'), (0, audit_1.auditLogger)('CREATE', 'CASH_ACCOUNT'), managementController.createCashAccountManagement);
router.put('/cash-accounts/:id', (0, auth_1.requireRole)('CFO'), (0, audit_1.auditLogger)('UPDATE', 'CASH_ACCOUNT'), managementController.updateCashAccountManagement);
router.delete('/cash-accounts/:id', (0, auth_1.requireRole)('CFO'), (0, audit_1.auditLogger)('DELETE', 'CASH_ACCOUNT'), managementController.deleteCashAccountManagement);
exports.default = router;
