export const runtime = 'nodejs';
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    try {
        const url = new URL(request.url);
        const jobId = url.searchParams.get('jobId');

        if (!jobId) {
            return NextResponse.json(
                { error: 'Missing jobId parameter' }, 
                { status: 400 }
            );
        }

        const response = await fetch(`${process.env.URL}/prompt/status/${jobId}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
            return NextResponse.json(
                { error: `Failed to get job status: ${response.statusText}` }, 
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data, { status: 200 });
        
    } catch (error: any) {
        return NextResponse.json(
            { error: `Error: ${error.message}` }, 
            { status: 500 }
        );
    }
}