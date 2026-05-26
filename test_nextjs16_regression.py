#!/usr/bin/env python3
"""
Brainlo - Tests de Régression Post-Upgrade Next.js 14→16 / React 18→19
Date: 2026-05-22
Couverture: Fonctionnel Personae | SEO | Performance | Mobile | Stripe | Sécurité
"""
import requests, json, time, sys, re, hmac, hashlib
from datetime import datetime
from typing import Optional

BASE_URL = "http://localhost:50082"
API_URL  = f"{BASE_URL}/api"
STRIPE_WEBHOOK_SECRET = "whsec_LsndJ5kH1O33gZkFi8JRhGwmsg93yRWF"

PERSONAE = {
    "Sophie_PRO":  {"email": "elsane.tiberini@gmail.com", "password": "TestBrainlo2026!", "plan": "PRO"},
    "Marc_PRO":    {"email": "sales@quotium.com",          "password": "TestBrainlo2026!", "plan": "PRO"},
    "Julie_FREE":  {"email": "elsane@yahoo.fr",            "password": "TestBrainlo2026!", "plan": "FREE"},
}

results = []; total_pass = 0; total_fail = 0; total_warn = 0
start_time = time.time()

G = "\033[92m"; R = "\033[91m"; Y = "\033[93m"; C = "\033[96m"; Z = "\033[0m"

def log(status, category, test_id, name, detail="", duration=0):
    global total_pass, total_fail, total_warn
    sym = {"PASS":"✓","FAIL":"✗","WARN":"⚠","INFO":"→"}.get(status,"?")
    col = {"PASS":G,"FAIL":R,"WARN":Y,"INFO":C}.get(status,"")
    ms  = f" [{duration:.0f}ms]" if duration else ""
    print(f"{col}{sym} [{test_id}] {name}{ms}: {detail}{Z}")
    if status=="PASS": total_pass+=1
    elif status=="FAIL": total_fail+=1
    elif status=="WARN": total_warn+=1
    results.append({"status":status,"category":category,"id":test_id,"name":name,"detail":detail,"duration_ms":round(duration)})

def section(title):
    print(f"\n{C}{'═'*65}\n  {title}\n{'═'*65}{Z}")

def req_get(url, headers=None, timeout=10, ua=None):
    t0=time.time()
    try:
        h = headers or {}
        if ua: h["User-Agent"] = ua
        r=requests.get(url,headers=h,timeout=timeout,allow_redirects=True)
        return r,(time.time()-t0)*1000
    except: return None,0

def req_post(url, data, headers=None, timeout=10):
    t0=time.time()
    try:
        r=requests.post(url,json=data,headers=headers or {"Content-Type":"application/json"},timeout=timeout)
        return r,(time.time()-t0)*1000
    except: return None,0

def req_patch(url, data, headers, timeout=10):
    t0=time.time()
    try:
        r=requests.patch(url,json=data,headers=headers,timeout=timeout)
        return r,(time.time()-t0)*1000
    except: return None,0

def req_delete(url, headers, timeout=10):
    t0=time.time()
    try:
        r=requests.delete(url,headers=headers,timeout=timeout)
        return r,(time.time()-t0)*1000
    except: return None,0

def auth_h(token): return {"Authorization":f"Bearer {token}","Content-Type":"application/json"}

def do_login(email, password):
    r,ms=req_post(f"{API_URL}/auth/login",{"email":email,"password":password})
    if r and r.status_code==200:
        d=r.json()
        return d.get("token") or d.get("accessToken") or (d.get("data") or {}).get("token"), ms
    return None, ms

# ══════════════════════════════════════════════════════════════════
# PHASE 0 — SMOKE TEST SERVEUR
# ══════════════════════════════════════════════════════════════════
section("PHASE 0 — SMOKE TEST SERVEUR")
pages = [
    ("SM-00","Landing Page","/"),
    ("SM-01","Login Page","/login"),
    ("SM-02","Onboarding","/onboarding"),
    ("SM-03","Blog","/blog"),
    ("SM-04","Robots.txt","/robots.txt"),
    ("SM-05","Sitemap.xml","/sitemap.xml"),
    ("SM-06","Forgot Password","/forgot-password"),
    ("SM-07","Assessment","/assessment"),
]
for tid,name,path in pages:
    r,ms=req_get(f"{BASE_URL}{path}")
    code=r.status_code if r else "TIMEOUT"
    if r and r.status_code==200: log("PASS","SMOKE",tid,name,f"HTTP 200",ms)
    elif r and r.status_code in(301,302): log("WARN","SMOKE",tid,name,f"Redirect → {r.headers.get('location')}",ms)
    else: log("FAIL","SMOKE",tid,name,f"HTTP {code}",ms)

# ══════════════════════════════════════════════════════════════════
# PHASE 1 — AUTHENTIFICATION PAR PERSONAE
# ══════════════════════════════════════════════════════════════════
section("PHASE 1 — AUTHENTIFICATION PAR PERSONAE")
tokens={}
for pk,p in PERSONAE.items():
    tok,ms=do_login(p["email"],p["password"])
    if tok:
        tokens[pk]=tok
        log("PASS","AUTH",f"AU-{pk[:3]}",f"Login {pk} [{p['plan']}]","Token JWT OK",ms)
    else:
        log("FAIL","AUTH",f"AU-{pk[:3]}",f"Login {pk}",f"HTTP error ou pas de token",ms)

