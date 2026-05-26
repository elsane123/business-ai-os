
#!/usr/bin/env python3
# Brainlo - Tests de Regression Post-Upgrade NJS 14->16 / React 18->19
# Date: 2026-05-22 | Couverture: Personae SEO Perf Mobile Stripe Secu
import requests, json, time, re, hmac, hashlib, sys
from datetime import datetime

BASE = "http://localhost:50082"
API  = BASE + "/api"
WH_SECRET = "whsec_LsndJ5kH1O33gZkFi8JRhGwmsg93yRWF"
PERSONAE = {
    "Sophie_PRO": {"email":"elsane.tiberini@gmail.com","password":"TestBrainlo2026!","plan":"PRO"},
    "Marc_PRO":   {"email":"sales@quotium.com","password":"TestBrainlo2026!","plan":"PRO"},
    "Julie_FREE": {"email":"elsane@yahoo.fr","password":"TestBrainlo2026!","plan":"FREE"},
}
results=[]; tp=0; tf=0; tw=0; st=time.time()
G="\033[92m"; R="\033[91m"; Y="\033[93m"; C="\033[96m"; Z="\033[0m"; B="\033[1m"

def log(status,cat,tid,name,detail="",ms=0):
    global tp,tf,tw
    sym={"PASS":"OK","FAIL":"KO","WARN":"!!","INFO":"--"}.get(status,"??")
    col={"PASS":G,"FAIL":R,"WARN":Y,"INFO":C}.get(status,"")
    t=f" [{ms:.0f}ms]" if ms else ""
    print(f"{col}[{sym}] [{tid}] {name}{t}: {detail}{Z}")
    if status=="PASS": tp+=1
    elif status=="FAIL": tf+=1
    elif status=="WARN": tw+=1
    results.append({"status":status,"cat":cat,"id":tid,"name":name,"detail":str(detail)[:120],"ms":round(ms)})

def sec(title):
    print(f"\n{C}{B}{'='*65}\n  {title}\n{'='*65}{Z}")

def GET(url,h=None,ua=None,to=12):
    t0=time.time()
    try:
        hh=dict(h or {})
        if ua: hh["User-Agent"]=ua
        r=requests.get(url,headers=hh,timeout=to,allow_redirects=True)
        return r,(time.time()-t0)*1000
    except Exception as e: return None,0

def POST(url,data,h=None,raw_body=None,to=12):
    t0=time.time()
    try:
        hh=dict(h or {"Content-Type":"application/json"})
        if raw_body is not None: r=requests.post(url,data=raw_body,headers=hh,timeout=to)
        else: r=requests.post(url,json=data,headers=hh,timeout=to)
        return r,(time.time()-t0)*1000
    except: return None,0

def PATCH(url,data,h,to=12):
    t0=time.time()
    try:
        r=requests.patch(url,json=data,headers=h,timeout=to)
        return r,(time.time()-t0)*1000
    except: return None,0

def DELETE(url,h,to=12):
    t0=time.time()
    try:
        r=requests.delete(url,headers=h,timeout=to)
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

def jget(r,*keys):
    try:
        d=r.json()
        for k in keys:
            d=d.get(k) if isinstance(d,dict) else None
        return str(d or "")
    except: return ""


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
    ("SM-08","Fonctionnalites","/fonctionnalites.html"),
]:
    r,ms=GET(f"{BASE}{path}")
    if r and r.status_code==200: log("PASS","SMOKE",tid,label,"HTTP 200",ms)
    elif r and r.status_code in(301,302,307,308): log("WARN","SMOKE",tid,label,f"Redirect {r.status_code}",ms)
    else: log("FAIL","SMOKE",tid,label,f"HTTP {r.status_code if r else chr(84)+chr(73)+chr(77)+chr(69)+chr(79)+chr(85)+chr(84)}",ms)

# ======================================================
# PHASE 1 — AUTH
# ======================================================
sec("PHASE 1 — AUTHENTIFICATION PAR PERSONAE")
tokens={}
for pk,p in PERSONAE.items():
    tok,ms=do_login(p["email"],p["password"])
    if tok:
        tokens[pk]=tok
        log("PASS","AUTH",f"AU-{pk[:3]}",f"Login {pk}",f"Plan={p[chr(112)+chr(108)+chr(97)+chr(110)]} Token OK",ms)
    else: log("FAIL","AUTH",f"AU-{pk[:3]}",f"Login {pk}","Pas de token",ms)

