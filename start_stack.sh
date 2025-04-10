#!/bin/bash

cd /root/history-reimagined
mkdir -p /root/pm2
mkdir -p /root/applogs
PM2_HOME=/root/pm2/ pm2 ls

cd be
PM2_HOME=/root/pm2 pm2 start "python index.py" --name my-fastapi-app > /root/applogs/uvicorn.log 2>&1

cd ../fe
PM2_HOME=/root/pm2 PORT=80 pm2 start .next/standalone/server.js --name my-next-app > /root/applogs/next.log 2>&1
