export const runtime = 'nodejs';
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Set up AbortController for long waits
        const controller = new AbortController();
        const timeout = setTimeout(() => {
            controller.abort(); // Never fires if not set, or set extremely high
        }, 1000*3600); // No timeout

        const response = await fetch(`${process.env.URL}/prompt`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            signal: controller.signal,
        });

        clearTimeout(timeout); // Clear timeout after response

        if (!response.ok) {
            if (response.status === 404) {
                return NextResponse.json({ data: JSON.stringify([]) }, { status: 200 });
            }
            return NextResponse.json({ error: `HTTP error! ${process.env.URL} response != 200` }, { status: response.status });
        }

        const data = await response.json();
        const respObject = { videoPath: data.video };

        return NextResponse.json(respObject, { status: 200 });
    } catch (error: any) {
        const message = error.name === 'AbortError'
            ? 'Request timed out'
            : `HTTP error! ${error}`;
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
