# Brainlo — Skill Complet

> Version : 1.4.0 | Onboarding simplifié + UX Activation + WCAG + E2E | 2026-05-26

## Démarrage rapide

Avant toute tâche, charger ce skill pour avoir le contexte complet du projet.

```bash
# ⚡ Démarrer le serveur Next.js (MODE PRODUCTION)
cd /a0/usr/projects/business_ai_os
nohup npm start --prefix business-ai-os -- -p 50082 > nextjs.out.log 2>&1 & echo $! > nextjs.pid
# Démarrer le serveur Python
nohup bash /a0/usr/projects/business_ai_os/start-python.sh > /a0/usr/projects/business_ai_os/python.out.log 2>&1 &
# Vérifier que les deux serveurs sont UP
curl -s -o /dev/null -w '%{http_code}' http://localhost:50082/onboarding
curl -s http://localhost:8000/health
# Après modifications Prisma (rebuild requis en prod)
npx prisma db push && npx prisma generate && cd /a0/usr/projects/business_ai_os/business-ai-os && npm run build && pkill -f 'next-server' && nohup npm start -- -p 50082 > ../nextjs.out.log 2>&1 &
# Après modifications code (rebuild requis en prod)
cd /a0/usr/projects/business_ai_os/business-ai-os && npm run build && pkill -f 'next-server' && nohup npm start -- -p 50082 > ../nextjs.out.log 2>&1 &
```

**URLs** : http://51.159.164.33:50082 (frontend) · http://localhost:8000 (Python API)

**Cron logs** : `/a0/usr/projects/business_ai_os/cron-daily-focus.log` · `cron-monthly-report.log` · `cron-wiki-lint.log`

---

## 📁 Emplacement du projet

```
/a0/usr/projects/business_ai_os/business-ai-os/
```

- **Frontend** : Next.js 16 App Router + TypeScript + Tailwind CSS (React 19)
- **Backend** : Next.js API Routes + Python FastAPI
- **ORM** : Prisma + PostgreSQL (Neon)
- **Auth** : JWT (jose) + cookie httpOnly
- **LLM** : OpenRouter (claude-3-haiku / claude-3-sonnet)
- **Email** : Resend
- **Paiement** : Stripe
- **Dev server** : `npm run dev -- -p 50082` + Python `uvicorn main:app --port 8000`
- **Logs** : `nextjs.out.log` et `python.out.log` dans `/a0/usr/projects/business_ai_os/`

---

## 🎯 Vision Produit

> *Un système d'exploitation d'entreprise piloté par l'IA pour solopreneurs.*

**Cible** : Solopreneurs et PME 5–50 personnes  
**Différenciation clé** : Interconnexion native entre agents IA

### Gamme Produit

| Plan | Prix/mois | Cible |
|---|---|---|
| **Solo Free** | 0€ | Solopreneur débutant |
| **Solo Pro** | 29€ | Solopreneur actif |
| **Starter PME** | 149€ | 1–4 personnes |
| **PME Growth** | 349€ | 5–20 personnes |
| **PME Scale** | 499€ | 20–50 personnes |

---

## 🏗️ Structure du Projet

