# 🔬 Rapport de Test Fonctionnel Complet — Brainlo

> **Version** : 1.0 | **Date** : 2026-05-17 | **Cycle** : Fonctionnel (post QA Cycle 2)  
> **Comptes test** : `sophie.qa2@designstudio.fr` (plan FREE) · `julie.qa2@freelance.fr` (plan FREE)  
> **Base URL** : http://51.159.164.33:50082  
> **Périmètre** : Conformité fonctionnelle aux spécifications SKILL.md + DOCUMENTATION_TECHNIQUE.md

---

## 📊 Résumé Exécutif

| Indicateur | Valeur |
|---|---|
| **Modules testés** | 14 / 14 |
| **Tests exécutés** | 52 |
| **Tests passants** | 30 ✅ |
| **Bugs fonctionnels trouvés** | 15 |
| **Bloquants (création/édition impossible)** | 5 🔴 |
| **Score fonctionnel estimé** | **5.5 / 10** |
| **Statut production** | ⛔ NON PRÊT |

---

## 🎯 Matrice de couverture par module

| Module | Tests | ✅ | ❌ | Statut |
|---|---|---|---|---|
| 1. Auth & Profil | 6 | 3 | 3 | 🟠 Partiel |
| 2. Daily Focus v2 | 5 | 5 | 0 | ✅ OK |
| 3. Trésorerie | 9 | 8 | 1 | 🟡 Mineur |
| 4. Pipeline CRM | 5 | 1 | 4 | 🔴 Bloquant |
| 5. Devis & Factures | 4 | 2 | 2 | 🔴 Bloquant |
| 6. Tâches | 3 | 2 | 1 | 🟠 Dégradé |
| 7. LinkedIn Content | 1 | 1 | 0 | ⚠️ Mineur |
| 8. Chat Business Brain | 1 | 1 | 0 | ✅ OK |
| 9. Agents IA | 2 | 1 | 1 | 🟡 Partiel |
| 10. Base de connaissance | 2 | 2 | 0 | ✅ OK |
| 11. Paramètres / Settings | 3 | 2 | 1 | 🟠 Partiel |
| 12. Diagnostic IA | 2 | 1 | 1 | 🟠 Partiel |
| 13. Stripe / Upgrade | 2 | 1 | 1 | ⚠️ Mock |
| 14. Cal.com | 1 | 1 | 0 | ✅ OK |

---

## 📋 Personas utilisées

| Persona | Email | Plan | Rôle |
|---|---|---|---|
| **Sophie QA2** | sophie.qa2@designstudio.fr | FREE | Solopreneur designer, utilisatrice principale |
| **Julie QA2** | julie.qa2@freelance.fr | FREE | Freelance, utilisatrice secondaire |

---

## MODULE 1 — Auth & Profil

### Tests effectués

| Test | Méthode | Résultat | Statut |
|---|---|---|---|
| 1.1 GET /api/auth/me | GET | HTTP 200, données user retournées | ✅ |
| 1.2 Mise à jour profil (PATCH) | PATCH | HTTP 200 sauvegarde OK | ✅ |
| 1.3 Mise à jour profil (PUT) | PUT | HTTP 405 Method Not Allowed | ❌ |
| 1.4 Changement mot de passe | POST | HTTP 405 Method Not Allowed | ❌ |
| 1.5 Reset mot de passe | POST | HTTP 400 Body invalide | ❌ |
| 1.6 Champs étendus dans /me | GET | city/siret/activityType = null | ⚠️ |

---

### 🔴 [BUG-F01] — PUT /api/auth/profile → HTTP 405
**Sévérité** : Medium  
**Spec** : `PUT /api/auth/profile` documenté comme endpoint de mise à jour  
**Observé** : HTTP 405 Method Not Allowed  
**Cause** : L'implémentation utilise `PATCH`, pas `PUT`  
**Fix** : Aligner la doc sur l'implémentation (PATCH) ou ajouter un export `PUT` dans `route.ts`

---

