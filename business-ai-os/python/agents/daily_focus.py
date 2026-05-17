"""Agent: Génère le Daily Focus — 3 actions prioritaires du jour."""
import os
import json
import httpx
from models.schemas import FocusRequest, FocusResponse, FocusAction

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
MODEL = os.getenv("OPENROUTER_MODEL", "anthropic/claude-3-haiku")


async def generate_daily_focus(req: FocusRequest) -> FocusResponse:
    """Generate 3 priority actions for today based on wiki context."""

    wiki_context = req.wiki_context or _build_fallback_context(req)

    system_prompt = """Tu es un conseiller business expert pour entrepreneurs solos et PME.
Tu analyses le contexte business d'un entrepreneur et génères exactement 3 actions prioritaires
pour aujourd'hui. Tes recommandations sont concrètes, actionnables en moins d'une journée,
et directement liées aux objectifs business.
Réponds TOUJOURS en JSON valide avec ce format exact:
{
  "actions": [
    {
      "priority": 1,
      "action": "Action concrète et précise",
      "context": "Contexte et détails de l'action",
      "why": "Pourquoi c'est prioritaire aujourd'hui",
      "estimated_minutes": 30
    }
  ],
  "motivation": "Message de motivation court (1 phrase)"
}"""

    user_prompt = f"""Voici le contexte business actuel:

{wiki_context}

---
Objectif CA mensuel: {req.monthly_goal}€
Charges fixes: {req.fixed_charges}€/mois
Entreprise: {req.business_name} ({req.sector or 'secteur non défini'})

Génère les 3 actions les plus importantes pour aujourd'hui.
Focalise-toi sur ce qui génère du CA ou protège la trésorerie en priorité."""

    # Enrichir avec les tâches haute priorité si disponibles
    if req.high_priority_tasks:
        tasks_section = "\n\n---\n🔴 TÂCHES HAUTE PRIORITÉ À INTÉGRER DANS LE FOCUS :\n"
        for t in req.high_priority_tasks[:3]:
            line = f"- [{t.get('category','?')}] {t.get('title','')}"
            if t.get('ai_reason'):
                line += f" → {t.get('ai_reason')}"
            if t.get('estimated_minutes'):
                line += f" (⏱ {t.get('estimated_minutes')} min)"
            if t.get('due_date'):
                line += f" (échéance: {t.get('due_date')[:10]})"
            tasks_section += line + "\n"
        tasks_section += "\nSi ces tâches sont urgentes, intègre-les directement dans les 3 actions du Focus."
        user_prompt += tasks_section

    # Injecter les patterns d'actions ignorées (pattern learning)
    if req.skip_patterns:
        skip_section = "\n\n---\n⚠️ PATTERNS D'ACTIONS SOUVENT IGNORÉES PAR CET ENTREPRENEUR :\n"
        for pattern in req.skip_patterns:
            skip_section += f"- '{pattern}'\n"
        skip_section += (
            "\nCes types d'actions ont été ignorés plus de 60% du temps ces 30 derniers jours. "
            "Évite de reproduire les mêmes formulations. "
            "Propose des variantes plus actionnables, plus courtes, ou reformule différemment. "
            "Si l'action reste nécessaire, change l'angle d'approche ou décompose-la en étape plus petite."
        )
        user_prompt += skip_section

    response_text = await _call_openrouter(system_prompt, user_prompt)

    try:
        # Clean potential markdown code blocks
        cleaned = response_text.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[1]
            cleaned = cleaned.rsplit("```", 1)[0]

        data = json.loads(cleaned)
        actions = [FocusAction(**a) for a in data.get("actions", [])]
        motivation = data.get("motivation", "Chaque action compte. Avancez pas à pas.")
    except (json.JSONDecodeError, KeyError):
        # Fallback if JSON parsing fails
        actions = [
            FocusAction(
                priority=1,
                action="Relancer vos 3 prospects les plus chauds",
                context="Envoyez un message personnalisé à chaque prospect en attente de réponse",
                why="La relance régulière est la source #1 de conversion",
                estimated_minutes=45,
            )
        ]
        motivation = "Focus sur ce qui génère du CA aujourd'hui."

    return FocusResponse(actions=actions, motivation=motivation)


def _build_fallback_context(req: FocusRequest) -> str:
    return f"""Entreprise: {req.business_name}
Secteur: {req.sector or 'Non défini'}
Objectif CA mensuel: {req.monthly_goal}€
Charges fixes: {req.fixed_charges}€/mois

Aucun contexte wiki disponible. Base-toi sur les informations génériques."""


async def _call_openrouter(system: str, user: str) -> str:
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            f"{OPENROUTER_BASE_URL}/chat/completions",
            headers={
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "Content-Type": "application/json",
                "HTTP-Referer": os.getenv("NEXT_PUBLIC_APP_URL", "http://localhost:3000"),
                "X-Title": "Brainlo",
            },
            json={
                "model": MODEL,
                "messages": [
                    {"role": "system", "content": system},
                    {"role": "user", "content": user},
                ],
                "temperature": 0.6,
                "max_tokens": 1024,
                "response_format": {"type": "json_object"},
            },
        )
        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"]