```
brainlo/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── onboarding/page.tsx          # 3 étapes simplifiées + WHY callouts
│   │   ├── error.tsx                    # Error boundary auth
│   ├── error.tsx                        # Error boundary pages publiques
│   ├── global-error.tsx                 # Error boundary root (crash total)
│   ├── (dashboard)/
│   │   ├── focus/page.tsx               # Daily Focus v2 (Score+Streak+Historique)
│   │   ├── cash/page.tsx                # Trésorerie + Runway + URSSAF + TVA
│   │   ├── pipeline/page.tsx            # Kanban + Enrichissement prospect
│   │   ├── content/page.tsx             # Générateur LinkedIn
│   │   ├── chat/page.tsx                # Business Brain Chat
│   │   ├── invoices/page.tsx            # Devis + Factures
│   │   ├── tasks/page.tsx               # Tâches
│   │   ├── knowledge-base/page.tsx      # Base de connaissances
│   │   ├── settings/page.tsx            # Profil + Paramètres fiscaux + Enrichir profil
│   │   ├── layout.tsx                   # Dashboard layout (skip-nav, checklist, sidebar)
│   │   └── error.tsx                    # Error boundary dashboard
│   └── api/
│       ├── user/
│       │   ├── onboarding/route.ts      # GET progression checklist / POST marquer étape
│       │   └── enrichment/route.ts      # GET/PATCH profil enrichi + score complétion
│       ├── focus/
│       │   ├── route.ts                 # GET/POST/PATCH actions + wiki ingest
│       │   ├── streak/route.ts          # Calcul série + heatmap 14j
│       │   ├── history/route.ts         # Historique 7/14/30j + skip patterns
│       │   └── score/route.ts           # Score journalier 0-100
│       ├── cash/
│       │   ├── transactions/route.ts
│       │   ├── runway/route.ts
│       │   ├── parse-brief/route.ts
│       │   ├── ocr/route.ts             # Vision LLM → transaction pré-remplie
│       │   ├── categorize/route.ts      # Auto-catégorisation description
│       │   ├── recurrences/route.ts     # Détection patterns récurrents 90j
│       │   └── urssaf/route.ts          # URSSAF déclarations + TVA tracker
│       ├── pipeline/
│       │   ├── prospects/route.ts       # CRUD + champs enrichissement
│       │   ├── prospects/[id]/route.ts  # PATCH + DELETE par ID
│       │   ├── enrich/route.ts          # API gouvernement FR (SIRET, adresse)
│       │   └── relance/route.ts
│       ├── cash/
│       │   ├── transactions/route.ts
│       │   ├── transactions/[id]/route.ts # DELETE + PATCH par ID
│       │   ├── runway/route.ts
│       │   ├── parse-brief/route.ts
│       │   └── urssaf/route.ts
│       ├── invoices/route.ts            # PAID → crée transaction auto
│       ├── quotes/route.ts
│       ├── content/generate/route.ts
│       ├── chat/route.ts
│       ├── tasks/ (route.ts, prioritize/)
│       ├── wiki/ (ingest/, query/)
│       ├── knowledge/route.ts
│       ├── agents/catalog/route.ts      # Catalogue agents avec état activation
│       ├── reports/monthly/route.ts     # Rapport mensuel JSON + envoi email
│       ├── cron/
│       │   ├── daily-focus/route.ts     # Email Focus 8h UTC — x-cron-secret
│       │   ├── monthly-report/route.ts  # Rapport mensuel 1er du mois
│       │   └── wiki-lint/route.ts       # Lint wiki chaque lundi
│       ├── stripe/ (checkout/, portal/, webhook/)
│       └── calcom/ (webhook/, events/)
├── components/
│   ├── dashboard/
│   │   ├── FocusScore.tsx               # Ring SVG animé 0-100
│   │   ├── FocusStreak.tsx              # Série + heatmap 14j
│   │   ├── FocusHistory.tsx             # Historique collapsible 7/14/30j
│   │   ├── DailyFocus.tsx
│   │   ├── ChatBrain.tsx
│   │   ├── CashWidget.tsx
│   │   ├── PipelineKanban.tsx
│   │   ├── CalendarWidget.tsx
│   │   └── OnboardingChecklist.tsx      # Checklist 9 étapes + auto-détection + progressbar
│   ├── layout/
│   │   ├── Sidebar.tsx                  # aria-current, aria-label, badges PRO
│   │   ├── MobileNav.tsx
│   │   └── Header.tsx
│   └── ui/
│       ├── Button.tsx, Card.tsx, Badge.tsx, Input.tsx
│       ├── UpgradeBanner.tsx            # Bandeau upgrade FREE→PRO
│       ├── ProBadge.tsx                 # Badge PRO + tooltip upgrade (sidebar)
│       └── ErrorBoundary.tsx            # Composant classe React réutilisable
├── e2e/                                 # Tests Playwright E2E
│   ├── global.setup.ts                  # Auth setup → .playwright/auth.json
│   ├── auth.spec.ts                     # Login valid/invalid, forgot-password
│   ├── dashboard.spec.ts                # Checklist, PRO badges, navigation
│   ├── pipeline.spec.ts                 # Prospects CRUD
│   ├── tasks.spec.ts                    # Tâches CRUD
│   └── settings.spec.ts                 # Settings, anchres #enrich #calcom
├── lib/
│   ├── wiki/ (reader, writer, ingest, query)
│   ├── db.ts, auth.ts, openrouter.ts, resend.ts, stripe.ts
│   ├── agents-catalog.ts, blog.ts, assessment.ts
│   ├── rate-limit.ts        # Rate limiting en mémoire (anti brute-force login)
│   ├── sanitize.ts          # Sanitisation XSS (text, email, url, phone)
│   └── reset-tokens.ts      # Tokens one-time pour forgot/reset password
├── prisma/schema.prisma
└── python/
    ├── agents/
    │   ├── daily_focus.py               # 3 actions + gestion skip_patterns
    │   ├── relance_gen.py
    │   ├── linkedin_gen.py
    │   ├── wiki_ingest.py               # Ingest onboarding enrichi
    │   ├── wiki_query.py                # BM25 (K1=1.5, B=0.75)
│   │   ├── wiki_lint.py                 # Lint hebdo: pages vides, log>200L, dedup
    │   ├── task_prioritizer.py
    │   └── kb_extract.py
    └── main.py                          # Routes: /focus /wiki/lint /wiki/query /tasks/prioritize ...
```

