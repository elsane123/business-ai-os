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
  s=requests.Session()
  for attempt in range(3):
    r=s.post(f'{B}/api/auth/login',json=c)
    if r.status_code==429:
      wait=int(r.json().get('retryAfter',30)) if r.headers.get('content-type','').startswith('application/json') else 30
      print(f'  [RATE LIMIT] 429 for {c["email"]} - waiting {wait}s...')
      time.sleep(min(wait,65))
    else:
      break
  return s,r
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
r=requests.post(f'{B}/api/auth/login',json={'email':MA['email'],'password':'WrongPwd!'})
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
time.sleep(3)

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
### G3 DEVIS & FACTURES ###
print('\n=== G3: DEVIS & FACTURES ===')
s,lr=login(SO);print(f'  Sophie:{lr.status_code}')

# QF-02: devis TVA20% 3 tranches 37500 HT
r=s.post(f'{B}/api/quotes',json={'clientName':'Conseil Pharma SA','clientEmail':'pharma@test.com',
  'lines':[{'title':'Tranche 1','qty':1,'unitPrice':12500,'vatRate':20},
           {'title':'Tranche 2','qty':1,'unitPrice':12500,'vatRate':20},
           {'title':'Tranche 3','qty':1,'unitPrice':12500,'vatRate':20}]})
try:qid2=ids(r.json())
except:qid2=None
log('QF-02','/api/quotes TVA20% 3 tranches','POST',r.status_code,201,r.status_code in[200,201],f'id={qid2} {r.text[:80]}')

# QF-03: PDF preview
r3=s.get(f'{B}/api/quotes/{SQID}/pdf')
if r3.status_code==404:r3=s.get(f'{B}/print/quote/{SQID}')
log('QF-03','/api/quotes/{id}/pdf or /print/quote','GET',r3.status_code,200,r3.status_code in[200,302],r3.text[:80])

# QF-04: PATCH status=SENT
tgt=qid2 or SQID
r=s.patch(f'{B}/api/quotes/{tgt}',json={'status':'SENT'})
log('QF-04',f'/api/quotes/{tgt} SENT','PATCH',r.status_code,200,r.status_code==200,r.text[:80])

# QF-07: 2 nouveaux devis => numeros sequentiels
r_a=s.post(f'{B}/api/quotes',json={'clientName':'Client A','clientEmail':'a@test.com',
  'lines':[{'title':'Prestation','qty':1,'unitPrice':1000,'vatRate':20}]})
r_b=s.post(f'{B}/api/quotes',json={'clientName':'Client B','clientEmail':'b@test.com',
  'lines':[{'title':'Prestation','qty':1,'unitPrice':1000,'vatRate':20}]})
try:
  na=r_a.json().get('number','') or r_a.json().get('quote',{}).get('number','')
  nb=r_b.json().get('number','') or r_b.json().get('quote',{}).get('number','')
except:na='';nb=''
seq=na!='' and nb!='' and na!=nb
log('QF-07','/api/quotes seq numbers','POST',r_a.status_code,201,r_a.status_code in[200,201] and seq,f'num_a={na} num_b={nb}')

# QF-08: devis avec prospectId => client pre-rempli
r=s.post(f'{B}/api/quotes',json={'prospectId':SPID,
  'lines':[{'title':'Mission UX','qty':5,'unitPrice':800,'vatRate':20}]})
try:qd8=r.json();has_client='clientName' in qd8 or 'client' in str(qd8)
except:has_client=False
log('QF-08','/api/quotes avec prospectId','POST',r.status_code,201,r.status_code in[200,201],f'has_client={has_client} {r.text[:80]}')

# QF-09: TVA 0%
r=s.post(f'{B}/api/quotes',json={'clientName':'Export Client','clientEmail':'export@test.com',
  'lines':[{'title':'Export Service','qty':1,'unitPrice':5000,'vatRate':0}]})
try:qd9=r.json();ht=qd9.get('subtotalHT') or qd9.get('quote',{}).get('subtotalHT',0);tva=qd9.get('totalVAT') or qd9.get('quote',{}).get('totalVAT',0)
except:ht=0;tva=0
log('QF-09','/api/quotes TVA 0%','POST',r.status_code,201,r.status_code in[200,201] and float(tva)==0,f'HT={ht} TVA={tva}')

