"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.receivePurchaseSchema = exports.createPurchaseSchema = void 0;
const zod_1 = require("zod");
exports.createPurchaseSchema = zod_1.z.object({
    vendorId: zod_1.z.string().cuid(),
    orderDate: zod_1.z.string().refine((date) => !isNaN(Date.parse(date)), {
        message: "Invalid date format"
    }),
    notes: zod_1.z.string().optional(),
    purchaseLines: zod_1.z.array(zod_1.z.object({
        itemId: zod_1.z.string().cuid(),
        qty: zod_1.z.number().positive(),
        unitPrice: zod_1.z.number().positive(),
    })),
});
exports.receivePurchaseSchema = zod_1.z.object({
    receiptLines: zod_1.z.array(zod_1.z.object({
        purchaseLineId: zod_1.z.string().cuid(),
        qtyReceived: zod_1.z.number().positive(),
        unitCost: zod_1.z.number().positive(),
        warehouseId: zod_1.z.string().cuid(),
    })),
});
