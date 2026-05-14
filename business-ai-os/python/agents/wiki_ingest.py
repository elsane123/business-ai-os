"""Agent: Ingère des événements business dans le wiki utilisateur."""
import os
import re
import json
from pathlib import Path
from datetime import datetime
from models.schemas import WikiIngestRequest, WikiIngestResponse


async def ingest_wiki_event(req: WikiIngestRequest) -> WikiIngestResponse:
    """Process a business event and update the appropriate wiki pages."""
    base = Path(req.wiki_base_path) / req.user_id
    pages_updated: list[str] = []
    log_entry = ""

    # Ensure wiki directories exist
    _ensure_wiki_structure(base)

    event_type = req.event_type
    data = req.data

    if event_type in ("prospect_created", "prospect_updated"):
        pages, log = _handle_prospect(base, data, event_type)
        pages_updated.extend(pages)
        log_entry = log

    elif event_type == "transaction_added":
        pages, log = _handle_transaction(base, data)
        pages_updated.extend(pages)
        log_entry = log

    elif event_type == "post_published":
        pages, log = _handle_post(base, data)
        pages_updated.extend(pages)
        log_entry = log

    elif event_type == "free_text":
        pages, log = _handle_free_text(base, data)
        pages_updated.extend(pages)
        log_entry = log


    elif event_type == "onboarding_complete":
        pages, log = _handle_onboarding_complete(base, data)
        pages_updated.extend(pages)
        log_entry = log

    else:
        log_entry = f"Event {event_type}: {json.dumps(data)[:200]}"

    # Append to log
    _append_log(base, event_type, log_entry)

    return WikiIngestResponse(
        pages_updated=pages_updated,
        log_entry=log_entry,
        success=True,
    )


def _handle_prospect(base: Path, data: dict, event_type: str) -> tuple[list[str], str]:
    name = data.get("name", "Inconnu")
    company = data.get("company", "")
    status = data.get("status", "IDENTIFIED")
    value = data.get("value", 0)
    notes = data.get("notes", "")
    email = data.get("email", "")

    slug = _to_slug(company or name)
    page_path = base / "prospects" / f"{slug}.md"
    action = "créé" if event_type == "prospect_created" else "mis à jour"

    if page_path.exists():
        existing = page_path.read_text(encoding="utf-8")
        # Update status line
        updated = re.sub(r'\*\*Statut\*\*:.*', f'**Statut**: {status}', existing)
        if notes:
            updated += f"\n### Mise à jour {datetime.now().strftime('%d/%m/%Y')}\n{notes}\n"
        page_path.write_text(updated, encoding="utf-8")
    else:
        content = f"""# Prospect: {name} — {company or 'N/A'}

## Informations
- **Nom**: {name}
- **Entreprise**: {company or 'N/A'}
- **Email**: {email or 'N/A'}
- **Statut**: {status}
- **Valeur estimée**: {value}€
- **Créé le**: {datetime.now().strftime('%d/%m/%Y')}

## Historique des interactions
_Aucune interaction enregistrée._

## Prochaines étapes
- [ ] Qualifier le besoin
- [ ] Proposer une démo ou un appel

## Notes
{notes or '_Aucune note._'}
"""
        page_path.write_text(content, encoding="utf-8")

    rel_path = f"prospects/{slug}"
    log = f"**{name}** ({company or 'N/A'}) — {action} — Statut: {status} — Valeur: {value}€"
    return [rel_path], log


def _handle_transaction(base: Path, data: dict) -> tuple[list[str], str]:
    amount = data.get("amount", 0)
    tx_type = data.get("type", "INCOME")
    category = data.get("category", "Autre")
    description = data.get("description", "")
    date = data.get("date", datetime.now().isoformat())

    sign = "+" if tx_type == "INCOME" else "-"
    month = datetime.fromisoformat(date[:10]).strftime("%B %Y")
    date_str = datetime.fromisoformat(date[:10]).strftime("%d/%m/%Y")

    entry = f"- {date_str} | {sign}{amount}€ | {category} | {description}"
    page_path = base / "finance" / "patterns.md"

    if page_path.exists():
        content = page_path.read_text(encoding="utf-8")
        section_header = f"## Transactions {month}"
        if section_header in content:
            content = content.replace(section_header, f"{section_header}\n{entry}")
        else:
            content += f"\n\n{section_header}\n{entry}\n"
        page_path.write_text(content, encoding="utf-8")
    else:
        page_path.write_text(f"# Patterns Financiers\n\n## Transactions {month}\n{entry}\n", encoding="utf-8")

    log = f"{sign}{amount}€ — {category} — {description or 'sans description'}"
    return ["finance/patterns"], log


