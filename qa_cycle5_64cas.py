#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""QA Cycle 5 – Brainlo API – 64 cas de test"""
import requests, json, time, os, sys
from datetime import datetime

BASE_URL = 'http://localhost:50082'
SOPHIE = {'email': 'elsane.tiberini@gmail.com', 'password': 'SophieTest2026!'}
MARC   = {'email': 'sales@quotium.com',         'password': 'MarcTest2026!'}
JULIE  = {'email': 'elsane@yahoo.fr',            'password': 'JulieTest2026!'}

SOPHIE_PROSPECT_ID = 'cmp9lxbdt0002mmk0ikazd6xj'
SOPHIE_QUOTE_ID    = 'cmp9lzekd000qmmk0ix84ya4f'
SOPHIE_INVOICE_ID  = 'cmp9m8lr7000smmk0m0m13281'

results, bugs = [], []

def login(creds):
    s = requests.Session()
    r = s.post(f'{BASE_URL}/api/auth/login', json=creds)
    return s, r

def log(tid, ep, method, got, expected, passed, notes=''):
    rec = {'id': tid, 'endpoint': f'{method} {ep}',
           'got': got, 'expected': str(expected), 'passed': passed,
           'notes': str(notes)[:300]}
    results.append(rec)
    if not passed:
        bugs.append(rec)
    icon = '✅' if passed else '❌'
    print(f'{icon} [{tid}] {method} {ep} → {got} (exp:{expected}) | {str(notes)[:100]}')
    sys.stdout.flush()

print(f'=== QA CYCLE 5 — {datetime.now().strftime("%Y-%m-%d %H:%M")} ===')
print(f'Base URL: {BASE_URL}')

############################################################
# GROUPE 1 – ONBOARDING (7 cas)
############################################################
print('\n═══ G1: ONBOARDING ═══')

# OB-03: duplicate email → 409
r = requests.post(f'{BASE_URL}/api/auth/register',
    json={'email': SOPHIE['email'], 'password': 'TestPass123!',
          'name': 'Dup User', 'businessName': 'Dup Co'})
log('OB-03', '/api/auth/register', 'POST', r.status_code, 409,
    r.status_code == 409, r.text[:150])

# OB-04: weak password → 400
r = requests.post(f'{BASE_URL}/api/auth/register',
    json={'email': 'ob04@qa.test', 'password': '1234',
          'name': 'Test', 'businessName': 'TestCo'})
log('OB-04', '/api/auth/register', 'POST', r.status_code, 400,
    r.status_code == 400, r.text[:150])

# OB-05: empty name → 400
r = requests.post(f'{BASE_URL}/api/auth/register',
    json={'email': 'ob05@qa.test', 'password': 'ValidPass123!',
          'name': '', 'businessName': 'TestCo'})
log('OB-05', '/api/auth/register', 'POST', r.status_code, 400,
    r.status_code == 400, r.text[:150])

# OB-07: wrong password → 401
r = requests.post(f'{BASE_URL}/api/auth/login',
    json={'email': SOPHIE['email'], 'password': 'WrongPwd999!'})
log('OB-07', '/api/auth/login', 'POST', r.status_code, 401,
    r.status_code == 401, r.text[:150])

# OB-08: change-password cycle
s, lr = login(SOPHIE)
new_pwd = 'SophieNew2026!'
if lr.status_code == 200:
    r1 = s.post(f'{BASE_URL}/api/auth/change-password',
        json={'currentPassword': SOPHIE['password'], 'newPassword': new_pwd})
    if r1.status_code == 405:
        r1 = s.patch(f'{BASE_URL}/api/auth/change-password',
            json={'currentPassword': SOPHIE['password'], 'newPassword': new_pwd})
    time.sleep(0.3)
    s2, lr2 = login({'email': SOPHIE['email'], 'password': new_pwd})
    if lr2.status_code == 200:
        r2 = s2.post(f'{BASE_URL}/api/auth/change-password',
            json={'currentPassword': new_pwd, 'newPassword': SOPHIE['password']})
        if r2.status_code == 405:
            r2 = s2.patch(f'{BASE_URL}/api/auth/change-password',
                json={'currentPassword': new_pwd, 'newPassword': SOPHIE['password']})
        ok08 = r1.status_code in [200,204] and lr2.status_code==200 and r2.status_code in [200,204]
        n08 = f'change:{r1.status_code} new_login:{lr2.status_code} restore:{r2.status_code}'
    else:
        ok08 = False
        n08 = f'change:{r1.status_code} new_login_failed:{lr2.status_code}'
    log('OB-08', '/api/auth/change-password', 'POST', r1.status_code, 200, ok08, n08)
else:
    log('OB-08', '/api/auth/change-password', 'POST', 0, 200, False, f'login_failed:{lr.status_code}')

# OB-09: PATCH profile + siret
s, lr = login(SOPHIE)
if lr.status_code == 200:
    r = s.patch(f'{BASE_URL}/api/auth/profile',
        json={'siret': '12345678901234', 'address': '15 Rue de la Paix 75001 Paris',
              'businessName': 'Sophie Design Studio'})
    me = s.get(f'{BASE_URL}/api/auth/me')
    try:
        md = me.json()
        has_siret = 'siret' in md or 'siret' in str(md.get('user', ''))
    except: has_siret = False
    log('OB-09', '/api/auth/profile', 'PATCH', r.status_code, 200,
        r.status_code in [200, 204], f'siret_in_me:{has_siret}')
else:
    log('OB-09', '/api/auth/profile', 'PATCH', 0, 200, False, 'login_failed')