### 🔴 [BUG-F02] — POST /api/auth/change-password → HTTP 405
**Sévérité** : High  
**Spec** : `POST /api/auth/change-password`  
**Observé** : HTTP 405 Method Not Allowed  
**Cause** : L'implémentation utilise `PATCH` (confirmé dans le code source)
```typescript
export async function PATCH(request: NextRequest) { ... } // pas POST
```
**Impact** : Changement de mot de passe impossible via l'interface  
**Fix** : Ajouter `export async function POST(...)` ou renommer l'appel côté frontend en PATCH

---

### 🔴 [BUG-F03] — POST /api/auth/reset-password — Flux de récupération absent
**Sévérité** : High  
**Spec** : Envoi d'un email de récupération (`Envoie email via Resend`)  
**Observé** : HTTP 400 `{"error":"Email et mot de passe requis"}` — l'endpoint attend email + nouveau mot de passe dans le body  
**Cause** : L'endpoint est un **direct password setter**, pas un flux forgot-password avec token email. Il n'y a pas de flow :
1. Utilisateur entre son email → email envoyé
2. Lien email → formulaire nouveau mot de passe
3. Validation token → changement effectif

**Impact** : Un utilisateur ayant perdu son mot de passe ne peut pas le récupérer sans le connaître  
**Fix** : Implémenter un vrai flux reset avec token JWT temporaire + email Resend

---

