"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runDepreciationSchema = exports.disposeAssetSchema = exports.capitalizeFromPurchaseSchema = exports.updateAssetSchema = exports.createAssetSchema = exports.createAssetCategorySchema = void 0;
const zod_1 = require("zod");
exports.createAssetCategorySchema = zod_1.z.object({
    code: zod_1.z.string().min(1, 'Code is required'),
    name: zod_1.z.string().min(1, 'Name is required'),
    description: zod_1.z.string().optional(),
    depreciationMethod: zod_1.z.enum(['STRAIGHT_LINE', 'REDUCING_BALANCE']),
    usefulLife: zod_1.z.number().int().positive('Useful life must be positive'),
    residualValue: zod_1.z.number().min(0).max(100, 'Residual value must be between 0-100%'),
    glAssetAccountId: zod_1.z.string().cuid('Asset account is required'),
    glDepreciationAccountId: zod_1.z.string().cuid('Depreciation account is required'),
    glAccumulatedDepreciationAccountId: zod_1.z.string().cuid('Accumulated depreciation account is required'),
});
exports.createAssetSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Asset name is required'),
    description: zod_1.z.string().optional(),
    categoryId: zod_1.z.string().cuid('Category is required'),
    acquisitionDate: zod_1.z.string().refine((date) => !isNaN(Date.parse(date)), {
        message: "Invalid acquisition date"
    }),
    acquisitionCost: zod_1.z.number().positive('Acquisition cost must be positive'),
    residualValue: zod_1.z.number().min(0).optional(),
    usefulLife: zod_1.z.number().int().positive().optional(),
    depreciationMethod: zod_1.z.enum(['STRAIGHT_LINE', 'REDUCING_BALANCE']).optional(),
    locationId: zod_1.z.string().cuid().optional(),
    serialNumber: zod_1.z.string().optional(),
    supplier: zod_1.z.string().optional(),
    purchaseOrderId: zod_1.z.string().cuid().optional(),
});
exports.updateAssetSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Asset name is required'),
    description: zod_1.z.string().optional(),
    categoryId: zod_1.z.string().cuid('Category is required'),
    locationId: zod_1.z.string().cuid().optional(),
    serialNumber: zod_1.z.string().optional(),
    supplier: zod_1.z.string().optional(),
});
exports.capitalizeFromPurchaseSchema = zod_1.z.object({
    purchaseOrderId: zod_1.z.string().cuid('Purchase order is required'),
    assets: zod_1.z.array(zod_1.z.object({
        name: zod_1.z.string().min(1, 'Asset name is required'),
        categoryId: zod_1.z.string().cuid('Category is required'),
        acquisitionCost: zod_1.z.number().positive('Cost must be positive'),
        serialNumber: zod_1.z.string().optional(),
        locationId: zod_1.z.string().cuid().optional(),
    })).min(1, 'At least one asset is required'),
});
exports.disposeAssetSchema = zod_1.z.object({
    disposalDate: zod_1.z.string().refine((date) => !isNaN(Date.parse(date)), {
        message: "Invalid disposal date"
    }),
    disposalAmount: zod_1.z.number().min(0, 'Disposal amount cannot be negative'),
    disposalMethod: zod_1.z.enum(['SALE', 'SCRAP', 'DONATION', 'WRITE_OFF']),
    buyerDetails: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional(),
});
exports.runDepreciationSchema = zod_1.z.object({
    periodYear: zod_1.z.number().int().min(2020).max(2050),
    periodMonth: zod_1.z.number().int().min(1).max(12),
    assetIds: zod_1.z.array(zod_1.z.string().cuid()).optional(),
});