# OB-10: logout → /me = 401
s, lr = login(SOPHIE)
if lr.status_code == 200:
    rl = s.post(f'{BASE_URL}/api/auth/logout')
    rm = s.get(f'{BASE_URL}/api/auth/me')
    log('OB-10', '/api/auth/logout→/me', 'POST', rl.status_code, 200,
        rl.status_code in [200,204] and rm.status_code == 401,
        f'/me_after_logout:{rm.status_code}')
else:
    log('OB-10', '/api/auth/logout→/me', 'POST', 0, 200, False, 'login_failed')

g1_pass = sum(1 for r in results if r['passed'])
print(f'G1 subtotal: {g1_pass}/{len(results)}')

############################################################
# GROUPE 2 – CRM PIPELINE (10 cas)
############################################################
print('\n═══ G2: CRM PIPELINE ═══')
s, lr = login(SOPHIE)
print(f'  Sophie login: {lr.status_code}')

# CRM-02: enrich SIRET
r = s.post(f'{BASE_URL}/api/pipeline/prospects/{SOPHIE_PROSPECT_ID}/enrich')
log('CRM-02', '/api/pipeline/prospects/{id}/enrich', 'POST',
    r.status_code, 200, r.status_code in [200,201], r.text[:200])

# CRM-03: PATCH status=CONTACTED
r = s.patch(f'{BASE_URL}/api/pipeline/prospects/{SOPHIE_PROSPECT_ID}',
    json={'status': 'CONTACTED'})
log('CRM-03', '/api/pipeline/prospects/{id}', 'PATCH',
    r.status_code, 200, r.status_code == 200, r.text[:150])

# CRM-04: parse-brief NLP
r = s.post(f'{BASE_URL}/api/pipeline/prospects/parse-brief',
    json={'brief': 'TechSolutions SARL, directeur Jean-Paul Dupont, besoin formation Python 10 devs, budget 20000 euros, decision fin juin'})
log('CRM-04', '/api/pipeline/prospects/parse-brief', 'POST',
    r.status_code, 200, r.status_code in [200,201], r.text[:200])

# CRM-05: GET filtre status=IDENTIFIED
r = s.get(f'{BASE_URL}/api/pipeline/prospects?status=IDENTIFIED')
try:
    d = r.json()
    items = d if isinstance(d, list) else d.get('prospects', d.get('data', []))
except: items = []
log('CRM-05', '/api/pipeline/prospects?status=IDENTIFIED', 'GET',
    r.status_code, 200, r.status_code == 200, f'count={len(items)}')

# CRM-06: relance IA
r = s.post(f'{BASE_URL}/api/pipeline/prospects/{SOPHIE_PROSPECT_ID}/relance',
    json={'context': 'prospect froid depuis 3 semaines, relancer sur offre formation'})
log('CRM-06', '/api/pipeline/prospects/{id}/relance', 'POST',
    r.status_code, 200, r.status_code in [200,201], r.text[:150])

# CRM-08: create + PATCH status=LOST
rn = s.post(f'{BASE_URL}/api/pipeline/prospects',
    json={'name': 'Test Lost QA', 'company': 'LostCo', 'status': 'IDENTIFIED'})
try:
    nd = rn.json()
    nid = nd.get('id') or nd.get('prospect', {}).get('id')
except: nid = None
if nid:
    r = s.patch(f'{BASE_URL}/api/pipeline/prospects/{nid}', json={'status': 'LOST'})
    log('CRM-08', '/api/pipeline/prospects/{id} →LOST', 'PATCH',
        r.status_code, 200, r.status_code == 200, r.text[:150])
else:
    log('CRM-08', '/api/pipeline/prospects/{id} →LOST', 'PATCH',
        rn.status_code, 200, False, f'create_failed:{rn.text[:100]}')

# CRM-09: create + PATCH status=WON
rn2 = s.post(f'{BASE_URL}/api/pipeline/prospects',
    json={'name': 'Test Won QA', 'company': 'WinCo', 'status': 'IDENTIFIED'})
try:
    nd2 = rn2.json()
    nid2 = nd2.get('id') or nd2.get('prospect', {}).get('id')
except: nid2 = None
if nid2:
    r = s.patch(f'{BASE_URL}/api/pipeline/prospects/{nid2}', json={'status': 'WON'})
    log('CRM-09', '/api/pipeline/prospects/{id} →WON', 'PATCH',
        r.status_code, 200, r.status_code == 200, r.text[:150])
else:
    log('CRM-09', '/api/pipeline/prospects/{id} →WON', 'PATCH',
        rn2.status_code, 200, False, f'create_failed:{rn2.text[:100]}')

# CRM-10: search=Rousseau
r = s.get(f'{BASE_URL}/api/pipeline/prospects?search=Rousseau')
try:
    d = r.json()
    items = d if isinstance(d, list) else d.get('prospects', d.get('data', []))
    has_r = any('Rousseau' in str(p) for p in items)
except: has_r = False; items = []
log('CRM-10', '/api/pipeline/prospects?search=Rousseau', 'GET',
    r.status_code, 200, r.status_code == 200 and has_r,
    f'count={len(items)} has_rousseau={has_r}')

# CRM-11: relance contexte OPCO
r = s.post(f'{BASE_URL}/api/pipeline/prospects/{SOPHIE_PROSPECT_ID}/relance',
    json={'context': 'financement OPCO disponible, formation CPF eligible, decision avant fin trimestre'})
log('CRM-11', '/api/pipeline/prospects/{id}/relance OPCO', 'POST',
    r.status_code, 200, r.status_code in [200,201], r.text[:150])

# CRM-12: FREE plan limit (Julie)
js, jlr = login(JULIE)
print(f'  Julie login: {jlr.status_code}')
if jlr.status_code == 200:
    r_list = js.get(f'{BASE_URL}