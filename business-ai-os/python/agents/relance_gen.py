"""Agent: Génère des messages de relance personnalisés pour les prospects."""
import os
import httpx
from models.schemas import RelanceRequest, RelanceResponse

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
MODEL = os.getenv("OPENROUTER_MODEL", "anthropic/claude-3-haiku")


async def generate_relance(req: RelanceRequest) -> RelanceResponse:
    """Generate a personalized follow-up message for a prospect."""

    system_prompt = f"""Tu es un expert en vente B2B et copywriting de relance.
Tu rédiges des messages de relance courts, personnalisés et efficaces.
Ton style: {req.tone}. Canal: {req.channel}.

Règles:
- Maximum 150 mots pour email, 300 caractères pour LinkedIn
- Commencer par une accroche qui montre tu te souviens du contexte
- Apporter de la valeur, pas juste demander une réponse
- Call-to-action clair et simple
- Jamais de ton désespéré ou insistant
- Toujours en français sauf si le prospect a une langue différente"""

    context_block = req.context or "Pas de contexte wiki disponible."

    user_prompt = f"""Prospect à relancer:
- Nom: {req.prospect_name}
- Entreprise: {req.company}
- Dernier contact: {req.last_contact or 'inconnu'}
- Statut pipeline: {req.status}
- Valeur estimée: {req.value}€

Contexte wiki (historique interactions):
{context_block}

Génère:
1. Un message de relance pour {req.channel}
2. L'accroche (première phrase)
{f'3. Un objet email percutant' if req.channel == 'email' else ''}

Format de réponse:
ACCROCHE: [première ligne]
{f'OBJET: [objet email]' if req.channel == 'email' else ''}
MESSAGE:
[message complet]"""

    response_text = await _call_openrouter(system_prompt, user_prompt)

    # Parse structured response
    lines = response_text.strip().split("\n")
    hook = ""
    subject = None
    message_lines = []
    in_message = False

    for line in lines:
        if line.startswith("ACCROCHE:"):
            hook = line.replace("ACCROCHE:", "").strip()
        elif line.startswith("OBJET:"):
            subject = line.replace("OBJET:", "").strip()
        elif line.startswith("MESSAGE:"):
            in_message = True
        elif in_message:
            message_lines.append(line)

    message = "\n".join(message_lines).strip()
    if not message:
        message = response_text  # fallback to full text
    if not hook:
        hook = message.split("\n")[0][:100]

    return RelanceResponse(
        subject=subject,
        message=message,
        hook=hook,
        channel=req.channel,
    )


async def _call_openrouter(system: str, user: str) -> str:
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            f"{OPENROUTER_BASE_URL}/chat/completions",
            headers={
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "Content-Type": "application/json",
                "HTTP-Referer": os.getenv("NEXT_PUBLIC_APP_URL", "http://localhost:3000"),
                "X-Title": "Business AI OS",
            },
            json={
                "model": MODEL,
                "messages": [
                    {"role": "system", "content": system},
                    {"role": "user", "content": user},
                ],
                "temperature": 0.75,
                "max_tokens": 512,
            },
        )
        response.raise_for_status()
        return response.json()["choices"][0]["message"]["content"]
