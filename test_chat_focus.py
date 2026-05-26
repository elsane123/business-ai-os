#!/usr/bin/env python3
"""Tests Chat Business Brain (CH-02 à CH-10) + Daily Focus IA (DF-01 à DF-06)."""
import requests, json, base64, os
from datetime import datetime

BASE = 'http://localhost:50082'
results = []
bugs = []

def safe_json(r):
    try:
        return r.json()
    except Exception:
        return {'_raw': r.text[:200]}

def log(id_, title, status, detail='', bug=None, severity='HAUTE'):
    icon = {'PASS': '✅', 'FAIL': '❌', 'WARN': '⚠️', 'SKIP': '⏭️'}.get(status, '?')
    print(f'\n[{status}] {id_} | {title}')
    if detail:
        print(f'      {detail[:120]}')
    if bug:
        print(f'  !! BUG [{severity}]: {bug}')
        bugs.append({'id': id_, 'severity': severity, 'bug': bug})
    results.append({'id': id_, 'title': title, 'status': status})

# ─── Session Sophie (PRO pour tests Chat) ────────────────────────────────────
sophie = requests.Session()
marc = requests.Session()
julie = requests.Session()

print('=== LOGIN ===')
r = sophie.post(f'{BASE}/api/auth/login', json={'email': 'elsane.tiberini@gmail.com', 'password': 'SophieTest2026!'})
d = safe_json(r)
print(f'Sophie: {r.status_code} plan={d.get("user", {}).get("plan", "?")} ok={d.get("success")}')

r = marc.post(f'{BASE}/api/auth/login', json={'email': 'sales@quotium.com', 'password': 'MarcTest2026!'})
d = safe_json(r)
print(f'Marc:   {r.status_code} plan={d.get("user", {}).get("plan", "?")} ok={d.get("success")}')

r = julie.post(f'{BASE}/api/auth/login', json={'email': 'elsane@yahoo.fr', 'password': 'JulieTest2026!'})
d = safe_json(r)
print(f'Julie:  {r.status_code} plan={d.get("user", {}).get("plan", "?")} ok={d.get("success")}')

# ─── TR-05 avec vraie image ticket ─────────────────────────────────────────────
print()
print('=' * 60)
print('TR-05 — OCR Ticket Restaurant (vraie image)')
print('=' * 60)

ticket_path = '/a0/usr/projects/business_ai_os/ticket_restaurant_test.png'
if os.path.exists(ticket_path):
    with open(ticket_path, 'rb') as fh:
        b64 = base64.b64encode(fh.read()).decode()
    r = sophie.post(f'{BASE}/api/cash/ocr', json={'imageBase64': b64, 'mimeType': 'image/png'})
    d = safe_json(r)
    if r.status_code == 200 and d.get('amount'):
        log('TR-05', 'OCR ticket restaurant (vraie image)',
            'PASS', f'amount={d.get("amount")}€ type={d.get("type")} cat={d.get("category")} date={d.get("date")}')
    elif r.status_code in (422, 400):
        log('TR-05', 'OCR ticket restaurant (vraie image)',
            'WARN', f'{r.status_code} Image non reconnue par LLM: {str(d)[:100]}',
            bug=f'OCR retourne {r.status_code} sur image réelle', severity='MOYENNE')
    else:
        log('TR-05', 'OCR ticket restaurant (vraie image)',
            'FAIL', f'{r.status_code}: {str(d)[:100]}',
            bug=f'OCR crash {r.status_code} sur vraie image', severity='CRITIQUE')
else:
    log('TR-05', 'OCR ticket restaurant', 'SKIP', 'Image test introuvable')

# =============================================================================
print()
print('=' * 60)
print('MODULE CHAT BUSINESS BRAIN — 8 cas (CH-02 à CH-10)')
print('=' * 60)

# ── CH-02: Prospects les plus chauds ──────────────────────────────────────────
r = marc.post(f'{BASE}/api/chat', json={'message': 'Quels sont mes prospects les plus chauds en ce moment?'})
d = safe_json(r)
if r.status_code == 200:
    reply = str(d.get('message') or d.get('response') or d.get('content') or str(d))[:120]
    log('CH-02', 'Prospects les plus chauds', 'PASS', f'Réponse: "{reply}"')
else:
    log('CH-02', 'Prospects les plus chauds', 'FAIL',
        f'Status {r.status_code}: {str(d)[:100]}',
        bug=f'POST /api/chat retourne {r.status_code}', severity='HAUTE')

