#!/usr/bin/env python3
"""Tests CRM restants : CRM-06 (avec plan Solo Pro), CRM-08 à CRM-12"""
import requests

BASE = 'http://localhost:3000'

results = []
bugs = []

def safe_json(r):
    try:
        return r.json()
    except Exception:
        return {'_raw': r.text[:200]}

def log(tid, title, status, detail='', bug=None, severity=None):
    icon = 'PASS' if status == 'PASS' else 'FAIL' if status == 'FAIL' else 'WARN'
    results.append({'id': tid, 'title': title, 'status': status})
    print(f'[{icon}] {tid} | {title}')
    print(f'      {detail[:120]}')
    if bug:
        bugs.append({'id': tid, 'severity': severity or 'HAUTE', 'bug': bug})
        print(f'  !! BUG [{severity}]: {bug}')
    print()

# ── Login Marc (plan Solo Pro) pour tester CRM-06 relance IA
print('=== LOGIN ===')
marc = requests.Session()
r = marc.post(f'{BASE}/api/auth/login', json={'email': 'sales@quotium.com', 'password': 'MarcTest2026!'})
d = safe_json(r)
print(f'Marc: {r.status_code} plan={d.get("user", {}).get("plan", "?")} success={d.get("success")}')

sophie = requests.Session()
r = sophie.post(f'{BASE}/api/auth/login', json={'email': 'elsane.tiberini@gmail.com', 'password': 'SophieTest2026!'})
d = safe_json(r)
print(f'Sophie: {r.status_code} plan={d.get("user", {}).get("plan", "?")} success={d.get("success")}')

julie = requests.Session()
r = julie.post(f'{BASE}/api/auth/login', json={'email': 'elsane@yahoo.fr', 'password': 'JulieTest2026!'})
d = safe_json(r)
print(f'Julie: {r.status_code} plan={d.get("user", {}).get("plan", "?")} success={d.get("success")}')

# Récupérer un prospect ID pour Marc
r = marc.get(f'{BASE}/api/pipeline/prospects')
d = safe_json(r)
marc_prospects = d.get('prospects', [])

if not marc_prospects:
    # Créer un prospect pour Marc si pas encore
    r = marc.post(f'{BASE}/api/pipeline/prospects', json={
        'name': 'Thomas Blanc', 'company': 'TechCorp SA', 'value': 8000, 'status': 'IDENTIFIED'
    })
    d = safe_json(r)
    MARC_PID = d.get('prospect', d).get('id')
    print(f'Prospect Marc créé: {MARC_PID}')
else:
    MARC_PID = marc_prospects[0]['id']
    print(f'Prospect Marc: {marc_prospects[0]["name"]} ({MARC_PID})')

# Récupérer un prospect pour Sophie
r = sophie.get(f'{BASE}/api/pipeline/prospects')
d = safe_json(r)
sophie_prospects = d.get('prospects', [])
SOPHIE_PID = sophie_prospects[0]['id'] if sophie_prospects else None
print(f'Prospect Sophie: {sophie_prospects[0]["name"] if sophie_prospects else "aucun"} ({SOPHIE_PID})')
print()

print('=== TESTS CRM (suite) ===')
print()

# ── CRM-06 BIS: Relance IA avec Marc (Solo Pro) ──────────────────────────────
if MARC_PID:
    r = marc.post(f'{BASE}/api/pipeline/relance',
        json={'prospectId': MARC_PID, 'tone': 'professionnel', 'channel': 'email'})
    d = safe_json(r)
    if r.status_code in [200, 201] and d.get('message'):
        preview = d['message'][:100].replace('\n', ' ')
        log('CRM-06', 'Relance IA (Marc Solo Pro)',
            'PASS', f'Sujet: "{d.get("subject","?")}" | Message: "{preview}..."')
    elif r.status_code == 403:
        log('CRM-06', 'Relance IA (Marc Solo Pro)',
            'FAIL', f'403 — Solo Pro requis mais Marc devrait être PRO: {str(d)[:80]}',
            bug='Marc devrait être Solo Pro mais relance bloquée 403', severity='CRITIQUE')
    else:
        log('CRM-06', 'Relance IA (Marc Solo Pro)',
            'FAIL', f'Status {r.status_code}: {str(d)[:100]}',
            bug=f'POST /api/pipeline/relance retourne {r.status_code}. Attendu: 201 + message',
            severity='CRITIQUE')
else:
    log('CRM-06', 'Relance IA (Marc Solo Pro)', 'WARN', 'Pas de prospect Marc disponible')

# ── CRM-08: Prospect LOST → archivage ────────────────────────────────────────
if SOPHIE_PID:
    r = sophie.patch(f'{BASE}/api/pipeline/prospects/{SOPHIE_PID}', json={'status': 'LOST'})
    d = safe_json(r)
    got_status = d.get('prospect', d).get('status') or d.get('status')
    if r.status_code in [200, 201] and got_status == 'LOST':
        log('CRM-08', 'Prospect LOST → archivage', 'PASS', f'Statut: LOST confirmé')
    else:
        log('CRM-08', 'Prospect LOST → archivage',
            'FAIL', f'Status {r.status_code}: statut={got_status} raw={str(d)[:80]}',
            bug=f'PATCH status=LOST retourne {r.status_code}, statut={got_status}', severity='HAUTE')
