import os
import dashscope

from http import HTTPStatus
from dotenv import load_dotenv
from dashscope import Application


load_dotenv()
dashscope.base_http_api_url = os.getenv("DASHSCOPE_HTTP_BASE_URL")

response = Application.call(
    api_key = os.getenv("DASHSCOPE_API_KEY"),
    app_id = os.getenv("DASHSCOPE_APP_ID"),
    prompt = 'Life of a middle aged Singaporean male in the 1980s Singapore.')

if response.status_code != HTTPStatus.OK:
    print(f'request_id={response.request_id}')
    print(f'code={response.status_code}')
    print(f'message={response.message}')

else:
    print(response.output.text)