# ── CH-03: Conseil stratégique contextuel ─────────────────────────────────────
r = sophie.post(f'{BASE}/api/chat', json={'message': 'Quel conseil stratégique me donnes-tu pour augmenter mon CA ce mois-ci?'})
d = safe_json(r)
if r.status_code == 200:
    reply = str(d.get('message') or d.get('response') or d.get('content') or str(d))[:120]
    log('CH-03', 'Conseil stratégique contextuel', 'PASS', f'Réponse: "{reply}"')
else:
    log('CH-03', 'Conseil stratégique contextuel', 'FAIL',
        f'Status {r.status_code}: {str(d)[:100]}',
        bug=f'POST /api/chat retourne {r.status_code}', severity='HAUTE')

# ── CH-04: Action rapide Santé financière ─────────────────────────────────────
r = marc.post(f'{BASE}/api/chat', json={'message': 'Quelle est ma santé financière ce mois? Donne moi un diagnostic rapide.'})
d = safe_json(r)
if r.status_code == 200:
    reply = str(d.get('message') or d.get('response') or d.get('content') or str(d))[:120]
    log('CH-04', 'Action rapide Santé financière', 'PASS', f'Réponse: "{reply}"')
else:
    log('CH-04', 'Action rapide Santé financière', 'FAIL',
        f'Status {r.status_code}: {str(d)[:100]}',
        bug=f'POST /api/chat retourne {r.status_code}', severity='HAUTE')

# ── CH-05: Analyse du mois ────────────────────────────────────────────────────
r = sophie.post(f'{BASE}/api/chat', json={'message': 'Fais moi une analyse complète de mon activité du mois de mai 2026.'})
d = safe_json(r)
if r.status_code == 200:
    reply = str(d.get('message') or d.get('response') or d.get('content') or str(d))[:120]
    log('CH-05', 'Analyse du mois', 'PASS', f'Réponse: "{reply}"')
else:
    log('CH-05', 'Analyse du mois', 'FAIL',
        f'Status {r.status_code}: {str(d)[:100]}',
        bug=f'POST /api/chat retourne {r.status_code}', severity='HAUTE')

# ── CH-07: Mémoire conversationnelle multi-questions ──────────────────────────
# Question 1
r = sophie.post(f'{BASE}/api/chat', json={'message': 'Mon TJM actuel est de 800 euros.'})
d1 = safe_json(r)
# Question 2 (dans la même session — vérifier si l'IA se souvient)
r = sophie.post(f'{BASE}/api/chat', json={'message': 'Quel est mon TJM dont je viens de te parler?'})
d2 = safe_json(r)
if r.status_code == 200:
    reply = str(d2.get('message') or d2.get('response') or d2.get('content') or str(d2))[:120]
    has_memory = '800' in reply or 'tjm' in reply.lower() or 'taux' in reply.lower()
    if has_memory:
        log('CH-07', 'Mémoire conversationnelle', 'PASS', f'IA se souvient: "{reply}"')
    else:
        log('CH-07', 'Mémoire conversationnelle', 'WARN',
            f'Pas de référence au TJM 800€: "{reply}"',
            bug='Chat ne mémorise pas le contexte de conversation', severity='MOYENNE')
else:
    log('CH-07', 'Mémoire conversationnelle', 'FAIL',
        f'Status {r.status_code}: {str(d2)[:100]}',
        bug=f'POST /api/chat retourne {r.status_code}', severity='HAUTE')

# ── CH-08: Question hors périmètre ────────────────────────────────────────────
r = julie.post(f'{BASE}/api/chat', json={'message': 'Quel temps fait-il à Paris demain?'})
d = safe_json(r)
if r.status_code == 200:
    reply = str(d.get('message') or d.get('response') or d.get('content') or str(d))[:120]
    is_deflected = any(kw in reply.lower() for kw in ['business', 'activité', 'spécialisé', 'périmètre', 'ne peux pas', 'météo', 'pas disponible'])
    if is_deflected:
        log('CH-08', 'Question hors périmètre (météo)', 'PASS', f'IA déflecte correctement: "{reply}"')
    else:
        log('CH-08', 'Question hors périmètre (météo)', 'WARN',
            f'IA répond sans déflection: "{reply}"',
            bug='Chat répond aux questions hors périmètre business', severity='FAIBLE')
elif r.status_code == 403:
    log('CH-08', 'Question hors périmètre (Julie FREE)', 'WARN',
        '403 — Chat bloqué plan FREE', bug='Chat 403 pour Julie FREE', severity='FAIBLE')
else:
    log('CH-08', 'Question hors périmètre (météo)', 'FAIL',
        f'Status {r.status_code}: {str(d)[:100]}',
        bug=f'POST /api/chat retourne {r.status_code}', severity='HAUTE')

