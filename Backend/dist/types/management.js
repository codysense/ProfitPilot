"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCashAccountSchema = exports.createCashAccountSchema = exports.updateChartAccountSchema = exports.createChartAccountSchema = exports.updateRoleSchema = exports.createRoleSchema = exports.approvalActionSchema = exports.createApprovalWorkflowSchema = exports.updateSystemSettingSchema = exports.createFiscalYearSchema = exports.updateCompanySettingsSchema = void 0;
const zod_1 = require("zod");
// Company Settings
exports.updateCompanySettingsSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Company name is required'),
    baseCurrency: zod_1.z.string().default('NGN'),
    timezone: zod_1.z.string().default('Africa/Lagos'),
    address: zod_1.z.string().optional(),
    phone: zod_1.z.string().optional(),
    email: zod_1.z.string().email('Invalid email format').optional(),
});
// Fiscal Year
exports.createFiscalYearSchema = zod_1.z.object({
    year: zod_1.z.number().int().min(2020).max(2050),
    startDate: zod_1.z.string().refine((date) => !isNaN(Date.parse(date)), {
        message: "Invalid start date format"
    }),
    endDate: zod_1.z.string().refine((date) => !isNaN(Date.parse(date)), {
        message: "Invalid end date format"
    }),
});
// System Settings
exports.updateSystemSettingSchema = zod_1.z.object({
    category: zod_1.z.string().min(1, 'Category is required'),
    key: zod_1.z.string().min(1, 'Key is required'),
    value: zod_1.z.string().min(1, 'Value is required'),
    dataType: zod_1.z.enum(['STRING', 'NUMBER', 'BOOLEAN', 'JSON']).default('STRING'),
    description: zod_1.z.string().optional(),
});
// Approval Workflow
exports.createApprovalWorkflowSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Workflow name is required'),
    entity: zod_1.z.enum(['PURCHASE_ORDER', 'SALES_ORDER', 'PRODUCTION_ORDER', 'INVENTORY_ADJUSTMENT']),
    minAmount: zod_1.z.number().optional(),
    maxAmount: zod_1.z.number().optional(),
    steps: zod_1.z.array(zod_1.z.object({
        name: zod_1.z.string().min(1, 'Step name is required'),
        roleId: zod_1.z.string().cuid('Invalid role ID'),
        isRequired: zod_1.z.boolean().default(true),
    })).min(1, 'At least one approval step is required'),
});
// Approval Action
exports.approvalActionSchema = zod_1.z.object({
    action: zod_1.z.enum(['APPROVE', 'REJECT']),
    comments: zod_1.z.string().optional(),
});
// Role Management
exports.createRoleSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Role name is required'),
    description: zod_1.z.string().optional(),
    permissions: zod_1.z.array(zod_1.z.string().cuid()).optional(),
});
exports.updateRoleSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Role name is required').optional(),
    description: zod_1.z.string().optional(),
    permissions: zod_1.z.array(zod_1.z.string().cuid()).optional(),
});
// Chart of Accounts
exports.createChartAccountSchema = zod_1.z.object({
    code: zod_1.z.string().min(1, 'Account code is required'),
    name: zod_1.z.string().min(1, 'Account name is required'),
    accountType: zod_1.z.enum([
        'INCOME',
        'EXPENSES',
        'OTHER_INCOME',
        'CURRENT_ASSETS',
        'NON_CURRENT_ASSETS',
        'CURRENT_LIABILITY',
        'NON_CURRENT_LIABILITY',
        'COST_OF_SALES',
        'TRADE_RECEIVABLES',
        'TRADE_PAYABLES',
        'EQUITY'
    ]),
    description: zod_1.z.string().optional(),
    parentId: zod_1.z.string().optional(),
});
exports.updateChartAccountSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Account name is required'),
    accountType: zod_1.z.enum([
        'INCOME',
        'EXPENSES',
        'OTHER_INCOME',
        'CURRENT_ASSETS',
        'NON_CURRENT_ASSETS',
        'CURRENT_LIABILITY',
        'NON_CURRENT_LIABILITY',
        'COST_OF_SALES',
        'TRADE_RECEIVABLES',
        'TRADE_PAYABLES',
        'EQUITY'
    ]),
    description: zod_1.z.string().optional(),
    parentId: zod_1.z.string().optional(),
    isActive: zod_1.z.boolean().optional(),
});
// Import cash account schemas
var cash_1 = require("./cash");
Object.defineProperty(exports, "createCashAccountSchema", { enumerable: true, get: function () { return cash_1.createCashAccountSchema; } });
Object.defineProperty(exports, "updateCashAccountSchema", { enumerable: true, get: function () { return cash_1.updateCashAccountSchema; } });