---

## 🗄️ Modèle de Données Prisma (état actuel)

### User (champs importants)
```
id, email, name, passwordHash, plan
businessName, sector, monthlyGoal, fixedCharges
legalName, address, zipCode, city, siret, legalForm
vatNumber, paymentTerms, invoiceFooter, logoUrl
quoteCounter, invoiceCounter
calcomWebhookSecret, calcomBookingUrl
// Statut fiscal auto-entrepreneur
activityType    // SERVICE_BNC | SERVICE_BIC | COMMERCE | LIBERAL
urssafRate      // taux en % (ex: 22.0)
urssafPeriodicity // MONTHLY | QUARTERLY  
tvaThreshold    // seuil franchise TVA (ex: 36800)
// Activation & enrichissement profil (v1.4.0)
onboardingProgress Json? // {completed: ["account","sector",...], dismissedAt?: ISO}
profileEnrichment  Json? // {offers:{...}, icp:{...}, location:{...}, brief:"..."}
```

### Prospect (champs enrichissement)
```
id, userId, name, company, email, phone
status, value, lastContactDate, notes, lostReason
// Enrichissement API gouvernement FR
siret, linkedinUrl, position
enrichCity, enrichAddress, enrichZip
employeeRange, nafCode
```

### UrssafDeclaration (nouveau)
```
id, userId
period      // YYYY-MM
ca          // CA du mois (INCOME transactions)
cotisations // ca * urssafRate / 100
status      // PENDING | DECLARED
declaredAt
```

### Autres modèles
- Transaction, DailyFocus, Relance, LinkedInPost
- Quote, Invoice, Task, KnowledgeEntry
- WikiPage, WikiEvent, CalendarEvent
- AgentActivation, AgentChatMessage

---

## ✅ Fonctionnalités Développées (session actuelle)

### 🌅 Daily Focus v2.0

**Fonctionnement** : Agent Python `daily_focus.py` analyse la wiki, le pipeline, la trésorerie et génère 3 actions priorisées chaque matin.

**5 améliorations ajoutées** :

1. **Feedback Loop** (PATCH `/api/focus`)
   - Statuts : `done` / `skipped` / `snoozed` / `pending`
   - `done` → log + append `business/patterns.md` dans wiki
   - Score et streak se mettent à jour automatiquement