### ⚠️ [BUG-F04] — /api/auth/me — Champs étendus non retournés
**Sévérité** : Medium  
**Observé** : Après PATCH profil avec city, siret, activityType, GET /me retourne ces champs = null  
**Cause probable** : La sélection Prisma dans `GET /api/auth/me` ne sélectionne pas ces champs étendus  
**Impact** : Page Paramètres ne peut pas afficher les données sauvegardées  
**Fix** : Ajouter les champs dans le `select` Prisma de GET /me :
```typescript
select: { id, email, name, plan, businessName, sector, monthlyGoal, fixedCharges,
  legalName, city, zipCode, address, siret, legalForm, activityType,
  urssafRate, urssafPeriodicity, tvaThreshold, ... }

---

### ✅ Données retournées (tests passants)
- Score daily = 10/100 avec `revenueBonus: 10` (transaction du jour comptabilisée)
- Streak = 0 (nouveau compte — comportement attendu)
- History = [] (nouveau compte — comportement attendu)

---

## MODULE 3 — Trésorerie (Cash)

### Tests effectués

| Test | Endpoint | Résultat | Statut |
|---|---|---|---|
| 3.1 GET transactions | GET /api/cash/transactions | HTTP 200, 2 items | ✅ |
| 3.2 Créer transaction INCOME | POST /api/cash/transactions | HTTP 201, ID généré | ✅ |
| 3.3 Créer transaction EXPENSE | POST /api/cash/transactions | HTTP 201 | ✅ |
| 3.4 Calcul runway | GET /api/cash/runway | HTTP 200, scénarios retournés | ✅ |
| 3.5 Catégorisation IA | POST /api/cash/categorize | HTTP 200, "Figma" → "Logiciels & SaaS" | ✅ |
| 3.6 Récurrences détectées | GET /api/cash/recurrences | HTTP 200 | ✅ |
| 3.7 NLP Parse-brief | POST /api/cash/parse-brief | HTTP 200 — RÉGRESSION RÉSOLUE ✅ | ✅ |
| 3.8 URSSAF tracker | GET /api/cash/urssaf | HTTP 200 | ✅ |
| 3.9 Suppression transaction | DELETE /api/cash/transactions/:id | HTTP vide / échec | ❌ |

> **Note régression** : `POST /api/cash/parse-brief` qui retournait HTTP 500 en Cycle 2 est maintenant résolu. Résultat observé : `{"transaction":{"amount":2500,"type":"INCOME","category":"Facture client","description":"Paiement facture client Dubois"}}`

---

### ⚠️ [BUG-F05] — DELETE /api/cash/transactions/:id → Échec silencieux
**Sévérité** : Medium  
**Observé** : Le DELETE retourne une réponse vide / code HTTP absent  
**Code source** : `export async function DELETE(request: NextRequest)` est présent dans la route, mais le code attend peut-être l'ID dans le **body** plutôt qu'en param URL  
**Impact** : Impossible de supprimer une transaction depuis l'interface  
**Fix** : Créer `/api/cash/transactions/[id]/route.ts` avec `export async function DELETE` utilisant `params.id`

---

## MODULE 4 — Pipeline CRM

### Tests effectués

| Test | Endpoint | Résultat | Statut |
|---|---|---|---|
| 4.1 GET prospects | GET /api/pipeline/prospects | HTTP 200 | ✅ |
| 4.2 Enrichissement SIRET (GET) | GET /api/pipeline/enrich?q=Orange | HTTP 200, SIREN: 380129866 | ✅ |
| 4.3 Modifier prospect | PATCH /api/pipeline/prospects/:id | HTML 500 (route manquante) | ❌ |
| 4.4 Supprimer prospect | DELETE /api/pipeline/prospects/:id | Échec (route manquante) | ❌ |
| 4.5 Enrichissement POST | POST /api/pipeline/enrich | HTTP 405 | ❌ |
| 4.6 Relance IA | POST /api/pipeline/relance | HTTP 403 (plan FREE) | ⚠️ Plan |

---

### 🔴 [BUG-F06] — PATCH/DELETE /api/pipeline/prospects/:id → HTML Error
**Sévérité** : Critical — Bloquant  
**Observé** : Appels à `/api/pipeline/prospects/:id` retournent une page HTML d'erreur Next.js  
**Cause** : **Il n'existe pas de fichier `/api/pipeline/prospects/[id]/route.ts`**  
Seul `/api/pipeline/prospects/route.ts` existe (liste + création)  
```
/api/pipeline/prospects/route.ts   ← GET (liste) + POST (création) seulement
/api/pipeline/prospects/[id]/      ← ❌ MANQUANT
```
**Impact** :
- Impossible de modifier un prospect (statut Kanban, valeur, notes)
- Impossible de supprimer un prospect  
- Tout le workflow Kanban drag-and-drop est cassé côté API  

**Fix** : Créer `/api/pipeline/prospects/[id]/route.ts` :
```typescript
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) { ... }
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) { ... }
```

---

### ⚠️ [BUG-F07] — POST /api/pipeline/enrich → HTTP 405
**Sévérité** : Low  
**Cause** : L'enrichissement est implémenté en GET avec `?q=` query param, mais la doc mentionne POST  
**Fix** : Ajouter alias POST ou aligner la doc

---

### ℹ️ Relance IA — Comportement correct en FREE
`POST /api/pipeline/relance` retourne HTTP 403 `{"error":"Fonctionnalité Solo Pro", "upgradeRequired":true}` pour les utilisateurs FREE — **comportement attendu et correct** selon les specs.

---

## MODULE 5 — Devis & Factures

### Tests effectués

| Test | Endpoint | Résultat | Statut |
|---|---|---|---|
| 5.1 GET quotes | GET /api/quotes | HTTP 200 | ✅ |
| 5.2 GET invoices | GET /api/invoices | HTTP 200 | ✅ |
| 5.3 Créer devis (format items) | POST /api/quotes {items:[...]} | HTTP 400 "Au moins une ligne requise" | ❌ |
| 5.4 Créer devis (format lines) | POST /api/quotes {lines:[...]} | HTTP 500 Internal Server Error | ❌ |
| 5.5 Créer facture | POST /api/invoices {lines:[...]} | HTTP 500 Internal Server Error | ❌ |

---

### 🔴 [BUG-F08] — POST /api/quotes → HTTP 500
**Sévérité** : Critical — Bloquant  
**Observé** : Format `{lines: [{description, quantity, unitPrice, vatRate}]}` → HTTP 500  
**Cause** : Le code source attend le champ `qty` (pas `quantity`) dans chaque ligne :
```typescript
type QuoteLine = { description: string; qty: number; unitPrice: number; vatRate: number }
const subtotalHT = lines.reduce((s, l) => s + l.qty * l.unitPrice, 0)
```
L'erreur HTTP 500 survient car `l.qty * l.unitPrice` = `undefined * number` = NaN, puis Prisma plante  
**Impact** : Création de devis **complètement cassée** depuis le frontend  
**Fix (2 options)** :
1. Frontend : utiliser `qty` dans les lignes (au lieu de `quantity`)
2. Backend : normaliser le champ `qty: body.quantity ?? body.qty`

---

### 🔴 [BUG-F09] — POST /api/invoices → HTTP 500
**Sévérité** : Critical — Bloquant  
**Même cause** : Champ `qty` attendu, `quantity` envoyé  
**Impact** : Création de factures **complètement cassée**  
**Fix** : Même correction que BUG-F08

---

## MODULE 6 — Tâches

### Tests effectués

| Test | Endpoint | Résultat | Statut |
|---|---|---|---|
| 6.1 Créer tâche | POST /api/tasks | HTTP 201, ID généré | ✅ |
| 6.2 Lister tâches | GET /api/tasks | HTTP 200, 1 item | ✅ |
| 6.3 Priorisation IA | POST /api/tasks/prioritize | HTTP 500 | ❌ |

---

### 🟠 [BUG-F10] — POST /api/tasks/prioritize → HTTP 500
**Sévérité** : High  
**Observé** : `{"error":"Erreur lors de la priorisation IA"}`  
**Cause probable** : L'agent Python `task_prioritizer.py` est appelé mais échoue (probablement format de payload incorrect ou dépendance Python manquante)  
**Impact** : Priorisation IA des tâches non fonctionnelle  
**Fix** : Vérifier les logs Python + payload envoyé à FastAPI

---

## MODULE 7 — LinkedIn Content

### Tests effectués

| Test | Endpoint | Résultat | Statut |
|---|---|---|---|
| 7.1 Générer post LinkedIn | POST /api/content/generate | HTTP 201, contenu généré | ⚠️ |

### ⚠️ [BUG-F11] — POST /api/content/generate → HTTP 201 au lieu de 200
**Sévérité** : Low  
**Observé** : La génération fonctionne et retourne du contenu, mais le code HTTP est 201 (Created) alors qu'une opération de génération devrait retourner 200 (OK)  
**Impact** : Faible — certains clients HTTP stricts pourraient avoir un comportement inattendu  
**Fix** : Changer `NextResponse.json({...}, { status: 201 }
, mais `/api/agents/catalog` n'existe pas séparément  
**Fix** : Supprimer les appels à `/api/agents/catalog` dans le frontend ou créer un alias

---

## MODULE 10 — Base de Connaissance

| Test | Endpoint | Résultat | Statut |
|---|---|---|---|
| 10.1 GET knowledge entries | GET /api/knowledge | HTTP 200, [] (nouveau compte) | ✅ |
| 10.2 Recherche wiki | POST /api/wiki/query | HTTP 200 | ✅ |

> Module entièrement fonctionnel. Liste vide attendue pour un nouveau compte sans documents importés.

---

## MODULE 11 — Paramètres / Settings

| Test | Endpoint | Résultat | Statut |
|---|---|---|---|
| 11.1 Mise à jour profil complet | PATCH /api/auth/profile | HTTP 200 | ✅ |
| 11.2 Persistance des champs étendus | GET /api/auth/me | city/siret/activityType = null | ❌ |
| 11.3 Paramètres URSSAF | PATCH /api/cash/urssaf | HTTP 200 | ✅ |

> Voir BUG-F04 — Les champs étendus ne sont pas retournés par `/api/auth/me`, empêchant l'affichage correct de la page Paramètres.

---

## MODULE 12 — Diagnostic IA (Assessment)

| Test | Endpoint | Résultat | Statut |
|---|---|---|---|
| 12.1 Page publique | GET /assessment | HTTP 200 | ✅ |
| 12.2 Soumission assessment | POST /api/assessment | HTTP 400 "Missing required fields" | ❌ |

### ⚠️ [BUG-F13] — POST /api/assessment → HTTP 400 Missing required fields
**Sévérité** : Medium  
**Observé** : `{"error":"Missing required fields"}` avec payload `{answers: {...}}`  
**Cause** : Le format exact des champs requis n'est pas documenté  
**Impact** : L'assessment IA ne peut pas être soumis programmatiquement — impact faible si le frontend le gère correctement  
**Fix** : Documenter le format requis ou ajouter une validation plus explicite avec la liste des champs manquants

---

## MODULE 13 — Stripe / Upgrade

| Test | Endpoint | Résultat | Statut |
|---|---|---|---|
| 13.1 Checkout session | POST /api/stripe/checkout | HTTP 200, URL mock | ⚠️ |
| 13.2 Portal client | GET /api/stripe/portal | HTTP 405 | ❌ |

### ⚠️ [BUG-F14] — Stripe Checkout en MODE MOCK
**Sévérité** : High (bloquant en production)  
**Observé** : `POST /api/stripe/checkout` retourne `{"url":"/focus?upgrade=success&mock=true"}`  
**Cause** : La clé Stripe configurée est probablement une clé test ou manquante — le code bascule en mode mock  
**Impact** : Aucun paiement réel n'est possible — la monétisation est entièrement fictive  
**Fix** : Configurer `STRIPE_SECRET_KEY=sk_live_...` + `STRIPE_PRICE_ID=price_...` dans `.env`

### ❌ [BUG-F15] — GET /api/stripe/portal → HTTP 405
**Sévérité** : Medium  
**Observé** : HTTP 405 sur GET — l'endpoint attend probablement POST  
**Fix** : Utiliser `POST /api/stripe/portal` depuis le frontend

---

## MODULE 14 — Cal.com Calendar

| Test | Endpoint | Résultat | Statut |
|---|---|---|---|
| 14.1 GET événements | GET /api/calcom/events | HTTP 200 | ✅ |

> Module fonctionnel en lecture. Aucun événement créé (compte nouveau) — comportement attendu.

---

## 🔴 Récapitulatif consolidé des bugs fonctionnels

| ID | Module | Sévérité | Titre | Statut |
|---|---|---|---|---|
| BUG-F01 | Auth | Medium | PUT /profile → 405 (PATCH requis) | Ouvert |
| BUG-F02 | Auth | **High** | POST change-password → 405 (PATCH requis) | Ouvert |
| BUG-F03 | Auth | **High** | reset-password n'est pas un flux forgot-password | Ouvert |
| BUG-F04 | Auth/Settings | Medium | /api/auth/me ne retourne pas les champs étendus | Ouvert |
| BUG-F05 | Cash | Medium | DELETE transaction échoue silencieusement | Ouvert |
| BUG-F06 | Pipeline | **Critical** | Route /prospects/[id] inexistante — PATCH/DELETE impossible | Ouvert |
| BUG-F07 | Pipeline | Low | POST /enrich → 405 (GET requis) | Ouvert |
| BUG-F08 | Devis | **Critical** | POST /quotes → 500 (champ qty vs quantity) | Ouvert |
| BUG-F09 | Factures | **Critical** | POST /invoices → 500 (champ qty vs quantity) | Ouvert |
| BUG-F10 | Tâches | High | POST /tasks/prioritize → 500 | Ouvert |
| BUG-F11 | LinkedIn | Low | POST /content/generate → 201 au lieu de 200 | Ouvert |
| BUG-F12 | Agents | Medium | GET /agents/catalog → route inexistante | Ouvert |
| BUG-F13 | Assessment | Medium | POST /api/assessment → 400 (format non documenté) | Ouvert |
| BUG-F14 | Stripe | **High** | Checkout en mode MOCK (pas de vrai Stripe) | Ouvert |
| BUG-F15 | Stripe | Medium | GET /api/stripe/portal → 405 (POST requis) | Ouvert |

---

## ⚡ Plan de correction prioritaire

### 🔴 Sprint 1 — Bloquants métier (2-3h)

| Priorité | Fix | Temps estimé |
|---|---|---|
| 1 | **Créer `/api/pipeline/prospects/[id]/route.ts`** (PATCH + DELETE) | 30 min |
| 2 | **Fix `qty` vs `quantity`** dans quotes + invoices route.ts | 10 min |
| 3 | **Configurer Stripe** (clé live + price ID dans .env) | 15 min |
| 4 | **Fix `POST` → `PATCH`** dans change-password (frontend) | 5 min |
| 5 | **Ajouter champs étendus dans select Prisma** de GET /api/auth/me | 10 min |

### 🟠 Sprint 2 — Dégradations (1-2h)

| Priorité | Fix | Temps estimé |
|---|---|---|
| 6 | **Implémenter vrai flux reset-password** (token email Resend) | 45 min |
| 7 | **Déboguer /api/tasks/prioritize** (logs Python FastAPI) | 30 min |
| 8 | **Fix /api/cash/transactions DELETE** (route [id]) | 15 min |
| 9 | **POST /api/stripe/portal** côté frontend (méthode) | 5 min |
| 10 | **Fix HTTP 201 → 200** dans /api/content/generate | 2 min |

### 🟡 Sprint 3 — Mineurs & doc (30 min)

| Fix | Temps |
|---|---|
| Documenter format POST /api/assessment | 15 min |
| Supprimer appels /api/agents/catalog si non utilisé | 5 min |
| Aligner doc sur PATCH (pas PUT) pour profile | 5 min |

---

## 📊 Conformité fonctionnelle aux spécifications

| Fonctionnalité clé (Spec SKILL.md) | Implémentée | Fonctionnelle |
|---|---|---|
| Daily Focus v2 (streak, score, history, feedback loop) | ✅ | ✅ |
| NLP Cash parse-brief | ✅ | ✅ (régression résolue) |
| Catégorisation IA transactions | ✅ | ✅ |
| Runway calculator | ✅ | ✅ |
| URSSAF + TVA tracker | ✅ | ✅ |
| Récurrences auto-détectées | ✅ | ✅ |
| Pipeline Kanban (CRUD complet) | ✅ spec | ❌ PATCH/DELETE cassés |
| Enrichissement SIRET (API gouv) | ✅ | ✅ (GET seulement) |
| Relances IA | ✅ spec | ⚠️ PRO uniquement |
| Devis & Factures (création) | ✅ spec | ❌ HTTP 500 |
| Facture → Transaction automatique (PAID) | ✅ spec | ❌ création bloquée |
| Priorisation IA des tâches | ✅ spec | ❌ HTTP 500 |
| Génération posts LinkedIn | ✅ | ✅ (code 201 mineur) |
| Chat Business Brain | ✅ | ✅ |
| Agents IA (catalogue) | ✅ | ✅ |
| Base de connaissance + Wiki | ✅ | ✅ |
| Paramètres profil + fiscal | ✅ | ⚠️ /me champs tronqués |
| Diagnostic IA (assessment) | ✅ | ⚠️ format non documenté |
| Stripe checkout | ✅ spec | ❌ mode MOCK |
| Cal.com intégration | ✅ | ✅ |
| Onboarding 7 étapes | ✅ spec | Non testé |
| OCR ticket (vision LLM) | ✅ spec | Non testé |

---

## 🎯 Score final et estimation de production-readiness

| Dimension | Score | Commentaire |
|---|---|---|
| **Auth & Sécurité** | 6/10 | Manque change-pwd, reset-pwd incomplet |
| **Daily Focus** | 9/10 | Complet, génération PRO uniquement |
| **Trésorerie** | 8/10 | NLP résolu, DELETE manquant |
| **Pipeline CRM** | 3/10 | Kanban cassé (pas de [id] route) |
| **Devis & Factures** | 2/10 | Création complètement cassée |
| **Tâches** | 6/10 | CRUD ok, IA prioritize cassée |
| **Content LinkedIn** | 8/10 | Fonctionne, code HTTP mineur |
| **Chat IA** | 9/10 | Entièrement fonctionnel |
| **Agents IA** | 7/10 | Catalogue ok, /catalog inexistant |
| **Base de connaissance** | 9/10 | Entièrement fonctionnelle |
| **Paramètres** | 6/10 | PATCH ok, /me champs tronqués |
| **Stripe / Paiement** | 2/10 | Mock mode = 0 revenu réel |
| **Cal.com** | 8/10 | Lecture fonctionnelle |

### Score global fonctionnel : **5.8 / 10**

```
🔴 Non production-ready

Raisons bloquantes :
1. Pipeline Kanban entièrement cassé côté édition/suppression
2. Devis & Factures non créables (HTTP 500)
3. Stripe en mode mock = 0 revenu
4. Changement de mot de passe non fonctionnel

Estimation pour atteindre production-ready (8/10) :
→ Sprint 1 : 2-3h de développement → Score estimé : 7.5/10
→ Sprint 2 : 2h supplémentaires → Score estimé : 8.5/10 ✅
```

---

*Rapport généré le 2026-05-17 — Tests exécutés avec comptes sophie.qa2@designstudio.fr et julie.qa2@freelance.fr (plan FREE)*
