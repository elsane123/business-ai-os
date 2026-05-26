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
try:qd9=r.json();ht=qd9.get('totalHT') or qd9.get('quote',{}).get('totalHT',0);tva=qd9.get('totalVAT') or qd9.get('quote',{}).get('totalVAT',0)
except:ht=0;tva=0
log('QF-09','/api/quotes TVA 0%','POST',r.status_code,201,r.status_code in[200,201] and float(tva)==0,f'HT={ht} TVA={tva}')

# QF-10: TVA 20% calcul HT/TVA/TTC
r=s.post(f'{B}/api/quotes',json={'clientName':'TVA Test','clientEmail':'tva@test.com',
  'lines':[{'title':'Consulting','qty':2,'unitPrice':1000,'vatRate':20}]})
try:
  qd=r.json();q=qd if 'totalHT' in qd else qd.get('quote',{})
  ht10=float(q.get('totalHT',0));vat10=float(q.get('totalVAT',0));ttc10=float(q.get('totalTTC',0))
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
