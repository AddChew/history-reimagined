export const runtime = 'nodejs';
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Start the job
        const response = await fetch(`${process.env.URL}/prompt/start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            return NextResponse.json(
                { error: `Failed to start job: ${response.statusText}` }, 
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json({ jobId: data.job_id }, { status: 202 });
        
    } catch (error: any) {
        return NextResponse.json(
            { error: `Error: ${error.message}` }, 
            { status: 500 }
        );
    }
}