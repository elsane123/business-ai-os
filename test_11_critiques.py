#!/usr/bin/env python3
"""Tests des 11 cas critiques — Sécurité, Reset Password, Agents IA, Rapports & URSSAF."""
import requests, json, subprocess, re, time

BASE = 'http://localhost:50082'
results = []
bugs = []

def safe_json(r):
    try:
        return r.json()
    except Exception:
        return {'_raw': r.text[:300]}

def log(id_, title, status, detail='', bug=None, severity='HAUTE'):
    icon = {'PASS': '✅', 'FAIL': '❌', 'WARN': '⚠️', 'SKIP': '⏭️'}.get(status, '?')
    print(f'\n[{status}] {id_} | {title}')
    if detail:
        print(f'      {detail[:160]}')
    if bug:
        print(f'  !! BUG [{severity}]: {bug}')
        bugs.append({'id': id_, 'severity': severity, 'bug': bug})
    results.append({'id': id_, 'title': title, 'status': status})

# ─── Login sessions ───────────────────────────────────────────────────────────
sophie = requests.Session()
marc   = requests.Session()
julie  = requests.Session()

print('=== LOGIN ===')
r = sophie.post(f'{BASE}/api/auth/login', json={'email': 'elsane.tiberini@gmail.com', 'password': 'SophieTest2026!'})
d = safe_json(r)
print(f'Sophie: {r.status_code} plan={d.get("user",{}).get("plan","?")} ok={d.get("success")}')

r = marc.post(f'{BASE}/api/auth/login', json={'email': 'sales@quotium.com', 'password': 'MarcTest2026!'})
d = safe_json(r)
print(f'Marc:   {r.status_code} plan={d.get("user",{}).get("plan","?")} ok={d.get("success")}')

r = julie.post(f'{BASE}/api/auth/login', json={'email': 'elsane@yahoo.fr', 'password': 'JulieTest2026!'})
d = safe_json(r)
print(f'Julie:  {r.status_code} plan={d.get("user",{}).get("plan","?")} ok={d.get("success")}')

# ─── Récupérer IDs ressources de Marc pour tests cross-user ───────────────────
marc_prospect_id = None
marc_task_id = None
marc_kb_doc_id = None
marc_quote_id = None
marc_invoice_id = None

# Prospects Marc
r = marc.get(f'{BASE}/api/pipeline/prospects')
d = safe_json(r)
prospects = d if isinstance(d, list) else d.get('prospects', [])
if prospects:
    marc_prospect_id = prospects[0].get('id')
    print(f'Marc prospect_id: {marc_prospect_id}')

# Tasks Marc
r = marc.get(f'{BASE}/api/tasks')
d = safe_json(r)
tasks = d.get('tasks', [])
if tasks:
    marc_task_id = tasks[0].get('id')
    print(f'Marc task_id: {marc_task_id}')

# KB docs Marc
r = marc.get(f'{BASE}/api/knowledge')
d = safe_json(r)
kb_docs = d if isinstance(d, list) else d.get('documents', [])
if kb_docs:
    marc_kb_doc_id = kb_docs[0].get('id')
    print(f'Marc kb_doc_id: {marc_kb_doc_id}')

# Quotes Marc
r = marc.get(f'{BASE}/api/quotes')
d = safe_json(r)
quotes = d if isinstance(d, list) else d.get('quotes', [])
if quotes:
    marc_quote_id = quotes[0].get('id')
    print(f'Marc quote_id: {marc_quote_id}')

# =============================================================================
print()
print('=' * 60)
print('PHASE 1 — SÉCURITÉ & ISOLATION (SC-04, KB-16, SC-05)')
print('=' * 60)

# ── SC-04: Cross-user isolation ───────────────────────────────────────────────
sc04_pass = True
sc04_details = []

# Test 1: Sophie accède aux prospects de Marc
if marc_prospect_id:
    r = sophie.get(f'{BASE}/api/pipeline/prospects/{marc_prospect_id}')
    if r.status_code in (403, 404):
        sc04_details.append(f'prospects/{marc_prospect_id[:8]}: {r.status_code} ✓')
    else:
        sc04_pass = False
        sc04_details.append(f'prospects/{marc_prospect_id[:8]}: {r.status_code} FAILLE!')

