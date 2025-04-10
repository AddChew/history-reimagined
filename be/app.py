#type: ignore
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import time

from gradio_client import Client

from eas_prediction import PredictClient
from eas_prediction import StringRequest

gradio_client = Client('http://wan-2p1-13b-svc.5231743222387178.ap-northeast-1.pai-eas.aliyuncs.com', headers={
    "Authorization": "MTg0ZGM3ODYyOTU0NTk3OTcxYzc0NGJkNGM2MzFjZjMxNDYzNGViYQ=="
})
# breakpoint()
# gradio_client.headers["Authorization"] = "Bearer MTg0ZGM3ODYyOTU0NTk3OTcxYzc0NGJkNGM2MzFjZjMxNDYzNGViYQ=="

# client = PredictClient('http://wan-2p1-13b-svc.5231743222387178.ap-northeast-1.pai-eas.aliyuncs.com','wan_2p1_13b_svc')
# client.set_token('MTg0ZGM3ODYyOTU0NTk3OTcxYzc0NGJkNGM2MzFjZjMxNDYzNGViYQ==')    
# client.init()

app = FastAPI()

###-----MODELS-----###
class PromptPayload(BaseModel):
    prompt: str
    neg_prompt: str = ""
    resolution: str = "1280*720"
    seed: int = -1
    infer_steps: int = 10
    cfg_scale: int = 5
    api_name: str = "/generate_fn"


@app.get("/")
def read_home():
    return {"ping": "pong"}

@app.post("/prompt")
async def post_prompt(payload: PromptPayload):
    try:
        response = gradio_client.predict(
            prompt=payload.prompt,
            neg_prompt=payload.neg_prompt,
            resolution=payload.resolution,
            seed=payload.seed,
            infer_steps=payload.infer_steps,
            cfg_scale=payload.cfg_scale,
            api_name=payload.api_name
        )
        # request = StringRequest(f'["{payload.prompt}","{payload.neg_prompt}","{payload.resolution}","{payload.seed}","{payload.infer_steps}","{payload.cfg_scale}"]')    
        # breakpoint()
        # response = client.predict(request)
        # time.sleep(5)
        # response = {'video': '/private/var/folders/cd/_l90mdsn1cnbdwxdbqnxxs2w0000gn/T/gradio/a320e6219c318b2fe6528a1a91c6972be804c43d3ecbfedc2cb2d6cb3076f77a/3MlbbA.mp4', 'subtitles': None}
        return response
    except Exception as e:
        breakpoint()
        raise HTTPException(status_code=500, detail=str(e))