# Credentials invalides
r,ms=req_post(f"{API_URL}/auth/login",{"email":"hacker@evil.com","password":"badpass"})
if r and r.status_code in(400,401,403): log("PASS","AUTH","AU-INV","Credentials invalides rejetés",f"HTTP {r.status_code}",ms)
else: log("FAIL","AUTH","AU-INV","Credentials invalides rejetés",f"HTTP {r.status_code if r else 'ERR'}",ms)

# Route protégée sans token
r,ms=req_get(f"{API_URL}/tasks")
if r and r.status_code in(401,403): log("PASS","AUTH","AU-GRD","Route protégée sans token refusée",f"HTTP {r.status_code}",ms)
else: log("WARN","AUTH","AU-GRD","Route protégée sans token",f"HTTP {r.status_code if r else 'ERR'}",ms)

# Token malformé
r,ms=req_get(f"{API_URL}/tasks",{"Authorization":"Bearer INVALID_TOKEN_XYZ"})
if r and r.status_code in(401,403): log("PASS","AUTH","AU-BAD","Token malformé refusé",f"HTTP {r.status_code}",ms)
else: log("WARN","AUTH","AU-BAD","Token malformé",f"HTTP {r.status_code if r else 'ERR'}",ms)

# ══════════════════════════════════════════════════════════════════
# PHASE 2 — TESTS FONCTIONNELS PAR PERSONAE
# ══════════════════════════════════════════════════════════════════
for pk in ["Sophie_PRO","Marc_PRO","Julie_FREE"]:
    section(f"PHASE 2 — FONCTIONNEL [{pk}]")
    tok=tokens.get(pk)
    plan=PERSONAE[pk]["plan"]
    if not tok:
        log("FAIL","FUNC",f"FN-{pk[:3]}",f"{pk}: pas de token, skip")
        continue
    h=auth_h(tok)
    pid=pk[:3]

    # 2.1 Auth/me
    r,ms=req_get(f"{API_URL}/auth/me",h)
    if r and r.status_code==200:
        d=r.json(); em=d.get("email") or (d.get("user") or {}).get("email","?")
        log("PASS","FUNC",f"FN-ME-{pid}",f"{pk} — /api/auth/me",f"email={em}",ms)
    else: log("FAIL","FUNC",f"FN-ME-{pid}",f"{pk} — /api/auth/me",f"HTTP {r.status_code if r else 'ERR'}",ms)

    # 2.2 GET Prospects
    r,ms=req_get(f"{API_URL}/pipeline/prospects",h)
    if r and r.status_code==200:
        d=r.json(); cnt=len(d) if isinstance(d,list) else len(d.get("prospects",[]))
        log("PASS","FUNC",f"FN-CRM-{pid}",f"{pk} — GET prospects",f"{cnt} prospects",ms)
    else: log("FAIL","FUNC",f"FN-CRM-{pid}",f"{pk} — GET prospects",f"HTTP {r.status_code if r else 'ERR'}",ms)

    # 2.3 POST Prospect
    r,ms=req_post(f"{API_URL}/pipeline/prospects",{"name":f"TestProspect_{pk}_{int(time.time())}","email":"p@test.com","status":"lead","value":1200},h)
    prospect_id=None
    if r and r.status_code in(200,201):
        d=r.json(); prospect_id=d.get("id") or (d.get("prospect") or {}).get("id")
        log("PASS","FUNC",f"FN-CRM-ADD-{pid}",f"{pk} — POST prospect",f"id={prospect_id}",ms)
    else: log("FAIL","FUNC",f"FN-CRM-ADD-{pid}",f"{pk} — POST prospect",f"HTTP {r.status_code if r else 'ERR'} {r.text[:80] if r else ''}",ms)

    # 2.4 GET Quotes
    r,ms=req_get(f"{API_URL}/quotes",h)
    if r and r.status_code==200:
        d=r.json(); cnt=len(d) if isinstance(d,list) else len(d.get("quotes",[]))
        log("PASS","FUNC",f"FN-QT-{pid}",f"{pk} — GET quotes",f"{cnt} devis",ms)
    else: log("FAIL","FUNC",f"FN-QT-{pid}",f"{pk} — GET quotes",f"HTTP {r.status_code if r else 'ERR'}",ms)

    # 2.5 POST Quote
    r,ms=req_post(f"{API_URL}/quotes",{"clientName":f"Client {pk}","clientEmail":"client@test.com","items":[{"description":"Mission conseil","quantity":5,"unitPrice":800,"vatRate":20}],"notes":"Test devis","validUntil":"2026-12-31"},h)
    quote_id=None
    if r and r.status_code in(200,201):
        d=r.json(); quote_id=d.get("id") or (d.get("quote") or {}).get("id")
        log("PASS","FUNC",f"FN-QT-ADD-{pid}",f"{pk} — POST quote",f"id={quote_id}