import { z } from 'zod';
import { PaymentMethod } from "@/generated/prisma/enums";


export const paymentSchema = z.object({
    id: z.string().optional(),
    amount: z.number().positive("Amount should be positive"),
    paymentMethod: z.enum(PaymentMethod).default(PaymentMethod.OTHER),
    proofUrl: z.url().optional(),
    paidAt: z.preprocess(
        (val) => (typeof val ==="string" || val instanceof Date ? new Date(val): val),
        z.date()
    ),
    createdAt: z.preprocess(
        (val) => (typeof val ==="string" || val instanceof Date ? new Date(val): val),
        z.date()
    ).optional(),
    debtId: z.string()
});

export type PaymentInput = z.infer<typeof paymentSchema>;