#!/usr/bin/env python3
import requests,time,sys,os,json
from datetime import datetime
B='http://localhost:50082'
SO={'email':'elsane.tiberini@gmail.com','password':'SophieTest2026!'}
MA={'email':'sales@quotium.com','password':'MarcTest2026!'}
JU={'email':'elsane@yahoo.fr','password':'JulieTest2026!'}
SPID='cmp9lxbdt0002mmk0ikazd6xj'
SQID='cmp9lzekd000qmmk0ix84ya4f'
SIID='cmp9m8lr7000smmk0m0m13281'
results,bugs=[],[]
def login(c):
  s=requests.Session();r=s.post(f'{B}/api/auth/login',json=c);return s,r
def log(tid,ep,m,got,exp,ok,n=''):
  rec={'id':tid,'ep':f'{m} {ep}','got':got,'exp':str(exp),'ok':ok,'n':str(n)[:200]}
  results.append(rec)
  if not ok:bugs.append(rec)
  print(f'{"PASS" if ok else "FAIL"} [{tid}] {m} {ep} -> {got} (exp:{exp}) {str(n)[:80]}');sys.stdout.flush()
def ids(d):
  if isinstance(d,dict):return d.get('id') or d.get('prospect',{}).get('id') or d.get('quote',{}).get('id') or d.get('task',{}).get('id')
  return None
def lst(d):
  if isinstance(d,list):return d
  if isinstance(d,dict):
    for k in['prospects','quotes','invoices','transactions','tasks','items','data','docs']:
      if k in d and isinstance(d[k],list):return d[k]
  return[]
print(f'=== QA CYCLE 5 | {datetime.now().strftime("%Y-%m-%d %H:%M")} ===')

### G1 ONBOARDING ###
print('\n=== G1: ONBOARDING ===')
r=requests.post(f'{B}/api/auth/register',json={'email':SO['email'],'password':'TestPass123!','name':'Dup','businessName':'Dup Co'})
log('OB-03','/api/auth/register','POST',r.status_code,409,r.status_code==409,r.text[:120])
r=requests.post(f'{B}/api/auth/register',json={'email':'ob04@qa.test','password':'1234','name':'T','businessName':'Co'})
log('OB-04','/api/auth/register','POST',r.status_code,400,r.status_code==400,r.text[:120])
r=requests.post(f'{B}/api/auth/register',json={'email':'ob05@qa.test','password':'ValidP123!','name':'','businessName':'Co'})
log('OB-05','/api/auth/register','POST',r.status_code,400,r.status_code==400,r.text[:120])
r=requests.post(f'{B}/api/auth/login',json={'email':SO['email'],'password':'WrongPwd!'})
log('OB-07','/api/auth/login','POST',r.status_code,401,r.status_code==401,r.text[:120])
s,lr=login(SO);np2='SophieNew2026!'
if lr.status_code==200:
  r1=s.post(f'{B}/api/auth/change-password',json={'currentPassword':SO['password'],'newPassword':np2})
  if r1.status_code==405:r1=s.patch(f'{B}/api/auth/change-password',json={'currentPassword':SO['password'],'newPassword':np2})
  time.sleep(0.3);s2,lr2=login({'email':SO['email'],'password':np2})
  if lr2.status_code==200:
    r2=s2.post(f'{B}/api/auth/change-password',json={'currentPassword':np2,'newPassword':SO['password']})
    if r2.status_code==405:r2=s2.patch(f'{B}/api/auth/change-password',json={'currentPassword':np2,'newPassword':SO['password']})
    ok8=r1.status_code in[200,204] and lr2.status_code==200 and r2.status_code in[200,204]
    n8=f'chg:{r1.status_code} newlogin:{lr2.status_code} restore:{r2.status_code}'
  else:ok8=False;n8=f'chg:{r1.status_code} newlogin_fail:{lr2.status_code}'
  log('OB-08','/api/auth/change-password','POST',r1.status_code,200,ok8,n8)
else:log('OB-08','/api/auth/change-password','POST',0,200,False,'login_failed')
s,lr=login(SO)
if lr.status_code==200:
  r=s.patch(f'{B}/api/auth/profile',json={'siret':'12345678901234','address':'15 Rue Paix 75001','businessName':'Sophie Design Studio'})
  me=s.get(f'{B}/api/auth/me')
  try:md=me.json();hs='siret' in md or 'siret' in str(md.get('user',''))
  except:hs=False
  log('OB-09','/api/auth/profile','PATCH',r.status_code,200,r.status_code in[200,204],f'siret_in_me:{hs}')
