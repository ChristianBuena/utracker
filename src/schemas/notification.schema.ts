import { z } from 'zod';
import { NotificationType } from '../generated/prisma/enums';

export const notificationSchema = z.object({
    id: z.string().optional(),
    type: z.enum(NotificationType),
    triggeredAt: z.date(),
    readAt: z.date().optional(),
    deptId: z.string()
})

export type NotificationInput = z.infer<typeof notificationSchema>