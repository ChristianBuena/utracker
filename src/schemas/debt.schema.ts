import { z } from 'zod';
import { DebtStatus } from '../generated/prisma/enums';
import { IncreaseInstance } from '../generated/prisma/enums';

export const deptSchema = z.object({
    id: z.string().optional(),
    title: z.string().min(1,"Title is required" ),
    description: z.string().optional(),
    amount: z.number().positive("Amount should be positive"),
    interestRate: z.number().positive("Interest should be positive").optional(),
    rateIncreaseInstance: z.enum(IncreaseInstance),
    startDate: z.date(),
    dueDate: z.date(),
    status: z.enum(DebtStatus).default(DebtStatus.UNPAID), // ensures types matches prisma enum
    notificationsEnabled: z.boolean().default(true),   
    debtorId: z.string(),
    creditorId: z.string(),
    createdAt: z.date().optional(),
});

export type DebtInput = z.infer<typeof deptSchema>