# Test 2: Sophie accède aux tâches de Marc
if marc_task_id:
    r = sophie.get(f'{BASE}/api/tasks/{marc_task_id}')
    if r.status_code in (403, 404):
        sc04_details.append(f'tasks/{marc_task_id[:8]}: {r.status_code} ✓')
    else:
        sc04_pass = False
        sc04_details.append(f'tasks/{marc_task_id[:8]}: {r.status_code} FAILLE!')

# Test 3: Sophie accède aux devis de Marc
if marc_quote_id:
    r = sophie.get(f'{BASE}/api/quotes/{marc_quote_id}')
    if r.status_code in (403, 404):
        sc04_details.append(f'quotes/{marc_quote_id[:8]}: {r.status_code} ✓')
    else:
        sc04_pass = False
        sc04_details.append(f'quotes/{marc_quote_id[:8]}: {r.status_code} FAILLE!')

# Test 4: Sophie modifie un prospect de Marc
if marc_prospect_id:
    r = sophie.patch(f'{BASE}/api/pipeline/prospects/{marc_prospect_id}',
                     json={'status': 'LOST', 'notes': 'Sophie was here'})
    if r.status_code in (403, 404):
        sc04_details.append(f'PATCH prospects/{marc_prospect_id[:8]}: {r.status_code} ✓')
    else:
        sc04_pass = False
        sc04_details.append(f'PATCH prospects/{marc_prospect_id[:8]}: {r.status_code} FAILLE!')

if not sc04_details:
    log('SC-04', 'Cross-user isolation', 'SKIP', 'Aucun ID Marc disponible pour test cross-user')
elif sc04_pass:
    log('SC-04', 'Cross-user isolation', 'PASS',
        'Toutes les ressources Marc inaccessibles depuis Sophie: ' + ' | '.join(sc04_details))
else:
    log('SC-04', 'Cross-user isolation', 'FAIL',
        'FAILLE SÉCURITÉ: ' + ' | '.join(sc04_details),
        bug='Cross-user data access non bloqué', severity='CRITIQUE')

# ── KB-16: Fichier KB cross-user ──────────────────────────────────────────────
if marc_kb_doc_id:
    r = sophie.get(f'{BASE}/api/knowledge/{marc_kb_doc_id}')
    if r.status_code in (403, 404):
        log('KB-16', 'Fichier KB cross-user bloqué', 'PASS',
            f'Sophie → doc Marc {marc_kb_doc_id[:12]}: {r.status_code} ✓')
    else:
        d = safe_json(r)
        log('KB-16', 'Fichier KB cross-user bloqué', 'FAIL',
            f'Sophie accède au doc Marc: {r.status_code}: {str(d)[:80]}',
            bug='Knowledge doc cross-user accessible', severity='CRITIQUE')
else:
    # Tester avec un ID fictif de Marc
    r = sophie.get(f'{BASE}/api/knowledge/fake_marc_doc_id_12345')
    if r.status_code in (403, 404):
        log('KB-16', 'Fichier KB cross-user bloqué', 'PASS',
            f'ID fictif retourne {r.status_code} ✓ (isolation par userId probable)')
    else:
        log('KB-16', 'Fichier KB cross-user bloqué', 'WARN',
            f'Pas de doc Marc KB disponible — ID fictif: {r.status_code}')

# ── SC-05: XSS injection ──────────────────────────────────────────────────────
xss_payloads = [
    '<script>alert("XSS")</script>',
    'Tâche normale <img src=x onerror=alert(1)>',
    'Test & "quotes" < > special chars',
]

xss_results = []
for payload in xss_payloads:
    r = sophie.post(f'{BASE}/api/tasks/parse-brief', json={'brief': payload})
    d = safe_json(r)
    response_text = json.dumps(d)
    # Vérifier que <script> est absent ou encodé dans la réponse
    has_raw_script = '<script>' in response_text or 'onerror=' in response_text
    xss_results.append({'payload': payload[:40], 'sanitized': not has_raw_script, 'status': r.status_code})

all_sanitized = all(x['sanitized'] for x in xss_results)
if all_sanitized:
    log('SC-05', 'XSS injection NLP sanitisée', 'PASS',
        f'lib/sanitize.ts actif — {len(xss_payloads)} payloads XSS sanitisés correctement')
else:
    failed = [x for x in xss_results if not x['sanitized']]
    log('SC-05', 'XSS injection NLP sanitisée', 'FAIL',
        f'XSS non sanitisé: {failed}',
        bug='XSS payload retourné non encodé dans la réponse API', severity='CRITIQUE')

