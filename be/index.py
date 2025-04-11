import uvicorn
import argparse

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=8001)

    args = parser.parse_args()
    port = int(args.port)
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=port,
        log_level="debug",
        workers=1,
        reload=True)