"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.customerWithBalanceSchema = exports.createPosReturnSchema = exports.createPosSaleSchema = exports.closePosSessionSchema = exports.createPosSessionSchema = void 0;
const zod_1 = require("zod");
// POS Session schemas
exports.createPosSessionSchema = zod_1.z.object({
    warehouseId: zod_1.z.string().cuid('Warehouse is required'),
    cashAccountId: zod_1.z.string().cuid('Cash account is required'),
    openingBalance: zod_1.z.number().min(0, 'Opening balance cannot be negative'),
});
exports.closePosSessionSchema = zod_1.z.object({
    closingBalance: zod_1.z.number().min(0, 'Closing balance cannot be negative'),
});
// POS Sale schemas
exports.createPosSaleSchema = zod_1.z.object({
    sessionId: zod_1.z.string().cuid('Session is required'),
    customerId: zod_1.z.string().cuid().optional(),
    saleLines: zod_1.z.array(zod_1.z.object({
        itemId: zod_1.z.string().cuid('Item is required'),
        qty: zod_1.z.number().positive('Quantity must be positive'),
        unitPrice: zod_1.z.number().positive('Unit price must be positive'),
        discountPercent: zod_1.z.number().min(0).max(100).default(0),
    })).min(1, 'At least one item is required'),
    subtotal: zod_1.z.number().positive('Subtotal must be positive'),
    taxAmount: zod_1.z.number().min(0).default(0),
    discountAmount: zod_1.z.number().min(0).default(0),
    totalAmount: zod_1.z.number().positive('Total amount must be positive'),
    amountPaid: zod_1.z.number().positive('Amount paid must be positive'),
    changeAmount: zod_1.z.number().min(0).default(0),
    paymentMethod: zod_1.z.enum(['CASH', 'CARD', 'TRANSFER']).default('CASH'),
    notes: zod_1.z.string().optional(),
});
// POS Return schemas
exports.createPosReturnSchema = zod_1.z.object({
    originalSaleId: zod_1.z.string().cuid('Original sale is required'),
    sessionId: zod_1.z.string().cuid('Session is required'),
    reason: zod_1.z.string().min(1, 'Return reason is required'),
    returnLines: zod_1.z.array(zod_1.z.object({
        originalLineId: zod_1.z.string().cuid('Original line is required'),
        itemId: zod_1.z.string().cuid('Item is required'),
        qtyReturned: zod_1.z.number().positive('Return quantity must be positive'),
        unitPrice: zod_1.z.number().positive('Unit price must be positive'),
    })).min(1, 'At least one item must be returned'),
});
// Customer with outstanding balance
exports.customerWithBalanceSchema = zod_1.z.object({
    id: zod_1.z.string(),
    code: zod_1.z.string(),
    name: zod_1.z.string(),
    outstandingBalance: zod_1.z.number(),
});