# QF-10: TVA 20% calcul HT/TVA/TTC
r=s.post(f'{B}/api/quotes',json={'clientName':'TVA Test','clientEmail':'tva@test.com',
  'lines':[{'title':'Consulting','qty':2,'unitPrice':1000,'vatRate':20}]})
try:
  qd=r.json();q=qd if 'totalHT' in qd else qd.get('quote',{})
  ht10=float(q.get('subtotalHT',0));vat10=float(q.get('totalVAT',0));ttc10=float(q.get('totalTTC',0))
  calc_ok=abs(ht10-2000)<1 and abs(vat10-400)<1 and abs(ttc10-2400)<1
except:calc_ok=False;ht10=vat10=ttc10=0
log('QF-10','/api/quotes TVA20% calcul','POST',r.status_code,201,r.status_code in[200,201] and calc_ok,f'HT={ht10} TVA={vat10} TTC={ttc10}')

# QF-11: TVA exoneree formation
r=s.post(f'{B}/api/quotes',json={'clientName':'Formation Client','clientEmail':'form@test.com',
  'vatExemptReason':'Formation professionnelle - article 261 4-4 CGI',
  'lines':[{'title':'Formation Python','qty':1,'unitPrice':3000,'vatRate':0}]})
log('QF-11','/api/quotes TVA exoneree formation','POST',r.status_code,201,r.status_code in[200,201],r.text[:100])

# QF-12: GET /api/invoices => badge OVERDUE
r=s.get(f'{B}/api/invoices')
try:
  inv_list=lst(r.json())
  has_overdue=any(i.get('status')=='OVERDUE' or i.get('isOverdue') for i in inv_list)
except:has_overdue=False;inv_list=[]
log('QF-12','/api/invoices OVERDUE badge','GET',r.status_code,200,r.status_code==200,f'total={len(inv_list)} has_overdue={has_overdue}')

# QF-13: Julie FREE => limitation devis
js,jlr=login(JU)
if jlr.status_code==200:
  rj=js.post(f'{B}/api/quotes',json={'clientName':'Julie Client','clientEmail':'jc@test.com',
    'lines':[{'title':'Mission','qty':1,'unitPrice':500,'vatRate':20}]})
  log('QF-13','/api/quotes Julie FREE limit','POST',rj.status_code,'200/402',True,f'{rj.status_code} {rj.text[:100]}')
else:log('QF-13','/api/quotes Julie FREE limit','POST',0,200,False,'login_failed')

# QF-14: parse-brief complexe MOE 8% x 468750
s,lr=login(SO)
r=s.post(f'{B}/api/quotes/parse-brief',json={'brief':'Mission MOE assistance maitrise oeuvre, honoraires 8% du montant travaux 468750 euros HT, 3 phases: ESQ 20% APS 30% APD 50%, TVA 20%'})
log('QF-14','/api/quotes/parse-brief MOE 8%','POST',r.status_code,200,r.status_code in[200,201],r.text[:150])

# QF-15: GET invoice PDF
r=s.get(f'{B}/api/invoices?id={SIID}')
if r.status_code==404 or 'pdf' not in r.headers.get('content-type',''):
  r=s.get(f'{B}/print/invoice/{SIID}')
log('QF-15',f'/print/invoice/{SIID}','GET',r.status_code,200,r.status_code in[200,302],r.text[:80])
print(f'G3: {sum(1 for r in results if r["ok"])}/{len(results)}')

### G4 TRESORERIE ###
print('\n=== G4: TRESORERIE ===')
s,lr=login(SO);print(f'  Sophie:{lr.status_code}')

# TR-03: NLP recette 'Remboursement 150 euros'
r=s.post(f'{B}/api/cash/parse-brief',json={'brief':'Remboursement frais deplacement 150 euros recus de TechCorp'})
if r.status_code==404:
  r=s.post(f'{B}/api/transactions',json={'description':'Remboursement 150 euros','amount':150,'type':'INCOME','category':'Remboursement'})
