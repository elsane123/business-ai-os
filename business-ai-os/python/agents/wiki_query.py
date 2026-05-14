"""Agent: Recherche BM25 dans le wiki utilisateur et construit le contexte LLM."""
import re
from pathlib import Path
from math import log
from models.schemas import WikiQueryRequest, WikiQueryResponse, WikiQueryResult

# BM25 parameters
K1 = 1.5
B = 0.75
AVG_DOC_LEN = 500


async def query_wiki(req: WikiQueryRequest) -> WikiQueryResponse:
    """Search wiki pages using BM25 and return relevant results."""
    base = Path(req.wiki_base_path) / req.user_id

    if not base.exists():
        return WikiQueryResponse(results=[], context_block="Aucun wiki disponible pour cet utilisateur.")

    # Load all pages
    pages = _load_all_pages(base)
    if not pages:
        return WikiQueryResponse(results=[], context_block="Le wiki est vide.")

    # BM25 search
    query_tokens = _tokenize(req.query)
    if not query_tokens:
        return WikiQueryResponse(results=[], context_block="Requête vide.")

    scored: list[tuple[str, float, str]] = []
    for path, content in pages.items():
        score = _bm25_score(query_tokens, content)
        if score > 0:
            snippet = _extract_snippet(content, query_tokens)
            scored.append((path, score, snippet))

    scored.sort(key=lambda x: x[1], reverse=True)
    top = scored[:req.max_results]

    results = [
        WikiQueryResult(path=p, score=s, snippet=sn, content=pages[p])
        for p, s, sn in top
    ]

    # Build LLM context block
    brain_content = (base / "BRAIN.md").read_text(encoding="utf-8") if (base / "BRAIN.md").exists() else ""
    context_block = _build_context(brain_content, results)

    return WikiQueryResponse(results=results, context_block=context_block)


def _load_all_pages(base: Path) -> dict[str, str]:
    pages: dict[str, str] = {}
    for md_file in base.rglob("*.md"):
        try:
            rel = md_file.relative_to(base).with_suffix("")
            content = md_file.read_text(encoding="utf-8")
            pages[str(rel)] = content
        except Exception:
            continue
    return pages


def _build_context(brain: str, results: list[WikiQueryResult], max_chars: int = 4000) -> str:
    context = ""
    if brain:
        context += f"## Business Brain\n{brain[:600]}\n\n"

    remaining = max_chars - len(context)
    for r in results:
        section = f"## Wiki: {r.path}\n{r.content}\n\n"
        if len(section) > remaining:
            section = f"## Wiki: {r.path}\n{r.content[:remaining - 50]}...\n\n"
        context += section
        remaining -= len(section)
        if remaining <= 0:
            break

    return context


def _bm25_score(query_tokens: list[str], document: str) -> float:
    doc_tokens = _tokenize(document)
    doc_len = len(doc_tokens)
    tf: dict[str, int] = {}
    for t in doc_tokens:
        tf[t] = tf.get(t, 0) + 1

    score = 0.0
    for term in query_tokens:
        freq = tf.get(term, 0)
        if freq == 0:
            continue
        idf = log((1 + 1) / (1 + 1) + 1)  # simplified IDF with single corpus
        numer = freq * (K1 + 1)
        denom = freq + K1 * (1 - B + B * doc_len / AVG_DOC_LEN)
        score += idf * numer / denom
    return score


def _tokenize(text: str) -> list[str]:
    text = text.lower()
    # Remove accents
    text = re.sub(r'[àáâãäå]', 'a', text)
    text = re.sub(r'[èéêë]', 'e', text)
    text = re.sub(r'[ìíîï]', 'i', text)
    text = re.sub(r'[òóôõö]', 'o', text)
    text = re.sub(r'[ùúûü]', 'u', text)
    text = re.sub(r'[^a-z0-9\s]', ' ', text)
    return [t for t in text.split() if len(t) > 2]


def _extract_snippet(content: str, query_tokens: list[str], length: int = 200) -> str:
    lower = content.lower()
    best_pos = 0
    best_score = 0

    for token in query_tokens:
        pos = lower.find(token)
        if pos >= 0:
            window = lower[max(0, pos - 50): pos + length]
            score = sum(1 for t in query_tokens if t in window)
            if score > best_score:
                best_score = score
                best_pos = max(0, pos - 50)

    snippet = content[best_pos: best_pos + length].replace("\n", " ").strip()
    prefix = "..." if best_pos > 0 else ""
    return f"{prefix}{snippet}..."
