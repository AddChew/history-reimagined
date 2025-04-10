#type: ignore
import os
from fastapi import FastAPI, HTTPException, BackgroundTasks, Request
import asyncio  # Import asyncio
import time
import uuid
import json
import random

from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Dict, Optional, List, AsyncGenerator
from concurrent.futures import ThreadPoolExecutor
from dotenv import load_dotenv

from http import HTTPStatus
from dashscope import Application
import dashscope


# Load environment variables from .env file
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env'))

dashscope.base_http_api_url = os.getenv("DASHSCOPE_HTTP_BASE_URL")
caption_app_id = os.getenv("CAPTION_DASHSCOPE_APP_ID")
caption_api_key = os.getenv("CAPTION_DASHSCOPE_API_KEY")
context_app_id = os.getenv("CONTEXT_DASHSCOPE_APP_ID")
context_api_key = os.getenv("CONTEXT_DASHSCOPE_API_KEY")
wan_api_key = os.getenv("WAN_API_KEY")
IS_DEBUG = os.getenv("IS_DEBUG", "False").lower() == "true"

from gradio_client import Client

app = FastAPI()

executor = ThreadPoolExecutor(max_workers=4)

# Job tracking storage
jobs: Dict[str, Dict] = {}

# Gradio client setup
gradio_client = Client('http://wan-2p1-13b-svc.5231743222387178.ap-northeast-1.pai-eas.aliyuncs.com', headers={
    "Authorization": wan_api_key
})

# Define assets directory path relative to the application
ASSETS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "assets")

# Ensure the assets directory exists
os.makedirs(ASSETS_DIR, exist_ok=True)

cache_video_data_demo = {
    "What lead to world war II and how was singapore involved? World  War  II  was caused": 
        [os.path.join(ASSETS_DIR, "jap_occupation_2.mp4")],
    "How did Singapore gained independence and how was life like after independence?": [
        os.path.join(ASSETS_DIR, "singapore_independence.mp4"),
        os.path.join(ASSETS_DIR, "singapore_independence_v2.mp4"),
    ]
}

###-----MODELS-----###
class PromptPayload(BaseModel):
    prompt: str
    neg_prompt: str = ""
    resolution: str = "1280*720"
    seed: int = -1
    infer_steps: int = 10
    cfg_scale: int = 5
    api_name: str = "/generate_fn"

class JobResponse(BaseModel):
    job_id: str
    status: str
    type: str = "video"

class JobStatus(BaseModel):
    job_id: str
    status: str
    completed: bool
    video: Optional[str] = None
    error: Optional[str] = None


def run_gradio_prediction(payload: PromptPayload, debug=IS_DEBUG):
    
    # Call gradio for prediction
    if not debug:
        response = gradio_client.predict(
            prompt=payload.prompt,
            neg_prompt=payload.neg_prompt,
            resolution=payload.resolution,
            seed=payload.seed,
            infer_steps=payload.infer_steps,
            cfg_scale=payload.cfg_scale,
            api_name=payload.api_name
        )
    else:
        # Simulate a long-running process
        # Convert prompt to lowercase and split into words set
        time.sleep(20)
        input_words = set(payload.prompt.lower().split())
        
        best_match = None
        max_overlap = 0
        
        # Find the best matching prompt in our cache
        for key in cache_video_data_demo.keys():
            cache_words = set(key.lower().split())
            # Calculate word intersection
            common_words = input_words.intersection(cache_words)
            # Jaccard similarity: intersection / union
            similarity = len(common_words) / len(input_words.union(cache_words))
            
            if similarity > max_overlap:
                max_overlap = similarity
                best_match = key
        
        # If we have a good match, return the cached video
        if best_match is not None:
            # Randomly select a video from the list instead of always taking the first one
            selected_video = random.choice(cache_video_data_demo[best_match])  # Random selection
            print(f"Found cached video for prompt with {max_overlap:.2f} similarity: {selected_video}")
            return {'video': selected_video, 'subtitles': None}
        
        # Fallback to default video
        print(f"No good match found (best was {max_overlap:.2f}), using default video")
        response = {'video': os.path.join(ASSETS_DIR, "jap_occupation_2.mp4"), 'subtitles': None}
    return response