else:log('OB-09','/api/auth/profile','PATCH',0,200,False,'login_failed')
s,lr=login(SO)
if lr.status_code==200:
  rl=s.post(f'{B}/api/auth/logout');rm=s.get(f'{B}/api/auth/me')
  log('OB-10','/api/auth/logout+/me','POST',rl.status_code,200,rl.status_code in[200,204] and rm.status_code==401,f'/me_after:{rm.status_code}')
else:log('OB-10','/api/auth/logout+/me','POST',0,200,False,'login_failed')
print(f'G1: {sum(1 for r in results if r["ok"])}/{len(results)}')

### G2 CRM ###
print('\n=== G2: CRM PIPELINE ===')
s,lr=login(SO);print(f'  Sophie:{lr.status_code}')
r=s.post(f'{B}/api/pipeline/prospects/{SPID}/enrich')
log('CRM-02','/pipeline/prospects/{id}/enrich','POST',r.status_code,200,r.status_code in[200,201],r.text[:150])
r=s.patch(f'{B}/api/pipeline/prospects/{SPID}',json={'status':'CONTACTED'})
log('CRM-03','/pipeline/prospects/{id} CONTACTED','PATCH',r.status_code,200,r.status_code==200,r.text[:100])
r=s.post(f'{B}/api/pipeline/prospects/parse-brief',json={'brief':'TechSolutions SARL, directeur Jean-Paul Dupont, formation Python 10 devs, budget 20000 euros'})
log('CRM-04','/pipeline/prospects/parse-brief','POST',r.status_code,200,r.status_code in[200,201],r.text[:150])
r=s.get(f'{B}/api/pipeline/prospects?status=IDENTIFIED')
try:items=lst(r.json())
except:items=[]
log('CRM-05','/pipeline/prospects?status=IDENTIFIED','GET',r.status_code,200,r.status_code==200,f'count={len(items)}')
r=s.post(f'{B}/api/pipeline/prospects/{SPID}/relance',json={'context':'prospect froid 3 semaines'})
log('CRM-06','/pipeline/prospects/{id}/relance','POST',r.status_code,200,r.status_code in[200,201],r.text[:100])
rn=s.post(f'{B}/api/pipeline/prospects',json={'name':'QA Lost','company':'LostCo','status':'IDENTIFIED'})
nid=ids(rn.json()) if rn.status_code in[200,201] else None
if nid:
  r=s.patch(f'{B}/api/pipeline/prospects/{nid}',json={'status':'LOST'})
  log('CRM-08','/pipeline/prospects LOST','PATCH',r.status_code,200,r.status_code==200,r.text[:100])
else:log('CRM-08','/pipeline/prospects LOST','PATCH',rn.status_code,200,False,rn.text[:100])
rn2=s.post(f'{B}/api/pipeline/prospects',json={'name':'QA Won','company':'WinCo','status':'IDENTIFIED'})
nid2=ids(rn2.json()) if rn2.status_code in[200,201] else None
if nid2:
  r=s.patch(f'{B}/api/pipeline/prospects/{nid2}',json={'status':'WON'})
  log('CRM-09','/pipeline/prospects WON','PATCH',r.status_code,200,r.status_code==200,r.text[:100])
else:log('CRM-09','/pipeline/prospects WON','PATCH',rn2.status_code,200,False,rn2.text[:100])
r=s.get(f'{B}/api/pipeline/prospects?search=Rousseau')
try:items=lst(r.json());hasr=any('Rousseau' in str(p) for p in items)
except:hasr=False;items=[]
log('CRM-10','/pipeline/prospects?search=Rousseau','GET',r.status_code,200,r.status_code==200 and hasr,f'cnt={len(items)} found={hasr}')
r=s.post(f'{B}/api/pipeline/prospects/{SPID}/relance',json={'context':'OPCO CPF disponible fin trimestre'})
log('CRM-11','/pipeline/prospects/{id}/relance OPCO','POST',r.status_code,200,r.status_code in[200,201],r.text[:100])
js,jlr=login(JU);print(f'  Julie:{jlr.status_code}')
lhit=False;last_s=0
if jlr.status_code==200:
  for i in range(5):
    rp=js.post(f'{B}/api/pipeline/prospects',json={'name':f'Lim{i+1}','company':f'Co{i+1}','status':'IDENTIFIED'})
    last_s=rp.status_code;print(f'  Julie create {i+1}: {rp.status_code} {rp.text[:60]}')
    if rp.status_code in[402,403,429]:lhit=True;break
log('CRM-12','/pipeline/prospects FREE limit','POST',last_s,'402/403',lhit,f'limit_hit={lhit}')
print(f'G2: {sum(1 for r in results if r["ok"])}/{len(results)}')
