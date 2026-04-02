import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({
        message: "Payment verification temporarily disabled",
        success: false
    });
}

export async function POST() {
    return NextResponse.json({
        message: "Payment verification temporarily disabled",
        success: false
    });
}
