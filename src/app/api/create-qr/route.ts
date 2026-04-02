import { NextResponse } from 'next/server';

export async function POST() {
    return NextResponse.json({
        message: "Payment system temporarily disabled",
        success: false
    }, { status: 503 });
}

export async function GET() {
    return NextResponse.json({
        message: "Payment system temporarily disabled",
        success: false
    }, { status: 503 });
}
