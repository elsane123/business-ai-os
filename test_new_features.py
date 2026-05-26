import requests
import json
import sys

BASE = 'http://localhost:50082'
EMAIL = 'test_qa_20260525@brainlo.test'
PASSWORD = 'TestBrainlo123!'

results = []

def test(name, fn):
    try:
        ok, msg = fn()
        status = '✅' if ok else '❌'
        results.append((name, ok, msg))
        print(f'{status} {name}: {msg}')
    except Exception as e:
        results.append((name, False, str(e)))
        print(f'❌ {name}: EXCEPTION {e}')

# === Login ===
session = requests.Session()
print('\n=== LOGIN ===' )
r = session.post(f'{BASE}/api/auth/login', json={'email': EMAIL, 'password': PASSWORD})
if r.status_code == 200:
    print(f'✅ Login OK ({r.status_code})')
else:
    # try different login endpoint
    r = session.post(f'{BASE}/api/auth/login', json={'email': EMAIL, 'password': PASSWORD}, allow_redirects=True)
    print(f'Login status: {r.status_code}, trying to check session...')

# Check session
print('\n=== API TESTS ===')

# T19: /api/user/onboarding sans auth
def t19():
    r = requests.get(f'{BASE}/api/user/onboarding')
    return r.status_code == 401, f'HTTP {r.status_code} (attendu 401)'
test('T19 - /api/user/onboarding sans auth → 401', t19)

# T20: /api/user/enrichment sans auth
def t20():
    r = requests.get(f'{BASE}/api/user/enrichment')
    return r.status_code == 401, f'HTTP {r.status_code} (attendu 401)'
test('T20 - /api/user/enrichment sans auth → 401', t20)

# T_SM: Smoke tests pages publiques
for path, name in [('/', 'Landing'), ('/login', 'Login'), ('/blog', 'Blog'), ('/robots.txt', 'Robots'), ('/sitemap.xml', 'Sitemap')]:
    def smoke(p=path, n=name):
        r = requests.get(f'{BASE}{p}')
        return r.status_code == 200, f'HTTP {r.status_code}'
    test(f'T_SM - {name} accessible', smoke)

# T_AUTH: /api/user/onboarding avec auth
def t_onboarding_auth():
    r = session.get(f'{BASE}/api/user/onboarding')
    if r.status_code == 200:
        data = r.json()
        return True, f'HTTP 200 - completed: {data.get("completed", [])}'
    return False, f'HTTP {r.status_code} - {r.text[:100]}'
test('T_AUTH - /api/user/onboarding avec auth', t_onboarding_auth)

# T_ENR: /api/user/enrichment avec auth
def t_enrichment_auth():
    r = session.get(f'{BASE}/api/user/enrichment')
    if r.status_code == 200:
        data = r.json()
        return True, f'HTTP 200 - score: {data.get("score", "N/A")}'
    return False, f'HTTP {r.status_code}'
test('T_ENR - /api/user/enrichment avec auth', t_enrichment_auth)

# T_PROSPECT: Créer prospect
def t_prospect():
    r = session.post(f'{BASE}/api/prospects', json={
        'name': 'Test Prospect QA',
        'company': 'ACME Corp',
        'email': 'prospect@acme.com',
        'status': 'IDENTIFIED',
        'value': 5000
    })
    if r.status_code in [200, 201]:
        return True, f'HTTP {r.status_code} - prospect créé'
    return False, f'HTTP {r.status_code} - {r.text[:100]}'
test('T08 - Créer un prospect (API)', t_prospect)

# T_TASK: Créer tâche
def t_task():
    r = session.post(f'{BASE}/api/tasks', json={
        'title': 'Tâche de test QA',
        'priority': 'MEDIUM',
        'status': 'TODO'
    })
    if r.status_code in [200, 201]:
        return True, f'HTTP {r.status_code} - tâche créée'
    return False, f'HTTP {r.status_code} - {r.text[:100]}'
test('T09 - Créer une tâche (API)', t_task)

# T_FOCUS: Récupérer focus
def t_focus():
    r = session.get(f'{BASE}/api/focus')
    if r.status_code in [200, 403]:
        return True, f'HTTP {r.status_code} (focus page accessible)'
    return False, f'HTTP {r.status_code}'
test('T10 - GET /api/focus accessible', t_focus)

# T_STRIPE: Check Stripe endpoint
def t_stripe():
    r = session.post(f'{BASE}/api/stripe/checkout', json={'priceId': 'test'})
    return r.status_code in [200, 400, 401, 403], f'HTTP {r.status_code} (endpoint répond)'
test('T15 - Stripe checkout endpoint répond', t_stripe)

# T_INVOICE: GET invoices
def t_invoice():
    r = session.get(f'{BASE}/api/invoices')
    if r.status_code == 200:
        return True, f'HTTP 200 - OK'
    return False, f'HTTP {r.status_code}'
test('T17 - GET /api/invoices avec auth', t_invoice)

# T_AGENTS: GET agents catalog
def t_agents():
    r = session.get(f'{BASE}/api/agents')
    return r.status_code in [200, 403], f'HTTP {r.status_code}'
test('T18 - GET /api/agents accessible', t_agents)

# T_ONBOARDING_STEPS: Vérifier que steps enrich+calcom sont dans la réponse logique
def t_checklist_steps():
    r = session.get(f'{BASE}/api/user/onboarding')
    if r.status_code == 200:
        data = r.json()
        completed = data.get('completed', [])
        # account and sector should be completed
        has_account = 'account' in completed
        has_sector = 'sector' in completed
        return has_account and has_sector, f'completed={completed}'
    return False, f'HTTP {r.status_code}'
test('T06/T07 - Checklist: account + sector auto-détectés', t_checklist_steps)

print('\n=== RÉSUMÉ ===')
passed = sum(1 for _, ok, _ in results if ok)
total = len(results)
print(f'{passed}/{total} tests passés')
for name, ok, msg in results:
    print(f'{"✅" if ok else "❌"} {name}')

