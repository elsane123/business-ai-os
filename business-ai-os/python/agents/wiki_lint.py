"""Agent: Wiki Lint hebdomadaire — nettoie et consolide le wiki utilisateur."""
import re
from pathlib import Path
from datetime import datetime, timedelta
from models.schemas import WikiLintRequest, WikiLintResponse


async def lint_wiki(req: WikiLintRequest) -> WikiLintResponse:
    """Lint the user's wiki: remove empty pages, truncate oversized logs, deduplicate."""
    base = Path(req.wiki_base_path) / req.user_id

    if not base.exists():
        return WikiLintResponse(
            success=False,
            pages_checked=0,
            pages_cleaned=0,
            bytes_freed=0,
            issues=["Wiki directory not found"]
        )

    pages_checked = 0
    pages_cleaned = 0
    bytes_freed = 0
    issues = []

    # ── 1. Remove empty or stub pages ────────────────────────────────────────
    for md_file in base.rglob("*.md"):
        pages_checked += 1
        try:
            content = md_file.read_text(encoding="utf-8")
            stripped = content.strip()

            # Skip core pages
            if md_file.name in ("BRAIN.md", "index.md", "log.md"):
                continue

            # Remove completely empty files or files with only whitespace/headers
            meaningful_lines = [
                l for l in stripped.splitlines()
                if l.strip() and not l.strip().startswith("#")
            ]
            if len(meaningful_lines) == 0:
                old_size = md_file.stat().st_size
                md_file.unlink()
                bytes_freed += old_size
                pages_cleaned += 1
                issues.append(f"Removed empty page: {md_file.relative_to(base)}")
        except Exception as e:
            issues.append(f"Error checking {md_file.name}: {e}")

    # ── 2. Truncate oversized log.md (keep last 200 lines) ───────────────────
    log_file = base / "log.md"
    if log_file.exists():
        try:
            content = log_file.read_text(encoding="utf-8")
            lines = content.splitlines()
            if len(lines) > 200:
                old_size = log_file.stat().st_size
                trimmed = "\n".join(lines[-200:])
                log_file.write_text(trimmed, encoding="utf-8")
                freed = old_size - log_file.stat().st_size
                bytes_freed += max(freed, 0)
                pages_cleaned += 1
                issues.append(f"Truncated log.md: {len(lines)} -> 200 lines")
        except Exception as e:
            issues.append(f"Error processing log.md: {e}")

    # ── 3. Remove duplicate lines within pages ───────────────────────────────
    for md_file in base.rglob("*.md"):
        if md_file.name == "log.md":
            continue
        try:
            content = md_file.read_text(encoding="utf-8")
            lines = content.splitlines()
            if len(lines) < 10:
                continue

            # Detect consecutive duplicate blocks (3+ identical lines)
            seen_paragraphs: set[str] = set()
            new_lines = []
            i = 0
            while i < len(lines):
                line = lines[i]
                # Check for repeated non-empty paragraphs
                if line.strip() and line.strip() in seen_paragraphs and len(line.strip()) > 40:
                    i += 1
                    continue
                if line.strip() and len(line.strip()) > 40:
                    seen_paragraphs.add(line.strip())
                new_lines.append(line)
                i += 1

            if len(new_lines) < len(lines):
                old_size = md_file.stat().st_size
                md_file.write_text("\n".join(new_lines), encoding="utf-8")
                freed = old_size - md_file.stat().st_size
                bytes_freed += max(freed, 0)
                pages_cleaned += 1
                issues.append(f"Deduped {md_file.name}: {len(lines)} -> {len(new_lines)} lines")
        except Exception as e:
            issues.append(f"Error deduping {md_file.name}: {e}")

    # ── 4. Update BRAIN.md with lint timestamp ───────────────────────────────
    brain_file = base / "BRAIN.md"
    if brain_file.exists():
        try:
            content = brain_file.read_text(encoding="utf-8")
            now_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")
            lint_marker = f"\n\n---\n*Dernier lint: {now_str} — {pages_cleaned} pages nettoyées, {bytes_freed} octets libérés*"

            # Remove old lint marker if exists
            content = re.sub(r"\n\n---\n\*Dernier lint:.*?\*", "", content, flags=re.DOTALL)
            brain_file.write_text(content + lint_marker, encoding="utf-8")
        except Exception as e:
            issues.append(f"Error updating BRAIN.md: {e}")

    return WikiLintResponse(
        success=True,
        pages_checked=pages_checked,
        pages_cleaned=pages_cleaned,
        bytes_freed=bytes_freed,
        issues=issues[:20]  # cap to 20 issues
    )
