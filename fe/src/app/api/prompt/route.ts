export const runtime = 'edge';
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        
        const response = await fetch(`${process.env.URL}/prompt`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            if (response.status === 404) {
                return NextResponse.json({ data: JSON.stringify([]) }, { status: 200 });
            }
            return NextResponse.json({ error: `HTTP error! ${response.status}` }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json({ videoPath: data.video }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: `Error: ${error.message}` }, { status: 500 });
    }
}