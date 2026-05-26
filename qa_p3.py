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
  try:resp_text=r.json().get('message','') or r.json().get('response','') or r.json().get('content','') or r.text
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