2. **Streak Tracker** (`/api/focus/streak`)
   - Série de jours consécutifs avec ≥1 action done
   - Heatmap 14 jours (vert=tout fait, indigo=partiel, gris=rien)
   - Record personnel + taux de complétion 30j
   - Component : `FocusStreak.tsx`

3. **Pattern Learning** (`/api/focus/history` + Python)
   - Détecte actions ignorées >60% sur 30j
   - Alerte jaune dans l'historique
   - `skip_patterns` injectés dans le prompt Python pour reformuler

4. **Historique Focus** (`/api/focus/history`)
   - Filtres 7j / 14j / 30j
   - Détail collapsible par jour : chaque action + statut
   - Component : `FocusHistory.tsx`

5. **Score Journalier** (`/api/focus/score`)
   - 0-70 pts : ratio actions complétées
   - +20 pts : bonus toutes actions faites
   - +10 pts : revenu saisi dans Cash aujourd'hui
   - Ring SVG animé + breakdown
   - Component : `FocusScore.tsx`

**Bug corrigé** : PATCH utilisait SQL brut SQLite (`?`) → remplacé par Prisma ORM (compatible PostgreSQL)

---

### 👥 Pipeline — Enrichissement Prospect

**API** : `/api/pipeline/enrich` — appelle `recherche-entreprises.api.gouv.fr` (gratuit, sans clé API)

**Fonctionnement** :
1. Utilisateur tape un nom d'entreprise dans le champ "Entreprise"
2. Debounce 500ms → appel API gouvernement
3. Dropdown suggestions avec : nom, 📍 ville, SIRET, 👥 effectifs
4. Clic → auto-remplit :
   - Nom société, SIRET, ville, adresse, code postal
   - Tranche d'effectifs, code NAF
   - URL recherche LinkedIn (entreprise)

**Badges sur cartes Kanban** : 📍 ville, 👥 effectifs (condensé), [in] LinkedIn

**Nouveaux champs Prospect** : siret, linkedinUrl, position, enrichCity, enrichAddress, enrichZip, employeeRange, nafCode

**Flux Pipeline → Devis** :
- Bouton 📄 (colonne Devis) passe TOUS les champs enrichis en URL params
- Page `/invoices` pré-remplit : nom société, adresse, CP, ville, SIRET, email
- Notes pré-remplies : `Contact: Nom (Poste)` + `Tél: ...`

---

### 💰 Cash & Runway — 4 nouvelles fonctionnalités

**1. OCR Ticket** (`/api/cash/ocr`)
- Bouton "📸 Scanner ticket" dans le header
- Photo → base64 → claude-3-haiku Vision
- Extrait : montant, type, catégorie, description, date
- Pré-remplit le formulaire de transaction

**2. Auto-catégorisation** (`/api/cash/categorize`)
- Debounce 700ms sur le champ Description
- LLM (claude-3-haiku, temp=0) → catégorie parmi les 9 catégories
- Chip "🏷️ Appliquer : Logiciels & SaaS" → 1 clic pour appliquer

**3. Récurrences auto-détectées** (`/api/cash/recurrences`)
- Analyse 90 derniers jours de transactions
- Groupe par description normalisée + montant ±25%
- Détecte Hebdomadaire / Mensuel / Trimestriel (médiane des gaps)
- Bannière amber avec bouton "+ Ajouter" (pré-remplit le formulaire)
- Ignorable par session

**4. Facture → Transaction automatique** (`app/api/invoices/route.ts`)
- Marquer une facture comme PAID → crée automatiquement une transaction INCOME
- amount = totalTTC, category = "Paiement facture", description = "Règlement [ref]"

---

### 📋 URSSAF + TVA Tracker (dans /cash)

**API** : `/api/cash/urssaf` — GET / POST (marquer déclaré) / PATCH (paramètres fiscaux)

**TVA Tracker** :
- Seuils 2025 : Services 36 800€ (tolérance 39 100€), Commerce 91 900€ (tolérance 101 000€)
- Barre de progression avec zones vert / jaune (80%) / orange (100%) / rouge (tolérance)
- Alerte contextuelle selon le niveau atteint

