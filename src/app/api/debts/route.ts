import { NextRequest, NextResponse } from "next/server";
import { listDebtsWithSummary, createDebt } from "@/services/debt.service";
import { debtSchema } from "@/schemas/debt.schema"
import { ZodError } from 'zod';

// should create POST, UPDATE and ARCHIVE
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const debtInput = debtSchema.parse(body);
        const result = await createDebt(debtInput);

        return NextResponse.json(result, { status: 201 });
    } catch (err: unknown) {
        if (err instanceof ZodError) {
                    return NextResponse.json(
                        { 
                            error: "Validation failed", 
                            details: err.flatten().fieldErrors // Mas readable 'to sa frontend
                        }, 
                        { status: 400 }
                    );
                }
        if (err instanceof Error) {
            return NextResponse.json({ error: "Unknown error occured"}, { status: 500 });
        }
    }
}
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
