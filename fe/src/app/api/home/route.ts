import { NextResponse } from "next/server";

export async function GET(request: Request) {
    try {
        const response = await fetch(`${process.env.URL}`);
        if (!response.ok) {
            if (response.status == 404) {
                return NextResponse.json({data: JSON.stringify([])}, { status: 200 });
            }
            return NextResponse.json({ error: `HTTP error! ${process.env.URL} response != 200` }, { status: response.status });
        }
        const data = await response.json();
        return NextResponse.json({ data: JSON.stringify(data)}, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: `HTTP error! ${error}` }, { status: 500 });
    }
}