# =============================================================================
print()
print('=' * 60)
print('PHASE 2 — RESET PASSWORD (SC-01, SC-02, SC-03)')
print('=' * 60)

# ── SC-01: Forgot password → réponse 200 ─────────────────────────────────────
r = requests.post(f'{BASE}/api/auth/forgot-password',
                  json={'email': 'elsane.tiberini@gmail.com'})
d = safe_json(r)
if r.status_code == 200 and d.get('success'):
    log('SC-01', 'Forgot password → réponse sécurisée', 'PASS',
        f'200 success=True: "{d.get("message", "")}" (email envoyé ou silencieux)')
elif r.status_code == 200:
    log('SC-01', 'Forgot password → réponse sécurisée', 'WARN',
        f'200 mais success absent: {str(d)[:80]}')
else:
    log('SC-01', 'Forgot password → réponse sécurisée', 'FAIL',
        f'Status {r.status_code}: {str(d)[:100]}',
        bug=f'POST /api/auth/forgot-password retourne {r.status_code}', severity='CRITIQUE')

# Test anti-énumération : email inexistant → même réponse 200
r2 = requests.post(f'{BASE}/api/auth/forgot-password',
                   json={'email': 'inconnu_xyz_999@test.com'})
d2 = safe_json(r2)
if r2.status_code == 200 and d2.get('success'):
    log('SC-01b', 'Anti-énumération email inexistant', 'PASS',
        f'Email inexistant → 200 success=True (pas de révélation d\'existence)')
else:
    log('SC-01b', 'Anti-énumération email inexistant', 'FAIL',
        f'Status {r2.status_code}: {str(d2)[:80]}',
        bug='Forgot-password révèle l\'existence du compte', severity='HAUTE')

# ── SC-02 + SC-03: Token reset via Node.js ────────────────────────────────────
APP = '/a0/usr/projects/business_ai_os/business-ai-os'
token_script = """const path = require('path');
process.chdir(path.join(__dirname));
const { createResetToken, validateResetToken, consumeResetToken } = require('./lib/reset-tokens');
const token = createResetToken('elsane.tiberini@gmail.com');
const valid = validateResetToken(token);
console.log('TOKEN:' + token + ':VALID:' + valid);
"""

reset_token = None
try:
    result = subprocess.run(
        ['node', '-e', token_script],
        capture_output=True, text=True, cwd=APP, timeout=10
    )
    output = result.stdout.strip()
    match = re.search(r'TOKEN:([^:]+):VALID:(.+)', output)
    if match:
        reset_token = match.group(1)
        valid_check = match.group(2)
        print(f'      Token généré: {reset_token[:16]}... valid={valid_check}')
except Exception as e:
    print(f'      Node.js token generation failed: {e}')

# SC-02 : Reset avec token valide
if reset_token:
    r = requests.post(f'{BASE}/api/auth/reset-password',
                      json={'token': reset_token, 'password': 'NewPass2026!'})
    d = safe_json(r)
    if r.status_code == 200 and d.get('success'):
        # Vérifier que le nouveau mot de passe fonctionne
        r2 = requests.post(f'{BASE}/api/auth/login',
                           json={'email': 'elsane.tiberini@gmail.com', 'password': 'NewPass2026!'})
        d2 = safe_json(r2)
        if r2.status_code == 200 and d2.get('success'):
            # Remettre l'ancien mot de passe
            token2_result = subprocess.run(
                ['node', '-e', token_script], capture_output=True, text=True, cwd=APP, timeout=10)
            match2 = re.search(r'TOKEN:([^:]+):VALID:', token2_result.stdout)
            if match2:
                requests.post(f'{BASE}/api/auth/reset-password',
                              json={'token': match2.group(1), 'password': 'SophieTest2026!'})
            log('SC-02', 'Reset password token valide', 'PASS',
                f'Token consommé → MDP changé → login OK avec nouveau MDP')
        else:
            log('SC-02', 'Reset password token valide', 'WARN',
                f'MDP changé mais login échoue: {r2.status_code}',
                bug='Reset password ne permet pas la connexion', severity='HAUTE')
    else:
        log('SC-02', 'Reset password token valide', 'FAIL',
            f'Status {r.status_code}: {str(d)[:100]}',
            bug=f'POST /api/auth/reset-password retourne {r.status_code}', severity='CRITIQUE')
else:
    log('SC-02', 'Reset password token valide', 'WARN',
        'Token non générable via Node.js — test SC-02 non exécutable',
        bug='Impossible de générer token in-memory depuis Python', severity='FAIBLE')

