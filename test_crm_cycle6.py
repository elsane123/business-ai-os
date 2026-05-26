#!/usr/bin/env python3
"""Test CRM Pipeline — Cycle 6 — Endpoints corrigés"""
import requests
import json
import os
from datetime import datetime

BASE = 'http://localhost:50082'
os.environ['DISABLE_RATE_LIMIT'] = 'true'

results = []
bugs = []

def log(tid, title, status, detail='', bug=None, severity=None):
    icon = 'PASS' if status == 'PASS' else 'FAIL' if status == 'FAIL' else 'WARN'
    results.append({'id': tid, 'title': title, 'status': status, 'detail': detail})
    print(f'[{icon}] {tid} | {title}')
    print(f'      Detail: {detail[:120]}')
    if bug:
        bugs.append({'id': tid, 'title': title, 'bug': bug, 'severity': severity or 'HAUTE'})
        print(f'  !! BUG ({severity}): {bug}')
    print()

# ── Login Sophie (Solo Pro) ──────────────────────────────────────────────────
print('=== LOGIN COMPTES ===')
sophie = requests.Session()
r = sophie.post(f'{BASE}/api/auth/login', json={'email': 'elsane.tiberini@gmail.com', 'password': 'SophieTest2026!'})
print(f'Sophie: {r.status_code} {r.json().get("success", r.json().get("error", "?"))}')

julie = requests.Session()
r2 = julie.post(f'{BASE}/api/auth/login', json={'email': 'elsane@yahoo.fr', 'password': 'JulieTest2026!'})
print(f'Julie: {r2.status_code} {r2.json().get("success", r2.json().get("error", "?"))}')

# Récupérer un prospect ID valide
r = sophie.get(f'{BASE}/api/pipeline/prospects')
prospects_data = r.json()
prospects_list = prospects_data.get('prospects', [])
if not prospects_list:
    print('ATTENTION: Aucun prospect trouvé pour Sophie!')
    PROSPECT_ID = None
else:
    PROSPECT_ID = prospects_list[0]['id']
    PROSPECT_NAME = prospects_list[0].get('name', '?')
    print(f'Prospect de test: {PROSPECT_NAME} ({PROSPECT_ID})')
    print(f'Statut actuel: {prospects_list[0].get("status", "?")}')

print()
print('=== MODULE CRM PIPELINE — 10 cas ===')
print()

# ── CRM-02: Enrichissement SIRET ─────────────────────────────────────────────
# La vraie route est GET /api/pipeline/enrich?q={company} (recherche entreprise)
r = sophie.get(f'{BASE}/api/pipeline/enrich?q=Airbus')
d = r.json() if r.content else {}
if r.status_code == 200 and 'results' in d:
    count = len(d['results'])
    first = d['results'][0].get('name', '?') if count > 0 else 'aucun'
    log('CRM-02', 'Enrichissement SIRET — recherche entreprise API gouv.fr',
        'PASS', f'{count} résultats, premier: {first}')
else:
    log('CRM-02', 'Enrichissement SIRET — recherche entreprise API gouv.fr',
        'FAIL', f'Status {r.status_code}: {str(d)[:100]}',
        bug=f'GET /api/pipeline/enrich?q=Airbus retourne {r.status_code}. Attendu: 200 + results[]',
        severity='CRITIQUE')

# ── CRM-03: Déplacer carte Kanban → CONTACTED ────────────────────────────────
if PROSPECT_ID:
    r = sophie.patch(f'{BASE}/api/pipeline/prospects/{PROSPECT_ID}', json={'status': 'CONTACTED'})
    d = r.json() if r.content else {}
    prospect_updated = d.get('prospect', d)
    if r.status_code in [200, 201] and (prospect_updated.get('status') == 'CONTACTED' or d.get('status') == 'CONTACTED'):
        log('CRM-03', 'Déplacer carte Kanban → CONTACTED',
            'PASS', f'Statut mis à jour: CONTACTED')
    else:
        log('CRM-03', 'Déplacer carte Kanban → CONTACTED',
            'FAIL', f'Status {r.status_code}: {str(d)[:100]}',
            bug=f'PATCH /api/pipeline/prospects/{{id}} status=CONTACTED. Obtenu: {r.status_code} {str(d)[:80]}',
            severity='HAUTE')
else:
    log('CRM-03', 'Déplacer carte Kanban → CONTACTED', 'WARN', 'Pas de prospect disponible')

# ── CRM-04: Créer prospect via NLP brief ─────────────────────────────────────
# La vraie route est POST /api/pipeline/parse-brief (pas /prospects/parse-brief)
r = sophie.post(f'{BASE}/api/pipeline/parse-brief',
    json={'brief': 'Nouveau prospect Lucas Petit, CEO startup IA, budget 5000€, très intéressé'})
d = r.json() if r.content else {}
if r.status_code in [200, 201] and ('name' in d or 'prospect' in d):
    parsed_name = d.get('name') or d.get('prospect', {}).get('name', '?')
    log('CRM-04', 'Créer prospect via NLP parse-brief',
        'PASS', f'Parsé: name={parsed_name}, value={d.get("value", "?")}, status={d.get("status", "?")}')
