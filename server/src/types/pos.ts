import { z } from 'zod';

// POS Session schemas
export const createPosSessionSchema = z.object({
  warehouseId: z.string().cuid('Warehouse is required'),
  cashAccountId: z.string().cuid('Cash account is required'),
  openingBalance: z.number().min(0, 'Opening balance cannot be negative'),
});

export const closePosSessionSchema = z.object({
  closingBalance: z.number().min(0, 'Closing balance cannot be negative'),
});

// POS Sale schemas
export const createPosSaleSchema = z.object({
  sessionId: z.string().cuid('Session is required'),
  customerId: z.string().cuid().optional(),
  saleLines: z.array(z.object({
    itemId: z.string().cuid('Item is required'),
    qty: z.number().positive('Quantity must be positive'),
    unitPrice: z.number().positive('Unit price must be positive'),
    discountPercent: z.number().min(0).max(100).default(0),
  })).min(1, 'At least one item is required'),
  subtotal: z.number().positive('Subtotal must be positive'),
  taxAmount: z.number().min(0).default(0),
  discountAmount: z.number().min(0).default(0),
  totalAmount: z.number().positive('Total amount must be positive'),
  amountPaid: z.number().positive('Amount paid must be positive'),
  changeAmount: z.number().min(0).default(0),
  paymentMethod: z.enum(['CASH', 'CARD', 'TRANSFER']).default('CASH'),
  notes: z.string().optional(),
});

// POS Return schemas
export const createPosReturnSchema = z.object({
  originalSaleId: z.string().cuid('Original sale is required'),
  sessionId: z.string().cuid('Session is required'),
  reason: z.string().min(1, 'Return reason is required'),
  returnLines: z.array(z.object({
    originalLineId: z.string().cuid('Original line is required'),
    itemId: z.string().cuid('Item is required'),
    qtyReturned: z.number().positive('Return quantity must be positive'),
    unitPrice: z.number().positive('Unit price must be positive'),
  })).min(1, 'At least one item must be returned'),
});

// Customer with outstanding balance
export const customerWithBalanceSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  outstandingBalance: z.number(),
});

export type CreatePosSessionRequest = z.infer<typeof createPosSessionSchema>;
export type ClosePosSessionRequest = z.infer<typeof closePosSessionSchema>;
export type CreatePosSaleRequest = z.infer<typeof createPosSaleSchema>;
export type CreatePosReturnRequest = z.infer<typeof createPosReturnSchema>;
export type CustomerWithBalance = z.infer<typeof customerWithBalanceSchema>;