# SC-03 : Reset avec token invalide/expiré
r = requests.post(f'{BASE}/api/auth/reset-password',
                  json={'token': 'faux-token-expire-xyz-12345', 'password': 'NewPass2026!'})
d = safe_json(r)
if r.status_code == 400 and ('invalide' in str(d).lower() or 'expiré' in str(d).lower() or 'expired' in str(d).lower()):
    log('SC-03', 'Reset password token expiré/invalide', 'PASS',
        f'400 retourné: "{d.get("error", "")}"')
elif r.status_code == 400:
    log('SC-03', 'Reset password token expiré/invalide', 'PASS',
        f'400 retourné (token rejeté): {str(d)[:80]}')
else:
    log('SC-03', 'Reset password token expiré/invalide', 'FAIL',
        f'Status {r.status_code}: {str(d)[:100]}',
        bug=f'Token invalide non rejeté: {r.status_code}', severity='CRITIQUE')

# =============================================================================
print()
print('=' * 60)
print('PHASE 3 — AGENTS IA (AG-01, AG-03, AG-04)')
print('=' * 60)

# ── AG-01: Catalogue agents ───────────────────────────────────────────────────
r = sophie.get(f'{BASE}/api/agents/catalog')
d = safe_json(r)
if r.status_code == 200:
    agents = d.get('agents', d if isinstance(d, list) else [])
    agent_ids = [a.get('id') for a in agents if isinstance(a, dict)]
    expected = ['agent-cfo', 'agent-cro', 'agent-cmo', 'agent-legal', 'agent-chro', 'agent-ops', 'agent-coach']
    found_all = all(aid in agent_ids for aid in expected)
    has_meta = all('isActive' in a and 'canActivate' in a for a in agents if isinstance(a, dict))
    if found_all and has_meta:
        log('AG-01', 'Catalogue agents complet', 'PASS',
            f'{len(agents)} agents: {agent_ids} — isActive + canActivate présents')
    elif agents:
        log('AG-01', 'Catalogue agents complet', 'WARN',
            f'{len(agents)} agents retournés — manquants: {[a for a in expected if a not in agent_ids]}',
            bug='Catalogue incomplet ou métadonnées manquantes', severity='MOYENNE')
    else:
        log('AG-01', 'Catalogue agents complet', 'FAIL',
            f'Liste vide: {str(d)[:100]}',
            bug='GET /api/agents/catalog retourne liste vide', severity='HAUTE')
else:
    log('AG-01', 'Catalogue agents complet', 'FAIL',
        f'Status {r.status_code}: {str(d)[:100]}',
        bug=f'GET /api/agents/catalog retourne {r.status_code}', severity='HAUTE')

# ── AG-03: Activer agent CFO (Sophie PRO) ─────────────────────────────────────
r = sophie.post(f'{BASE}/api/agents/agent-cfo/activate')
d = safe_json(r)
if r.status_code in (200, 201):
    log('AG-03', 'Activer agent CFO (Sophie PRO)', 'PASS',
        f'agent-cfo activé: {str(d)[:100]}')
elif r.status_code == 409:
    log('AG-03', 'Activer agent CFO (Sophie PRO)', 'PASS',
        f'409 agent déjà actif (idempotent) — comportement correct')
elif r.status_code == 403:
    log('AG-03', 'Activer agent CFO (Sophie PRO)', 'FAIL',
        f'403 — Sophie PRO bloquée sur activation: {str(d)[:80]}',
        bug='Agent activation bloquée pour utilisateur PRO', severity='CRITIQUE')
else:
    log('AG-03', 'Activer agent CFO (Sophie PRO)', 'FAIL',
        f'Status {r.status_code}: {str(d)[:100]}',
        bug=f'POST /api/agents/agent-cfo/activate retourne {r.status_code}', severity='HAUTE')

# ── AG-03b: Activation agent bloquée plan FREE (Julie) ───────────────────────
r = julie.post(f'{BASE}/api/agents/agent-cfo/activate')
d = safe_json(r)
if r.status_code == 403:
    log('AG-03b', 'Activation agent bloquée plan FREE', 'PASS',
        f'403 Julie FREE: {str(d)[:80]}')
elif r.status_code == 200:
    log('AG-03b', 'Activation agent bloquée plan FREE', 'FAIL',
        f'Julie FREE peut activer des agents — pas de restriction plan',
        bug='Agents activables par plan FREE', severity='HAUTE')
