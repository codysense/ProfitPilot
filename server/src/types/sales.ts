import { z } from 'zod';

export const createSaleSchema = z.object({
  customerId: z.string().cuid(),
  orderDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid date format"
  }),
  notes: z.string().optional(),
  saleLines: z.array(z.object({
    itemId: z.string().cuid(),
    qty: z.number().positive(),
    unitPrice: z.number().positive(),
  })),
});

export const deliverSaleSchema = z.object({
  deliveryLines: z.array(z.object({
    saleLineId: z.string().cuid(),
    qtyDelivered: z.number().positive(),
    warehouseId: z.string().cuid(),
  })),
});

export type CreateSaleRequest = z.infer<typeof createSaleSchema>;
export type DeliverSaleRequest = z.infer<typeof deliverSaleSchema>;