def _handle_post(base: Path, data: dict) -> tuple[list[str], str]:
    content = data.get("content", "")
    impressions = data.get("impressions", 0)
    engagement = data.get("engagement", 0)
    post_type = data.get("postType", "insight")

    rate = round((engagement / impressions * 100), 1) if impressions > 0 else 0
    perf = "🔥 Viral" if impressions > 500 else ("✅ Bon" if impressions > 100 else "📉 Faible")

    entry = f"""### Post {datetime.now().strftime('%d/%m/%Y')} — {perf}
**Type**: {post_type} | **Impressions**: {impressions} | **Engagement**: {engagement} ({rate}%)

> {content[:200]}...
"""
    page_path = base / "content" / "what-works.md"
    if page_path.exists():
        existing = page_path.read_text(encoding="utf-8")
        page_path.write_text(existing + "\n" + entry, encoding="utf-8")
    else:
        page_path.write_text(f"# Ce qui Fonctionne sur LinkedIn\n\n{entry}", encoding="utf-8")

    log = f"{perf} — {impressions} impressions — taux {rate}%"
    return ["content/what-works"], log


def _handle_free_text(base: Path, data: dict) -> tuple[list[str], str]:
    text = data.get("text", "")
    # Store in a notes file for now (without LLM call in Python - TS handles LLM)
    notes_path = base / "business" / "notes.md"
    date_str = datetime.now().strftime("%d/%m/%Y %H:%M")
    entry = f"\n## Note {date_str}\n{text}\n"
    if notes_path.exists():
        notes_path.write_text(notes_path.read_text(encoding="utf-8") + entry, encoding="utf-8")
    else:
        notes_path.write_text(f"# Notes Business\n{entry}", encoding="utf-8")
    return ["business/notes"], f"Note libre: {text[:100]}"


def _ensure_wiki_structure(base: Path) -> None:
    for sub in ["", "prospects", "business", "finance", "content"]:
        (base / sub).mkdir(parents=True, exist_ok=True)


def _append_log(base: Path, event_type: str, summary: str) -> None:
    log_path = base / "log.md"
    timestamp = datetime.now().isoformat()
    entry = f"\n## [{timestamp}] {event_type}\n{summary}\n"
    if log_path.exists():
        log_path.write_text(log_path.read_text(encoding="utf-8") + entry, encoding="utf-8")
    else:
        log_path.write_text(f"# Journal Wiki\n{entry}", encoding="utf-8")


def _to_slug(s: str) -> str:
    s = s.lower().strip()
    s = re.sub(r'[àáâãäå]', 'a', s)
    s = re.sub(r'[èéêë]', 'e', s)
    s = re.sub(r'[ìíîï]', 'i', s)
    s = re.sub(r'[òóôõö]', 'o', s)
    s = re.sub(r'[ùúûü]', 'u', s)
    s = re.sub(r'[^a-z0-9]+', '-', s)
    return s.strip('-')[:60]