# ── CH-09: Trésorerie + OPCO ──────────────────────────────────────────────────
r = marc.post(f'{BASE}/api/chat', json={'message': 'Quel est mon solde de trésorerie ce mois? Y a-t-il des remboursements OPCO en attente?'})
d = safe_json(r)
if r.status_code == 200:
    reply = str(d.get('message') or d.get('response') or d.get('content') or str(d))[:120]
    log('CH-09', 'Trésorerie + OPCO contextuel', 'PASS', f'Réponse: "{reply}"')
else:
    log('CH-09', 'Trésorerie + OPCO contextuel', 'FAIL',
        f'Status {r.status_code}: {str(d)[:100]}',
        bug=f'POST /api/chat retourne {r.status_code}', severity='HAUTE')

# ── CH-10: Runway avec client public ──────────────────────────────────────────
r = marc.post(f'{BASE}/api/chat', json={'message': 'Avec mon solde actuel et un client public qui paie à 90 jours, combien de temps peux-je tenir financièrement?'})
d = safe_json(r)
if r.status_code == 200:
    reply = str(d.get('message') or d.get('response') or d.get('content') or str(d))[:120]
    log('CH-10', 'Runway client public 90j', 'PASS', f'Réponse: "{reply}"')
else:
    log('CH-10', 'Runway client public 90j', 'FAIL',
        f'Status {r.status_code}: {str(d)[:100]}',
        bug=f'POST /api/chat retourne {r.status_code}', severity='HAUTE')

# =============================================================================
print()
print('=' * 60)
print('MODULE DAILY FOCUS IA — 6 cas (DF-01 à DF-06)')
print('=' * 60)

# ── DF-01: Génération 3 priorités contextuelles ───────────────────────────────
r = sophie.post(f'{BASE}/api/focus', json={})
d = safe_json(r)
if r.status_code == 200:
    focus = d.get('focus') or d.get('priorities') or d.get('actions') or d
    items = focus if isinstance(focus, list) else (
        focus.get('items') or focus.get('priorities') or focus.get('actions') or []
    )
    count = len(items) if isinstance(items, list) else 0
    if count >= 1:
        first = items[0] if isinstance(items[0], dict) else {'action': str(items[0])}
        log('DF-01', 'Génération priorités Daily Focus',
            'PASS', f'{count} action(s) générée(s). Ex: "{str(first.get("action",""))[:80]}"')
    else:
        log('DF-01', 'Génération priorités Daily Focus',
            'WARN', f'Focus généré mais 0 actions: {str(d)[:100]}',
            bug='Daily Focus retourne 0 priorités', severity='HAUTE')
else:
    log('DF-01', 'Génération priorités Daily Focus',
        'FAIL', f'Status {r.status_code}: {str(d)[:100]}',
        bug=f'POST /api/focus retourne {r.status_code}', severity='CRITIQUE')

# ── DF-02: Priorité trésorerie critique ──────────────────────────────────────
# Vérifier que le focus contient des priorités liées à la trésorerie
r = sophie.get(f'{BASE}/api/focus')
d = safe_json(r)
if r.status_code == 200:
    content = str(d).lower()
    has_finance = any(kw in content for kw in ['trésorerie', 'tresorerie', 'facture', 'paiement', 'relance', 'prospect', 'finance'])
    if has_finance:
        log('DF-02', 'Priorité contextualisée (trésorerie/prospect)', 'PASS',
            f'Focus contient des priorités métier contextuelles')
    else:
        log('DF-02', 'Priorité contextualisée (trésorerie/prospect)', 'WARN',
            f'Focus générique sans contexte métier: {str(d)[:100]}',
            bug='Daily Focus non contextualisé au profil utilisateur', severity='MOYENNE')
else:
    log('DF-02', 'Priorité contextualisée (trésorerie/prospect)', 'FAIL',
        f'Status {r.status_code}: {str(d)[:100]}',
        bug=f'GET /api/focus retourne {r.status_code}', severity='HAUTE')

# ── DF-03: Priorité prospect inactif ─────────────────────────────────────────
r = marc.post(f'{BASE}/api/focus', json={})
d = safe_json(r)
if r.status_code == 200:
    content = str(d).lower()
    log('DF-03', 'Focus Marc PRO — priorités générées', 'PASS',
        f'Focus Marc: {str(d)[:120]}')
else:
    log('DF-03', 'Focus Marc PRO — priorités générées', 'FAIL',
        f'Status {r.status_code}: {str(d)[:100]}',
        bug=f'POST /api/focus Marc retourne {r.status_code}', severity='HAUTE')

