import { z } from 'zod';

export const paymentSchema = z.object({
    id: z.string().optional(),
    amount: z.number().positive("Amount should be positive"),
    proofUrl: z.url().optional(),
    paidAt: z.date(),
    createdAt: z.date().optional(),
    deptId: z.string().optional(),
});

export type PaymentInput = z.infer<typeof paymentSchema>;