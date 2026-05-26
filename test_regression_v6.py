#!/usr/bin/env python3
"""
Brainlo - Tests de Régression Post-Upgrade Next.js 14->16 / React 18->19
Date: 2026-05-22 | Couverture: Personae | SEO | Perf | Mobile | Stripe | Sécu
"""
import requests, json, time, re, hmac, hashlib, sys
from datetime import datetime

BASE = "http://localhost:50082"
API  = BASE + "/api"
WH_SECRET = "whsec_LsndJ5kH1O33gZkFi8JRhGwmsg93yRWF"

PERSONAE = {
    "Sophie_PRO": {"email":"elsane.tiberini@gmail.com","password":"TestBrainlo2026!","plan":"PRO"},
    "Marc_PRO":   {"email":"sales@quotium.com",         "password":"TestBrainlo2026!","plan":"PRO"},
    "Julie_FREE": {"email":"elsane@yahoo.fr",           "password":"TestBrainlo2026!","plan":"FREE"},
}

results=[]; tp=0; tf=0; tw=0; st=time.time()
G="\033[92m"; R="\033[91m"; Y="\033[93m"; C="\033[96m"; Z="\033[0m"; B="\033[1m"

def log(status,cat,tid,name,detail="",ms=0):
    global tp,tf,tw
    sym={"PASS":"✓","FAIL":"✗","WARN":"⚠","INFO":"→"}.get(status,"?")
    col={"PASS":G,"FAIL":R,"WARN":Y,"INFO":C}.get(status,"")
    t=f" [{ms:.0f}ms]" if ms else ""
    print(f"{col}{sym} [{tid}] {name}{t}: {detail}{Z}")
    if status=="PASS": tp+=1
    elif status=="FAIL": tf+=1
    elif status=="WARN": tw+=1
    results.append({"status":status,"cat":cat,"id":tid,"name":name,"detail":detail,"ms":round(ms)})

def sec(title):
    print(f"\n{C}{B}{'='*65}\n  {title}\n{'='*65}{Z}")

def GET(url,h=None,ua=None,timeout=12):
    t0=time.time()
    try:
        hh=dict(h or {})
        if ua: hh["User-Agent"]=ua
        r=requests.get(url,headers=hh,timeout=timeout,allow_redirects=True)
        return r,(time.time()-t0)*1000
    except Exception as e: return None,0

def POST(url,data,h=None,raw_body=None,timeout=12):
    t0=time.time()
    try:
        hh=dict(h or {"Content-Type":"application/json"})
        if raw_body is not None:
            r=requests.post(url,data=raw_body,headers=hh,timeout=timeout)
        else:
            r=requests.post(url,json=data,headers=hh,timeout=timeout)
        return r,(time.time()-t0)*1000
    except: return None,0

def PATCH(url,data,h,timeout=12):
    t0=time.time()
    try:
        r=requests.patch(url,json=data,headers=h,timeout=timeout)
        return r,(time.time()-t0)*1000
    except: return None,0

def DELETE(url,h,timeout=12):
    t0=time.time()
    try:
        r=requests.delete(url,headers=h,timeout=timeout)
        return r,(time.time()-t0)*1000
    except: return None,0

def AH(tok): return {"Authorization":f"Bearer {tok}","Content-Type":"application/json"}

def do_login(email,pwd):
    r,ms=POST(f"{API}/auth/login",{"email":email,"password":pwd})
    if r and r.status_code==200:
        d=r.json()
        tok=d.get("token") or d.get("accessToken") or (d.get("data") or {}).get("token")
        return tok,ms
    return None,ms

def safe(d,*keys):
    """Safe nested get, returns str"""
    v=d
    for k in keys:
        if isinstance(v,dict): v=v.get(k)
        else: return ""
    return str(v or "")

# ======================================================
# PHASE 0 — SMOKE TEST
# ======================================================
sec("PHASE 0 — SMOKE TEST SERVEUR")
for tid,label,path in [
    ("SM-00","Landing Page","/"),
    ("SM-01","Login","/login"),
    ("SM-02","Onboarding","/onboarding"),
    ("SM-03","Blog","/blog"),
    ("SM-04","Robots.txt","/robots.txt"),
    ("SM-05","Sitemap.xml","/sitemap.xml"),
    ("SM-06","Forgot-password","/forgot-password"),
    ("SM-07","Assessment","/assessment"),
    ("SM-08","Fonctionnalites HTML","/fonctionnalites.html"),
]:
    r,ms=GET(f"{BASE}{path}")
    if r and r.status_code==200: log("PASS","SMOKE",tid,label,"HTTP 200",ms)
    elif r and r.status_code in(301,302,307,308):
        log("WARN","SMOKE",tid,label,f"Redirect {r.status_code}",ms)
    else: log("FAIL","SMOKE",tid,label,f"HTTP {r.status_code if r else 'TIMEOUT'}",ms)