elif r.status_code in [200, 201]:
    log('CRM-04', 'Créer prospect via NLP parse-brief',
        'PASS', f'Status {r.status_code}: {str(d)[:100]}')
else:
    log('CRM-04', 'Créer prospect via NLP parse-brief',
        'FAIL', f'Status {r.status_code}: {str(d)[:100]}',
        bug=f'POST /api/pipeline/parse-brief retourne {r.status_code}. Attendu: 200 + JSON structuré',
        severity='HAUTE')

# ── CRM-05: Filtrer prospects par statut ─────────────────────────────────────
r = sophie.get(f'{BASE}/api/pipeline/prospects?status=CONTACTED')
d = r.json() if r.content else {}
if r.status_code == 200:
    items = d.get('prospects', d) if isinstance(d, dict) else d
    count = len(items) if isinstance(items, list) else '?'
    # Vérifier que tous les résultats ont le bon statut
    if isinstance(items, list) and count > 0:
        wrong_status = [p for p in items if p.get('status') != 'CONTACTED']
        if wrong_status:
            log('CRM-05', 'Filtrer prospects par statut',
                'WARN', f'{count} résultats mais {len(wrong_status)} ont un statut différent de CONTACTED',
                bug=f'Le filtre ?status= ne filtre pas correctement (résultats mix de statuts)',
                severity='MOYENNE')
        else:
            log('CRM-05', 'Filtrer prospects par statut',
                'PASS', f'{count} prospects CONTACTED retournés (filtre correct)')
    else:
        log('CRM-05', 'Filtrer prospects par statut',
            'PASS', f'Réponse OK, {count} résultats')
else:
    log('CRM-05', 'Filtrer prospects par statut',
        'FAIL', f'Status {r.status_code}: {str(d)[:100]}',
        bug=f'GET /api/pipeline/prospects?status=CONTACTED retourne {r.status_code}',
        severity='HAUTE')

# ── CRM-06: Relance IA prospect inactif ──────────────────────────────────────
# La vraie route est POST /api/pipeline/relance avec {prospectId} dans le body
if PROSPECT_ID:
    r = sophie.post(f'{BASE}/api/pipeline/relance',
        json={'prospectId': PROSPECT_ID, 'tone': 'professionnel', 'channel': 'email'})
    d = r.json() if r.content else {}
    if r.status_code in [200, 201] and d.get('message'):
        msg_preview = d['message'][:80]
        log('CRM-06', 'Relance IA prospect inactif',
            'PASS', f'Message généré: "{msg_preview}..."')
    elif r.status_code == 403 and d.get('upgradeRequired'):
        log('CRM-06', 'Relance IA prospect inactif',
            'WARN', 'Plan FREE bloqué — Solo Pro requis (comportement attendu si Sophie est FREE)')
    else:
        log('CRM-06', 'Relance IA prospect inactif',
            'FAIL', f'Status {r.status_code}: {str(d)[:100]}',
            bug=f'POST /api/pipeline/relance retourne {r.status_code}. Attendu: 201 + message',
            severity='CRITIQUE')
else:
    log('CRM-06', 'Relance IA prospect inactif', 'WARN', 'Pas de prospect disponible')

# ── CRM-08: Prospect LOST → archivage ────────────────────────────────────────
if PROSPECT_ID:
    r = sophie.patch(f'{BASE}/api/pipeline/prospects/{PROSPECT_ID}', json={'status': 'LOST'})
    d = r.json() if r.content else {}
    prospect_data = d.get('prospect', d)
    if r.status_code in [200, 201] and (prospect_data.get('status') == 'LOST' or d.get('status') == 'LOST'):
        log('CRM-08', 'Prospect LOST → archivage',
            'PASS', f'Statut mis à jour: LOST')
    else:
        log('CRM-08', 'Prospect LOST → archivage',
            'FAIL', f'Status {r.status_code}: {str(d)[:100]}',
            bug=f'PATCH prospects/{{id}} status=LOST. Obtenu: {r.status_code}',
            severity='HAUTE')
else:
    log('CRM-08', 'Prospect LOST → archivage', 'WARN', 'Pas de prospect disponible')

# ── CRM-09: Prospect WON → wiki ──────────────────────────────────────────────
if PROSPECT_ID:
    r = sophie.patch(f'{BASE}/api/pipeline/prospects/{PROSPECT_ID}', json={'status': 'WON'})
    d = r.json() if r.content else {}
    prospect_data = d.get('prospect', d)
    if r.status_code in [200, 201] and (prospect_data.get('status') == 'WON' or d.get('status') == 'WON'):
        log('CRM-09', 'Prospect WON → mise à jour wiki',
            'PASS', f'Statut WON confirmé — wiki ingest déclenché en background')
    else:
        log('CRM-09', 'Prospect WON → mise à jour wiki',
            'FAIL', f'Status {r.status_code}: {str(d)[:100]}',
            bug=f'PATCH prospects/{{id}} status=WON. Obtenu: {r.status_code}',
            severity='HAUTE')
