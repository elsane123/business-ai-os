# 🤖 Business AI OS

> **Suite d'agents IA pour solopreneurs et PME** — Dashboard centralisé piloté par l'intelligence artificielle.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3.11+-green)](https://www.python.org/)

## 🎯 Concept

Business AI OS est un système d'exploitation d'entreprise piloté par l'IA. Un dashboard central où chaque fonction métier est gérée par un agent IA dédié : trésorerie, CRM, focus journalier, devis, factures, contenu LinkedIn.

## ✨ Fonctionnalités

| Module | Description |
|---|---|
| 🎯 **Daily Focus** | 3 actions prioritaires générées chaque matin par l'IA |
| 💰 **Trésorerie** | Transactions, runway calculator, saisie NLP, OCR reçus |
| 👥 **Pipeline CRM** | Kanban prospects + enrichissement auto SIRET/LinkedIn |
| 📄 **Devis & Factures** | Création depuis brief naturel, PDF professionnel |
| ✅ **Tâches IA** | Priorisation automatique avec score 0-100 |
| 📝 **LinkedIn** | Génération de posts contextualisés |
| 🧠 **Business Brain** | Chat IA avec mémoire complète de l'entreprise |
| 📚 **Knowledge Base** | Upload & interrogation PDF/DOCX/PPTX |
| 📅 **Calendrier** | Intégration Cal.com webhooks |
| 🎓 **Assessment** | Outil d'évaluation lead magnet public |

## 🏗️ Stack Technique

- **Frontend** : Next.js 14, TypeScript, Tailwind CSS
- **Backend** : Next.js API Routes + Python FastAPI
- **Base de données** : PostgreSQL via Prisma ORM
- **IA** : OpenRouter (Claude / GPT-4o)
- **Paiement** : Stripe
- **Email** : Resend
- **Calendrier** : Cal.com

## 🚀 Installation

### Prérequis
```bash
node >= 18.x | npm >= 9.x | python >= 3.11 | postgresql >= 15
```

### Installation
```bash
# 1. Cloner
git clone https://github.com/elsane123/business-ai-os.git
cd business-ai-os/business-ai-os

# 2. Dépendances Node
npm install

# 3. Variables d'environnement
cp .env.example .env
# Éditer .env avec vos clés API

# 4. Base de données
npx prisma generate
npx prisma migrate dev --name init

# 5. Démarrer Next.js
npm run dev -- -p 50082

# 6. Dépendances Python (nouveau terminal)
cd python && pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

## 📁 Documentation

| Fichier | Description |
|---|---|
| [`DOCUMENTATION_TECHNIQUE.md`](./DOCUMENTATION_TECHNIQUE.md) | Spécifications techniques complètes (API, schéma BDD, agents) |
| [`MANUEL_UTILISATEUR_DEMO.md`](./MANUEL_UTILISATEUR_DEMO.md) | Manuel utilisateur + scripts vidéos démo |
| [`STRATEGIE_DE_TEST_COMPLETE.md`](./STRATEGIE_DE_TEST_COMPLETE.md) | Stratégie de test + personas fictifs + scénarios E2E |

## 🔑 Variables d'Environnement

Voir `.env.example` pour la liste complète. Variables principales :

```env
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
OPENROUTER_API_KEY=sk-or-xxx
STRIPE_SECRET_KEY=sk_live_xxx
RESEND_API_KEY=re_xxx
```

## 📋 Plans

| Plan | Prix | Usage |
|---|---|---|
| **Solo Free** | 0€ | 3 prospects, 4 posts/mois |
| **Solo Pro** | 29€/mois | Accès complet |
| **Starter PME** | 149€/mois | Multi-users, connexion bancaire |
| **PME Growth** | 349€/mois | Agents interconnectés |

## 📄 Licence

MIT License — voir [LICENSE](./LICENSE)
