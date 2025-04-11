export const runtime = 'nodejs';
import fs from 'fs';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
    const body = await request.json();
    const { videoPath } = body;
    if (!videoPath) {
        return new Response('File path is required', { status: 400 });
    }
    const stat = fs.statSync(videoPath);
    const file = fs.createReadStream(videoPath);

    return new Response(file as any, {
        status: 200,
        headers: {
            'Content-Type': 'video/mp4',
            'Content-Length': stat.size.toString(),
            'Accept-Ranges': 'bytes',
        },
    });
}