# DashScope text generation function
def generate_text_blocking(prompt: str, api_key:str, app_id:str) -> List[str]:
    """Run text generation and return chunks as they're generated"""
    text_chunks = []
    try:
        responses = Application.call(
            api_key=api_key, 
            app_id=app_id,
            prompt=prompt,
            stream=True,  # Streaming output
            incremental_output=True)  # Incremental output

        for response in responses:
            if response.status_code == HTTPStatus.OK:
                chunk = response.output.text
                text_chunks.append(chunk)
    except Exception as e:
        text_chunks.append(f"Error generating text: {str(e)}")
    return text_chunks


async def process_job(job_id: str, payload: PromptPayload):
    try:
        # Update job status
        jobs[job_id]['status'] = 'processing'
        jobs[job_id]['text_chunks'] = []
        
        caption_task = asyncio.get_event_loop().run_in_executor(
            executor,
            generate_text_blocking,
            payload.prompt,
            caption_api_key,
            caption_app_id
        )

        # Wait for caption text generation to complete
        caption_text_chunks = await caption_task
        jobs[job_id]['caption_text_chunks'] = " ".join(caption_text_chunks)
        jobs[job_id]['caption_text_completed'] = True

        text_to_video_prompt = PromptPayload(
            prompt=jobs[job_id]['caption_text_chunks'],
            neg_prompt=payload.neg_prompt,
            resolution=payload.resolution,
            seed=payload.seed,
            infer_steps=payload.infer_steps,
            cfg_scale=payload.cfg_scale,
            api_name=payload.api_name
        )

        video_task = asyncio.get_event_loop().run_in_executor(
            executor, 
            run_gradio_prediction,
            text_to_video_prompt
        )
        
        context_task = asyncio.get_event_loop().run_in_executor(
            executor,
            generate_text_blocking,
            payload.prompt,
            context_api_key,
            context_app_id
        )
        
        # Wait for video generation to complete
        video_result = await video_task
        jobs[job_id]['status'] = 'completed'
        jobs[job_id]['completed'] = True
        jobs[job_id]['video'] = video_result.get('video')
        
        # Wait for context text generation to complete
        context_text_chunks = await context_task
        joined_context_text = "Cant find context from Knowledge Base or context DASH returned empty"
        if len(context_text_chunks) > 0:
            joined_context_text = context_text_chunks[-1]
        jobs[job_id]['context_text_chunks'] = joined_context_text
        jobs[job_id]['context_text_completed'] = True
        
    except Exception as e:
        # Update job with error
        jobs[job_id]['status'] = 'failed'
        jobs[job_id]['completed'] = True
        jobs[job_id]['error'] = str(e)

@app.get("/")
def read_home():
    return {"ping": "pong"}

@app.post("/prompt/start", response_model=JobResponse)
async def start_prompt_job(payload: PromptPayload, background_tasks: BackgroundTasks):
    # Create a unique job ID
    job_id = str(uuid.uuid4())
    
    # Store job information
    jobs[job_id] = {
        'status': 'queued',
        'completed': False,
        'created_at': time.time(),
        'prompt': payload.prompt,
        'text_chunks': []  # Initialize empty text_chunks
    }
    
    # Use asyncio.create_task instead of background_tasks
    asyncio.create_task(process_job(job_id, payload))
    
    return {"job_id": job_id, "status": "queued"}

@app.get("/prompt/status/{job_id}", response_model=JobStatus)
async def get_job_status(job_id: str):
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job = jobs[job_id]
    
    return {
        "job_id": job_id,
        "status": job.get("status", "unknown"),
        "completed": job.get("completed", False),
        "video": job.get("video"),
        "error": job.get("error")
    }



@app.get("/prompt/text/{job_id}")
async def stream_text(job_id: str, request: Request):
    """Stream text as it's generated"""
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job = jobs[job_id]
    
    async def generate_stream():
        # Return chunks that have already been generated
        sent_chunks = 0
        
        while True:
            # Check for client disconnect
            if await request.is_disconnected():
                break
                
            # Get current chunks
            current_chunks = job.get('context_text_chunks', [])
            
            # Send any new chunks
            while sent_chunks < len(current_chunks):
                yield f"data: {json.dumps({'text': current_chunks[sent_chunks]})}\n\n"
                sent_chunks += 1
            
            # If text generation is complete, send completion message and exit
            if job.get('text_completed', False):
                yield f"data: {json.dumps({'done': True})}\n\n"
                break
                
            # If there was an error, send it
            if job.get('error'):
                yield f"data: {json.dumps({'error': job.get('error')})}\n\n"
                break
                
            # Wait before checking again
            await asyncio.sleep(0.5)
    
    return StreamingResponse(
        generate_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )
