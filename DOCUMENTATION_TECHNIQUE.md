# Brainlo — Spécifications Techniques & Documentation

> Version : 1.4.0 | Date : 2026-05-26 | Statut : **MVP en production — Facturation électronique Factur-X**

---

## Table des matières

1. [Vision & Positionnement](#1-vision--positionnement)
2. [Stack Technique](#2-stack-technique)
3. [Architecture Globale](#3-architecture-globale)
4. [Structure du Projet](#4-structure-du-projet)
5. [Base de Données — Schéma Prisma](#5-base-de-données--schéma-prisma)
6. [API REST — Référence Complète](#6-api-rest--référence-complète)
7. [Agents Python](#7-agents-python)
8. [Système LLM Wiki (Pattern Karpathy)](#8-système-llm-wiki-pattern-karpathy)
9. [Intégrations Tierces](#9-intégrations-tierces)
10. [Plans & Fonctionnalités](#10-plans--fonctionnalités)
11. [Variables d'Environnement](#11-variables-denvironnement)
12. [Guide de Démarrage Développeur](#12-guide-de-démarrage-développeur)
13. [Décisions d'Architecture](#13-décisions-darchitecture)
14. [Conventions de Code](#14-conventions-de-code)
15. [Sécurité — Bibliothèques & Patterns](#15-sécurité--bibliothèques--patterns)
16. [Scheduler & Cron Jobs](#16-scheduler--cron-jobs)
17. [Changelog Technique](#17-changelog-technique)

---

## 1. Vision & Positionnement

### Concept

> *Un système d'exploitation d'entreprise piloté par l'IA. Un dashboard central où chaque fonction métier est gérée par un agent IA dédié. L'entrepreneur arrive, définit son entreprise, et les agents s'activent automatiquement sur ses priorités.*

**Brainlo** est un SaaS B2B proposant une suite d'agents IA interconnectés pour solopreneurs et PME (1–50 personnes). Contrairement aux outils verticaux (Notion pour les notes, Stripe pour les paiements, HubSpot pour le CRM), Brainlo centralise toutes les fonctions métier dans un seul OS, où les agents partagent le contexte en temps réel.

### Cible

| Segment | Profil | CA mensuel |
|---|---|---|
| **Solopreneur débutant** | Auto-entrepreneur, freelance démarrant | < 3k€/mois |
| **Solopreneur actif** | Consultant, freelance établi | 3k–15k€/mois |
| **Petite équipe** | Fondateur + 1–4 personnes | 15k–50k€/mois |
| **PME en croissance** | 5–20 personnes | 50k–200k€/mois |

### Différenciation clé

- **Interconnexion native** : le budget CFO influence les décisions CMO, les ventes CRO alimentent le forecast CFO
- **LLM Wiki** : mémoire persistante et croissante par utilisateur (pattern Karpathy)
- **Daily Focus** : 3 actions priorisées chaque matin, calculées sur données réelles
- **Saisie langage naturel** : "J'ai facturé Camille 1200€" → transaction créée automatiquement

---

## 2. Stack Technique

### Frontend

| Technologie | Version | Rôle |
|---|---|---|
| **Next.js** | 14 | Framework React avec App Router |
| **TypeScript** | 5.x | Typage statique |
| **Tailwind CSS** | 3.x | Styles utilitaires |
| **React** | 18 | UI composants |

### Backend

| Technologie | Version | Rôle |
|---|---|---|
| **Next.js API Routes** | 14 | REST API (Route Handlers) |
| **Python FastAPI** | 0.104+ | Microservice agents IA |
| **Prisma ORM** | 5.x | Accès base de données |
| **PostgreSQL** | 15+ | Base de données principale |

### IA & LLM

| Technologie | Rôle |
|---|---|
| **OpenRouter** | Gateway LLM unifiée |
| **Claude 3 Haiku** | Tâches rapides (catégorisation, OCR) |
| **GPT-4o / Claude Sonnet** | Tâches complexes (wiki, focus, relances) |
| **BM25 custom** | Recherche sémantique dans la wiki |

### Services tiers

| Service | Usage |
|---|---|
| **Stripe** | Abonnements, portail client, webhooks |
| **Resend** | Emails transactionnels |
| **Cal.com** | Prise de RDV, webhooks calendrier |

### Tooling Dev

| Outil | Rôle |
|---|---|
| `npm run dev` | Serveur Next.js (port 50082) |
| `uvicorn` | Serveur Python FastAPI (port 8000) |
| `npx prisma studio` | Interface admin BDD |
| `npx prisma migrate dev` | Migrations BDD |

---

## 3. Architecture Globale

```
┌─────────────────────────────────────────────────────────────────┐
│                        NAVIGATEUR CLIENT                        │
│              Next.js 14 — App Router — Tailwind CSS             │
└──────────────────────────────┬──────────────────────────────────┘
                               │ HTTP/HTTPS
┌──────────────────────────────▼──────────────────────────────────┐
│                    NEXT.JS API ROUTES (Edge)                    │
│  /api/auth  /api/cash  /api/pipeline  /api/focus  /api/tasks   │
│  /api/invoices  /api/quotes  /api/content  /api/chat  /api/wiki │
│  /api/knowledge  /api/calcom  /api/stripe  /api/assessment      │
└──────┬───────────────────────┬────────────────────────┬─────────┘
       │ Prisma Client         │ HTTP POST              │ Webhooks
┌──────▼──────┐   ┌───────────▼──────────┐   ┌────────▼─────────┐
│  PostgreSQL  │   │  PYTHON MICROSERVICE  │   │ Services Externes │
│  (Prisma)   │   │  FastAPI — port 8000  │   │ Stripe/Cal.com/  │
│             │   │                      │   │ Resend/LinkedIn   │
│  15 modèles │   │  7 agents IA Python  │   └──────────────────┘
└─────────────┘   └──────────┬───────────┘
                             │ OpenRouter API
                  ┌──────────▼───────────┐
                  │     OPENROUTER LLM    │
                  │  Claude / GPT-4o     │
                  └──────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      LLM WIKI (Filesystem)                      │
│            wiki-data/{userId}/ — Markdown files                 │
│     BRAIN.md | prospects/ | finance/ | business/ | content/    │
└─────────────────────────────────────────────────────────────────┘
```

### Flux de données principal

```
Utilisateur
    │ action (saisie, clic, brief NLP)
    ▼
Next.js Route Handler
    │ authentification JWT
    │ validation données
    ├─► Prisma → PostgreSQL (CRUD)
    ├─► lib/openrouter.ts (LLM direct)
    └─► Python FastAPI (agents complexes)
            │
            ├─► OpenRouter LLM
            └─► lib/wiki/ (LLM Wiki)
                    │
                    └─► wiki-data/{userId}


---

## 5. Base de Données — Schéma Prisma

### Modèles principaux

#### User
```prisma
model User {
  id              String   @id @default(cuid())
  email           String   @unique
  name            String
  passwordHash    String
  plan            String   @default("FREE")     // FREE | PRO
  stripeCustomerId String?
  businessName    String?
  sector          String?
  monthlyGoal     Float    @default(0)
  fixedCharges    Float    @default(0)
  linkedinUrl     String?
  // Cal.com
  calcomWebhookSecret String?
  calcomBookingUrl    String?
  // Infos légales (devis & factures)
  legalName       String?
  address         String?
  zipCode         String?
  city            String?
  country         String?  @default("France")
  siret           String?
  legalForm       String?  @default("Auto-entrepreneur")
  vatNumber       String?
  shareCapital    String?
  logoUrl         String?  // Base64 ou URL
  paymentTerms    Int?     @default(30)
  invoiceFooter   String?
  quoteCounter    Int      @default(0)
  invoiceCounter  Int      @default(0)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

#### Transaction
```prisma
model Transaction {
  id          String   @id @default(cuid())
  userId      String
  amount      Float
  type        String   // INCOME | EXPENSE
  category    String
  description String?
  date        DateTime
  createdAt   DateTime @default(now())
}
```

#### Prospect
```prisma
model Prospect {
  id              String    @id @default(cuid())
  userId          String
  name            String
  company         String?
  email           String?
  status          String    @default("IDENTIFIED")
  // IDENTIFIED | CONTACTED | INTERESTED | PROPOSAL | NEGOTIATION | WON | LOST
  value           Float     @default(0)
  lastContactDate DateTime?
  notes           String?
  lostReason      String?
  phone           String?
  // Enrichissement
  siret           String?
  linkedinUrl     String?
  position        String?
  enrichCity      String?
  enrichAddress   String?
  enrichZip       String?
  employeeRange   String?
  nafCode         String?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}
```

#### Task
```prisma
model Task {
  id               String    @id @default(cuid())
  userId           String
  title            String
  description      String?
  category         String    @default("ADMIN")   // CASH | CLIENTS | VISIBILITY | ADMIN
  status           String    @default("TODO")    // TODO | IN_PROGRESS | DONE | CANCELLED
  priority         String    @default("MEDIUM")  // HIGH | MEDIUM | LOW
  aiPriorityScore  Float?    // 0–100 score IA
  aiReason         String?   // Justification IA
  estimatedMinutes Int?
  dueDate          DateTime?
  linkedProspectId String?
  linkedInvoiceId  String?
  isRecurring      Boolean   @default(false)
  recurrenceType   String?   // NONE | DAILY | WEEKLY | MONTHLY_START | MONTHLY_END | QUARTERLY | CUSTOM
  recurrenceLabel  String?
  parentTaskId     String?
  completedAt      DateTime?
}
```

#### Quote / Invoice
```prisma
model Quote {
  id         String    @id @default(cuid())
  userId     String
  prospectId String?
  number     String    // DEVIS-2026-001
  status     String    @default("DRAFT")  // DRAFT | SENT | ACCEPTED | DECLINED | EXPIRED
  lines      String    // JSON [{title, description, qty, unitPrice, vatRate, unit}]
  subtotalHT Float     @default(0)
  totalVAT   Float     @default(0)
  totalTTC   Float     @default(0)
  validUntil DateTime?
  clientInfo String?   // JSON {name, address, zipCode, city, siret}
  notes      String?
  sentAt     DateTime?
  acceptedAt DateTime?
  invoiceId  String?
}

model Invoice {
  id            String    @id @default(cuid())
  userId        String
  prospectId    String?
  number        String    // FAC-2026-001
  status        String    @default("DRAFT")  // DRAFT | SENT | PAID | OVERDUE | CANCELLED
  lines         String    // JSON [{title, description, qty, unitPrice, vatRate, unit}]
  subtotalHT    Float     @default(0)
  totalVAT      Float     @default(0)
  totalTTC      Float     @default(0)
  dueDate       DateTime?
  notes         String?
  sentAt        DateTime?
  paidAt        DateTime?
  transactionId String?
}
```

#### AssessmentLead
```prisma
model AssessmentLead {
  id         String   @id @default(cuid())
  firstName  String
  lastName   String
  email      String
  answers    String   // JSON
  scores     String   // JSON sections
  totalScore Int
  roiData    String   // JSON ROI inputs
  synthesis  String   // Synthèse IA
  createdAt  DateTime @default(now())
}
```

### Enums (implémentés en String Prisma)

| Enum | Valeurs |
|---|---|
| `Plan` | `FREE`, `PRO` |
| `TransactionType` | `INCOME`, `EXPENSE` |
| `ProspectStatus` | `IDENTIFIED`, `CONTACTED`, `INTERESTED`, `PROPOSAL`, `NEGOTIATION`, `WON`, `LOST` |
| `TaskCategory` | `CASH`, `CLIENTS`, `VISIBILITY`, `ADMIN` |
| `TaskStatus` | `TODO`, `IN_PROGRESS`, `DONE`, `CANCELLED` |
| `TaskPriority` | `HIGH`, `MEDIUM`, `LOW` |
| `PostStatus` | `DRAFT`, `SCHEDULED`, `PUBLISHED` |
| `QuoteStatus` | `DRAFT`, `SENT`, `ACCEPTED`, `DECLINED`, `EXPIRED` |
| `InvoiceStatus` | `DRAFT`, `SENT`, `PAID`, `OVERDUE`, `CANCELLED` |
| `RecurrenceType` | `NONE`, `DAILY`, `WEEKLY`, `MONTHLY_START`, `MONTHLY_END`, `QUARTERLY`, `CUSTOM` |
| `CalendarEventStatus` | `CONFIRMED`, `CANCELLED`, `RESCHEDULED` |

---

## 6. API REST — Référence Complète

> Toutes les routes sont authentifiées par JWT via cookie `token` sauf mention contraire.
> Réponse d'erreur standard : `{ error: string }` avec code HTTP approprié.

### 🔐 Auth

#### `POST /api/auth/register`
```json
// Body
{ "name": "Jean Dupont", "email": "jean@mail.com", "password": "motdepasse" }
// Response 201
{ "user": { "id": "...", "email": "...", "name": "..." }, "token": "..." }
```

#### `POST /api/auth/login`
```json
// Body
{ "email": "jean@mail.com", "password": "motdepasse" }
// Response 200 — Pose cookie httpOnly "token"
{ "user": { "id": "...", "email": "...", "plan": "FREE" } }
```

#### `POST /api/auth/logout`
```json
// Response 200 — Efface cookie token
{ "success": true }
```

#### `GET /api/auth/me`
```json
// Response 200
{ "id": "...", "email": "...", "name": "...", "plan": "PRO", "businessName": "..." }
```

#### `PUT /api/auth/profile`
```json
// Body (champs optionnels)
{
  "name": "...", "businessName": "...", "sector": "...",
  "monthlyGoal": 5000, "fixedCharges": 1200,
  "linkedinUrl": "...", "legalName": "...",
  "address": "...", "zipCode": "...", "city": "...",
  "siret": "...", "legalForm": "Auto-entrepreneur",
  "paymentTerms": 30, "invoiceFooter": "..."
}
// Response 200
{ "user": { ...updatedUser } }
```

#### `POST /api/auth/change-password`
```json
// Body
{ "currentPassword": "...", "newPassword": "..." }
// Response 200
{ "success": true }
```

#### `POST /api/auth/reset-password`
```json
// Body
{ "email": "jean@mail.com" }
// Response 200 — Envoie email via Resend
{ "success": true }
```

---

### 💰 Cash

#### `GET /api/cash/transactions`
```json
// Query params optionnels: ?month=2026-05&type=INCOME
// Response 200
{ "transactions": [ { "id": "...", "amount": 1200, "type": "INCOME", "category": "Consulting", "date": "2026-05-01" } ] }
```

#### `POST /api/cash/transactions`
```json
// Body
{ "amount": 1200, "type": "INCOME", "category": "Consulting", "description": "Mission Alpha", "date": "2026-05-01" }
// Response 201
{ "transaction": { ...created } }
```

#### `GET /api/cash/runway`
```json
// Response 200
{
  "currentBalance": 8400,
  "avgMonthlyExpenses": 2100,
  "scenarios": {
    "pessimistic": { "months": 2, "date": "2026-07-15" },
    "realistic": { "months": 4, "date": "2026-09-15" },
    "optimistic": { "months": 7, "date": "2026-12-15" }
  }
}
```

#### `GET /api/cash/recurrences`
```json
// Response 200 — détection automatique des charges récurrentes (90 derniers jours)
{ "suggestions": [ { "description": "Loyer bureau", "category": "Loyer & Bureau", "type": "EXPENSE", "avgAmount": 400, "occurrences": 3, "label": "Mensuel" } ] }
```

#### `POST /api/cash/recurrences`
```json
// Body — enregistrement manuel d'une charge récurrente
{
  "description": "Loyer bureau coworking",
  "category": "Loyer & Bureau",
  "type": "EXPENSE",
  "amount": 400,
  "label": "Mensuel"
}
// Response 201 — transaction créée avec préfixe [Mensuel] dans la description
{ "transaction": { "id": "cuid...", "description": "[Mensuel] Loyer bureau coworking", "amount": 400 } }
// ⚠️ Note : les champs isRecurring/recurrenceLabel ne sont pas dans le schéma Prisma.
// Le label est encodé dans la description avec le format [Label] Description.
```

#### `POST /api/cash/categorize` *(IA)*
```json
// Body
{ "description": "Abonnement Figma", "type": "EXPENSE" }
// Response 200
{ "category": "Logiciels & SaaS" }
```

#### `POST /api/cash/ocr` *(IA)*
```json
// Body: multipart/form-data avec image (imageBase64 + mimeType)
// Response 200
{ "amount": 45.50, "category": "Repas", "description": "Restaurant client", "date": "2026-05-10" }
// Response 422 — image illisible ou rejetée par le modèle LLM Vision
{ "error": "Erreur LLM Vision — image illisible ou résolution insuffisante" }
// ⚠️ Note : utiliser une image réelle et lisible (photo ticket, reçu). Une image synthétique retourne 422.
```

#### `POST /api/cash/parse-brief` *(IA)*
```json
// Body
{ "brief": "J'ai facturé Camille 1200€ pour la mission de mars" }
// Response 200
{ "amount": 1200, "type": "INCOME", "category": "Consulting", "description": "Mission mars — Camille", "date": "2026-05-15" }
```

---

### 👥 Pipeline CRM

#### `GET /api/pipeline/prospects`
```json
// Response 200
{ "prospects": [ { "id": "...", "name": "...", "status": "INTERESTED", "value": 3000 } ] }
```

#### `POST /api/pipeline/prospects`
```json
// Body
{ "name": "Marie Dupont", "company": "TechCorp", "email": "marie@tech.com", "value": 2500, "status": "IDENTIFIED" }
// ⚠️ Plan FREE : limité à 3 prospects max
// Response 402 — limite atteinte
{ "error": "Limite de 3 prospects atteinte sur le plan gratuit", "upgradeRequired": true }
```

#### `GET /api/pipeline/prospects/[id]`
```json
// Response 200
{ "prospect": { "id": "...", "name": "Marie Dupont", "status": "INTERESTED", "value": 3000 } }
// Response 404 — prospect inexistant ou appartenant à un autre utilisateur (isolation userId)
{ "error": "Prospect introuvable" }
```

#### `PATCH /api/pipeline/prospects/[id]`
```json
// Body — mise à jour partielle
{ "status": "WON" }
```

#### `DELETE /api/pipeline/prospects/[id]`
```json
// Response 200
{ "success": true }
```

#### `POST /api/pipeline/enrich` *(IA)*
```json
// Body
{ "prospectId": "...", "name": "Marie Dupont", "company": "TechCorp" }
// Response 200
{ "siret": "...", "position": "CEO", "employeeRange": "10-50", "nafCode": "6201Z", "linkedinUrl": "..." }
```

#### `POST /api/pipeline/relance` *(IA)*
```json
// Body
{ "prospectId": "cuid..." }
// Response 200
{ "message": "Bonjour Marie, suite à notre échange du 28 mars..." }
```

#### `POST /api/pipeline/parse-brief` *(IA)*
```json
// Body
{ "brief": "Nouveau prospect : Lucas Martin, fondateur de DataFlow, intéressé par une mission à 4000€" }
// Response 200
{ "name": "Lucas Martin", "company": "DataFlow", "value": 4000, "status": "INTERESTED" }

#### `GET /api/focus`
```json
// Response 200 — retourne le focus du jour (génère si absent)
{
  "focus": {
    "id": "...",
    "date": "2026-05-15",
    "actions": [
      { "priority": 1, "action": "Relancer Camille (devis 890€, 11j sans réponse)", "context": "pipeline", "why": "Bloque 890€ de CA" },
      { "priority": 2, "action": "Facturer Client B (mission terminée)", "context": "cash", "why": "Déclenche paiement immédiat" },
      { "priority": 3, "action": "Publier post LinkedIn rédigé", "context": "content", "why": "Visibilité hebdo" }
    ],
    "statuses": ["pending", "pending", "pending"]
  }
}
```

#### `POST /api/focus`
```json
// Body — mettre à jour le statut d'une action
{ "actionIndex": 0, "status": "done" }
```

#### `GET /api/focus/score`
```json
// Response 200
{ "score": 73, "label": "Bonne journée", "actionsCompleted": 2, "actionsTotal": 3 }
```

#### `GET /api/focus/streak`
```json
// Response 200
{ "streak": 5, "lastFocusDate": "2026-05-14", "message": "5 jours consécutifs !" }
```

#### `GET /api/focus/history`
```json
// Response 200
{ "history": [ { "date": "2026-05-14", "score": 100, "actionsCompleted": 3 } ] }
```

---

### ✅ Tâches

#### `GET /api/tasks`
```json
// Query: ?status=TODO&category=CASH
{ "tasks": [ { "id": "...", "title": "...", "category": "CASH", "status": "TODO", "priority": "HIGH", "aiPriorityScore": 87.5 } ] }
```

#### `POST /api/tasks`
```json
// Body
{
  "title": "Relancer Camille", "category": "CLIENTS", "priority": "HIGH",
  "estimatedMinutes": 15, "dueDate": "2026-05-16",
  "linkedProspectId": "cuid..."
}
```

#### `PUT /api/tasks/[id]`
```json
// Body (champs optionnels)
{ "status": "DONE", "completedAt": "2026-05-15T10:30:00Z" }
```

#### `DELETE /api/tasks/[id]`
```json
// Response 200
{ "success": true }
```

#### `POST /api/tasks/prioritize` *(IA)*
```json
// Body — liste d'IDs à scorer
{ "taskIds": ["id1", "id2", "id3"] }
// Response 200
{ "scores": [ { "id": "id1", "score": 92.5, "reason": "Bloque 3 deals en cours" } ] }
```

#### `POST /api/tasks/parse-brief` *(IA)*
```json
// Body
{ "brief": "Préparer la proposition commerciale pour TechCorp avant vendredi" }
// Response 200
{ "title": "Proposition commerciale TechCorp", "category": "CLIENTS", "priority": "HIGH", "dueDate": "2026-05-16", "estimatedMinutes": 60 }
```

---

### 📄 Devis & Factures

#### `GET /api/quotes`
```json
{ "quotes": [ { "id": "...", "number": "DEVIS-2026-001", "status": "DRAFT", "totalTTC": 2400 } ] }
```

#### `POST /api/quotes`
```json
// Body
{
  "prospectId": "cuid...",
  "lines": [ { "title": "Consulting", "qty": 3, "unitPrice": 800, "vatRate": 20 } ],
  "validUntil": "2026-06-15",
  "clientInfo": { "name": "TechCorp", "address": "1 rue de Paris", "zipCode": "75001", "city": "Paris" }
}
// ⚠️ Plan FREE : limité à 3 devis max
// Response 402 — limite atteinte
{ "error": "Limite de 3 devis atteinte sur le plan gratuit", "upgradeRequired": true }
```

#### `POST /api/quotes/parse-brief` *(IA)*
```json
// Body
{ "brief": "Devis pour 3 jours de consulting à 800€/j HT pour TechCorp" }
// Response 200
{ "lines": [ { "title": "Consulting", "qty": 3, "unitPrice": 800, "vatRate": 20 } ], "subtotalHT": 2400, "totalTTC": 2880 }
```

#### `GET /api/quotes/[id]`
```json
// Response 200
{ "id": "cuid...", "number": "DEVIS-2026-001", "status": "DRAFT", "totalTTC": 2880, "lines": [...] }
// Response 404 — devis inexistant ou appartenant à un autre utilisateur
{ "error": "Devis introuvable" }
```

#### `PATCH /api/quotes/[id]`
```json
// Body — mise à jour statut ou lignes
{ "status": "ACCEPTED", "acceptedAt": "2026-05-17T10:00:00Z" }
// Response 200
{ "id": "cuid...", "status": "ACCEPTED", "acceptedAt": "2026-05-17T10:00:00.000Z" }
```

#### `DELETE /api/quotes/[id]`
```json
// Response 200 — suppression (uniquement si statut DRAFT)
{ "success": true }
// Response 404 — devis inexistant ou autre utilisateur
{ "error": "Devis introuvable" }
```

#### `GET /api/invoices`
```json
{ "invoices": [ { "id": "...", "number": "FAC-2026-001", "status": "SENT", "totalTTC": 2880, "dueDate": "2026-06-15" } ] }
```

#### `POST /api/invoices`
```json
// Body (même structure que quote)
{ "prospectId": "...", "lines": [...], "dueDate": "2026-06-15", "notes": "Paiement 30j" }
// Conversion depuis un devis accepté
{ "fromQuoteId": "cuid..." }
// ⚠️ Si clientInfo présent sans prospectId, un Prospect est créé automatiquement (status WON)
```

#### `GET /api/invoices/[id]/facturx` *(Facturation électronique)*
```json
// Response 200 — PDF binaire Factur-X BASIC (application/pdf)
// Content-Disposition: attachment; filename="FAC-2026-001-facturx.pdf"
// Le PDF contient un fichier XML CII EN 16931 embarqué (factur-x.xml)

// Response 404 — facture inexistante ou autre utilisateur
{ "error": "Not found" }

// Response 500 — erreur de génération Python
{ "error": "Erreur génération Factur-X: ..." }
```

> **Prérequis pour XML valide** : l'utilisateur doit avoir renseigné SIRET et adresse complète dans son profil.

---

### 📝 Contenu LinkedIn

#### `POST /api/content/generate` *(IA)*
```json
// Body
{ "topic": "automatisation", "postType": "insight", "tone": "expert" }
// Response 200
{ "content": "🤖 J'ai automatisé 80% de ma gestion client en 3 mois...\n\n[post complet]" }
```

#### `GET /api/content/posts`
```json
{ "posts": [ { "id": "...", "content": "...", "status": "DRAFT", "postType": "insight", "impressions": 0 } ] }
```

#### `PUT /api/content/posts` 
```json
// Body
{ "id": "...", "status": "PUBLISHED", "publishedAt": "2026-05-15T09:00:00Z", "impressions": 1240 }
```

---

### 🧠 Wiki LLM

#### `POST /api/wiki/ingest`
```json
// Body
{ "eventType": "prospect_added", "data": { "name": "Marie Dupont", "company": "TechCorp", "value": 3000 } }
// Response 200
{ "pagesUpdated": ["prospects/marie-dupont.md", "log.md", "index.md"] }
```

#### `POST /api/wiki/query`
```json
// Body
{ "query": "Qui sont mes meilleurs clients ?", "maxPages": 5 }
// Response 200
{
  "answer": "D'après votre wiki...",
  "pages": [ { "path": "business/icp.md", "score": 0.87 } ]
}
```

---

### 📚 Base de Connaissance

#### `GET /api/knowledge`
```json
{ "documents": [ { "id": "...", "name": "Présentation Alpha", "fileType": "pdf", "status": "INDEXED", "pageCount": 12 } ] }
```

#### `POST /api/knowledge/file`
```json
// multipart/form-data: file + category
// Formats supportés : .pdf, .docx, .pptx, .xlsx, .txt, .md
// Response 201
{ "document": { "id": "...", "status": "PROCESSING" } }
// Response 400 — format non supporté
{ "error": "Format non supporté. Acceptés: .pdf, .docx, .pptx, .xlsx, .txt, .md" }
```

#### `DELETE /api/knowledge/[id]`
```json
// Response 200 — suppression du document et du fichier wiki associé
{ "success": true }
// Response 404 — document inexistant ou appartenant à un autre utilisateur
{ "error": "Document introuvable" }
```

---

### 📅 Cal.com

#### `GET /api/calcom/events`
```json
{ "events": [ { "id": "...", "title": "Call TechCorp", "startTime": "2026-05-16T10:00:00Z", "attendeeName": "Marie Dupont" } ] }
```

#### `POST /api/calcom/webhook`
```json
// Reçoit événements Cal.com (HMAC vérifié)
// triggerEvent: BOOKING_CREATED | BOOKING_CANCELLED | BOOKING_RESCHEDULED
// Response 200
{ "received": true }
```

---

### 🎓 Assessment

#### `POST /api/assessment`
```json
// Body
{
  "firstName": "Jean", "lastName": "Dupont", "email": "jean@mail.com",
  "answers": [ { "questionId": "q1", "value": 3 } ],
  "roiData": { "currentRevenue": 3000, "timeWastedHours": 10 }
}
// Response 201
{
  "totalScore": 67,
  "sections": { "cash": 72, "clients": 58, "visibility": 71 },
  "synthesis": "Votre principal levier de croissance est...",
  "roiEstimate": { "monthly": 1200, "annual": 14400 }
}
```

---

## 7. Agents Python

> Microservice FastAPI tournant sur **port 8000**. Toutes les routes acceptent du JSON et retournent du JSON.

### Structure FastAPI (`python/main.py`)

```python
# Routes exposées
POST /focus/generate      → daily_focus.py
POST /tasks/prioritize    → task_prioritizer.py
POST /wiki/ingest         → wiki_ingest.py
POST /wiki/query          → wiki_query.py
POST /knowledge/extract   → kb_extract.py
POST /content/linkedin    → linkedin_gen.py
POST /pipeline/relance    → relance_gen.py
POST /facturx/generate    → facturx_gen.py
```

### Agent `facturx_gen.py`

**Rôle** : Génère des PDF Factur-X hybrides (PDF + XML CII EN 16931 embarqué) pour la facturation électronique française et européenne.

**Librairies** : `factur-x` (embed XML), `weasyprint` (HTML→PDF), `lxml` (génération XML)

**Input** (`POST /facturx/generate`) :
```json
{
  "invoice": {
    "id": "cuid...",
    "number": "FAC-2026-001",
    "status": "SENT",
    "lines": [ { "title": "Consulting", "qty": 2, "unitPrice": 500, "vatRate": 20 } ],
    "subtotalHT": 1000, "totalVAT": 200, "totalTTC": 1200,
    "createdAt": "2026-05-25T10:00:00Z",
    "dueDate": "2026-06-24T10:00:00Z",
    "prospect": { "name": "Jean Dupont", "company": "Acme SAS", "email": "jean@acme.fr" }
  },
  "seller": {
    "legalName": "Marie Martin Consulting",
    "siret": "12345678901234",
    "vatNumber": "FR12345678901",
    "address": "12 rue de la Paix", "zipCode": "75001", "city": "Paris"
  }
}
```

**Output** : PDF binaire (`application/pdf`) contenant :
- Rendu visuel HTML (mise en page identique à la page print)
- Fichier `factur-x.xml` embarqué dans le PDF (PDF/A-3)
- XML conforme CII UN/CEFACT, profil `urn:factur-x.eu:1p0:basic`
- TypeCode `380` (facture commerciale)

**Profil Factur-X** : `BASIC` — contient les lignes de détail, taux TVA par ligne, totaux, infos vendeur/acheteur avec SIRET.

**Performances** : génération en ~0.02 sec, PDF ~42 Ko.

---

### Agent `daily_focus.py`

**Rôle** : Génère le plan journalier priorisé (3 actions max)

**Inputs** :
```json
{
  "userId": "...",
  "transactions": [...],
  "prospects": [...],
  "posts": [...],
  "tasks": [...],
  "monthlyGoal": 5000,
  "currentBalance": 3240,
  "wikiContext": "...contenu BRAIN.md + pages pertinentes..."
}
```

**Prompt LLM** : Analyse la situation financière, commerciale et visibilité, génère exactement 3 actions priorisées selon règle : Cash bloque → Clients en danger → Visibilité à maintenir.

**Output** :
```json
{
  "actions": [
    { "priority": 1, "action": "...", "context": "cash|clients|visibility", "why": "..." }
  ]
}
```

---

### Agent `task_prioritizer.py`

**Rôle** : Score IA (0–100) pour chaque tâche + justification

**Logic** : Analyse les dépendances métier (tâche liée à prospect → + 20pts, tâche bloquante → + 30pts), la date d'échéance et la catégorie.

**Output** :
```json
{ "scores": [ { "id": "...", "score": 87.5, "reason": "Bloque 3 deals en cours" } ] }
```

---

### Agent `wiki_ingest.py`

**Rôle** : Convertit les événements business en updates wiki Markdown

**Événements supportés** :

| Event Type | Pages mises à jour |
|---|---|
| `prospect_added` | `prospects/{nom}.md`, `log.md`, `index.md` |
| `deal_won` | `business/icp.md`, `business/messages.md`, `log.md` |
| `deal_lost` | `business/risks.md`, `prospects/{nom}.md`, `log.md` |
| `transaction_added` | `finance/patterns.md`, `log.md` |
| `relance_sent` | `prospects/{nom}.md`, `log.md` |
| `post_published` | `content/what-works.md`, `log.md` |
| `booking_created` | `prospects/{nom}.md`, `log.md` |

**Pattern** : Lit la page existante → prompt LLM "merge/update" → écrit via `wiki/writer.ts`

---

### Agent `wiki_query.py`

**Rôle** : Recherche sémantique BM25 dans le wiki utilisateur

**Algorithm** : BM25 (K1=1.5, B=0.75) sur toutes les pages Markdown de `wiki-data/{userId}
 plus pertinentes → contexte enrichi pour le LLM

---

### Agent `kb_extract.py`

**Rôle** : Extraction texte depuis documents uploadés

**Formats supportés** : PDF, DOCX, PPTX, TXT, MD

**Étapes** :
1. Réception fichier binaire encodé base64
2. Décodage + détection format via extension
3. Extraction texte (`pdfplumber` pour PDF, `python-docx` pour DOCX, `python-pptx` pour PPTX)
4. Sauvegarde texte brut dans `wiki-data/{userId}/knowledge/{filename}.txt`
5. Mise à jour statut `KnowledgeDocument` → `INDEXED`

---

### Agent `linkedin_gen.py`

**Rôle** : Génération de posts LinkedIn contextualisés

**Types de posts** :

| Type | Format | Longueur |
|---|---|---|
| `insight` | Point de vue expert | 800–1200 chars |
| `victory` | Victoire client (anonymisée) | 600–900 chars |
| `learning` | Apprentissage récent | 700–1000 chars |
| `tip` | Conseil pratique (liste) | 500–800 chars |

**Context injecté** : `content/what-works.md` + `business/icp.md` pour adapter le ton

---

### Agent `relance_gen.py`

**Rôle** : Génération de messages de relance prospect

**Context injecté** : Page prospect `prospects/{nom}.md` + `business/messages.md`

**Output** : Message prêt à copier/envoyer, ton adapté à l'étape du pipeline

| Étape | Ton du message |
|---|---|
| `CONTACTED` | Chaleureux, rappel contexte initial |
| `INTERESTED` | Focus valeur, réduction friction |
| `PROPOSAL` | Urgence douce, levée d'objection |
| `NEGOTIATION` | Direct, option alternative si besoin |

---

## 8. Système LLM Wiki (Pattern Karpathy)

### Concept fondamental

> Au lieu de re-dériver la connaissance à chaque question (RAG classique), le LLM **construit et maintient une wiki persistante** — un artefact vivant qui se compound dans le temps. Chaque action utilisateur enrichit la mémoire collective de son entreprise.

### Structure de la wiki par utilisateur

```
wiki-data/{userId}/
├── BRAIN.md                    # Schéma maître : ICP + objectifs + conventions + profil
├── index.md                    # Index de toutes les pages (mis à jour automatiquement)
├── log.md                      # Journal append-only chronologique (toutes les actions)
├── prospects/
│   └── {prenom-nom}.md         # 1 page par prospect (contexte + historique + signaux)
├── business/
│   ├── icp.md                  # Profil client idéal (affiné à chaque deal WON/LOST)
│   ├── patterns.md             # Saisonnalité, cycles, tendances identifiées
│   ├── messages.md             # Messages qui convertissent vs échouent
│   └── risks.md                # Risques identifiés (blocages, objections récurrentes)
├── finance/
│   ├── patterns.md             # Patterns financiers récurrents
│   └── clients.md              # DSO, fiabilité paiement par client
└── content/
    ├── what-works.md           # Formats et sujets avec meilleur engagement
    ├── competitors.md          # Intelligence concurrentielle
    └── ideas-bank.md           # Banque d'idées contenu
```

### Les 3 opérations wiki

| Opération | Déclencheur | Implémentation |
|---|---|---|
| **Ingest** | Chaque action utilisateur significative | `lib/wiki/ingest.ts` → `wiki_ingest.py` |
| **Query** | Avant chaque réponse LLM complexe | `lib/wiki/query.ts` → BM25 search |
| **Lint** | Tâche cron hebdomadaire | Vérification cohérence, pages périmées |

### Événements déclencheurs d'ingestion

| Événement | Pages mises à jour |
|---|---|
| `prospect_added` | `prospects/{nom}.md`, `log.md`, `index.md` |
| `prospect_status_changed` | `prospects/{nom}.md`, `log.md` |
| `deal_won` | `business/icp.md`, `business/messages.md`, `log.md` |
| `deal_lost` | `business/risks.md`, `prospects/{nom}.md`, `log.md` |
| `transaction_added` | `finance/patterns.md`, `log.md` |
| `relance_sent` | `prospects/{nom}.md`, `log.md` |
| `post_published` | `content/what-works.md`, `log.md` |
| `booking_created` | `prospects/{nom}.md`, `log.md` |
| `invoice_paid` | `finance/clients.md`, `log.md` |

### Algorithme BM25 (lib/wiki/query.ts)

```typescript
// Paramètres
const K1 = 1.5;  // saturation des termes
const B = 0.75;  // normalisation longueur

// Flux
// 1. Tokenisation query (stopwords FR/EN retirés)
// 2. Lecture de toutes les pages wiki du userId
// 3. Calcul score BM25 pour chaque page
// 4. Retour Top-N pages (défaut: 5)
// 5. Injection dans le prompt LLM comme contexte
```

### Exemple de page BRAIN.md

```markdown
# 🧠 Business Brain — [Prénom]

## Identité entreprise
- Nom : Freelance Design Studio
- Secteur : Design UX/UI
- Forme juridique : Auto-entrepreneur

## Objectifs
- CA mensuel cible : 5 000€
- Charges fixes : 1 200€/mois
- Objectif runway : 3 mois minimum

## ICP (Client Idéal)
- Startups SaaS B2B, 10–50 salariés
- Budget design : 2 000–8 000€/mission
- Décideur : CEO ou CPO direct
- Canal acquisition : LinkedIn (inbound)

## Conventions
- Devise : EUR
- Délai paiement : 30 jours
- TVA : non assujetti (AE)
```

---

## 9. Intégrations Tierces

### Stripe

```typescript
// lib/stripe.ts
import Stripe from 'stripe';
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Plans configurés
// SOLO_PRO → price_xxx (29€/mois)
// STARTER_PME → price_xxx (149€/mois)
// PME_GROWTH → price_xxx (349€/mois)
```

| Webhook Event | Action |
|---|---|
| `checkout.session.completed` | Active le plan, met à jour `user.plan` et `user.stripeCustomerId` |
| `customer.subscription.deleted` | Rétrograde vers `FREE` |
| `invoice.payment_failed` | Email alerte via Resend |

### Cal.com

```typescript
// Validation webhook HMAC-SHA256
// Header: X-Cal-Signature-256
// Vérification avec user.calcomWebhookSecret

// Events traités :
// BOOKING_CREATED   → crée CalendarEvent + ingeste wiki
// BOOKING_CANCELLED → met à jour CalendarEvent status=CANCELLED
// BOOKING_RESCHEDULED → met à jour CalendarEvent dates
```

### OpenRouter (lib/openrouter.ts)

```typescript
// Client unifié pour tous les appels LLM
export async function callLLM({
  model,      // 'anthropic/claude-3-haiku' | 'openai/gpt-4o'
  messages,   // ChatMessage[]
  temperature // 0.0 → 1.0
}

WIKI_BASE_PATH=./wiki-data

# ─── Cal.com ────────────────────────────────────────────────────
# Configuré par utilisateur dans Settings
# CALCOM_WEBHOOK_SECRET → stocké en base par user (user.calcomWebhookSecret)
```

> ⚠️ Ne jamais commiter le fichier `.env`. Utiliser `.env.example` comme référence.

---

## 12. Guide de Démarrage Développeur

### Prérequis

```bash
node >= 18.x
npm >= 9.x
python >= 3.11
pip >= 23.x
postgresql >= 15 (ou SQLite pour dev local)
```

### Installation complète

```bash
# 1. Cloner et naviguer
cd /a0/usr/projects/business_ai_os/brainlo

# 2. Dépendances Node.js
npm install

# 3. Variables d'environnement
cp .env.example .env
# Éditer .env avec vos clés

# 4. Générer le client Prisma
npx prisma generate

# 5. Appliquer les migrations
npx prisma migrate dev --name init

# 6. Démarrer Next.js (port 50082)
npm run dev -- -p 50082

# 7. [Nouveau terminal] Dépendances Python
cd python
pip install -r requirements.txt

# 8. Démarrer le microservice Python
uvicorn main:app --reload --port 8000
```

### Commandes utiles

```bash
# Prisma Studio (admin BDD visuel)
npx prisma studio

# Reset complet de la BDD
npx prisma migrate reset

# Générer une migration après modif schema.prisma
npx prisma migrate dev --name description_changement

# Voir les logs Next.js
tail -f /a0/usr/projects/business_ai_os/nextjs.out.log

# Voir les logs Python
tail -f /a0/usr/projects/business_ai_os/python.out.log

# Tester l'API Python directement
curl -X POST http://localhost:8000/focus/generate \
  -H 'Content-Type: application/json' \
  -d '{"userId": "test", "transactions": [], "prospects": []}'
```

### Workflow d'ajout d'une feature

```
1. Modifier prisma/schema.prisma si nouveau modèle
   → npx prisma migrate dev --name feature_name
   → npx prisma generate

2. Créer l'API Route dans app/api/{module}/route.ts
   → Authentification JWT obligatoire (await getUser(request))
   → Validation du body
   → Appel Prisma ou lib/openrouter.ts
   → Retour JSON avec code HTTP approprié

3. Si agent IA complexe → créer python/agents/{agent}.py
   → Ajouter la route dans python/main.py
   → Appeler depuis la Next.js route via fetch(PYTHON_AGENT_URL)

4. Créer/modifier le composant React dans components/
   → Utiliser les composants ui/ (Button, Card, Badge, Input)
   → Appels API via fetch('/api/...')

5. Tester manuellement via l'interface
6. Vérifier les logs des deux serveurs
```

### Structure d'une API Route typique

```typescript
// app/api/module/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  // 1. Authentification
  const user = await getUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // 2. Guard plan si feature PRO
  if (user.plan === 'FREE') {
    return NextResponse.json({ error: 'PRO required' }, { status: 403 });
  }

  try {
    // 3. Logique métier
    const data = await db.model.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    // 4. Déclencher ingestion wiki si nécessaire
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/wiki/ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', cookie: request.headers.get('cookie') || '' },
      body: JSON.stringify({ eventType: 'action_done', data: { userId: user.id } }),
    });

    // 5. Retour
    return NextResponse.json({ data });
  } catch (error) {
    console.error('[module/GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await getUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  // Validation...

  const record = await db.model.create({
    data: { userId: user.id, ...body },
  });

  return NextResponse.json({ record }, { status: 201 });
}
```

### Structure d'un Agent Python typique

```python
# python/agents/mon_agent.py
from typing import Any
import httpx
import os
import json

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
MODEL = os.getenv("OPENROUTER_MODEL", "anthropic/claude-3-haiku")

async def run(data: dict[str, Any]) -> dict[str, Any]:
    """Point d'entrée de l'agent."""
    
    # 1. Préparer le contexte
    context = build_context(data)
    
    # 2. Appel LLM
    response = await call_llm(
        system="Tu es un expert...",
        user=f"Données : {context}\n\nTâche : ..."
    )
    
    # 3. Parser le JSON retourné par le LLM
    result = json.loads(response)
    return result

async def call_llm(system: str, user: str) -> str:
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={"Authorization": f"Bearer {OPENROUTER_API_KEY}"},
            json={
                "model": MODEL,
                "messages": [
                    {"role": "system", "content": system},
                    {"role": "user", "content": user}
                ],
                "response_format": {"type": "json_object"}
            },
            timeout=30.0
        )
        return resp.json()["choices"][0]["message"]["content"]
```

---

## 13. Décisions d'Architecture

### ADR-001 : Saisie manuelle volontaire (Solo Pro)

**Contexte** : Faut-il imposer une connexion bancaire automatique ?  
**Décision** : Non — saisie manuelle pour le MVP Solo Pro  
**Raisons** :
- Réduction friction onboarding (pas d'OAuth bancaire)
- Connexion bancaire = datasource critique de confiance
- L'utilisateur saisit = il comprend ses chiffres
- Ajout connexion bancaire prévu dans Starter PME (149€)

---

### ADR-002 : 3 actions maximum dans le Daily Focus

**Contexte** : Combien d'actions IA recommander par jour ?  
**Décision** : Maximum 3, toujours dans l'ordre Cash → Clients → Visibilité  
**Raisons** :
- Psychologie : trop d'actions → paralysie
- Forcer la priorisation IA = valeur différenciante
- Règle métier : cash bloque toujours, clients ensuite, visibilité si possible

---

### ADR-003 : LLM Wiki dès le premier jour

**Contexte** : Quand activer la mémoire LLM Wiki ?  
**Décision** : Dès l'inscription, à chaque action  
**Raisons** :
- La mémoire se compound → plus de valeur avec le temps
- Churn réduit si la mémoire est "personnelle"
- Pattern Karpathy : supérieur au RAG classique pour contexte persistant

---

### ADR-004 : Python microservice séparé

**Contexte** : Les agents IA dans Next.js ou Python ?  
**Décision** : Python FastAPI séparé sur port 8000  
**Raisons** :
- Agents complexes bénéficient de l'écosystème Python (pdfplumber, docx, etc.)
- Isolation : un agent planté ne crash pas le frontend
- Scalabilité indépendante
- Facilité de debug des prompts LLM

---

### ADR-005 : JWT custom, pas Clerk

**Contexte** : Quel système d'auth utiliser ?  
**Décision** : JWT custom avec `jose` + cookie httpOnly  
**Raisons** :
- Pas de dépendance externe payante pour le MVP
- Contrôle total sur le payload (userId, plan, etc.)
- Cookie httpOnly → CSRF protection native
- Migration vers Clerk possible plus tard si besoin

---

### ADR-006 : BM25 custom, pas de vector DB

**Contexte** : Comment faire la recherche dans la wiki ?  
**Décision** : BM25 (K1=1.5, B=0.75) sur fichiers Markdown locaux  
**Raisons** :
- Pas de coût d'infrastructure (pas de Pinecone, Qdrant...)
- Excellent pour du texte Markdown structuré
- Simplicité : pas de pipeline d'embedding à maintenir
- Migration vers vector DB possible à l'échelle PME

---

### ADR-007 : Filesystem wiki, pas BDD

**Contexte** : Stocker les pages wiki en BDD ou fichiers ?  
**Décision** : Fichiers Markdown sur filesystem (`wiki-data/{userId}/`)  
**Raisons** :
- Lisibilité humaine directe
- Le LLM peut écrire du Markdown naturellement
- Pas de migrations BDD pour chaque mise à jour de structure
- Backup simple (rsync, S3)
- Pattern Karpathy : pensé pour des fichiers texte

---

## 14. Conventions de Code

### TypeScript / Next.js

```typescript
// ✅ Nommage des fichiers
app/api/cash/transactions/route.ts  // kebab-case pour routes
components/dashboard/CashWidget.tsx  // PascalCase pour composants
lib/openrouter.ts                    // camelCase pour libs

// ✅ Types explicites
interface Transaction {
  id: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  date: Date;
}

// ✅ Erreurs loguées avec contexte
catch (error) {
  console.error('[cash/transactions/POST]', error);
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}

// ✅ Authentification en début de route
const user = await getUser(request);
if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

// ✅ userId toujours filtré en BDD
await db.transaction.findMany({ where: { userId: user.id } });
```

### Python

```python
# ✅ Async partout (FastAPI)
async def run(data: dict) -> dict:
    ...

# ✅ Types annotés
from typing import Any
async def call_llm(system: str, user: str) -> str:
    ...

# ✅ Timeout sur tous les appels HTTP
async with httpx.AsyncClient(timeout=30.0) as client:
    ...

# ✅ JSON strict dans les prompts LLM
"response_format": {"type": "json_object"}

# ✅ Logging
import logging
logger = logging.getLogger(__name__)
logger.info(f"[daily_focus] Generating for userId={data['userId']}")
```

### Composants React

```tsx
// ✅ Props typées
interface CashWidgetProps {
  userId: string;
  className?: string;
}

// ✅ Loading states
const [loading, setLoading] = useState(false);

// ✅ Error handling
const [error, setError] = useState<string | null>(null);

// ✅ Fetch avec try/catch
try {
  setLoading(true);
  const res = await fetch('/api/cash/transactions');
  if (!res.ok) throw new Error('Erreur réseau');
  const data = await res.json();
  setTransactions(data.transactions);
} catch (err) {
  setError('Impossible de charger les transactions');
} finally {
  setLoading(false);
}
// Palette de couleurs
// Fond principal   : bg-gray-950 / bg-gray-900
// Cartes           : bg-gray-800 border border-gray-700
// Accent primaire  : indigo-500 / indigo-600
// Accent secondaire: violet-500 / violet-600
// Succès           : green-400
// Danger/Alerte    : red-400
// Warning          : yellow-400
// Texte principal  : text-white / text-gray-100
// Texte secondaire : text-gray-400

// Gradients titres
// bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent

// Classes composants communs
// Card     : bg-gray-800 rounded-xl border border-gray-700 p-6
// Button   : bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition
// Input    : bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-indigo-500
// Badge    : px-2 py-0.5 rounded-full text-xs font-medium
```

### Git — Conventions de commit

```bash
# Format : type(scope): description

feat(focus): add streak counter to daily focus
fix(cash): correct runway calculation for negative balance
chore(prisma): add CalendarEvent model
refactor(wiki): extract BM25 to separate module
docs: update API documentation
test(pipeline): add prospect enrichment tests

# Types :
# feat     → nouvelle fonctionnalité
# fix      → correction de bug
# chore    → maintenance, configs
# refactor → refactoring sans changement fonctionnel
# docs     → documentation uniquement
# test     → ajout/modification de tests
# perf     → amélioration performance
```

---

## 15. Sécurité

### Authentification

| Mécanisme | Implémentation |
|---|---|
| **JWT** | `jose` library, cookie httpOnly, SameSite=Strict |
| **Expiration** | 7 jours par défaut |
| **Payload** | `{ userId, email, plan }` |
| **Validation** | Chaque route handler appelle `getUser(request)` |

### Isolation des données

```typescript
// ✅ TOUJOURS filtrer par userId — jamais de données cross-user
await db.transaction.findMany({ where: { userId: user.id } });
await db.prospect.findFirst({ where: { id: prospectId, userId: user.id } });

// ❌ JAMAIS sans filtre userId
await db.transaction.findMany(); // INTERDIT
```

### Webhooks

```typescript
// Stripe — vérification signature
const event = stripe.webhooks.constructEvent(
  body, sig, process.env.STRIPE_WEBHOOK_SECRET!
);

// Cal.com — vérification HMAC-SHA256
const expectedSig = crypto
  .createHmac('sha256', user.calcomWebhookSecret)
  .update(rawBody)
  .digest('hex');
if (expectedSig !== receivedSig) return 401;
```

### Variables sensibles

- Jamais exposées côté client (`NEXT_PUBLIC_` uniquement pour URLs publiques)
- Stockées dans `.env` (gitignored)
- Accédées via `process.env.VAR_NAME`
- Clés Stripe/OpenRouter/Resend : rotation trimestrielle recommandée

### Rate limiting (recommandé en production)

```typescript
// Routes sensibles : auth/login, auth/register
// Limite suggérée : 5 req/min par IP
// Implémentation : Upstash Rate Limit ou middleware Vercel
```

---

## 16. Roadmap Technique

### Phase 1 — MVP Solo Pro ✅ (Actuel)
- [x] Auth JWT + Onboarding
- [x] Daily Focus IA
- [x] Cash + Runway
- [x] Pipeline Kanban + enrichissement
- [x] Relances IA
- [x] Contenu LinkedIn
- [x] Chat Business Brain
- [x] LLM Wiki
- [x] Devis & Factures PDF
- [x] Tâches + priorisation IA
- [x] Base de connaissances
- [x] Cal.com webhooks
- [x] Stripe abonnements
- [x] Assessment lead capture

### Phase 2 — Starter PME 149€
- [ ] Connexion bancaire (Bridge by Yapily)
- [ ] Import Pennylane
- [ ] Multi-utilisateurs (3 seats)
- [ ] Pipeline 200 deals + prévision 60j
- [ ] Séquences relance auto (3 messages)
- [ ] Interconnexion CRO → CFO
- [ ] Export comptable PDF/CSV

### Phase 3 — PME Growth 349€
- [ ] Agent CMO complet (contenus SEO)
- [ ] Multi-comptes bancaires (5)
- [ ] 10 utilisateurs + rôles
- [ ] Forecast 90j + scénarios what-if
- [ ] Publication auto LinkedIn + X
- [ ] Business Review mensuel consolidé
- [ ] Triple interconnexion CFO + CRO + CMO

### Phase 4 — PME Scale 499€
- [ ] Agent CHRO (RH)
- [ ] ERP light intégré
- [ ] Multi-entités
- [ ] API publique partenaires
- [ ] SSO / SAML
- [ ] Utilisateurs illimités

### Quick Wins identifiés
- [ ] Prospect Radar (signaux Pappers — levées fonds, recrutements)
- [ ] ICP Finder (analyse deals gagnés → suggestions prospects similaires)
- [ ] Social Listening (X/Twitter + Reddit — opportunités temps réel)
- [ ] Deal Cloning (scoring similitude prospects vs clients gagnés)
- [ ] Blog Next.js + SEO content
- [ ] Email quotidien Daily Focus (Resend)

---

## 17. Tests & Qualité

### Tests manuels recommandés

```bash
# 1. Auth flow complet
curl -X POST http://localhost:50082/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"name":"Test","email":"test@mail.com","password":"test1234"}'

# 2. Tester le Daily Focus
curl -X GET http://localhost:50082/api/focus \
  -H 'Cookie: token=<jwt_token>'

# 3. Tester l'agent Python
curl -X POST http://localhost:8000/focus/generate \
  -H 'Content-Type: application/json' \
  -d '{"userId":"test","transactions":[],"prospects":[],"monthlyGoal":5000}'

# 4. Tester le wiki
curl -X POST http://localhost:50082/api/wiki/query \
  -H 'Content-Type: application/json' \
  -H 'Cookie: token=<jwt_token>' \
  -d '{"query":"Qui sont mes prospects actifs ?"}'
```

### Checklist avant merge

- [ ] TypeScript sans erreur (`npm run build`)
- [ ] Prisma schema valide (`npx prisma validate`)
- [ ] userId filtré sur toutes les queries BDD
- [ ] Authentification vérifiée sur toute nouvelle route
- [ ] Variables d'env ajoutées au `.env.example`
- [ ] Logs d'erreur avec contexte (`console.error('[route/method]', error)`)
- [ ] Ingestion wiki déclenchée si action significative

---

## Annexe A — URLs du projet

| Environnement | URL | Service |
|---|---|---|
| **Dev Frontend** | `http://localhost:50082` | Next.js |
| **Dev Python** | `http://localhost:8000` | FastAPI agents |
| **Prisma Studio** | `http://localhost:5555` | Admin BDD |
| **Production** | `http://51.159.164.33:50082` | Next.js prod |
| **Fonctionnalités** | `http://51.159.164.33:50082/fonctionalitee.html` | Page marketing |

## Annexe B — Fichiers de configuration clés

| Fichier | Rôle |
|---|---|
| `next.config.js` | Config Next.js (images, redirects) |
| `tailwind.config.js` | Thème Tailwind + couleurs custom |
| `tsconfig.json` | Config TypeScript + path aliases |
| `prisma/schema.prisma` | Schéma BDD (source de vérité) |
| `middleware.ts` | Auth middleware Next.js (routes protégées) |
| `.env` | Variables d'environnement (gitignored) |
| `.env.example` | Template variables (versionné) |
| `python/requirements.txt` | Dépendances Python |
| `python/main.py` | FastAPI app + routes agents |

---

---

## 15. Sécurité — Bibliothèques & Patterns

### `lib/rate-limit.ts` — Limitation de taux

Implémentation en mémoire (sans dépendance externe) pour protéger les endpoints sensibles.

```typescript
// Utilisation dans une route
import { checkRateLimit } from '@/lib/rate-limit'

const result = checkRateLimit(ip, { maxRequests: 5, windowMs: 15 * 60 * 1000 })
if (!result.allowed) {
  return NextResponse.json(
    { error: `Trop de tentatives. Réessayez dans ${result.retryAfterMinutes} minute(s).` },
    { status: 429, headers: { 'Retry-After': String(result.retryAfterSeconds) } }
  )
}
```

**Appliqué sur** : `POST /api/auth/login` (5 tentatives / 15 min / IP)  
**Mécanisme** : Fenêtre glissante par IP, purge automatique toutes les 5 min (anti-leak mémoire)

**Mode test** : Le rate limiter peut être désactivé via la variable d'environnement `DISABLE_RATE_LIMIT=true` (ou `NODE_ENV=test`). À ne jamais activer en production.
```typescript
// Bypass automatique en environnement de test
if (process.env.NODE_ENV === 'test' || process.env.DISABLE_RATE_LIMIT === 'true') {
  return { allowed: true, remaining: this.max, ... }
}
```

---

### `lib/sanitize.ts` — Sanitisation des entrées

Protection contre les attaques XSS stockées. Appliqué sur tous les champs texte libres.

```typescript
import { sanitizeText, sanitizeEmail, sanitizeUrl, sanitizePhone } from '@/lib/sanitize'

// Dans un POST handler
const name = sanitizeText(body.name, 100)       // strip HTML + encode entities + trim
const email = sanitizeEmail(body.email)          // strip tags + lowercase + max 254
const website = sanitizeUrl(body.website)        // accepte seulement http:// et https://
const phone = sanitizePhone(body.phone)          // filtre chars non numériques
```

**Appliqué sur** : `POST/PATCH /api/pipeline/prospects` (notes, company, name)

---

### `lib/reset-tokens.ts` — Tokens de réinitialisation

Stockage en mémoire des tokens one-time pour le flux reset-password.

```typescript
// Générer un token (valable 1h)
const token = createResetToken(userId)  // retourne string hex 64 chars

// Valider et consommer (one-time)
const userId = validateAndConsumeToken(token)  // retourne userId ou null
```

**TTL** : 1 heure | **Usage** : `POST /api/auth/forgot-password` → `POST /api/auth/reset-password`

---

### Middleware de protection des routes

Fichier : `middleware.ts`

**Routes protégées** (redirect vers `/login` si non authentifié) :
```
/focus, /tasks, /pipeline, /cash, /content, /chat,
/settings, /knowledge-base, /calendar, /profile, /invoices, /quotes, /agents
```

---

### Headers de sécurité HTTP

Configurés dans `next.config.js` :

| Header | Valeur | Protection |
|---|---|---|
| `Content-Security-Policy` | `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; connect-src 'self' https://...` | XSS / injection |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains` | HTTPS forcé (prod uniquement) |
| `X-Frame-Options` | `DENY` | Clickjacking |
| `X-Content-Type-Options` | `nosniff` | MIME sniffing |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Fuite URL |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | API browser |

---

### Authentification JWT

- Token stocké **uniquement** dans le cookie `auth_token` (httpOnly, SameSite=lax)
- Le token n'est **jamais** retourné dans le body de réponse (login/register)
- Les API routes valident via `getSession(req)` depuis `lib/auth.ts`

---

## 16. Scheduler & Cron Jobs

### Configuration

Les jobs cron utilisent `curl` vers les endpoints Next.js protégés par `x-cron-secret`.

**Variable d'environnement** : `CRON_SECRET` (hex 64 chars)

### Jobs installés

```bash
# Voir avec: crontab -l | grep Brainlo

# Daily Focus email — tous les jours à 8h UTC (10h Paris)
0 8 * * * curl -s -X POST -H 'x-cron-secret: $CRON_SECRET' http://localhost:50082/api/cron/daily-focus

# Rapport mensuel — le 1er de chaque mois à 9h UTC
0 9 1 * * curl -s -X POST -H 'x-cron-secret: $CRON_SECRET' http://localhost:50082/api/cron/monthly-report

# Wiki lint — chaque lundi à 9h UTC
0 9 * * 1 curl -s -X POST -H 'x-cron-secret: $CRON_SECRET' http://localhost:50082/api/cron/wiki-lint
```

### Endpoints Cron

#### `POST /api/cron/daily-focus`

**Auth** : Header `x-cron-secret`  
**Logique** :
1. Récupère tous les users `plan=PRO`
2. Pour chaque user : vérifie si focus déjà généré → utilise existant OU génère via Python `/focus/generate`
3. Envoie email HTML via Resend (`sendDailyFocusEmail`)
4. Fallback : 3 actions génériques si Python API indisponible

```json
// Response 200
{"success":true, "date":"2026-05-17", "totalPro":5, "sent":5, "skipped":0, "errors":0,
 "users":["user1@...","user2@..."]}
```

#### `POST /api/cron/monthly-report`

**Auth** : Header `x-cron-secret`  
**Logique** : Génère et envoie le bilan du mois précédent à tous les users PRO  
**Données** : CA/charges/net, pipeline, tâches, focus streak

#### `POST /api/cron/wiki-lint`

**Auth** : Header `x-cron-secret`  
**Logique** : Appelle Python `/wiki/lint` pour chaque utilisateur  
**Actions** : Supprime pages vides, tronque log.md >200 lignes, déduplique, met à jour BRAIN.md

```json
// Response 200
{"success":true, "totalUsers":17, "processed":17, "errors":0,
 "totalCleaned":3, "totalBytesFreed":2133}
```

### API Rapport Mensuel

#### `GET /api/reports/monthly?month=2026-05`

**Auth** : Cookie session  
**Response** :
```json
{
  "month": "avril 2026",
  "finance": {"ca": 8400, "charges": 2100, "net": 6300, "goalProgress": 84},
  "pipeline": {"activeProspects": 6, "wonThisMonth": 2, "wonRevenue": 4800, "conversionRate": 33},
  "tasks": {"completed": 8, "total": 10, "completionRate": 80},
  "focus": {"activeDays": 22, "daysInMonth": 30, "engagementRate": 73}
}
```

#### `POST /api/reports/monthly`

**Auth** : Cookie session  
**Effet** : Génère le rapport du mois précédent et l'envoie par email à l'utilisateur connecté

### Logs

```
/a0/usr/projects/business_ai_os/cron-daily-focus.log
/a0/usr/projects/business_ai_os/cron-monthly-report.log
/a0/usr/projects/business_ai_os/cron-wiki-lint.log
```

---

## 17. Changelog Technique

### v1.2.0 — 2026-05-17 (Post-QA Sprint + Quick Wins)

#### Nouvelles fonctionnalités

| Feature | Fichier | Description |
|---|---|---|
| Daily Focus Email | `app/api/cron/daily-focus/route.ts` | Email quotidien 8h UTC pour tous les users PRO |
| Rapport Mensuel Auto | `app/api/reports/monthly/route.ts` | Bilan mensuel JSON + envoi email automatique |
| Wiki Lint Hebdomadaire | `app/api/cron/wiki-lint/route.ts` + `python/agents/wiki_lint.py` | Nettoyage wiki chaque lundi |
| Endpoint rapport mensuel utilisateur | `GET/POST /api/reports/monthly` | Accessible depuis le dashboard |

#### Nouvelles routes API

| Méthode | Route | Sprint |
|---|---|---|
| PATCH, DELETE | `/api/pipeline/prospects/[id]` | Sprint 1 |
| DELETE, PATCH | `/api/cash/transactions/[id]` | Sprint 2 |
| GET | `/api/agents/catalog` | Sprint 3 |
| POST | `/api/auth/forgot-password` | Sprint 2 |
| PATCH | `/api/auth/change-password` | Sprint 2 |
| GET, POST | `/api/reports/monthly` | QW-2 |
| POST | `/api/cron/daily-focus` | QW-1 |
| POST | `/api/cron/monthly-report` | QW-2 |
| POST | `/api/cron/wiki-lint` | QW-3 |

#### Nouvelles bibliothèques

| Fichier | Rôle |
|---|---|
| `lib/rate-limit.ts` | Rate limiting en mémoire (anti brute-force) |
| `lib/sanitize.ts` | Sanitisation XSS des entrées utilisateur |
| `lib/reset-tokens.ts` | Tokens one-time pour reset-password |

#### Corrections de bugs (QA Cycles 1-3)

| Bug | Fix |
|---|---|
| Python API DOWN (PM2 misconfiguration) | Restart via `start-python.sh` + fix interpreter |
| JWT exposé dans response body | Supprimé de login/register response |
| Pages /tasks + /settings non protégées | Middleware étendu (7 nouvelles routes) |
| Mot de passe faible accepté | Validation forte (min 8, majuscule, chiffre) |
| XSS stocké dans notes prospect | Sanitisation via `lib/sanitize.ts` |
| wiki/query HTTP 422 | Payload Python corrigé |
| Stripe checkout HTTP 500 | `apiVersion: '2023-10-16'` + `NEXT_PUBLIC_APP_URL` |
| Champs profil non persistés à l'inscription | `register/route.ts` → 10 champs étendus |
| GET /api/focus non bloqué pour FREE | Vérification plan ajoutée |
| CSP/HSTS manquants | Headers dans `next.config.js` |

#### Variables d'environnement ajoutées

| Variable | Description |
|---|---|
| `CRON_SECRET` | Secret partagé pour authentifier les appels cron |
| `PYTHON_API_URL` | URL du microservice Python (défaut: `http://localhost:8000`) |
| `STRIPE_TEST_MODE` | Désactivé (`false`) pour le mode production live |

---

### v1.3.0 — 2026-05-17 (Post-QA Cycles 5-8)

#### Nouvelles routes API

| Route | Méthode | Description |
|-------|---------|-------------|
| `/api/quotes/[id]` | GET | Récupérer un devis par ID (isolation userId) |
| `/api/quotes/[id]` | PATCH | Mettre à jour statut/lignes d'un devis |
| `/api/quotes/[id]` | DELETE | Supprimer un devis DRAFT |
| `/api/knowledge/[id]` | DELETE | Supprimer un document KB avec auth |
| `/api/pipeline/prospects/[id]` | GET | Récupérer un prospect par ID (isolation userId) |
| `/api/cash/recurrences` | POST | Créer manuellement une charge récurrente |

#### Corrections de bugs (QA Cycles 5-8)

| Bug | Fix |
|-----|-----|
| GET /api/pipeline/prospects/[id] → 405 cross-user | Handler GET + isolation `userId` → 404 (SC-04) |
| Aucune limite devis plan FREE | Limite 3 devis max → 402 `upgradeRequired` (QF-13) |
| Aucune limite prospects plan FREE | Limite 3 prospects max → 402 `upgradeRequired` |
| POST /api/cash/recurrences → 405 | Handler POST implémenté (TR-11) |
| OCR crash 500 pour image illisible | Status 422 pour erreur LLM Vision (TR-05) |
| Format XLSX non supporté par kb_extract.py | Ajout `_extract_xlsx()` via openpyxl (KB-04) |
| Cache .next corrompu (bcryptjs) | Suppression + recompilation complète |
| Rate limiter bloquant en tests | Bypass `DISABLE_RATE_LIMIT=true` |

#### Améliorations fonctionnelles

| Feature | Description |
|---------|-------------|
| Chat Business Brain | Prompt enrichi avec note KB vide si `kbCount === 0` (KB-14) |
| Knowledge Base | Support format `.xlsx` dans les formats acceptés et `kb_extract.py` |
| Sécurité | Isolation cross-user vérifiée sur tous les endpoints dynamiques |
| Documentation API | Routes dynamiques [id] documentées pour quotes, knowledge, prospects |

#### Résultat QA global

> 95 cas testés — 92/95 PASS (97%) — 0 bug critique résiduel  
> Référence : NSI-QA-2026-001

---

### v1.4.0 — 2026-05-26 (Facturation électronique Factur-X + UX Devis)

#### Nouvelles fonctionnalités

| Feature | Fichier(s) | Description |
|---------|-----------|-------------|
| **Factur-X PDF** | `python/agents/facturx_gen.py` | Génération PDF hybride Factur-X BASIC (PDF + XML CII EN 16931 embarqué) |
| **Route Factur-X Python** | `python/main.py` | `POST /facturx/generate` — accepte JSON, retourne PDF binaire |
| **Route Factur-X Next.js** | `app/api/invoices/[id]/facturx/route.ts` | `GET /api/invoices/[id]/facturx` — proxy sécurisé vers Python |
| **Bouton Factur-X** | `app/(dashboard)/invoices/page.tsx` | Bouton de téléchargement sur chaque facture dans le dashboard |
| **Autocomplete SIRET** | `app/(dashboard)/invoices/page.tsx` | Recherche société avec enrichissement SIRET dans formulaire devis |
| **Conversion quote→prospect** | `app/api/invoices/route.ts` | Création automatique d'un Prospect (status WON) depuis clientInfo |

#### Nouvelles routes API

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/invoices/[id]/facturx` | Télécharge le PDF Factur-X BASIC de la facture |
| POST | `/facturx/generate` *(Python)* | Génère le PDF Factur-X depuis un payload JSON |

#### Nouvelles bibliothèques Python

| Package | Version | Rôle |
|---------|---------|------|
| `factur-x` | 4.2 | Embedding XML CII dans PDF (PDF/A-3) |
| `pypdf` | 6.x | Dépendance factur-x |
| `saxonche` | 12.x | Validation schematron XSD |

#### Améliorations UX Devis & Factures

| Feature | Description |
|---------|-------------|
| Prix HT saisie libre | Champ texte avec inputMode decimal, accepte virgule (1000,50) |
| Modification devis SENT | Bouton Modifier disponible pour statuts DRAFT et SENT |
| Devis facturés masqués | Les devis avec invoiceId n'apparaissent plus dans la liste |
| Compteur devis corrigé | L'onglet Devis (N) n'affiche que les devis non encore facturés |
| Gestion erreur 402 | Message d'erreur visible dans le modal lors d'un dépassement de limite |
| Suppression Diagnostic IA | Entrée retirée du menu Sidebar |

#### Corrections de bugs

| Bug | Fix |
|-----|-----|
| Client non renseigné après conversion devis->facture | Création automatique Prospect depuis clientInfo si prospectId null |
| Erreur 402 silencieuse (limite devis FREE) | Affichage du message d'erreur dans le modal |
| Prix HT avec décimales impossible | Champ texte libre avec rawPrices state local dans LineEditor |

---

> Document maintenu par Agent Zero
> Derniere mise a jour : 2026-05-26
> Fichier : `/a0/usr/projects/business_ai_os/DOCUMENTATION_TECHNIQUE.md`
> Version : 1.4.0 | ~2060 lignes
