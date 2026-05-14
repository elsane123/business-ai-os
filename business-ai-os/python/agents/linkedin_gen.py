"""Agent: Génère des posts LinkedIn adaptés au business de l'utilisateur."""
import os
import re
import httpx
from models.schemas import LinkedInRequest, LinkedInResponse

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
MODEL = os.getenv("OPENROUTER_MODEL", "anthropic/claude-3-haiku")

POST_TYPE_PROMPTS = {
    "insight": "Un insight professionnel basé sur ton expertise. Structure: hook fort, développement en 3-4 points, conclusion actionnable.",
    "story": "Une histoire personnelle/professionnelle authentique. Structure: situation, défi, résolution, leçon apprise.",
    "tips": "Un post de conseils pratiques en liste. Structure: hook, 5-7 conseils numérotés, conclusion.",
    "question": "Un post qui invite à la discussion. Structure: contexte, question centrale, ta perspective, invitation à commenter.",
    "case_study": "Une étude de cas client (anonymisée si besoin). Structure: situation client, solution apportée, résultats chiffrés.",
}


async def generate_linkedin_post(req: LinkedInRequest) -> LinkedInResponse:
    """Generate a LinkedIn post tailored to the user's business."""

    post_instructions = POST_TYPE_PROMPTS.get(req.post_type, POST_TYPE_PROMPTS["insight"])
    context_block = req.context or ""

    system_prompt = f"""Tu es un expert en personal branding LinkedIn pour entrepreneurs B2B.
Tu génères des posts LinkedIn qui génèrent de l'engagement et positionnent l'auteur comme expert.

Ton style: {req.tone}
Type de post: {req.post_type}
Instructions: {post_instructions}

Règles absolues:
- Entre 800 et 1300 caractères (LinkedIn idéal)
- Première ligne = hook ultra-percutant (sans emoji au début)
- Utiliser des sauts de ligne pour aérer le texte
- 3-5 hashtags pertinents à la fin
- Ton authentique, pas corporate
- En français
- Jamais de "En tant qu'entrepreneur..."""

    topic_line = f"Sujet: {req.topic}" if req.topic else "Choisis le meilleur sujet en fonction du contexte."

    user_prompt = f"""Entreprise: {req.business_name or 'Non défini'}
Secteur: {req.sector or 'Non défini'}
{topic_line}

Contexte wiki (ce qui fonctionne, insights récents):
{context_block[:800] if context_block else 'Aucun contexte disponible.'}

Génère un post LinkedIn {req.post_type}.

Format:
HOOK: [première ligne]
CONTENU:
[post complet avec hashtags à la fin]"""

    response_text = await _call_openrouter(system_prompt, user_prompt)

    # Parse response
    hook = ""
    content = response_text

    lines = response_text.strip().split("\n")
    content_lines = []
    in_content = False

    for line in lines:
        if line.startswith("HOOK:"):
            hook = line.replace("HOOK:", "").strip()
        elif line.startswith("CONTENU:"):
            in_content = True
        elif in_content:
            content_lines.append(line)

    if content_lines:
        content = "\n".join(content_lines).strip()
    if not hook and content:
        hook = content.split("\n")[0][:100]

    # Extract hashtags
    hashtags = re.findall(r'#(\w+)', content)

    return LinkedInResponse(
        content=content,
        hook=hook,
        hashtags=hashtags[:7],
        post_type=req.post_type,
        character_count=len(content),
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
                "temperature": 0.8,
                "max_tokens": 800,
            },
        )
        response.raise_for_status()
        return response.json()["choices"][0]["message"]["content"]