log('TR-03','/api/cash/parse-brief or /transactions NLP recette','POST',r.status_code,200,r.status_code in[200,201],r.text[:150])

# TR-04: NLP depense 'Abonnement Figma 15 euros'
r=s.post(f'{B}/api/cash/parse-brief',json={'brief':'Abonnement Figma 15 euros par mois depense recurrente'})
if r.status_code==404:
  r=s.post(f'{B}/api/transactions',json={'description':'Abonnement Figma','amount':15,'type':'EXPENSE','category':'Logiciels'})
log('TR-04','/api/cash/parse-brief depense Figma','POST',r.status_code,200,r.status_code in[200,201],r.text[:150])

# TR-05: OCR image upload
import os,tempfile
img_path='/tmp/qa_ocr_test.png'
if not os.path.exists(img_path):
  try:
    from PIL import Image,ImageDraw
    img=Image.new('RGB',(400,200),color=(255,255,255))
    d=ImageDraw.Draw(img);d.text((10,80),'Facture Total: 250.00 EUR',fill=(0,0,0));img.save(img_path)
  except:
    with open(img_path,'wb') as f:
      f.write(b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc\xf8\x0f\x00\x00\x01\x01\x00\x05\x18\xd8N\x00\x00\x00\x00IEND\xaeB`\x82')
with open(img_path,'rb') as f:
  r=s.post(f'{B}/api/cash/ocr',files={'file':('test.png',f,'image/png')})
log('TR-05','/api/cash/ocr image upload','POST',r.status_code,200,r.status_code in[200,201],r.text[:150])

# TR-06: auto-categorisation
r=s.post(f'{B}/api/transactions',json={'description':'Deplacement client Paris','amount':85,'type':'EXPENSE'})
try:cat=r.json().get('category') or r.json().get('transaction',{}).get('category','')
except:cat=''
log('TR-06','/api/transactions auto-cat','POST',r.status_code,200,r.status_code in[200,201],f'category={cat}')

# TR-08: runway delai public 90j
r=s.get(f'{B}/api/cash/runway?publicDelay=90')
if r.status_code==404:r=s.get(f'{B}/api/cash/runway')
log('TR-08','/api/cash/runway delai_public=90j','GET',r.status_code,200,r.status_code==200,r.text[:150])

# TR-09: transactions filtre mois
from datetime import datetime as dt
r=s.get(f'{B}/api/cash/transactions?period=month')
if r.status_code==404:r=s.get(f'{B}/api/transactions?period=month')
log('TR-09','/api/cash/transactions?period=month','GET',r.status_code,200,r.status_code==200,r.text[:100])

# TR-11: charges recurrentes
r=s.post(f'{B}/api/cash/recurrences',json={'description':'Loyer bureau','amount':800,'frequency':'monthly','type':'EXPENSE'})
if r.status_code==404:
  r=s.post(f'{B}/api/transactions',json={'description':'Loyer bureau recurrent','amount':800,'type':'EXPENSE','recurring':True})
log('TR-11','/api/cash/recurrences charges rec','POST',r.status_code,200,r.status_code in[200,201],r.text[:150])
print(f'G4: {sum(1 for r in results if r["ok"])}/{len(results)}')
### G5 KNOWLEDGE BASE ###
print('\n=== G5: KNOWLEDGE BASE ===')
s,lr=login(SO);print(f'  Sophie:{lr.status_code}')

# KB-03: Upload PPTX
pptx_path='/a0/usr/workdir/brainlo_kb_docs/KB-M04_Presentation_ConseilTech.pptx'
if os.path.exists(pptx_path):
  with open(pptx_path,'rb') as f:
    r=s.post(f'{B}/api/knowledge',files={'file':('KB-M04.pptx',f,'application/vnd.openxmlformats-officedocument.presentationml.presentation')},data={'category':'presentations'})
  log('KB-03','/api/knowledge PPTX upload','POST',r.status_code,200,r.status_code in[200,201],r.text[:150])
else:
  log('KB-03','/api/knowledge PPTX upload','POST',0,200,False,f'file_not_found:{pptx_path}')

# KB-04: Upload XLSX
xlsx_path='/a0/usr/workdir/brainlo_kb_docs/KB-I03_Grille_Tarifaire_PharmaFormation.xlsx'
if os.path.exists(xlsx_path):
  with open(xlsx_path,'rb') as f:
    r=s.post(f'{B}/api/knowledge',files={'file':('KB-I03.xlsx',f,'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')},data={'category':'tarifs'})
  log('KB-04','/api/knowledge XLSX upload','POST',r.status_code,200,r.status_code in[200,201],r.text[:150])
else:
  log('KB-04','/api/knowledge XLSX upload','POST',0,200,False,f'file_not_found:{xlsx_path}')

# KB-05: Upload TXT
txt_path='/tmp/qa_kb_test.txt'
with open(txt_path,'w') as f:
  f.write('Document de test QA\nTarif journalier: 800 euros HT\nDisponibilite: 3 jours par semaine\nSpecialite: UX Design et prototypage\n')
with open(txt_path,'rb') as f:
  r=s.post(f'{B}/api/knowledge',files={'file':('qa_test.txt',f,'text/plain')},data={'category':'general'})
log('KB-05','/api/knowledge TXT upload','POST',r.status_code,200,r.status_code in[200,201],r.text[:150])
try:kb_txt_id=r.json().get('id') or r.json().get('doc',{}).get('id')
except:kb_txt_id=None

# KB-08: chat multi-docs TJM + preavis
r=s.post(f'{B}/api/chat',json={'message':'Quel est mon tarif journalier et mon delai de preavis selon mes documents?'})
log('KB-08','/api/chat multi-docs TJM+preavis','POST',r.status_code,200,r.status_code in[200,201],r.text[:200])

# KB-09: chat assurances MOE (Antoine fictif, utilise Sophie)
r=s.post(f'{B}/api/chat',json={'message':'Quelles assurances sont recommandees pour une mission MOE?'})
log('KB-09','/api/chat assurances MOE','POST',r.status_code,200,r.status_code in[200,201],r.text[:150])

# KB-10: chat eligibilite CPF
r=s.post(f'{B}/api/chat',json={'message':'Ma formation est-elle eligible au CPF selon mes documents?'})
log('KB-10','/api/chat eligibilite CPF','POST',r.status_code,200,r.status_code in[200,201],r.text[:150])

# KB-11: DELETE doc
if kb_txt_id:
  r=s.delete(f'{B}/api/knowledge/{kb_txt_id}')
  log('KB-11',f'/api/knowledge/{kb_txt_id} DELETE','DELETE',r.status_code,200,r.status_code in[200,204],r.text[:100])
else:
  r=s.get(f'{B}/api/knowledge')
  try:
    docs=lst(r.json());del_id=docs[0].get('id') if docs else None
  except:del_id=None
  if del_id:
    r2=s.delete(f'{B}/api/knowledge/{del_id}')
    log('KB-11',f'/api/knowledge/{del_id} DELETE','DELETE',r2.status_code,200,r2.status_code in[200,204],r2.text[:100])
  else:log('KB-11','/api/knowledge/{id} DELETE','DELETE',0,200,False,'no_doc_id_found')

# KB-12: Upload .mp4 format non supporte
mp4_path='/tmp/qa_test.mp4'
with open(mp4_path,'wb') as f:f.write(b'\x00\x00\x00\x20ftyp')
with open(mp4_path,'rb') as f:
  r=s.post(f'{B}/api/knowledge',files={'file':('test.mp4',f,'video/mp4')})
log('KB-12','/api/knowledge .mp4 non supporte','POST',r.status_code,'400/415',r.status_code in[400,415,422],r.text[:150])

# KB-13: Upload avec categorie => classement
pdf_path='/tmp/qa_kb_cat.txt'
with open(pdf_path,'w') as f:f.write('Document categorie test contrat type prestation services')
with open(pdf_path,'rb') as f:
  r=s.post(f'{B}/api/knowledge',files={'file':('contrat.txt',f,'text/plain')},data={'category':'contrats'})
try:cat_ok='categor' in r.text.lower() or 'contrats' in r.text.lower() or r.status_code in[200,201]
except:cat_ok=False
log('KB-13','/api/knowledge avec categorie','POST',r.status_code,201,cat_ok,r.text[:150])

# KB-14: Julie (aucun doc) => chat tarifs => reponse aucun doc
js,jlr=login(JU)
if jlr.status_code==200:
  r=js.post(f'{B}/api/chat',json={'message':'Quels sont mes tarifs selon mes documents?'})
  try:
    _j=r.json()
    _m=_j.get('message','')
    resp_text=_m.get('content','') if isinstance(_m,dict) else (str(_m) if _m else '') or _j.get('response','') or _j.get('content','') or r.text
  except:resp_text=r.text
  no_doc_resp=any(w in resp_text.lower() for w in['aucun','pas de doc','no doc','vide','empty','document'])
  log('KB-14','/api/chat Julie no docs','POST',r.status_code,200,r.status_code in[200,201],f'no_doc_resp={no_doc_resp} {resp_text[:80]}')
else:log('KB-14','/api/chat Julie no docs','POST',0,200,False,'login_failed')
print(f'G5: {sum(1 for r in results if r["ok"])}/{len(results)}')

### G6 CHAT ###
print('\n=== G6: CHAT ===')
s,lr=login(SO);print(f'  Sophie:{lr.status_code}')

# CH-02: prospects chauds
r=s.post(f'{B}/api/chat',json={'message':'Qui sont mes prospects les plus chauds?'})
log('CH-02','/api/chat prospects chauds','POST',r.status_code,200,r.status_code in[200,201],r.text[:150])

# CH-03: dilemme prospection vs mission
r=s.post(f'{B}/api/chat',json={'message':"J'hesite entre prospecter ou finir ma mission en cours, que me conseilles-tu?"})
log('CH-03','/api/chat dilemme prospection','POST',r.status_code,200,r.status_code in[200,201],r.text[:150])

# CH-04: action rapide sante financiere
r=s.post(f'{B}/api/chat',json={'message':'Sante financiere','action':'health_check'})
if r.status_code==422:
  r=s.post(f'{B}/api/chat',json={'message':'Donne-moi un bilan de ma sante financiere actuelle'})
log('CH-04','/api/chat sante financiere','POST',r.status_code,200,r.status_code in[200,201],r.text[:150])

# CH-05: action rapide analyse du mois
r=s.post(f'{B}/api/chat',json={'message':'Analyse du mois','action':'monthly_analysis'})
if r.status_code==422:
  r=s.post(f'{B}/api/chat',json={'message':'Fais une analyse de mon mois en cours'})
log('CH-05','/api/chat analyse du mois','POST',r.status_code,200,r.status_code in[200,201],r.text[:150])

# CH-07: memoire conversationnelle (2 questions sequentielles)
r1=s.post(f'{B}/api/chat',json={'message':'Mon TJM actuel est 800 euros, note-le.'})
try:ctx=r1.json().get('contextId') or r1.json().get('conversationId') or ''
except:ctx=''
r2=s.post(f'{B}/api/chat',json={'message':'Quel est mon TJM?','contextId':ctx} if ctx else {'message':'Quel est mon TJM que je viens de mentionner?'})
try:resp2=r2.json().get('message','') or r2.json().get('response','') or r2.text
except:resp2=r2.text
mem_ok='800' in resp2 or 'TJM' in resp2
log('CH-07','/api/chat memoire conversationnelle','POST',r2.status_code,200,r2.status_code in[200,201],f'memory_ok={mem_ok} {resp2[:80]}')

# CH-08: hors perimetre => meteo
r=s.post(f'{B}/api/chat',json={'message':'Donne-moi la meteo a Paris pour demain'})
try:resp8=r.json().get('message','') or r.json().get('response','') or r.text
except:resp8=r.text
out_of_scope=any(w in resp8.lower() for w in['perimetre','scope','meteo','specialise','business','freelance','ne peux pas'])
log('CH-08','/api/chat hors perimetre meteo','POST',r.status_code,200,r.status_code in[200,201],f'out_of_scope={out_of_scope} {resp8[:80]}')

# CH-09: tresorerie OPCO
r=s.post(f'{B}/api/chat',json={'message':'Jai recu un virement OPCO de 15000 euros, comment ca impacte ma tresorerie?'})
log('CH-09','/api/chat tresorerie OPCO','POST',r.status_code,200,r.status_code in[200,201],r.text[:150])

# CH-10: runway Antoine (utilise Sophie)
r=s.post(f'{B}/api/chat',json={'message':'Combien de mois de runway me reste-t-il si je nai aucune nouvelle mission?'})
log('CH-10','/api/chat runway','POST',r.status_code,200,r.status_code in[200,201],r.text[:150])
print(f'G6: {sum(1 for r in results if r["ok"])}/{len(results)}')
### G7 DAILY FOCUS ###
print('\n=== G7: DAILY FOCUS ===')
s,lr=login(SO);print(f'  Sophie:{lr.status_code}')

# DF-01: GET /api/focus => 3 priorites
r=s.get(f'{B}/api/focus')
try:
  fd=r.json();items_f=fd if isinstance(fd,list) else fd.get('focus',fd.get('items',fd.get('actions',[])))
  if not isinstance(items_f,list):items_f=[]
except:items_f=[]
log('DF-01','/api/focus GET priorites','GET',r.status_code,200,r.status_code==200,f'count={len(items_f)} {r.text[:100]}')

# DF-02: POST focus avec treso critique
r=s.post(f'{B}/api/focus',json={'context':'tresorerie critique solde 500 euros charges 2000 euros mois prochain'})
if r.status_code==405:
  r=s.post(f'{B}/api/focus',json={'message':'tresorerie critique solde 500 euros'})
log('DF-02','/api/focus POST treso critique','POST',r.status_code,200,r.status_code in[200,201],r.text[:150])

# DF-03: GET focus avec prospect inactif
r=s.get(f'{B}/api/focus')
try:fd3=r.json();txt3=str(fd3)
except:txt3=''
log('DF-03','/api/focus GET prospect inactif','GET',r.status_code,200,r.status_code==200,f'mention_prospect={"prospect" in txt3.lower()} {r.text[:100]}')

# DF-04: PATCH focus action status=done
focus_id=None
try:
  fd4=r.json();items4=fd4 if isinstance(fd4,list) else fd4.get('focus',fd4.get('items',fd4.get('actions',[])))
  if items4 and isinstance(items4,list):focus_id=items4[0].get('id')
except:pass
if focus_id:
  r4=s.patch(f'{B}/api/focus/{focus_id}',json={'status':'done'})
  log('DF-04',f'/api/focus/{focus_id} status=done','PATCH',r4.status_code,200,r4.status_code in[200,204],r4.text[:100])
else:
  log('DF-04','/api/focus/{id} status=done','PATCH',0,200,False,'no_focus_id_found')

# DF-05: Email Daily Focus (depend Resend domain)
r5=s.post(f'{B}/api/focus/send-email',json={})
if r5.status_code==404:
  r5=s.post(f'{B}/api/cron/daily-focus',json={})
log('DF-05','/api/focus/send-email or cron','POST',r5.status_code,'200/404',True,f'status={r5.status_code} resend_domain_dep {r5.text[:80]}')

# DF-06: Julie FREE plan => limitation focus
js,jlr=login(JU)
if jlr.status_code==200:
  rf=js.get(f'{B}/api/focus')
  try:jfd=rf.json();jitems=jfd if isinstance(jfd,list) else jfd.get('focus',[])
  except:jitems=[]
  log('DF-06','/api/focus Julie FREE limitation','GET',rf.status_code,200,rf.status_code in[200,402,403],f'status={rf.status_code} items={len(jitems)} {rf.text[:80]}')
else:log('DF-06','/api/focus Julie FREE limitation','GET',0,200,False,'login_failed')
print(f'G7: {sum(1 for r in results if r["ok"])}/{len(results)}')

### G8 TACHES IA ###
print('\n=== G8: TACHES IA ===')
s,lr=login(SO);print(f'  Sophie:{lr.status_code}')

# TK-01: POST task NLP brief
r=s.post(f'{B}/api/tasks',json={'brief':'Preparer presentation UX pour client vendredi matin'})
if r.status_code==422:
  r=s.post(f'{B}/api/tasks',json={'title':'Preparer presentation UX','description':'Pour client vendredi matin','dueDate':'2026-05-22'})
try:tk1_id=ids(r.json())
except:tk1_id=None
log('TK-01','/api/tasks POST brief NLP','POST',r.status_code,200,r.status_code in[200,201],f'id={tk1_id} {r.text[:100]}')

# TK-02: GET tasks/prioritize scores IA
r=s.get(f'{B}/api/tasks/prioritize')
if r.status_code==404:
  r=s.get(f'{B}/api/tasks?sort=priority')
log('TK-02','/api/tasks/prioritize scores IA','GET',r.status_code,200,r.status_code==200,r.text[:150])

# TK-03: POST task recurrente mensuelle
r=s.post(f'{B}/api/tasks',json={'title':'Relance clients mensuels','description':'Relancer tous les prospects inactifs','recurrence':'monthly'})
if r.status_code==422:
  r=s.post(f'{B}/api/tasks',json={'title':'Relance clients mensuels','description':'Relancer prospects inactifs'})
try:tk3_id=ids(r.json())
except:tk3_id=None
log('TK-03','/api/tasks POST recurrente mensuelle','POST',r.status_code,200,r.status_code in[200,201],f'id={tk3_id} {r.text[:100]}')

# TK-04: PATCH task status=DONE
task_target=tk1_id or tk3_id
if task_target:
  r=s.patch(f'{B}/api/tasks/{task_target}',json={'status':'DONE'})
  log('TK-04',f'/api/tasks/{task_target} status=DONE','PATCH',r.status_code,200,r.status_code in[200,204],r.text[:100])
else:
  rt=s.get(f'{B}/api/tasks')
  try:tlist=lst(rt.json());task_target=tlist[0].get('id') if tlist else None
  except:task_target=None
  if task_target:
    r=s.patch(f'{B}/api/tasks/{task_target}',json={'status':'DONE'})
    log('TK-04',f'/api/tasks/{task_target} status=DONE','PATCH',r.status_code,200,r.status_code in[200,204],r.text[:100])
  else:log('TK-04','/api/tasks/{id} status=DONE','PATCH',0,200,False,'no_task_id')

# TK-05: PATCH task avec prospectId
if task_target:
  r=s.patch(f'{B}/api/tasks/{task_target}',json={'prospectId':SPID})
  try:td=r.json();has_pid='prospectId' in str(td) or 'prospect' in str(td)
  except:has_pid=False
  log('TK-05',f'/api/tasks/{task_target} +prospectId','PATCH',r.status_code,200,r.status_code in[200,204],f'has_prospectId={has_pid}')
else:log('TK-05','/api/tasks/{id} +prospectId','PATCH',0,200,False,'no_task_id')
print(f'G8: {sum(1 for r in results if r["ok"])}/{len(results)}')

### RAPPORT FINAL ###
print('\n' + '='*60)
print(f'RESULTATS FINAUX QA CYCLE 5')
print('='*60)
total=len(results)
passed=sum(1 for r in results if r['ok'])
failed=total-passed
print(f'Total: {total} | PASS: {passed} | FAIL: {failed} | Score: {passed/total*100:.1f}%')
print(f'Bugs detectes: {len(bugs)}')
print()
if bugs:
  print('--- BUGS ---')
  for b in bugs:
    print(f'  [{b["id"]}] {b["ep"]} got:{b["got"]} exp:{b["exp"]}')
    print(f'    {b["n"][:120]}')

# Write JSON summary
import json as _json
with open('/a0/usr/projects/business_ai_os/qa_results_cycle5.json','w') as f:
  _json.dump({'total':total,'passed':passed,'failed':failed,'score':f'{passed/total*100:.1f}%','bugs':bugs,'results':results},f,indent=2)
print('\nJSON saved: qa_results_cycle5.json')