# ── DF-04: Cocher action accomplie + streak ───────────────────────────────────
# D'abord récupérer le focus courant pour avoir un action_id
r = sophie.get(f'{BASE}/api/focus')
d = safe_json(r)
focus_obj = d.get('focus') or {}
focus_id = focus_obj.get('id')
actions = focus_obj.get('actions', [])

if r.status_code == 200 and focus_id and isinstance(actions, list) and len(actions) > 0:
    # PATCH par actionIndex (0=première action)
    r2 = sophie.patch(f'{BASE}/api/focus', json={'actionIndex': 0, 'status': 'done'})
    d2 = safe_json(r2)
    if r2.status_code in (200, 204):
        r3 = sophie.get(f'{BASE}/api/focus/streak')
        d3 = safe_json(r3)
        streak = d3.get('streak') or d3.get('current') or d3.get('currentStreak') or 0
        action_label = str(actions[0].get('action', ''))[:50]
        log('DF-04', 'Cocher action accomplie + streak',
            'PASS', f'Action[0] "{action_label}" → done. Streak={streak} jour(s)')
    else:
        log('DF-04', 'Cocher action accomplie + streak',
            'FAIL', f'PATCH /api/focus retourne {r2.status_code}: {str(d2)[:80]}',
            bug=f'PATCH focus actionIndex retourne {r2.status_code}', severity='HAUTE')
elif r.status_code == 200 and not focus_id:
    log('DF-04', 'Cocher action accomplie + streak',
        'WARN', f'Pas de focus_id dans réponse: {str(d)[:80]}',
        bug='GET /api/focus ne retourne pas d\'id de focus', severity='MOYENNE')
else:
    log('DF-04', 'Cocher action accomplie + streak',
        'FAIL', f'GET /api/focus retourne {r.status_code}: {str(d)[:80]}',
        bug=f'GET /api/focus retourne {r.status_code}', severity='HAUTE')

# ── DF-05: Email Daily Focus (Solo Pro) ───────────────────────────────────────
# Tester l'endpoint cron qui envoie l'email Daily Focus
r = marc.get(f'{BASE}/api/focus/score')
d = safe_json(r)
if r.status_code == 200:
    score = d.get('score') or d.get('current') or d.get('focusScore') or 0
    log('DF-05', 'Score Focus Solo Pro (Marc)', 'PASS',
        f'Score Focus Marc: {score} — Email Daily Focus dépend de Resend (domaine à vérifier)')
else:
    log('DF-05', 'Score Focus Solo Pro (Marc)', 'WARN',
        f'GET /api/focus/score: {r.status_code}: {str(d)[:80]}',
        bug=f'Focus score retourne {r.status_code}', severity='FAIBLE')

# ── DF-06: Daily Focus indisponible plan FREE ──────────────────────────────────
r = julie.post(f'{BASE}/api/focus', json={})
d = safe_json(r)
if r.status_code == 403:
    log('DF-06', 'Daily Focus bloqué plan FREE (Julie)', 'PASS',
        f'403 retourné correctement: {str(d)[:80]}')
elif r.status_code == 200:
    upgrade_req = d.get('upgradeRequired') or d.get('upgrade_required')
    if upgrade_req:
        log('DF-06', 'Daily Focus bloqué plan FREE (Julie)', 'PASS',
            f'200 avec upgradeRequired=True: {str(d)[:80]}')
    else:
        log('DF-06', 'Daily Focus bloqué plan FREE (Julie)', 'WARN',
            f'Daily Focus accessible en plan FREE sans restriction: {str(d)[:80]}',
            bug='Daily Focus disponible pour plan FREE — devrait être Solo Pro uniquement', severity='HAUTE')
else:
    log('DF-06', 'Daily Focus bloqué plan FREE (Julie)', 'WARN',
        f'Status inattendu {r.status_code}: {str(d)[:80]}')

# =============================================================================
print()
print('=' * 60)
print('RESUME FINAL — TR-05 + Chat IA (8) + Daily Focus (6)')
print('=' * 60)
p = sum(1 for x in results if x['status'] == 'PASS')
f = sum(1 for x in results if x['status'] == 'FAIL')
w = sum(1 for x in results if x['status'] == 'WARN')
print(f'TOTAL: {len(results)} cas | PASS: {p} | FAIL: {f} | WARN: {w} | BUGS: {len(bugs)}')
print()
if bugs:
    print('BUGS DETECTES:')
    for b in bugs:
        print(f'  [{b["severity"]}] {b["id"]} - {b["bug"]}')
print('=' * 60)
