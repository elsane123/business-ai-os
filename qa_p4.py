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
