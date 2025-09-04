"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createWarehouseSchema = exports.createLocationSchema = exports.inventoryTransferSchema = exports.inventoryAdjustmentSchema = exports.createBomSchema = exports.createItemSchema = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
exports.createItemSchema = zod_1.z.object({
    sku: zod_1.z.string().min(1, 'SKU is required'),
    name: zod_1.z.string().min(1, 'Name is required'),
    description: zod_1.z.string().optional(),
    type: zod_1.z.nativeEnum(client_1.ItemType),
    uom: zod_1.z.string().default('EA'),
    costingMethod: zod_1.z.nativeEnum(client_1.CostingMethod).default('GLOBAL'),
    standardCost: zod_1.z.number().optional(),
    sellingPriceOrdinary: zod_1.z.number().optional(),
    sellingPriceBulk: zod_1.z.number().optional(),
    sellingPriceWIC: zod_1.z.number().optional(),
    taxCode: zod_1.z.string().optional(),
});
exports.createBomSchema = zod_1.z.object({
    itemId: zod_1.z.string().cuid(),
    version: zod_1.z.string().default('1.0'),
    bomLines: zod_1.z.array(zod_1.z.object({
        componentItemId: zod_1.z.string().cuid(),
        qtyPer: zod_1.z.number().positive(),
        scrapPercent: zod_1.z.number().min(0).max(100).default(0),
    })),
});
exports.inventoryAdjustmentSchema = zod_1.z.object({
    itemId: zod_1.z.string().cuid(),
    warehouseId: zod_1.z.string().cuid(),
    adjustmentType: zod_1.z.enum(['IN', 'OUT']),
    qty: zod_1.z.number().positive(),
    unitCost: zod_1.z.number().positive().optional(),
    reason: zod_1.z.string().min(1, 'Reason is required'),
});
exports.inventoryTransferSchema = zod_1.z.object({
    itemId: zod_1.z.string().cuid(),
    fromWarehouseId: zod_1.z.string().cuid(),
    toWarehouseId: zod_1.z.string().cuid(),
    qty: zod_1.z.number().positive(),
});
exports.createLocationSchema = zod_1.z.object({
    code: zod_1.z.string().min(1, 'Code is required').max(10, 'Code must be 10 characters or less'),
    name: zod_1.z.string().min(1, 'Name is required'),
    address: zod_1.z.string().optional(),
    city: zod_1.z.string().optional(),
    state: zod_1.z.string().optional(),
    country: zod_1.z.string().default('Nigeria'),
});
exports.createWarehouseSchema = zod_1.z.object({
    code: zod_1.z.string().min(1, 'Code is required').max(10, 'Code must be 10 characters or less'),
    name: zod_1.z.string().min(1, 'Name is required'),
    locationId: zod_1.z.string().min(1, 'Location is required'),
    address: zod_1.z.string().optional(),
});
