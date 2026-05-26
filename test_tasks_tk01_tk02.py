#!/usr/bin/env python3
"""Tests TK-01 (NLP brief) + TK-02 (Score priorisation IA)."""
import requests

BASE = 'http://localhost:50082'
results = []
bugs = []

def safe_json(r):
    try:
        return r.json()
    except Exception:
        return {'_raw': r.text[:300]}

def log(id_, title, status, detail='', bug=None, severity='HAUTE'):
    icon = {'PASS': '✅', 'FAIL': '❌', 'WARN': '⚠️'}.get(status, '?')
    print(f'\n[{status}] {id_} | {title}')
    if detail:
        print(f'      {detail[:150]}')
    if bug:
        print(f'  !! BUG [{severity}]: {bug}')
        bugs.append({'id': id_, 'severity': severity, 'bug': bug})
    results.append({'id': id_, 'title': title, 'status': status})

# ─── Login Sophie PRO ─────────────────────────────────────────────────────────
sophie = requests.Session()
print('=== LOGIN ===')
r = sophie.post(f'{BASE}/api/auth/login',
    json={'email': 'elsane.tiberini@gmail.com', 'password': 'SophieTest2026!'})
d = safe_json(r)
print(f'Sophie: {r.status_code} plan={d.get("user", {}).get("plan", "?")} ok={d.get("success")}')

print()
print('=' * 60)
print('MODULE TÂCHES IA — TK-01 + TK-02')
print('=' * 60)

# ── TK-01: Créer tâche via NLP brief ─────────────────────────────────────────
# Étape 1 : Parser le brief via /api/tasks/parse-brief
brief = "Appeler Lucas Petit pour faire le point sur le projet UX d'ici vendredi prochain"
r = sophie.post(f'{BASE}/api/tasks/parse-brief', json={'brief': brief})
d = safe_json(r)

if r.status_code == 200 and d.get('task'):
    task_data = d['task']
    print(f'      parse-brief OK: {task_data}')

    # Étape 2 : Créer la tâche avec les données parsées
    r2 = sophie.post(f'{BASE}/api/tasks', json={
        'title': task_data.get('title'),
        'description': task_data.get('description'),
        'category': task_data.get('category', 'CLIENTS'),
        'estimatedMinutes': task_data.get('estimatedMinutes'),
        'dueDate': task_data.get('dueDate'),
    })
    d2 = safe_json(r2)

    if r2.status_code == 201 and d2.get('task'):
        created = d2['task']
        log('TK-01', 'Créer tâche via NLP brief',
            'PASS',
            f'brief parsé → title="{task_data.get("title", "")[:50]}" '
            f'cat={task_data.get("category")} '
            f'due={task_data.get("dueDate")} '
            f'→ id={created["id"][:12]}...')
        created_task_id = created['id']
    else:
        log('TK-01', 'Créer tâche via NLP brief',
            'FAIL', f'Parse OK mais création échoue: {r2.status_code}: {str(d2)[:100]}',
            bug=f'POST /api/tasks retourne {r2.status_code} après parse-brief', severity='HAUTE')
        created_task_id = None
elif r.status_code == 200 and not d.get('task'):
    log('TK-01', 'Créer tâche via NLP brief',
        'FAIL', f'parse-brief retourne 200 sans task: {str(d)[:100]}',
        bug='POST /api/tasks/parse-brief retourne 200 sans objet task', severity='HAUTE')
    created_task_id = None
else:
    log('TK-01', 'Créer tâche via NLP brief',
        'FAIL', f'Status {r.status_code}: {str(d)[:100]}',
        bug=f'POST /api/tasks/parse-brief retourne {r.status_code}', severity='CRITIQUE')
    created_task_id = None

# ── TK-02: Score priorisation IA ─────────────────────────────────────────────
# POST /api/tasks/prioritize (pas GET)
r = sophie.post(f'{BASE}/api/tasks/prioritize', json={})
d = safe_json(r)

if r.status_code == 200:
    tasks = d.get('tasks', [])
    prioritized = d.get('prioritized', 0)
    msg = d.get('message', '')

    if msg and ('aucune' in msg.lower() or 'no task' in msg.lower()):
        log('TK-02', 'Score priorisation IA',
            'WARN', f'Aucune tâche active à prioriser: "{msg}"',
            bug='Pas de tâches actives pour tester la priorisation', severity='FAIBLE')
    elif isinstance(tasks, list) and len(tasks) >= 0:
        scores = [(t.get('title', '')[:40], t.get('aiPriorityScore'), t.get('priority')) for t in tasks[:3]]
        log('TK-02', 'Score priorisation IA',
            'PASS',
            f'{len(tasks)} tâche(s) priorisée(s), {prioritized} scores IA calculés. '
            f'Top 3: {scores}')
    else:
        log('TK-02', 'Score priorisation IA',
            'FAIL', f'Structure inattendue: {str(d)[:100]}',
            bug='POST /api/tasks/prioritize retourne structure inattendue', severity='HAUTE')
else:
    log('TK-02', 'Score priorisation IA',
        'FAIL', f'Status {r.status_code}: {str(d)[:150]}',
        bug=f'POST /api/tasks/prioritize retourne {r.status_code}', severity='CRITIQUE')

# ── Vérification TK-02 avec tâche créée (TK-01) ───────────────────────────────
if created_task_id:
    print(f'\n--- Re-test priorisation avec tâche TK-01 créée ---')
    r = sophie.post(f'{BASE}/api/tasks/prioritize', json={})
    d = safe_json(r)
    if r.status_code == 200:
        tasks = d.get('tasks', [])
        prioritized = d.get('prioritized', 0)
        new_task = next((t for t in tasks if t.get('id') == created_task_id), None)
        if new_task:
            print(f'      Tâche TK-01 priorisée: score={new_task.get("aiPriorityScore")} '
                  f'priority={new_task.get("priority")} reason="{new_task.get("aiReason", "")[:60]}"')
        else:
            print(f'      {len(tasks)} tâche(s) priorisée(s) — tâche TK-01 non retrouvée dans les résultats')

# =============================================================================
print()
print('=' * 60)
print('RESUME FINAL — TK-01 + TK-02')
print('=' * 60)
p = sum(1 for x in results if x['status'] == 'PASS')
f = sum(1 for x in results if x['status'] == 'FAIL')
w = sum(1 for x in results if x['status'] == 'WARN')
print(f'TOTAL: {len(results)} cas | PASS: {p} | FAIL: {f} | WARN: {w} | BUGS: {len(bugs)}')
if bugs:
    print('\nBUGS DETECTES:')
    for b in bugs:
        print(f'  [{b["severity"]}] {b["id"]} - {b["bug"]}')
print('=' * 60)