**Types d'activité + taux URSSAF** :
- SERVICE_BNC : 22.0% — Prestation services BNC
- SERVICE_BIC : 22.9% — Prestation services BIC
- COMMERCE : 12.3% — Vente marchandises
- LIBERAL : 22.2% — Libéral réglementé CIPAV

**Déclarations mensuelles** :
- Grille mois janvier → mois actuel
- CA calculé depuis transactions INCOME du mois
- Cotisations = CA × taux
- Bouton "Marquer déclaré" → enregistre en DB
- Lien direct urssaf.fr pour déclarer

---

### 📋 Onboarding v3.0 (3 étapes simplifiées)

**Page** : `app/(auth)/onboarding/page.tsx` (449 lignes)

| Étape | Contenu | WHY callout |
|---|---|---|
| 0 | Boot screen animé | — |
| 1 | Compte : nom, email, mot de passe, entreprise | 🔐 Sécurise · 🧠 Agents IA · 📋 Devis · ⚡ Focus |
| 2 | Profil rapide : secteur (chips), CA mensuel (optionnel), description (optionnel) | 🤖 Calibre agents · 💡 Daily Focus · 📣 LinkedIn · 👥 Relances |
| 3 | Activation : création compte + ingest wiki + redirection | — |

**Champs déplacés** vers `Settings > Enrichir mon profil` : Offres, ICP/Stratégie, Localisation, Brief.

**Wiki générée automatiquement à l'inscription** :
- `BRAIN.md` — profil complet entreprise
- `business/icp.md` — profil client idéal
- `content/competitors.md` — concurrents + différenciateur
- `business/messages.md` — proposition de valeur + templates
- `business/documentation.md` — brief/pitch collé

---

### 🚀 UX Activation — Onboarding Checklist & PRO Badges (v1.4.0)

**Checklist 9 étapes** : `components/dashboard/OnboardingChecklist.tsx`

| ID | Étape | Auto-détection | PRO |
|---|---|---|---|
| `account` | Créer votre compte | Toujours coché | Non |
| `sector` | Renseigner votre secteur | `user.sector` non vide | Non |
| `prospect` | Ajouter votre 1er prospect | Compte prospects > 0 | Non |
| `task` | Créer votre première tâche | Compte tâches > 0 | Non |
| `focus` | Générer votre Daily Focus | Entrée focus aujourd'hui | Non |
| `chat` | Essayer le Chat IA | Manuel | Oui |
| `agents` | Explorer les Agents IA | Manuel | Oui |
| `enrich` | Enrichir votre profil | `profileEnrichment` non vide | Non |
| `calcom` | Connecter Cal.com | `calcomBookingUrl` renseigné | Non |

- Visible 30 premiers jours, masquable (localStorage)
- Skip-nav, `aria-expanded`, `role="progressbar"` (WCAG)
- API : `GET /api/user/onboarding` (auto-détection + manuel) / `POST` (marquer étape)

**Badges PRO sidebar** : `components/ui/ProBadge.tsx`
- Sur : LinkedIn, Chat, Agents IA, Base de connaissance
- Tooltip upgrade au survol → CTA "Passer à Solo Pro — 29€/mois"
- Mode réduit : point violet discret

**Settings > Enrichir mon profil** : `app/(dashboard)/settings/page.tsx` (sections `id="enrich"` et `id="calcom"`)

| Section | Score | Débloque |
|---|---|---|
| 📦 Offres & Pricing | 25% | Devis IA, Relances pricing |
| 🎯 ICP & Stratégie | 50% | Agents relance, Posts LinkedIn ciblés |
| 🌍 Localisation & Marché | 75% | Prospection géolocalisée |
| 📄 Brief Commercial | 100% | Chat IA contextualisé, Brain enrichi |

- API : `GET/PATCH /api/user/enrichment` (score calculé côté serveur)


---

### ⚡ QW-1 — Notification email Daily Focus (8h UTC)

**Endpoint** : `POST /api/cron/daily-focus` (protégé par `x-cron-secret` header)

**Logique** :
- Récupère tous les users `plan=PRO`
- Pour chaque user : focus déjà généré → utilise existant, sinon génère via Python `/focus/generate`
- Envoie email HTML via `sendDailyFocusEmail()` dans `lib/resend.ts`
- Fallback : 3 actions génériques si Python API indisponible

**Cron système** : `0 8 * * *` (tous les jours à 8h UTC = 10h Paris)

**Log** : `/a0/usr/projects/business_ai_os/cron-daily-focus.log`

---

### 📊 QW-2 — Rapport Mensuel Auto

**Endpoint utilisateur** : `GET /api/reports/monthly?month=2026-05` (auth cookie)  
**Endpoint cron** : `POST /api/cron/monthly-report` (x-cron-secret)  
**Email** : `sendMonthlyReportEmail()` dans `lib/resend.ts`

**Données agrégées** :
- Finance : CA / Charges / Net / Progression objectif / Top dépenses
- Pipeline : prospects actifs / deals gagnés / taux conversion  
- Tâches : taux de complétion
- Focus : jours actifs / taux engagement

**Cron système** : `0 9 1 * *` (1er de chaque mois à 9h UTC)

---

### 🧠 QW-3 — Wiki Lint Hebdomadaire

**Agent Python** : `python/agents/wiki_lint.py`  
**Endpoint Python** : `POST /wiki/lint`  
**Endpoint Next.js** : `POST /api/cron/wiki-lint` (x-cron-secret)

**Actions** :
1. Supprime pages Markdown vides (sans contenu significatif)
2. Tronque `log.md` si > 200 lignes (garde les 200 dernières)
3. Déduplique les lignes répétées >40 chars dans les pages
4. Met à jour `BRAIN.md` avec horodatage du dernier lint

**Cron système** : `0 9 * * 1` (chaque lundi à 9h UTC)

---

### 🛡️ Sécurité — Améliorations QA (Post-QA Sprint)

**Nouvelles bibliothèques** :
- `lib/rate-limit.ts` — Rate limiting en mémoire, 5 req/15min/IP sur login
- `lib/sanitize.ts` — Sanitisation XSS : `sanitizeText()`, `sanitizeEmail()`, `sanitizeUrl()`, `sanitizePhone()`
- `lib/reset-tokens.ts` — Tokens one-time TTL 1h pour flux forgot/reset-password

**Corrections sécurité** :
- JWT retiré du response body (login + register) → cookie httpOnly exclusif
- XSS sanitisation sur toutes les entrées pipeline/prospects
- Middleware étendu à 13 routes protégées
- CSP + HSTS headers dans `next.config.js` (HSTS actif automatiquement quand `NODE_ENV=production`)
- Rate limiting brute-force sur `POST /api/auth/login`

**Variables d'environnement ajoutées** :
- `CRON_SECRET` — Secret partagé pour authentifier les cron jobs
- `PYTHON_API_URL` — URL du microservice Python (défaut: `http://localhost:8000`)

---

### 🧪 Qualité — Error Boundaries, Tests E2E Playwright, WCAG (v1.4.0)

**Error Boundaries (5 fichiers)** :
- `app/global-error.tsx` — crash total root layout (inclut `<html>` et `<body>`)
- `app/error.tsx` — pages publiques (landing, blog)
- `app/(dashboard)/error.tsx` — toutes les pages dashboard
- `app/(auth)/error.tsx` — pages auth (login, onboarding)
- `components/ui/ErrorBoundary.tsx` — composant classe React réutilisable (`<ErrorBoundary fallback={...}>`)

