"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.arApAgingSchema = exports.inventoryAgingSchema = exports.profitLossSchema = exports.balanceSheetSchema = exports.reportParametersSchema = void 0;
const zod_1 = require("zod");
exports.reportParametersSchema = zod_1.z.object({
    dateFrom: zod_1.z.string().optional(),
    dateTo: zod_1.z.string().optional(),
    asOfDate: zod_1.z.string().optional(),
    warehouseId: zod_1.z.string().optional(),
    itemId: zod_1.z.string().optional(),
    customerId: zod_1.z.string().optional(),
    vendorId: zod_1.z.string().optional(),
    itemType: zod_1.z.string().optional(),
    format: zod_1.z.enum(['json', 'csv', 'pdf', 'excel']).default('json'),
});
exports.balanceSheetSchema = zod_1.z.object({
    asOfDate: zod_1.z.string().refine((date) => !isNaN(Date.parse(date)), {
        message: "Invalid date format"
    }),
});
exports.profitLossSchema = zod_1.z.object({
    dateFrom: zod_1.z.string().refine((date) => !isNaN(Date.parse(date)), {
        message: "Invalid date format"
    }),
    dateTo: zod_1.z.string().refine((date) => !isNaN(Date.parse(date)), {
        message: "Invalid date format"
    }),
});
exports.inventoryAgingSchema = zod_1.z.object({
    asOfDate: zod_1.z.string().refine((date) => !isNaN(Date.parse(date)), {
        message: "Invalid date format"
    }),
    warehouseId: zod_1.z.string().optional(),
});
exports.arApAgingSchema = zod_1.z.object({
    asOfDate: zod_1.z.string().refine((date) => !isNaN(Date.parse(date)), {
        message: "Invalid date format"
    }),
    type: zod_1.z.enum(['AR', 'AP']),
});
