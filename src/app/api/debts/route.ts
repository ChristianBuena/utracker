import { NextResponse, NextRequest } from "next/server";
import { listDebtsWithSummary } from "@/services/debt.service";

// should create POST, UPDATE and ARCHIVE
export async function GET() {
    try {
        const debts = await listDebtsWithSummary()

        return NextResponse.json(
            { debts },
            {status: 200}
        )
    } catch (err: unknown) {
        if ( err instanceof Error ) {
            return NextResponse.json(
                { error: err.message},
                { status: 500 }
            )
        }

        return NextResponse.json(
            {error: "Unkown error occured"},
            { status: 500 }
        )
    }
}