r,ms=POST(f"{API}/auth/login",{"email":"evil@hacker.com","password":"badpass"})
if r and r.status_code in(400,401,403): log("PASS","AUTH","AU-INV","Credentials invalides rejetes",f"HTTP {r.status_code}",ms)
else: log("FAIL","AUTH","AU-INV","Credentials invalides rejetes",f"HTTP {r.status_code if r else 0}",ms)

r,ms=GET(f"{API}/tasks")
if r and r.status_code in(401,403): log("PASS","AUTH","AU-GRD","Route protegee sans token",f"HTTP {r.status_code}",ms)
else: log("WARN","AUTH","AU-GRD","Route protegee sans token",f"HTTP {r.status_code if r else 0}",ms)

r,ms=GET(f"{API}/tasks",{"Authorization":"Bearer FAKEJWT.INVALID.TOKEN"})
if r and r.status_code in(401,403): log("PASS","AUTH","AU-BAD","Token malform",f"HTTP {r.status_code}",ms)
else: log("WARN","AUTH","AU-BAD","Token malform",f"HTTP {r.status_code if r else 0}",ms)
# ====================================================
# PHASE 0 - SMOKE TEST
# ====================================================
sec("PHASE 0 - SMOKE TEST SERVEUR")
for tid,label,path in [
    ("SM-00","Landing Page","/"),
    ("SM-01","Login","/login"),
    ("SM-02","Onboarding","/onboarding"),
    ("SM-03","Blog","/blog"),
    ("SM-04","Robots.txt","/robots.txt"),
    ("SM-05","Sitemap.xml","/sitemap.xml"),
    ("SM-06","Forgot-password","/forgot-password"),
    ("SM-07","Assessment","/assessment"),
]:
    r,ms=GET(f"{BASE}{path}")
    if r and r.status_code==200: log("PASS","SMOKE",tid,label,"HTTP 200",ms)
    elif r and r.status_code in(301,302,307,308): log("WARN","SMOKE",tid,label,f"Redirect {r.status_code}",ms)
    else: log("FAIL","SMOKE",tid,label,f"HTTP {r.status_code if r else 0}",ms)

# ====================================================
# PHASE 1 - AUTH
# ====================================================
sec("PHASE 1 - AUTHENTIFICATION PAR PERSONAE")
tokens={}
for pk,p in PERSONAE.items():
    tok,ms=do_login(p["email"],p["password"])
    if tok:
        tokens[pk]=tok
        log("PASS","AUTH",f"AU-{pk[:3]}",f"Login {pk}",f"Plan={p[chr(112)+chr(108)+chr(97)+chr(110)]} Token OK",ms)
    else: log("FAIL","AUTH",f"AU-{pk[:3]}",f"Login {pk}","Pas de token",ms)

r,ms=POST(f"{API}/auth/login",{"email":"evil@hack.com","password":"bad"})
if r and r.status_code in(400,401,403): log("PASS","AUTH","AU-INV","Credentials invalides",f"HTTP {r.status_code}",ms)
else: log("FAIL","AUTH","AU-INV","Credentials invalides",f"HTTP {r.status_code if r else 0}",ms)

r,ms=GET(f"{API}/tasks")
if r and r.status_code in(401,403): log("PASS","AUTH","AU-GRD","Route protegee sans token",f"HTTP {r.status_code}",ms)
else: log("WARN","AUTH","AU-GRD","Route protegee sans token",f"HTTP {r.status_code if r else 0}",ms)

r,ms=GET(f"{API}/tasks",{"Authorization":"Bearer FAKEJWT.INVALID.TOKEN"})
if r and r.status_code in(401,403): log("PASS","AUTH","AU-BAD","Token malforme refuse",f"HTTP {r.status_code}",ms)
else: log("WARN","AUTH","AU-BAD","Token malforme",f"HTTP {r.status_code if r else 0}",ms)
