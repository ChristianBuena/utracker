import { DebtStatus } from '@/generated/prisma/enums';
import type { DebtModel, PaymentModel } from '@/generated/prisma/models';
import type { DebtInput } from '@/schemas/debt.schema';
import type { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';




// Should create createDebt for adding dept logic
//the function should:
    //create title
    //create description
    //add the amount of debt
    //add the rate increase date then update or update the rate everytime 1 month (default 1 month)

// type guide for cannonical shape that every consumer (api or frontend) can rely on
export type DebtSummary = {
    debt: DebtModel;
    payments: PaymentModel[];
    totalPaid: number;
    remainingBalance: number;
    isOverdue: boolean;
    derivedStatus: DebtStatus;
};

export function createDebt(input: DebtInput): Promise<DebtSummary> {
    return prisma.$transaction(async (tx:Prisma.TransactionClient) => {
        const [debtor, creditor] = await Promise.all([
            tx.user.findUnique({ where: { id: input.debtorId}}),
            tx.user.findUnique({ where: { id: input.creditorId}})
        ])
        if (!debtor) throw new Error('Debtor not found')
        if (!creditor) throw new Error('Creditor not found')

        //create debt
        const debt = await tx.debt.create({
            data: {
                title: input.title,
                description: input.description,
                amount: input.amount,
                interestRate: input.interestRate,
                rateIncreaseInstance: input.rateIncreaseInstance,
                startDate: input.startDate,
                dueDate: input.dueDate,
                debtorId: input.debtorId,
                creditorId: input.creditorId,
                notificationsEnabled: input.notificationsEnabled ?? true,
                status: input.status ?? DebtStatus.UNPAID
            }
        })

        //fetch payment(should be emtpy initially)
        const payments: PaymentModel[] = await tx.payment.findMany({
            where: { debtId: debt.id },
            orderBy: { paidAt: 'asc'}
        })

        const { totalPaid, remainingBalance, derivedStatus, isOverdue } =
            computeDebtState(debt as DebtModel, payments)

        let updatedDebt = debt
        if (derivedStatus !== debt.status) {
            updatedDebt = await tx.debt.update ({
                where: { id: debt.id },
                data: { status: derivedStatus }
            })
        }

        return {
            debt: { ...updatedDebt, status: derivedStatus },
            payments,
            totalPaid,
            remainingBalance,
            derivedStatus,
            isOverdue
        }
    })
}
// helper function for computation of key field
export function computeDebtState(
  debt: DebtModel,
  payments: PaymentModel[]
): {
  totalPaid: number;
  remainingBalance: number;
  derivedStatus: DebtStatus;
  isOverdue: boolean;
} {
    const totalPaid = payments.reduce(
        (sum: number, p: PaymentModel) => sum + Number(p.amount),
        0
    );

    const debtAmount = Number(debt.amount);
    const remainingBalance = Math.max(debtAmount - totalPaid, 0);

    let derivedStatus: DebtStatus;
    if (totalPaid === 0) {
        derivedStatus = DebtStatus.UNPAID;
    } else if (totalPaid < debtAmount) {
        derivedStatus = DebtStatus.PARTIALLY_PAID;
    } else {
        derivedStatus = DebtStatus.PAID;
    }

    const isOverdue = new Date() > new Date(debt.dueDate) && derivedStatus !== DebtStatus.PAID;

    return { totalPaid, remainingBalance, derivedStatus, isOverdue };
}

// For fetching debt, payments, compute summary, then return all in structured from
export async function getDebtByIdWithSummary(id: string): Promise<DebtSummary> {
    const debt = await prisma.debt.findUnique({
        where: { id },
    });

    if (!debt) {
        throw new Error("Debt not found");
    }

    const payments = await prisma.payment.findMany({
        where: { debtId: id },
        orderBy: {paidAt:"asc"}
    });

    const { totalPaid, remainingBalance, derivedStatus, isOverdue } = computeDebtState(
        debt,
        payments
    );

    return {
        debt: { ...debt, status: derivedStatus},
        payments,
        totalPaid,
        remainingBalance,
        derivedStatus,
        isOverdue,
    };
}


// function to returns many debts with summaries, useful for dashbaord
export async function listDebtsWithSummary(): Promise<DebtSummary[]> {
    const debts = await prisma.debt.findMany({
        include: {
            payments: {
                orderBy: { paidAt: "asc"}
            }
        } 
    });

    return debts.map((debt) => {
        const { payments, ...debtData } = debt;
        const { totalPaid, remainingBalance, derivedStatus, isOverdue } = computeDebtState(
            debtData as DebtModel,
            payments,
        );

        return {
            debt: { ...(debtData as DebtModel), status: derivedStatus },
            payments,
            totalPaid,
            remainingBalance,
            derivedStatus,
            isOverdue,
        };
    });
}

// for sync DB status with computed status
export async function syncDebtStatus(id: string): Promise<DebtModel> {
    const summary = await getDebtByIdWithSummary(id);

    return prisma.debt.update({
        where: { id },
        data: { status: summary.derivedStatus },
    });
}