# ======================================================
# PHASE 1 — AUTH
# ======================================================
sec("PHASE 1 — AUTHENTIFICATION PAR PERSONAE")
tokens={}
for pk,p in PERSONAE.items():
    tok,ms=do_login(p["email"],p["password"])
    if tok:
        tokens[pk]=tok
        log("PASS","AUTH",f"AU-{pk[:3]}",f"Login {pk} [{p['plan']}]","Token JWT OK",ms)
    else: log("FAIL","AUTH",f"AU-{pk[:3]}",f"Login {pk}","Pas de token",ms)

r,ms=POST(f"{API}/auth/login",{"email":"evil@hacker.com","password":"badpass"})
if r and r.status_code in(400,401,403): log("PASS","AUTH","AU-INV","Credentials invalides rejetés",f"HTTP {r.status_code}",ms)
else: log("FAIL","AUTH","AU-INV","Credentials invalides rejetés",f"HTTP {r.status_code if r else 'ERR'}",ms)

r,ms=GET(f"{API}/tasks")
if r and r.status_code in(401,403): log("PASS","AUTH","AU-GRD","Route protégée sans token",f"HTTP {r.status_code}",ms)
else: log("WARN","AUTH","AU-GRD","Route protégée sans token",f"HTTP {r.status_code if r else 'ERR'}",ms)

r,ms=GET(f"{API}/tasks",{"Authorization":"Bearer FAKEJWT.INVALID.TOKEN"})
if r and r.status_code in(401,403): log("PASS","AUTH","AU-BAD","Token malformé refusé",f"HTTP {r.status_code}",ms)
else: log("WARN","AUTH","AU-BAD","Token malformé",f"HTTP {r.status_code if r else 'ERR'}",ms)

