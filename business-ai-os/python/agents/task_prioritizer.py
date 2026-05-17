"""Agent de priorisation des tâches Brainlo.

Analyse les tâches actives et leur attribue un score 0-100
en fonction du contexte business (cash, prospects, échéances).
"""

import os
import json
import httpx
from datetime import datetime
from typing import Any

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "anthropic/claude-3-haiku")


def _days_until(date_str: str | None) -> int | None:
    """Nombre de jours jusqu'à une date ISO."""
    if not date_str:
        return None
    try:
        target = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
        delta = target.replace(tzinfo=None) - datetime.now()
        return delta.days
    except Exception:
        return None


def _rule_based_score(task: dict, context: dict) -> tuple[int, str]:
    """Scoring rapide basé sur des règles métier (fallback sans LLM)."""
    score = 50
    reasons = []

    category = task.get("category", "ADMIN")
    due_days = _days_until(task.get("due_date"))
    cash_balance = context.get("cash_balance", 0)
    monthly_goal = context.get("monthly_goal", 0)
    prospect = task.get("linked_prospect")

    # Règle 1 : catégorie CASH = priorité haute si cash faible
    if category == "CASH":
        score += 20
        if monthly_goal > 0 and cash_balance < monthly_goal * 0.3:
            score += 20
            reasons.append("Cash critique (< 30% objectif)")
        elif monthly_goal > 0 and cash_balance < monthly_goal * 0.6:
            score += 10
            reasons.append("Cash sous objectif")

    # Règle 2 : prospect lié sans contact depuis > 7 jours
    if prospect:
        days_since = prospect.get("days_since_contact")
        if days_since is not None:
            if days_since > 14:
                score += 25
                reasons.append(f"Prospect {prospect.get('name')} sans contact depuis {days_since}j")
            elif days_since > 7:
                score += 15
                reasons.append(f"Prospect {prospect.get('name')} à relancer")

        prospect_value = prospect.get("value", 0)
        if prospect_value > 5000:
            score += 15
            reasons.append(f"Deal {prospect_value:,.0f}€")
        elif prospect_value > 2000:
            score += 8

        prospect_status = prospect.get("status", "")
        if prospect_status in ["NEGOTIATION", "PROPOSAL"]:
            score += 10
            reasons.append("Deal en négociation")

    # Règle 3 : échéance imminente
    if due_days is not None:
        if due_days < 0:
            score += 30
            reasons.append(f"En retard de {abs(due_days)}j")
        elif due_days == 0:
            score += 25
            reasons.append("À faire aujourd'hui")
        elif due_days <= 2:
            score += 20
            reasons.append(f"Échéance dans {due_days}j")
        elif due_days <= 7:
            score += 10
            reasons.append(f"Échéance dans {due_days}j")

    # Règle 4 : factures impayées liées
    overdue_invoices = context.get("overdue_invoices", [])
    if task.get("linked_invoice_id") and overdue_invoices:
        score += 20
        reasons.append("Facture impayée liée")

    # Plafonnement
    score = min(100, max(0, score))

    if score >= 75:
        priority = "HIGH"
    elif score >= 40:
        priority = "MEDIUM"
    else:
        priority = "LOW"

    reason = " · ".join(reasons) if reasons else _default_reason(category)
    return score, priority, reason


def _default_reason(category: str) -> str:
    defaults = {
        "CASH": "Tâche financière à traiter",
        "CLIENTS": "Action commerciale",
        "VISIBILITY": "Action de visibilité",
        "ADMIN": "Tâche administrative",
    }
    return defaults.get(category, "Tâche à traiter")


async def prioritize_tasks(payload: dict) -> list[dict]:
    """Priorise les tâches avec le LLM, fallback sur règles si erreur."""
    tasks = payload.get("tasks", [])
    context = payload.get("context", {})

    if not tasks:
        return []

    # Toujours calculer le score basé sur les règles en premier
    rule_results = []
    for task in tasks:
        score, priority, reason = _rule_based_score(task, context)
        rule_results.append({
            "task_id": task["id"],
            "score": score,
            "priority": priority,
            "reason": reason,
        })

    # Enrichissement LLM si la clé API est disponible
    if not OPENROUTER_API_KEY:
        return rule_results

    try:
        tasks_summary = []
        for t in tasks:
            entry = f"- [{t['category']}] {t['title']}"
            if t.get("linked_prospect"):
                p = t["linked_prospect"]
                entry += f" (prospect: {p.get('name')}, {p.get('value', 0)}€, statut: {p.get('status')})"
            if t.get("due_date"):
                days = _days_until(t["due_date"])
                entry += f" (échéance: J{days:+d})"
            tasks_summary.append(entry)

        cash_pct = 0
        if context.get("monthly_goal", 0) > 0:
            cash_pct = round(context["cash_balance"] / context["monthly_goal"] * 100)

        system_prompt = """Tu es un CFO IA pour solopreneurs. Analyse les tâches et attribue à chacune:
- score: entier 0-100 (impact business)
- priority: HIGH | MEDIUM | LOW
- reason: explication courte et percutante en français (max 80 chars)

Règle d'or : Cash > Clients actifs > Visibilité > Admin
Réponds UNIQUEMENT en JSON : {"results": [{"task_id": "...", "score": 85, "priority": "HIGH", "reason": "..."}]}"""

        user_message = f"""Contexte business :
- Cash : {context.get('cash_balance', 0):,.0f}€ ({cash_pct}% de l'objectif mensuel)
- Objectif mensuel : {context.get('monthly_goal', 0):,.0f}€
- Factures impayées : {len(context.get('overdue_invoices', []))}
- Prospects actifs : {len(context.get('hot_prospects', []))}

Tâches à prioriser :
{chr(10).join(tasks_summary)}

Scores actuels (règles) pour référence :
{json.dumps([{"id": r["task_id"], "score": r["score"]} for r in rule_results], ensure_ascii=False)}"""

        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://business-ai-os.app",
                },
                json={
                    "model": OPENROUTER_MODEL,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_message},
                    ],
                    "temperature": 0.3,
                    "max_tokens": 1000,
                },
            )

        if resp.status_code == 200:
            content = resp.json()["choices"][0]["message"]["content"]
            # Extraire le JSON
            start = content.find("{")
            end = content.rfind("}") + 1
            if start != -1 and end > start:
                data = json.loads(content[start:end])
                llm_results = data.get("results", [])
                if llm_results and len(llm_results) == len(tasks):
                    return llm_results

    except Exception as e:
        print(f"[task_prioritizer] LLM error, using rule-based: {e}")

    return rule_results


async def get_high_priority_tasks_for_focus(user_id: str, db_url: str = None) -> list[dict]:
    """Retourne les tâches HIGH priority pour le Daily Focus.
    Appelé par daily_focus.py pour enrichir les actions du jour.
    """
    # Cette fonction est appelée en interne par daily_focus.py
    # Elle retourne les tâches HIGH priority via l'API Next.js
    # (le daily_focus agent reçoit déjà les tâches dans son payload)
    return []
