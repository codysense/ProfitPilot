"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deliverSaleSchema = exports.createSaleSchema = void 0;
const zod_1 = require("zod");
exports.createSaleSchema = zod_1.z.object({
    customerId: zod_1.z.string().cuid(),
    orderDate: zod_1.z.string().refine((date) => !isNaN(Date.parse(date)), {
        message: "Invalid date format"
    }),
    notes: zod_1.z.string().optional(),
    saleLines: zod_1.z.array(zod_1.z.object({
        itemId: zod_1.z.string().cuid(),
        qty: zod_1.z.number().positive(),
        unitPrice: zod_1.z.number().positive(),
    })),
});
exports.deliverSaleSchema = zod_1.z.object({
    deliveryLines: zod_1.z.array(zod_1.z.object({
        saleLineId: zod_1.z.string().cuid(),
        qtyDelivered: zod_1.z.number().positive(),
        warehouseId: zod_1.z.string().cuid(),
    })),
});
