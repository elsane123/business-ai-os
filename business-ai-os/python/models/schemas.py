"""Pydantic schemas for Brainlo FastAPI service."""
from pydantic import BaseModel, Field
from typing import Optional, Any
from datetime import datetime


class FocusRequest(BaseModel):
    user_id: str
    business_name: str
    sector: Optional[str] = None
    monthly_goal: float = 0
    fixed_charges: float = 0
    wiki_context: Optional[str] = None  # pre-loaded wiki context from TS
    high_priority_tasks: list[dict] = []  # tâches HIGH priority pour enrichir le Focus
    skip_patterns: list[str] = []  # types d'actions souvent ignorées (pattern learning)


class FocusAction(BaseModel):
    priority: int  # 1, 2, 3
    action: str
    context: str
    why: str
    estimated_minutes: int = 30


class FocusResponse(BaseModel):
    actions: list[FocusAction]
    motivation: str
    generated_at: datetime = Field(default_factory=datetime.utcnow)


class RelanceRequest(BaseModel):
    user_id: str
    prospect_name: str
    company: str
    last_contact: Optional[str] = None
    status: str
    value: float
    context: Optional[str] = None  # wiki page content for this prospect
    tone: str = "professionnel"  # professionnel / décontracté / expert
    channel: str = "email"  # email / linkedin


class RelanceResponse(BaseModel):
    subject: Optional[str] = None  # for email
    message: str
    hook: str  # one-line hook
    channel: str


class LinkedInRequest(BaseModel):
    user_id: str
    post_type: str = "insight"  # insight / story / tips / question / case_study
    topic: Optional[str] = None
    context: Optional[str] = None  # wiki context
    business_name: Optional[str] = None
    sector: Optional[str] = None
    tone: str = "expert"  # expert / authentique / provocateur


class LinkedInResponse(BaseModel):
    content: str
    hook: str  # first line
    hashtags: list[str]
    post_type: str
    character_count: int


class WikiIngestRequest(BaseModel):
    user_id: str
    event_type: str  # prospect_created | transaction_added | free_text | etc.
    data: dict[str, Any]
    wiki_base_path: str


class WikiIngestResponse(BaseModel):
    pages_updated: list[str]
    log_entry: str
    success: bool


class WikiQueryRequest(BaseModel):
    user_id: str
    query: str
    wiki_base_path: str
    max_results: int = 5


class WikiQueryResult(BaseModel):
    path: str
    score: float
    snippet: str
    content: str


class WikiQueryResponse(BaseModel):
    results: list[WikiQueryResult]
    context_block: str  # pre-formatted context for LLM


class KBExtractRequest(BaseModel):
    user_id: str
    doc_id: str
    doc_name: str
    original_filename: str
    file_path: str
    category: str
    wiki_base_path: str


class KBExtractResponse(BaseModel):
    success: bool
    error: str
    page_count: int
    text_path: str


# ─── Task Prioritization ─────────────────────────────────────────────────────

class TaskProspectContext(BaseModel):
    name: str
    company: str | None = None
    status: str
    value: float = 0
    days_since_contact: int | None = None

class TaskInput(BaseModel):
    id: str
    title: str
    description: str | None = None
    category: Optional[str] = None  # CASH | CLIENTS | VISIBILITY | ADMIN
    status: str    # TODO | IN_PROGRESS
    estimated_minutes: int | None = None
    due_date: str | None = None
    linked_prospect: TaskProspectContext | None = None
    linked_invoice_id: str | None = None

class BusinessContext(BaseModel):
    cash_balance: float = 0
    monthly_goal: float = 0
    hot_prospects: list[dict] = []
    overdue_invoices: list[dict] = []

class TaskPrioritizeRequest(BaseModel):
    user_id: str
    tasks: list[TaskInput]
    context: BusinessContext

class TaskPriorityResult(BaseModel):
    task_id: str
    score: float
    priority: str  # HIGH | MEDIUM | LOW
    reason: str

class TaskPrioritizeResponse(BaseModel):
    results: list[TaskPriorityResult]


class WikiLintRequest(BaseModel):
    user_id: str
    wiki_base_path: str


class WikiLintResponse(BaseModel):
    success: bool
    pages_checked: int
    pages_cleaned: int
    bytes_freed: int
    issues: list[str] = []