def _handle_onboarding_complete(base: Path, data: dict) -> tuple[list[str], str]:
    """Enrichit la wiki avec toutes les données collectées lors de l'onboarding."""
    pages_updated = []
    now = datetime.now().strftime('%d/%m/%Y')

    business_name   = data.get('businessName', 'Mon Entreprise')
    sector          = data.get('sector', '')
    monthly_goal    = data.get('monthlyGoal', 0)
    fixed_charges   = data.get('fixedCharges', 0)
    description     = data.get('description', '')
    offer_type      = data.get('offerType', '')
    offer_desc      = data.get('offerDescription', '')
    price_range     = data.get('priceRange', '')
    duration        = data.get('typicalDuration', '')
    target_client   = data.get('targetClient', '')
    pain_point      = data.get('clientPainPoint', '')
    value_prop      = data.get('valueProposition', '')
    competitors     = data.get('competitors', '')
    differentiator  = data.get('differentiator', '')
    city            = data.get('city', '')
    country         = data.get('country', '')
    target_geo      = data.get('targetGeography', '')
    languages       = data.get('workLanguages', '')
    brief_content   = data.get('briefContent', '')

    # ── 1. BRAIN.md enrichi ──────────────────────────────────────────────────
    brain_path = base / 'BRAIN.md'
    brain_content = f"""# Business Brain — {business_name}
_Généré lors de l'onboarding le {now}_

## Identité
- **Entreprise** : {business_name}
- **Secteur** : {sector}
- **Localisation** : {city}{', ' + country if country else ''}
- **Zone de prospection** : {target_geo}
- **Langues** : {languages}

## Activité
{description}

## Offre Principale
- **Type** : {offer_type}
- **Panier moyen** : {price_range}
- **Durée typique** : {duration}
{('- **Description** : ' + offer_desc) if offer_desc else ''}

## Proposition de Valeur
{value_prop or '_À définir_'}

## Finances
- **Objectif CA mensuel** : {monthly_goal}€
- **Charges fixes** : {fixed_charges}€
- **Marge cible** : {int(monthly_goal) - int(fixed_charges) if monthly_goal and fixed_charges else '_À calculer_'}€

## Différenciateur
{differentiator or '_À définir_'}

## Conventions pour les agents IA
- Toujours prioriser les actions cash-first
- Adapter le ton au secteur : {sector}
- Prospecter en priorité dans la zone : {target_geo}
- Langue de travail principale : {languages}
"""
    brain_path.write_text(brain_content, encoding='utf-8')
    pages_updated.append('BRAIN')

    # ── 2. business/icp.md ───────────────────────────────────────────────────
    if target_client or pain_point:
        icp_path = base / 'business' / 'icp.md'
        icp_path.parent.mkdir(parents=True, exist_ok=True)
        icp_content = f"""# Profil Client Idéal (ICP)
_Défini lors de l'onboarding — {now}_

## Qui est mon client idéal ?
{target_client or '_À définir_'}

## Problème principal résolu
{pain_point or '_À définir_'}

## Proposition de valeur
{value_prop or '_À définir_'}

## Signaux d'achat à détecter
- Mentionne le problème de {pain_point[:50] if pain_point else '_'}
- Cherche une solution dans la zone {target_geo}
- Budget cohérent avec la fourchette {price_range}

## Deals gagnés
_Les deals gagnés seront automatiquement ajoutés ici pour affiner l'ICP._

## Deals perdus
_Les deals perdus et leurs raisons seront analysés ici._
"""
        icp_path.write_text(icp_content, encoding='utf-8')
        pages_updated.append('business/icp')

    # ── 3. content/competitors.md ────────────────────────────────────────────
    if competitors:
        comp_path = base / 'content' / 'competitors.md'
        comp_path.parent.mkdir(parents=True, exist_ok=True)
        comp_lines = ['- ' + c.strip() for c in competitors.split(',') if c.strip()]
        comp_content = f"""# Intelligence Concurrentielle
_Initialisée lors de l'onboarding — {now}_

## Concurrents identifiés
{chr(10).join(comp_lines) if comp_lines else competitors}

## Notre différenciateur
{differentiator or '_À préciser_'}

## Angles de contenu pour se différencier
_Cet espace sera enrichi automatiquement au fil des publications._

## Veille concurrentielle
_Les publications et mouvements des concurrents seront trackés ici._
"""
        comp_path.write_text(comp_content, encoding='utf-8')
        pages_updated.append('content/competitors')

    # ── 4. business/messages.md ──────────────────────────────────────────────
    if value_prop:
        msg_path = base / 'business' / 'messages.md'
        msg_path.parent.mkdir(parents=True, exist_ok=True)
        msg_content = f"""# Messages Commerciaux
_Initialisé lors de l'onboarding — {now}_

## Proposition de valeur principale
> {value_prop}

## Message de connexion LinkedIn (template)
Bonjour [Prénom],

Je vois que vous travaillez sur [contexte ICP]. {value_prop[:80] if value_prop else ''}.

Ça vous parlerait d'en discuter 20 min ?

Bonne journée,

## Messages qui convertissent
_Les messages avec un bon taux de réponse seront ajoutés ici automatiquement._

## Messages qui n'ont pas converti
_Les messages ignorés ou refusés seront analysés pour améliorer l'approche._
"""
        msg_path.write_text(msg_content, encoding='utf-8')
        pages_updated.append('business/messages')

    # ── 5. business/documentation.md (brief collé) ──────────────────────────
    if brief_content and len(brief_content.strip()) > 50:
        doc_path = base / 'business' / 'documentation.md'
        doc_path.parent.mkdir(parents=True, exist_ok=True)
        doc_content = f"""# Documentation Commerciale
_Importée lors de l'onboarding — {now}_

{brief_content}
"""
        doc_path.write_text(doc_content, encoding='utf-8')
        pages_updated.append('business/documentation')

    log = (f"Onboarding complet — {business_name} ({sector}) — "
           f"{len(pages_updated)} pages wiki créées : {', '.join(pages_updated)}")
    return pages_updated, log
