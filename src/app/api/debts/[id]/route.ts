import { NextResponse } from "next/server";
import { getDebtByIdWithSummary } from "@/services/debt.service";

type RouteParams = {
    params: {
        id: string
    }
}

export async function GET(
    request: Request,
    { params }: RouteParams
) {
    try {
        const debtId = params.id

        if (!debtId) {
            return NextResponse.json(
                {error: "Debt ID is required"},
                {status: 400}
            )
        }
    
        const debtSummary = await getDebtByIdWithSummary(debtId)

        return NextResponse.json(
            debtSummary,
            { status: 200 }
        )
    } catch (err: unknown) {
        if (err instanceof Error) {
            if (err.message === "Debt not found") {
                return NextResponse.json(
                    { error: err.message},
                    {status:404}
                )
            }

            return NextResponse.json(
                {error: err.message},
                {status: 500}
            )
        }

        return NextResponse.json(
            {error: "Unknown error occured"},
            {status: 500}
        )
    }
}