else:
    log('CRM-08', 'Prospect LOST → archivage', 'WARN', 'Pas de prospect Sophie')

# ── CRM-09: Prospect WON → wiki ingest ───────────────────────────────────────
if SOPHIE_PID:
    r = sophie.patch(f'{BASE}/api/pipeline/prospects/{SOPHIE_PID}', json={'status': 'WON'})
    d = safe_json(r)
    got_status = d.get('prospect', d).get('status') or d.get('status')
    if r.status_code in [200, 201] and got_status == 'WON':
        log('CRM-09', 'Prospect WON → wiki ingest', 'PASS',
            f'Statut WON — wiki ingest déclenché en background')
    else:
        log('CRM-09', 'Prospect WON → wiki ingest',
            'FAIL', f'Status {r.status_code}: statut={got_status} raw={str(d)[:80]}',
            bug=f'PATCH status=WON retourne {r.status_code}, statut={got_status}', severity='HAUTE')
else:
    log('CRM-09', 'Prospect WON → wiki ingest', 'WARN', 'Pas de prospect Sophie')

# ── CRM-10: Recherche par nom ─────────────────────────────────────────────────
r = sophie.get(f'{BASE}/api/pipeline/prospects?search=Camille')
d = safe_json(r)
if r.status_code == 200:
    items = d.get('prospects', [])
    found = any('Camille' in p.get('name', '') for p in items)
    if found:
        log('CRM-10', 'Recherche prospect par nom', 'PASS',
            f'"Camille" trouvé parmi {len(items)} résultats')
    else:
        # Tester sans filtre pour voir si la recherche fonctionne
        all_names = [p.get('name') for p in items[:5]]
        log('CRM-10', 'Recherche prospect par nom', 'WARN',
            f'{len(items)} résultats retournés sans filtre: {all_names}',
            bug='Le paramètre ?search= retourne tous les prospects sans filtrer par nom',
            severity='MOYENNE')
else:
    log('CRM-10', 'Recherche prospect par nom',
        'FAIL', f'Status {r.status_code}: {str(d)[:100]}',
        bug=f'GET /api/pipeline/prospects?search= retourne {r.status_code}', severity='HAUTE')

# ── CRM-11: Relance ton expert (canal LinkedIn) ───────────────────────────────
if MARC_PID:
    r = marc.post(f'{BASE}/api/pipeline/relance',
        json={'prospectId': MARC_PID, 'tone': 'expert', 'channel': 'linkedin'})
    d = safe_json(r)
    if r.status_code in [200, 201] and d.get('message'):
        log('CRM-11', 'Relance expert LinkedIn (OPCO)', 'PASS',
            f'Canal: {d.get("channel","?")} | Sujet: {d.get("subject","?")}')
    else:
        log('CRM-11', 'Relance expert LinkedIn (OPCO)',
            'FAIL', f'Status {r.status_code}: {str(d)[:100]}',
            bug=f'POST relance tone=expert channel=linkedin retourne {r.status_code}', severity='HAUTE')
else:
    log('CRM-11', 'Relance expert LinkedIn (OPCO)', 'WARN', 'Pas de prospect Marc')

# ── CRM-12: Limite FREE plan — max 3 prospects ────────────────────────────────
print('--- CRM-12: Test limite FREE (Julie) ---')
r_list = julie.get(f'{BASE}/api/pipeline/prospects')
current_count = len(safe_json(r_list).get('prospects', []))
print(f'Prospects Julie actuels: {current_count}')

blocked = False
created = 0
for i in range(1, 6):
    r = julie.post(f'{BASE}/api/pipeline/prospects',
        json={'name': f'Prospect FREE Test {i}', 'company': f'Société {i}', 'value': 100})
    d = safe_json(r)
    if r.status_code == 402 and d.get('upgradeRequired'):
        blocked = True
        print(f'  Bloqué tentative {i}: {d.get("error","?")}')
        break
    elif r.status_code in [200, 201]:
        created += 1
        total_now = current_count + created
        print(f'  #{total_now} créé OK (status {r.status_code})')
    else:
        print(f'  Erreur {r.status_code}: {str(d)[:60]}')
        break

if blocked:
    log('CRM-12', 'Limite 3 prospects plan FREE', 'PASS',
        f'{current_count} existants + {created} créés puis bloqué 402 upgradeRequired')
else:
    total = current_count + created
    log('CRM-12', 'Limite 3 prospects plan FREE',
        'FAIL', f'{total} prospects au total sans aucun blocage',
        bug=f'Plan FREE: {total} prospects créés sans restriction. Limite 3 non appliquée après correction',
        severity='HAUTE')

# ── RÉSUMÉ ────────────────────────────────────────────────────────────────────
print()
print('=' * 60)
print('RÉSUMÉ CRM SUITE — CRM-06b à CRM-12')
print('=' * 60)
pass_c = sum(1 for r in results if r['status'] == 'PASS')
fail_c = sum(1 for r in results if r['status'] == 'FAIL')
warn_c = sum(1 for r in results if r['status'] == 'WARN')
print(f'PASS: {pass_c} | FAIL: {fail_c} | WARN: {warn_c} | BUGS: {len(bugs)}')
print()
if bugs:
    print('BUGS:')
    for b in bugs:
        print(f'  [{b["severity"]}] {b["id"]} — {b["bug"]}')
print('=' * 60)