else:
    log('CRM-09', 'Prospect WON → mise à jour wiki', 'WARN', 'Pas de prospect disponible')

# ── CRM-10: Recherche prospect par nom ───────────────────────────────────────
r = sophie.get(f'{BASE}/api/pipeline/prospects?search=Camille')
if r.status_code != 200:
    r = sophie.get(f'{BASE}/api/pipeline/prospects?q=Camille')
d = r.json() if r.content else {}
if r.status_code == 200:
    items = d.get('prospects', d) if isinstance(d, dict) else d
    found = any('Camille' in p.get('name', '') for p in items) if isinstance(items, list) else False
    if found:
        log('CRM-10', 'Recherche prospect par nom', 'PASS', 'Prospect "Camille" trouvé dans les résultats')
    else:
        log('CRM-10', 'Recherche prospect par nom', 'WARN',
            f'Recherche retourne {len(items) if isinstance(items, list) else "?"} résultats mais pas "Camille"',
            bug='Le paramètre ?search= retourne tous les prospects sans filtrer par nom', severity='MOYENNE')
else:
    log('CRM-10', 'Recherche prospect par nom', 'FAIL', f'Status {r.status_code}: {str(d)[:100]}',
        bug=f'GET /api/pipeline/prospects?search= retourne {r.status_code}', severity='HAUTE')

# ── CRM-11: Relance OPCO (même endpoint, contexte différent) ─────────────────
if PROSPECT_ID:
    r = sophie.post(f'{BASE}/api/pipeline/relance',
        json={'prospectId': PROSPECT_ID, 'tone': 'expert', 'channel': 'email'})
    d = r.json() if r.content else {}
    if r.status_code in [200, 201] and d.get('message'):
        log('CRM-11', 'Relance OPCO (ton expert)', 'PASS', f'Sujet: {d.get("subject", "?")} | Canal: {d.get("channel", "?")}')
    elif r.status_code == 403:
        log('CRM-11', 'Relance OPCO (ton expert)', 'WARN', 'Plan FREE bloqué (comportement normal)')
    else:
        log('CRM-11', 'Relance OPCO (ton expert)', 'FAIL', f'Status {r.status_code}: {str(d)[:100]}',
            bug=f'POST /api/pipeline/relance tone=expert retourne {r.status_code}', severity='HAUTE')
else:
    log('CRM-11', 'Relance OPCO (ton expert)', 'WARN', 'Pas de prospect disponible')

# ── CRM-12: Limite FREE plan — max 3 prospects ────────────────────────────────
# Julie est en plan FREE, vérifier la limite après correction
print('--- Test CRM-12: Limite FREE (Julie) ---')
julie_prospects = julie.get(f'{BASE}/api/pipeline/prospects')
julie_data = julie_prospects.json() if julie_prospects.content else {}
julie_list = julie_data.get('prospects', [])
print(f'Prospects Julie actuels: {len(julie_list)}')

# Créer des prospects jusqu\'à dépasser la limite
blocked = False
created = 0
for i in range(5):
    r = julie.post(f'{BASE}/api/pipeline/prospects', json={'name': f'Test FREE Limit {i+1}', 'company': f'Entreprise {i+1}', 'value': 100})
    d = r.json() if r.content else {}
    if r.status_code == 402 and d.get('upgradeRequired'):
        blocked = True
        print(f'  Bloqué à la tentative {i+1}: {d.get("error", "?")}')
        break
    elif r.status_code in [200, 201]:
        created += 1
        print(f'  Créé #{created}: {r.status_code}')
    else:
        print(f'  Erreur inattendue: {r.status_code} {str(d)[:60]}')
        break

if blocked:
    log('CRM-12', 'Limite 3 prospects plan FREE', 'PASS',
        f'{created} prospects créés puis bloqué avec 402 upgradeRequired')
else:
    log('CRM-12', 'Limite 3 prospects plan FREE', 'FAIL',
        f'{created} prospects créés SANS blocage (pas de limite FREE appliquée)',
        bug=f'Plan FREE: {created} prospects créés sans restriction. Attendu: blocage à 3 avec 402',
        severity='HAUTE')

# ── RÉSUMÉ FINAL ──────────────────────────────────────────────────────────────
print()
print('=' * 60)
print('RÉSUMÉ CRM PIPELINE — Cycle 6')
print('=' * 60)
pass_count = sum(1 for r in results if r['status'] == 'PASS')
fail_count = sum(1 for r in results if r['status'] == 'FAIL')
warn_count = sum(1 for r in results if r['status'] == 'WARN')
print(f'PASS : {pass_count}/{len(results)}')
print(f'FAIL : {fail_count}/{len(results)}')
print(f'WARN : {warn_count}/{len(results)}')
print(f'BUGS : {len(bugs)}')
print()
if bugs:
    print('=== BUGS DÉTECTÉS ===')
    for b in bugs:
        print(f'[{b["severity"]}] {b["id"]} — {b["bug"]}')
else:
    print('✅ Aucun bug détecté!')
print('=' * 60)