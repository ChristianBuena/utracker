import { prisma } from '@/lib/prisma'
import { DebtModel, PaymentModel } from "@/generated/prisma/models"
import { DebtStatus } from "@/generated/prisma/enums"


// Should create createDebt for adding dept logic

// type guide for cannonical shape that every consumer (api or frontend) can rely on
export type DebtSummary = {
    debt: DebtModel;
    payments: PaymentModel[];
    totalPaid: number;
    remainingBalance: number;
    isOverdue: boolean;
    derivedStatus: DebtStatus;
};

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
    const totalPaid = payments.reduce((sum:number, p: PaymentModel) => sum + p.amount, 0);
    
    const remainingBalance = Math.max(debt.amount - totalPaid, 0);

    let derivedStatus: DebtStatus;
    if(totalPaid === 0) {
        derivedStatus = DebtStatus.UNPAID;
    } else if (totalPaid < debt.amount) {
        derivedStatus = DebtStatus.PARTIALLY_PAID;
    } else {
        derivedStatus = DebtStatus.PAID
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
        const { totalPaid, remainingBalance, derivedStatus, isOverdue } = computeDebtState(
        debt,
        debt.payments,
    );

     return {
      debt: {
        id: debt.id,
        title: debt.title,
        description: debt.description,
        amount: debt.amount,
        interestRate: debt.interestRate,
        startDate: debt.startDate,
        dueDate: debt.dueDate,
        status: derivedStatus,
        notificationsEnabled: debt.notificationsEnabled,
        createdAt: debt.createdAt,
        debtorId: debt.debtorId,
        creditorId: debt.creditorId,
      },
      payments: debt.payments,
      totalPaid,
      remainingBalance,
      derivedStatus,
      isOverdue,
    };

    })
}

// for sync DB status with computed status
export async function syncDebtStatus(id: string): Promise<DebtModel> {
    const summary = await getDebtByIdWithSummary(id);

    return prisma.debt.update({
        where: { id },
        data: { status: summary.derivedStatus },
    });
}

