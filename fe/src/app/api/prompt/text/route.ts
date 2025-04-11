export const runtime = 'nodejs'; // Use nodejs runtime

export async function GET(request: Request) {
    const url = new URL(request.url);
    const jobId = url.searchParams.get('jobId');

    if (!jobId) {
        return new Response(
            JSON.stringify({ error: 'Missing jobId parameter' }), 
            { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
    }

    try {
        // Forward to backend
        const backendUrl = `${process.env.URL}/prompt/text/${jobId}`;
        console.log(`Connecting to backend: ${backendUrl}`);

        // Create transform stream for processing events
        const { readable, writable } = new TransformStream();
        const writer = writable.getWriter();

        // Start the fetch in the background without awaiting
        fetch(backendUrl, {
            headers: { 'Accept': 'text/event-stream' },
        }).then(async response => {
            if (!response.ok) {
                const errorMsg = `Backend error: ${response.status}`;
                console.error(errorMsg);
                const encoder = new TextEncoder();
                writer.write(encoder.encode(`data: ${JSON.stringify({ error: errorMsg })}\n\n`));
                writer.close();
                return;
            }

            if (!response.body) {
                const errorMsg = "Response body is null";
                console.error(errorMsg);
                const encoder = new TextEncoder();
                writer.write(encoder.encode(`data: ${JSON.stringify({ error: errorMsg })}\n\n`));
                writer.close();
                return;
            }

            const reader = response.body.getReader();
            const encoder = new TextEncoder();
            const decoder = new TextDecoder();

            try {
                // Forward data from backend to client
                while (true) {
                    const { done, value } = await reader.read();
                    
                    if (done) {
                        console.log("Stream closed by backend");
                        writer.close();
                        break;
                    }
                    
                    // Forward the raw bytes without modifying them
                    writer.write(value);
                }
            } catch (error) {
                console.error("Error processing stream:", error);
                const errorMsg = `Stream processing error: ${error instanceof Error ? error.message : String(error)}`;
                writer.write(encoder.encode(`data: ${JSON.stringify({ error: errorMsg })}\n\n`));
                writer.close();
            }
        }).catch(error => {
            console.error("Fetch error:", error);
            const encoder = new TextEncoder();
            const errorMsg = `Fetch error: ${error instanceof Error ? error.message : String(error)}`;
            writer.write(encoder.encode(`data: ${JSON.stringify({ error: errorMsg })}\n\n`));
            writer.close();
        });

        // Return the readable stream immediately
        return new Response(readable, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache, no-transform',
                'Connection': 'keep-alive',
                'X-Accel-Buffering': 'no'
            }
        });
    } catch (error) {
        console.error(`Setup error: ${error instanceof Error ? error.message : String(error)}`);
        return new Response(
            JSON.stringify({ error: `Error setting up stream: ${error instanceof Error ? error.message : String(error)}` }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}