# ======================================================
# PHASE 2 — FONCTIONNEL PAR PERSONAE
# ======================================================
for pk in ["Sophie_PRO","Marc_PRO","Julie_FREE"]:
    sec(f"PHASE 2 — FONCTIONNEL [{pk}]")
    tok=tokens.get(pk)
    plan=PERSONAE[pk]["plan"]
    if not tok:
        log("FAIL","FUNC",f"FN-{pk[:3]}",f"{pk} skip (no token)"); continue
    h=AH(tok); pid=pk[:3]

    # 2.1 auth/me
    r,ms=GET(f"{API}/auth/me",h)
    if r and r.status_code==200:
        d=r.json(); em=d.get("email") or safe(d,"user","email")
        log("PASS","FUNC",f"ME-{pid}",f"{pk} — auth/me",f"email={em}",ms)
    else: log("FAIL","FUNC",f"ME-{pid}",f"{pk} — auth/me",f"HTTP {r.status_code if r else 'ERR'}",ms)

    # 2.2 GET prospects
    r,ms=GET(f"{API}/pipeline/prospects",h)
    if r and r.status_code==200:
        d=r.json(); cnt=len(d) if isinstance(d,list) else len(d.get("prospects",[]))
        log("PASS","FUNC",f"CRM-G-{pid}",f"{pk} — GET prospects",f"{cnt} prospects",ms)
    else: log("FAIL","FUNC",f"CRM-G-{pid}",f"{pk} — GET prospects",f"HTTP {r.status_code if r else 'ERR'}",ms)

    # 2.3 POST prospect
    r,ms=POST(f"{API}/pipeline/prospects",{"name":f"QA_{pk}_{int(time.time())}","email":"qa@test.com","status":"lead","value":1200},h)
    prospect_id=None
    if r and r.status_code in(200,201):
        d=r.json(); prospect_id=d.get("id") or safe(d,"prospect","id")
        log("PASS","FUNC",f"CRM-A-{pid}",f"{pk} — POST prospect",f"id={prospect_id}",ms)
    else: log("FAIL","FUNC",f"CRM-A-{pid}",f"{pk} — POST prospect",f"HTTP {r.status_code if r else 'ERR'} | {r.text[:80] if r else ''}",ms)

    # 2.4 PATCH prospect
    if prospect_id:
        r,ms=PATCH(f"{API}/pipeline/prospects/{prospect_id}",{"status":"qualified","value":2500},h)
        if r and r.status_code in(200,201): log("PASS","FUNC",f"CRM-U-{pid}",f"{pk} — PATCH prospect","status=qualified",ms)
        else: log("FAIL","FUNC",f"CRM-U-{pid}",f"{pk} — PATCH prospect",f"HTTP {r.status_code if r else 'ERR'}",ms)

    # 2.5 GET quotes
    r,ms=GET(f"{API}/quotes",h)
    if r and r.status_code==200:
        d=r.json(); c=len(d) if isinstance(d,list) else len(d.get("quotes",[]))
        log("PASS","FUNC",f"QT-G-{pid}",f"{pk} — GET quotes",f"{c} devis",ms)
    else: log("FAIL","FUNC",f"QT-G-{pid}",f"{pk} — GET quotes",f"HTTP {r.status_code if r else 'ERR'}",ms)

    # 2.6 POST quote (champs corrects: lines/title/qty)
    r,ms=POST(f"{API}/quotes",{"clientName":f"Client_{pk}","clientEmail":"client@test.com","lines":[{"title":"Consulting IA","qty":3,"unitPrice":1500,"vatRate":20}],"validUntil":"2026-12-31"},h)
    quote_id=None
    if r and r.status_code in(200,201):
        d=r.json(); quote_id=d.get("id") or safe(d,"quote","id")
        log("PASS","FUNC",f"QT-A-{pid}",f"{pk} — POST quote",f"id={quote_id}",ms)
    else: log("FAIL","FUNC",f"QT-A-{pid}",f"{pk} — POST quote",f"HTTP {r.status_code if r else 'ERR'} | {r.text[:80] if r else ''}",ms)

    # 2.7 GET invoices
    r,ms=GET(f"{API}/invoices",h)
    if r and r.status_code==200:
        d=r.json(); c=len(d) if isinstance(d,list) else len(d.get("invoices",[]))
        log("PASS","FUNC",f"INV-G-{pid}",f"{pk} — GET invoices",f"{c} factures",ms)
    else: log("FAIL","FUNC",f"INV-G-{pid}",f"{pk} — GET invoices",f"HTTP {r.status_code if r else 'ERR'}",ms)

    # 2.8 POST invoice
    r,ms=POST(f"{API}/invoices",{"clientName":f"Client_{pk}","clientEmail":"client@test.com","lines":[{"title":"Prestation mensuelle","qty":1,"unitPrice":2000,"vatRate":20}],"dueDate":"2026-06-30"},h)
    invoice_id=None
    if r and r.status_code in(200,201):
        d=r.json(); invoice_id=d.get("id") or safe(d,"invoice","id")
        log("PASS","FUNC",f"INV-A-{pid}",f"{pk} — POST invoice",f"id={invoice_id}",ms)
    else: log("FAIL","FUNC",f"INV-A-{pid}",f"{pk} — POST invoice",f"HTTP {r.status_code if r else 'ERR'} | {r.text[:80] if r else ''}",ms)

    # 2.9 GET tasks
    r,ms=GET(f"{API}/tasks",h)
    if r and r.status_code==200:
        d=r.json(); c=len(d) if isinstance(d,list) else len(d.get("tasks",[]))
        log("PASS","FUNC",f"TK-G-{pid}",f"{pk} — GET tasks",f"{c} tasks",ms)
    else: log("FAIL","FUNC",f"TK-G-{pid}",f"{pk} — GET tasks",f"HTTP {r.status_code if r else 'ERR'}",ms)

    # 2.10 POST task
    r,ms=POST(f"{API}/tasks",{"title":f"QA Task {pk}","description":"Test regression NJ16","priority":"high","dueDate":"2026-06-01"},h)
    task_id=None
    if r and r.status_code in(200,201):
        d=r.json(); task_id=d.get("id") or safe(d,"task","id")
        log("PASS","FUNC",f"TK-A-{pid}",f"{pk} — POST task",f"id={task_id}",ms)
    else: log("FAIL","FUNC",f"TK-A-{pid}",f"{pk} — POST task",f"HTTP {r.status_code if r else 'ERR'} | {r.text[:80] if r else ''}",ms)

    # 2.11 GET transactions (cash)
    r,ms=GET(f"{API}/transactions",h)
    if r and r.status_code==200:
        d=r.json(); c=len(d) if isinstance(d,list) else len(d.get("transactions",[]))
        log("PASS","FUNC",f"CASH-G-{pid}",f"{pk} — GET transactions",f"{c} transactions",ms)
    else: log("FAIL","FUNC",f"CASH-G-{pid}",f"{pk} — GET transactions",f"HTTP {r.status_code if r else 'ERR'}",ms)

    # 2.12 POST transaction
    r,ms=POST(f"{API}/transactions",{"type":"income","amount":1500,"description":"Facture client","category":"consulting","date":"2026-05-20"},h)
    if r and r.status_code in(200,201): log("PASS","FUNC",f"CASH-A-{pid}",f"{pk} — POST transaction","income=1500",ms)
    else: log("FAIL","FUNC",f"CASH-A-{pid}",f"{pk} — POST transaction",f"HTTP {r.status_code if r else 'ERR'} | {r.text[:80] if r else ''}