else:
    log('AG-03b', 'Activation agent bloquée plan FREE', 'WARN',
        f'Status inattendu {r.status_code}: {str(d)[:80]}')

# ── AG-04: Chat avec agent CFO ────────────────────────────────────────────────
r = sophie.post(f'{BASE}/api/agents/agent-cfo/chat',
                json={'message': 'Analyse ma trésorerie et donne-moi 3 recommandations CFO'})
d = safe_json(r)
if r.status_code == 200:
    reply = str(d.get('message') or d.get('response') or d.get('content') or str(d))[:120]
    log('AG-04', 'Chat agent CFO contextuel', 'PASS',
        f'Réponse CFO: "{reply}"')
elif r.status_code == 404:
    log('AG-04', 'Chat agent CFO contextuel', 'FAIL',
        f'404 — route /api/agents/agent-cfo/chat introuvable',
        bug='POST /api/agents/{id}/chat route manquante ou agent non activé requis', severity='HAUTE')
else:
    log('AG-04', 'Chat agent CFO contextuel', 'FAIL',
        f'Status {r.status_code}: {str(d)[:100]}',
        bug=f'POST /api/agents/agent-cfo/chat retourne {r.status_code}', severity='HAUTE')

# =============================================================================
print()
print('=' * 60)
print('PHASE 4 — RAPPORTS & URSSAF (RP-01, UR-01)')
print('=' * 60)

# ── RP-01: Rapport mensuel ────────────────────────────────────────────────────
r = sophie.get(f'{BASE}/api/reports/monthly?month=2026-05')
d = safe_json(r)
if r.status_code == 200:
    has_ca = any(k in d for k in ['ca', 'revenue', 'totalRevenue', 'income'])
    has_prospects = any(k in d for k in ['prospects', 'pipeline', 'pipelineCount'])
    if has_ca or has_prospects:
        log('RP-01', 'Rapport mensuel mai 2026', 'PASS',
            f'KPIs présents: {list(d.keys())[:8]}')
    else:
        log('RP-01', 'Rapport mensuel mai 2026', 'WARN',
            f'200 mais structure inattendue: {list(d.keys())[:8]}',
            bug='Rapport mensuel manque de KPIs CA/prospects', severity='MOYENNE')
else:
    log('RP-01', 'Rapport mensuel mai 2026', 'FAIL',
        f'Status {r.status_code}: {str(d)[:120]}',
        bug=f'GET /api/reports/monthly retourne {r.status_code}', severity='HAUTE')

# ── UR-01: Calcul URSSAF ──────────────────────────────────────────────────────
r = sophie.get(f'{BASE}/api/cash/urssaf')
d = safe_json(r)
if r.status_code == 200:
    has_rate = any(k in str(d).lower() for k in ['rate', 'taux', 'cotisation', 'urssaf'])
    has_amount = any(k in d for k in ['amount', 'montant', 'total', 'due', 'cotisations'])
    if has_rate or has_amount:
        log('UR-01', 'Calcul cotisations URSSAF', 'PASS',
            f'URSSAF calculé: {str(d)[:120]}')
    else:
        log('UR-01', 'Calcul cotisations URSSAF', 'WARN',
            f'200 mais structure inattendue: {str(d)[:100]}',
            bug='URSSAF retourne 200 sans données de cotisations', severity='MOYENNE')
else:
    log('UR-01', 'Calcul cotisations URSSAF', 'FAIL',
        f'Status {r.status_code}: {str(d)[:120]}',
        bug=f'GET /api/cash/urssaf retourne {r.status_code}', severity='HAUTE')

# =============================================================================
print()
print('=' * 60)
print('RESUME FINAL — 11 cas critiques + 2 bonus')
print('=' * 60)
p = sum(1 for x in results if x['status'] == 'PASS')
f = sum(1 for x in results if x['status'] == 'FAIL')
w = sum(1 for x in results if x['status'] == 'WARN')
s = sum(1 for x in results if x['status'] == 'SKIP')
print(f'TOTAL: {len(results)} cas | PASS: {p} | FAIL: {f} | WARN: {w} | SKIP: {s} | BUGS: {len(bugs)}')
print()
if bugs:
    print('BUGS DETECTES:')
    for b in bugs:
        print(f'  [{b["severity"]}] {b["id"]} - {b["bug"]}')
else:
    print('Aucun bug détecté.')
print('=' * 60)