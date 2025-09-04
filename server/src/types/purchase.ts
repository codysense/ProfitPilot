import { z } from 'zod';

export const createPurchaseSchema = z.object({
  vendorId: z.string().cuid(),
  orderDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid date format"
  }),
  notes: z.string().optional(),
  purchaseLines: z.array(z.object({
    itemId: z.string().cuid(),
    qty: z.number().positive(),
    unitPrice: z.number().positive(),
  })),
});

export const receivePurchaseSchema = z.object({
  receiptLines: z.array(z.object({
    purchaseLineId: z.string().cuid(),
    qtyReceived: z.number().positive(),
    unitCost: z.number().positive(),
    warehouseId: z.string().cuid(),
  })),
});

export type CreatePurchaseRequest = z.infer<typeof createPurchaseSchema>;
export type ReceivePurchaseRequest = z.infer<typeof receivePurchaseSchema>;