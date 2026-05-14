"""Business AI OS — FastAPI microservice for AI agents."""
import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from models.schemas import (
    KBExtractRequest, KBExtractResponse,
    FocusRequest, FocusResponse,
    RelanceRequest, RelanceResponse,
    LinkedInRequest, LinkedInResponse,
    WikiIngestRequest, WikiIngestResponse,
    WikiQueryRequest, WikiQueryResponse,
)
from models.schemas import TaskPrioritizeRequest, TaskPrioritizeResponse
from agents.daily_focus import generate_daily_focus
from agents.relance_gen import generate_relance
from agents.linkedin_gen import generate_linkedin_post
from agents.kb_extract import extract_document
from agents.wiki_ingest import ingest_wiki_event
from agents.wiki_query import query_wiki
from agents.task_prioritizer import prioritize_tasks

load_dotenv()

app = FastAPI(
    title="Business AI OS — Agent Service",
    description="Microservice Python pour les agents IA du Business AI OS",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("NEXT_PUBLIC_APP_URL", "http://localhost:3000")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "business-ai-os-agents", "version": "0.1.0"}


@app.post("/focus/generate", response_model=FocusResponse)
async def focus_generate(req: FocusRequest):
    """Generate the 3 priority actions for today based on user's wiki context."""
    try:
        return await generate_daily_focus(req)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/relance/generate", response_model=RelanceResponse)
async def relance_generate(req: RelanceRequest):
    """Generate a personalized follow-up message for a prospect."""
    try:
        return await generate_relance(req)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/linkedin/generate", response_model=LinkedInResponse)
async def linkedin_generate(req: LinkedInRequest):
    """Generate a LinkedIn post tailored to the user's business."""
    try:
        return await generate_linkedin_post(req)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/wiki/ingest", response_model=WikiIngestResponse)
async def wiki_ingest(req: WikiIngestRequest):
    """Ingest a business event into the user's wiki."""
    try:
        return await ingest_wiki_event(req)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/wiki/query", response_model=WikiQueryResponse)
async def wiki_query(req: WikiQueryRequest):
    """Search the user's wiki with BM25 and return relevant pages + LLM context."""
    try:
        return await query_wiki(req)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))




@app.post("/kb/extract", response_model=KBExtractResponse)
async def kb_extract(req: KBExtractRequest):
    """Extrait le texte d'un document et l'indexe dans le wiki KB."""
    try:
        return await extract_document(req)
    except Exception as e:
        return KBExtractResponse(success=False, error=str(e), page_count=0, text_path="")

@app.post("/tasks/prioritize", response_model=TaskPrioritizeResponse)
async def tasks_prioritize(req: TaskPrioritizeRequest):
    """Priorise les tâches actives selon le contexte business (LLM + règles)."""
    try:
        results = await prioritize_tasks(req.dict())
        return TaskPrioritizeResponse(results=results)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
