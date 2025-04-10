export const runtime = 'edge';

export async function GET(request: Request) {
    try {
        const url = new URL(request.url);
        const jobId = url.searchParams.get('jobId');

        if (!jobId) {
            return new Response(
                JSON.stringify({ error: 'Missing jobId parameter' }), 
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // For debugging
        console.log(`Streaming text for job ID: ${jobId}`);

        // Forward request to backend
        const backendUrl = `${process.env.URL}/prompt/text/${jobId}`;
        console.log(`Connecting to backend: ${backendUrl}`);
        
        const response = await fetch(backendUrl);
        
        if (!response.ok) {
            console.error(`Backend error: ${response.status}`);
            return new Response(
                JSON.stringify({ error: `Backend error: ${response.status}` }), 
                { status: response.status, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Return a proper SSE stream
        return new Response(response.body, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache, no-transform',
                'Connection': 'keep-alive',
                'X-Accel-Buffering': 'no' // Important for Nginx
            }
        });
        
    } catch (error: any) {
        console.error(`Error in text streaming: ${error.message}`);
        return new Response(
            JSON.stringify({ error: `Error: ${error.message}` }), 
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}