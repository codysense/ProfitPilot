"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.receiveFinishedGoodsSchema = exports.addOverheadSchema = exports.addLaborSchema = exports.issueMaterialsSchema = exports.createProductionOrderSchema = void 0;
const zod_1 = require("zod");
exports.createProductionOrderSchema = zod_1.z.object({
    itemId: zod_1.z.string().cuid(),
    qtyTarget: zod_1.z.number().positive(),
    warehouseId: zod_1.z.string().cuid(),
    bomId: zod_1.z.string().cuid().optional().or(zod_1.z.literal('')),
});
exports.issueMaterialsSchema = zod_1.z.object({
    materials: zod_1.z.array(zod_1.z.object({
        itemId: zod_1.z.string().cuid(),
        qty: zod_1.z.number().positive(),
        unitCost: zod_1.z.number().positive().optional(),
    })),
});
exports.addLaborSchema = zod_1.z.object({
    hours: zod_1.z.number().positive(),
    rate: zod_1.z.number().positive(),
    employeeName: zod_1.z.string().optional(),
});
exports.addOverheadSchema = zod_1.z.object({
    amount: zod_1.z.number().positive(),
    note: zod_1.z.string().optional(),
});
exports.receiveFinishedGoodsSchema = zod_1.z.object({
    qtyGood: zod_1.z.number().positive(),
    qtyScrap: zod_1.z.number().min(0).default(0),
});
