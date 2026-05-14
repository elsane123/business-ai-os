#!/bin/bash
cd /a0/usr/projects/business_ai_os/business-ai-os/python
export $(grep -v '^#' ../.env | xargs) 2>/dev/null
exec /opt/venv/bin/python3 -m uvicorn main:app --host 0.0.0.0 --port 8000
