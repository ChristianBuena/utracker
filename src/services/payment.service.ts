import { prisma } from '@/lib/prisma'
import { DebtModel, PaymentModel } from '@/generated/prisma/models'
import { PaymentInput } from '@/schemas/payment.schema'
import { DebtStatus } from '@/generated/prisma/enums'
import { Prisma } from '@/generated/prisma/client'
import { computeDebtState } from '@/services/debt.service'

export async function createPayment(input: PaymentInput) {
  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // fetch debt with full payments
    const debt = await tx.debt.findUnique({
      where: { id: input.debtId },
      include: {
        payments: true
      }
    })

    if (!debt) {
      throw new Error("Debt not found")
    }

    // reject if already fully paid
    if (debt.status === DebtStatus.PAID) {
      throw new Error("Debt is already fully paid")
    }

    // compute current state
    const { remainingBalance } = computeDebtState(
      debt,
      debt.payments
    )

    // prevent overpayment
    if (input.amount > remainingBalance) {
      throw new Error("Payment amount exceeds remaining balance")
    }

    // create payment
    const payment = await tx.payment.create({
      data: {
        amount: input.amount,
        paymentMethod: input.paymentMethod,
        proofUrl: input.proofUrl,
        paidAt: input.paidAt,
        debtId: input.debtId
      }
    })

    // recompute state with new payment included
    const { derivedStatus } = computeDebtState(
      debt,
      [...debt.payments, payment]
    )

    // update debt status
    const updatedDebt: DebtModel = await tx.debt.update({
      where: { id: debt.id },
      data: { status: derivedStatus }
    })

    return {
      payment,
      debt: updatedDebt,
      remainingBalance: remainingBalance - input.amount
    }
  })
}
