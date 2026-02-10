import { NextRequest, NextResponse } from "next/server";
import { createPayment } from '@/services/payment.service'
import { paymentSchema } from "@/schemas/payment.schema";

export async function POST(req: NextRequest) {
    try {
        // Parse JSON Body
        const body = await req.json();

        // Validate using Zod
        const paymentInput = paymentSchema.parse(body)

        // Call service
        const result = await createPayment(paymentInput);

        // Return 201 Created with payment + debt info
        return NextResponse.json(result, {status: 201});
    } catch ( err: unknown ) {
        // handle Zod error
        if (err instanceof Error && "issues" in err) {
            return NextResponse.json({error: err.issues }, {status: 400 });
        }

        // Handle custom domain errors
        if (err instanceof Error) {
            return NextResponse.json({error: err.message}, {status:400});
        }

        // Fallback
        return NextResponse.json({error: "Unkown error"}, {status:500})
    }
}

// should create a POST api 