**Tests E2E Playwright** (dossier `e2e/`, 24 tests, 96% pass rate) :
```bash
npm run test:e2e           # Lancer tous les tests
npm run test:e2e:report    # Ouvrir le rapport HTML
```
- `e2e/global.setup.ts` — Auth setup, sauvegarde session dans `.playwright/auth.json`
- `e2e/auth.spec.ts` — Login valide/invalide, forgot-password, route protégée
- `e2e/dashboard.spec.ts` — Checklist, % progression, badges PRO, navigation sidebar
- `e2e/pipeline.spec.ts` — Chargement, bouton nouveau prospect, création
- `e2e/tasks.spec.ts` — Chargement, bouton nouvelle tâche, création
- `e2e/settings.spec.ts` — Sections, ancres #enrich et #calcom, score profil

**Accessibilité WCAG 2.1 AA** (score estimé 78/100) :
- `globals.css` — `.skip-nav`, `.sr-only`, `focus-visible`, `prefers-reduced-motion`
- `layout.tsx` — `<a href="#main-content" className="skip-nav">` + `<main id="main-content" tabIndex={-1}>`
- `Sidebar.tsx` — `<nav aria-label="Navigation principale">` + `aria-current="page"` sur lien actif
- `OnboardingChecklist.tsx` — `<button aria-expanded>` (remplacement div), `role="progressbar"`, `aria-live`
- `login/page.tsx` — `htmlFor`/`id` sur tous les champs + `autoComplete`
- `onboarding/page.tsx` — composant `Field` génère `id` auto depuis le label

---

## 🚨 Points d'attention / Bugs connus

### ⚡ Migration Next.js 16 + React 19 (2026-05-22)

**Fichiers modifiés** :
- `middleware.ts` → renommé en `proxy.ts` (convention Next.js 16), fonction `middleware()` → `proxy()`
- `lib/auth.ts` → `cookies()` / `setAuthCookie()` / `clearAuthCookie()` maintenant async
- `next.config.js` → `experimental.serverActions` supprimé + `allowedDevOrigins: ['51.159.164.33']` + CSP `unsafe-eval` en dev
- Tous les route handlers `[id]` et `[slug]` → `params` devient `Promise<{...}>` + `await params`

**Notes importantes** :
- React 18.2.0 → **React 19.2.6** : vérifier compatibilité des nouvelles libs UI
- lucide-react : mis à jour vers **1.16.0** (compatibilité React 19)
- `allowedDevOrigins` obligatoire pour accès via IP publique en dev
- `unsafe-eval` requis en mode dev pour Turbopack/React
- postcss vulnérabilité moderate = dépendance interne Next.js, **ne pas faire `npm audit fix --force`**

---

1. **Prisma : toujours régénérer après schema change**
   ```bash
   npx prisma db push && npx prisma generate
   # puis redémarrer Next.js
   ```

2. **TypeScript errors pré-existants** (ne pas corriger sauf si demandé)
   - `app/page.tsx` — canvas API
   - `lib/stripe.ts` — version types
   - `app/(dashboard)/layout.tsx` — JWTPayload

3. **Base de données** : PostgreSQL (Neon) — PAS SQLite
   - Ne jamais utiliser SQL brut avec `?` — utiliser Prisma ORM
   - Les placeholders PostgreSQL sont `$1, $2, $3`

4. **Ports** :
   - Next.js : 50082 (pas 3000)
   - Python FastAPI : 8000
   - Si port occupé : `pkill -f 'next dev'` ou `pkill -f uvicorn`

5. **CRON_SECRET** (dans `.env`) :
   - Requis pour authentifier les endpoints `POST /api/cron/*`
   - Header : `x-cron-secret: $CRON_SECRET`
   - Générer : `openssl rand -hex 32`

6. **Sécurité** — Libs critiques :
   - `lib/rate-limit.ts` → Rate limiting login (5/15min/IP)
   - `lib/sanitize.ts` → Sanitisation XSS obligatoire sur inputs libres
   - `lib/reset-tokens.ts` → Tokens reset-password TTL 1h

---

## 📋 Roadmap — Prochaines fonctionnalités

