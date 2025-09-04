"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.importBankStatementSchema = exports.bankReconciliationSchema = exports.createVendorPaymentSchema = exports.createCustomerPaymentSchema = exports.createCashTransactionSchema = exports.updateCashAccountSchema = exports.createCashAccountSchema = void 0;
const zod_1 = require("zod");
exports.createCashAccountSchema = zod_1.z.object({
    code: zod_1.z.string().min(1, 'Code is required'),
    name: zod_1.z.string().min(1, 'Name is required'),
    accountType: zod_1.z.enum(['CASH', 'BANK']),
    accountNumber: zod_1.z.string().optional(),
    bankName: zod_1.z.string().optional(),
    glAccountId: zod_1.z.string().cuid('GL Account is required'),
    balance: zod_1.z.number().default(0),
});
exports.updateCashAccountSchema = zod_1.z.object({
    name: zod_1.z.string(),
    accountType: zod_1.z.enum(["CASH", "BANK"]),
    accountNumber: zod_1.z.string().optional(),
    bankName: zod_1.z.string().optional(),
    glAccountId: zod_1.z.string().optional(),
    balance: zod_1.z.number(),
    isActive: zod_1.z.boolean().optional() // ✅ Add this
});
exports.createCashTransactionSchema = zod_1.z.object({
    cashAccountId: zod_1.z.string().cuid('Cash account is required'),
    glAccountId: zod_1.z.string().cuid('GL account is required'),
    transactionType: zod_1.z.enum(['RECEIPT', 'PAYMENT']),
    amount: zod_1.z.number().positive('Amount must be positive'),
    description: zod_1.z.string().min(1, 'Description is required'),
    transactionDate: zod_1.z.string().refine((date) => !isNaN(Date.parse(date)), {
        message: "Invalid date format"
    }),
    reference: zod_1.z.string().optional(),
    contraAccountId: zod_1.z.string().optional(),
});
exports.createCustomerPaymentSchema = zod_1.z.object({
    customerId: zod_1.z.string().cuid('Customer is required'),
    cashAccountId: zod_1.z.string().cuid('Cash account is required'),
    amount: zod_1.z.number().positive('Amount must be positive'),
    paymentDate: zod_1.z.string().refine((date) => !isNaN(Date.parse(date)), {
        message: "Invalid date format"
    }),
    reference: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional(),
    saleId: zod_1.z.string().cuid().optional(),
});
exports.createVendorPaymentSchema = zod_1.z.object({
    vendorId: zod_1.z.string().cuid('Vendor is required'),
    cashAccountId: zod_1.z.string().cuid('Cash account is required'),
    amount: zod_1.z.number().positive('Amount must be positive'),
    paymentDate: zod_1.z.string().refine((date) => !isNaN(Date.parse(date)), {
        message: "Invalid date format"
    }),
    reference: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional(),
    purchaseId: zod_1.z.string().cuid().optional(),
});
exports.bankReconciliationSchema = zod_1.z.object({
    cashAccountId: zod_1.z.string().cuid('Cash account is required'),
    transactionIds: zod_1.z.array(zod_1.z.string().cuid()),
    statementBalance: zod_1.z.number(),
    bookBalance: zod_1.z.number(),
    reconciliationDate: zod_1.z.string().refine((date) => !isNaN(Date.parse(date)), {
        message: "Invalid date format"
    }),
});
exports.importBankStatementSchema = zod_1.z.object({
    cashAccountId: zod_1.z.string().cuid('Cash account is required'),
    csvData: zod_1.z.array(zod_1.z.object({
        date: zod_1.z.string(),
        description: zod_1.z.string(),
        amount: zod_1.z.number(),
        type: zod_1.z.string().optional(),
        reference: zod_1.z.string().optional(),
    })),
});
