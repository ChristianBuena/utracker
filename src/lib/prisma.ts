import { PrismaClient } from '@/generated/prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var globalForPrisma: { prisma?: PrismaClient } | undefined;
}

export const prisma =
  globalThis.globalForPrisma?.prisma ??
  new PrismaClient({
    log: ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis.globalForPrisma = globalThis.globalForPrisma ?? {};
  globalThis.globalForPrisma.prisma = prisma;
}