### Phase 0 — UX Activation & Qualité (v1.4.0) ✅
- [x] **Onboarding 3 étapes** — ✅ Livré : formulaire simplifié + WHY callouts
- [x] **Checklist dashboard** — ✅ Livré : 9 étapes, auto-détection, ARIA, 30 jours
- [x] **Badges PRO sidebar** — ✅ Livré : 4 items + tooltip upgrade
- [x] **Settings > Enrichir mon profil** — ✅ Livré : score 0-100%, 4 jalons, API enrichment
- [x] **Error Boundaries** — ✅ Livré : 5 fichiers, toutes les routes couvertes
- [x] **Tests E2E Playwright** — ✅ Livré : 24 tests, 96% pass rate
- [x] **WCAG 2.1 AA** — ✅ Livré : skip-nav, aria-current, aria-live, focus-visible, htmlFor/id

### Phase 1 — Quick wins
- [x] **Notification email Daily Focus** — ✅ Livré : email 8h UTC tous les users PRO via `POST /api/cron/daily-focus`
- [x] **Rapport mensuel PDF** — ✅ Livré : `/api/reports/monthly` + email HTML + cron 1er du mois
- [x] **Wiki Lint** — ✅ Livré : `python/agents/wiki_lint.py` + cron chaque lundi
- [ ] **Silence Detector** — prospects sans contact > X jours → alerte Daily Focus
- [ ] **Cold Outreach Sequencer** — 3 messages personnalisés depuis fiche prospect

### Phase 2 — Croissance
- [ ] **Social Listening X** — monitor mots-clés via API X (secrets disponibles)
- [ ] **Content Amplifier** — LinkedIn post → Thread X + newsletter + story
- [ ] **Publication automatique X** — depuis page /content

### Phase 3 — Intelligence
- [ ] **ICP Finder** — analyse deals WON → suggest profils similaires via Pappers
- [ ] **Prospect Radar** — signaux achat via Pappers (levée fonds, recrutement)
- [ ] **Machine à preuves sociales** — deal WON → demande témoignage → post LinkedIn

### Améliorations modules existants
- [ ] **Cash** : graphique runway visuel (Recharts) + simulateur "What if"
- [ ] **Pipeline** : analyse victoires/pertes + forecast CA mensuel depuis pipeline
- [ ] **Content** : calendrier éditorial + feedback performance + banque d'idées
- [ ] **Chat** : actions directes inline + questions suggérées contextuelles
- [ ] **Tasks** : lien tâche ↔ prospect + tâches récurrentes

---

## 🔑 Secrets disponibles (via §§secret())

- `OPENROUTER_API_KEY` — LLM (OpenRouter)
- `X_BEARER_TOKEN`, `X_API_KEY`, `X_API_SECRET`, `X_ACCESS_TOKEN`, `X_ACCESS_SECRET` — Twitter/X API
- `BEEHIIV_API_KEY`, `BEEHIIV_PUBLICATION_ID` — Newsletter
- `LINKEDIN_ACCESS_TOKEN` — LinkedIn
- `GHITUB_API_KEY` — GitHub

---

## 📄 Fichiers de référence

- `/a0/usr/projects/business_ai_os/TODO.md` — **Roadmap et tâches restantes** (14 items, mis à jour v1.4.0)
- `/a0/usr/projects/business_ai_os/fonctionnalites_daily_focus.md` — Spec complète Daily Focus v2.0
- `/a0/usr/projects/business_ai_os/DOCUMENTATION_TECHNIQUE.md` — Doc technique générale (v1.2.0)
- `/a0/usr/projects/business_ai_os/Rapport de Tests Fonctionnels _ Brainlo.md` — Rapport QA fonctionnel (21/22 tests)
- `/a0/usr/projects/business_ai_os/business-ai-os/.env` — Variables d'environnement
- `/a0/usr/projects/business_ai_os/business-ai-os/prisma/schema.prisma` — Schéma DB complet
- `/a0/usr/projects/business_ai_os/business-ai-os/playwright.config.ts` — Configuration E2E Playwright
- `/a0/usr/projects/business_ai_os/business-ai-os/next.config.js` — Headers HTTP, CSP, HSTS, cache
