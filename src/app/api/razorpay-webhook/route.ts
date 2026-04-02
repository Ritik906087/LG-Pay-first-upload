import { NextResponse, NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
    return NextResponse.json(
        { message: "Payment system temporarily disabled" },
        { status: 503 }
    );
}
