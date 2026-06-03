# TODO — Brainlo Roadmap

> Dernière mise à jour : 2026-06-03 (session 4)  
> État du projet : **Production-ready avec quelques bloquants à lever**

---

## ✅ Réalisé

### Authentification & Onboarding
- [x] Inscription / Connexion / Déconnexion
- [x] Réinitialisation de mot de passe (forgot / reset)
- [x] Onboarding simplifié 3 étapes (Welcome → Compte → Profil → Activation)
- [x] WHY callouts sur chaque étape d'onboarding
- [x] Animation d'activation

### Dashboard & Activation utilisateur
- [x] Widget checklist "Premiers pas avec Brainlo" (9 étapes)
- [x] Auto-détection des étapes complétées depuis les données réelles DB
- [x] Barre de progression animée + pourcentage
- [x] Masquable (localStorage), disparaît après 30 jours ou 100%
- [x] Badges PRO dans la sidebar (LinkedIn, Chat, Agents IA, KB)
- [x] Tooltip upgrade au survol des badges PRO

### Settings & Profil
- [x] Settings > Enrichir mon profil (score 0–100%)
- [x] 4 sections accordion : Offres, ICP/Stratégie, Localisation, Brief
- [x] Jalons de déblocage à 25% / 50% / 75% / 100%
- [x] Intégration Cal.com dans les settings
- [x] Ancres navigables : `settings#enrich` et `settings#calcom`

### Fonctionnalités métier
- [x] Pipeline CRM (prospects CRUD)
- [x] Gestion des tâches (CRUD + NLP)
- [x] Daily Focus (basique FREE + IA PRO)
- [x] Chat IA (PRO)
- [x] Agents IA — relance, LinkedIn, analyse (PRO)
- [x] Base de connaissance / Wiki / BRAIN.md (PRO)
- [x] Devis & Factures (CRUD + PDF print)
- [x] Trésorerie / Cash flow + récurrences
- [x] Contenu LinkedIn (générateur IA)
- [x] Assessment solopreneur
- [x] Blog avec articles Markdown

### Paiement & Plans
- [x] Intégration Stripe (checkout + webhook)
- [x] Plan FREE vs Solo Pro
- [x] UpgradeBanner pour les utilisateurs FREE

### Infrastructure & Qualité
- [x] API REST complète (tous les endpoints opérationnels)
- [x] Sécurité : rate limiting, sanitize XSS, isolation cross-user
- [x] Security headers HTTP (CSP, X-Frame-Options, Permissions-Policy...)
- [x] **Auth centralisée via proxy.ts** — middleware Edge unique, whitelist PUBLIC_PATHS, redirect `/login?returnTo=`, 401 JSON sur les routes API non authentifiées
- [x] **NeonDB reconnect strategy** — `connect_timeout=30`, `connection_limit=5`, `$on('error')` handler qui détecte `E57P01` (admin_shutdown) et force un `$disconnect/$connect`
- [x] SEO : robots.ts, sitemap.ts, canonical, JSON-LD, OG images
- [x] Error Boundaries (global, dashboard, auth, pages publiques)
- [x] Tests E2E Playwright (24 tests, 96% de succès)
- [x] Accessibilité WCAG 2.1 AA (skip-nav, aria-current, aria-live, aria-expanded, focus-visible, htmlFor/id, reduced-motion)
- [x] Cron jobs : Daily Focus email, rapport mensuel, wiki lint

---

## 🔴 Priorité 1 — Mise en production (bloquants)

- [ ] **Resend domain validation** — Valider SPF/DKIM sur dashboard Resend.com pour `brainlo.ai` → emails transactionnels non envoyés en prod (bienvenue, reset mdp)
- [ ] **Stripe live vs test** — Vérifier que `STRIPE_SECRET_KEY` est bien `sk_live_` en production (et non `sk_test_`)
- [ ] **HSTS via Caddy** — Ajouter `Strict-Transport-Security: max-age=63072000; includeSubDomains` dans le Caddyfile
- [ ] **`vercel.json` manquant** — Les crons `daily-focus` et `monthly-report` ne se déclenchent **jamais** en production sans ce fichier. Créer `vercel.json` avec les schedules (`0 7 * * *` et `0 8 1 * *`) et s'assurer que Vercel passe bien le header `x-cron-secret`

---

## 🟡 Priorité 2 — UI manquante

- [x] **Page Rapports dashboard** — `/app/(dashboard)/reports/page.tsx` existe (204 lignes) avec KpiCards CA/charges/net, pipeline, tâches, focus
- [x] **Page `/fonctionnalites` intégrée Next.js** — `/app/fonctionnalites/page.tsx` existe avec metadata, canonical, OpenGraph (la page HTML statique `public/fonctionnalites.html` peut être conservée ou supprimée)
- [ ] **Email de bienvenue** — Déclenché à l'inscription dans le code mais bloqué par Resend (dépend Priorité 1)

---

## 🔵 Priorité 3 — Qualité technique

- [ ] **NeonDB cold-start (production)** — NeonDB free tier auto-suspend après 5 min d'inactivité → cold-start 3–5s au premier accès. Reconnect strategy implémentée (`lib/db.ts`), mais pour une prod sans friction : upgrader vers **NeonDB Scale** (auto-suspend désactivé) ou adopter **Prisma Accelerate** (connection pooler, warm connections, cache). À prioriser avant lancement public.
- [ ] **Accessibilité WCAG → 90+/100** — Score estimé 78/100 après le sprint WCAG. Aller plus loin : contrastes couleurs (#818cf8 sur fond sombre), modales avec focus-trap, alertes ARIA dans les pages dashboard
- [ ] **Tests E2E Playwright** — Mettre à jour les tests existants pour couvrir les nouveaux composants WCAG (skip-nav, aria-expanded, progressbar)
- [ ] **Tests E2E Playwright** — Ajouter couverture des pages : `/onboarding`, `/settings#enrich`, flux Stripe checkout complet
- [ ] **Performance** — Vérifier bundle size Next.js, lazy loading images, code splitting (score estimé 70/100)
- [x] **`.env.example` complet** — `CRON_SECRET`, `NODE_ENV`, `DISABLE_RATE_LIMIT`, `STRIPE_CUSTOMER_PORTAL_URL`, `NOTION_TOKEN` ajoutés + instructions DNS Resend + WIKI_BASE_PATH générique
- [x] **Doublon variable Python URL** — `PYTHON_API_URL` consolidé en `PYTHON_AGENT_URL` dans toutes les références code

---

## 🟣 Priorité 5 — Acquisition Client AI (Epic 8) ✅ DONE

- [x] **E8.1 ICP Builder** — `POST /api/pipeline/icp/generate` — CRO agent analyse deals WON + Business Brain → ICP + scores de closing sur chaque prospect. Badges couleur sur pipeline page. ICP sauvegardé dans `BRAIN.md`.
- [x] **E8.2 Séquence Cold Email** — `POST /api/agents/cold-email/generate` — séquence 5 emails (J1/J3/J7/J14/J21), accordéon UI sur agent CRO, copier/coller par email, tonalité configurable.
- [x] **E8.3 LinkedIn CMO Outreach** — `POST /api/agents/linkedin-post/generate` + `/publish` — génère + publie post LinkedIn via UGC Posts API. UI sur agent CMO avec textarea 3000 chars, bouton publier, gestion expiration token.
- [x] **LinkedIn token user-configured** — `GET/POST/DELETE /api/user/linkedin-token` — token stocké en DB par user. Section dédiée Settings > Intégrations (save/disconnect). Plus de dépendance à `process.env.LINKEDIN_ACCESS_TOKEN`.
- [x] **Sidebar CROISSANCE** — nouvelle section rose avec Contenu LinkedIn, ICP Builder, Séquence Email, LinkedIn CMO.

---

## 🟢 Priorité 4 — Croissance & Marketing

- [ ] **3 articles SEO** — Intégrer au blog Next.js les articles prêts dans `seo-content/articles/` :
  - `daily-focus-entrepreneur.md`
  - `guide-tresorerie-solopreneur.md`
  - `brainlo-vs-notion.md` (comparatif)
- [ ] **Assessment comme outil d'acquisition** — SEO-ifier `/assessment`, ajouter Open Graph, le promouvoir comme lead magnet
- [ ] **Newsletter Beehiiv** — Intégration API déjà câblée dans `lib/resend.ts`, activer le pipeline d'inscription automatique post-onboarding
- [ ] **LinkedIn Brainlo** — Utiliser les agents IA pour générer et publier du contenu sur le compte LinkedIn de Brainlo

---

## 🔴 Stripe — Abonnement mensuel récurrent

- [x] **Créer un prix récurrent dans Stripe dashboard** — `price_1Tbcvs1DYEHpPzLOjfMh3Lyj` (29€/mois, produit `prod_UaoZ20ZcQR9LS1`)
- [x] **Mettre à jour `STRIPE_PRICE_ID_SOLO_PRO`** dans `.env` — fait
- [x] **Passer `mode: 'subscription'`** dans `lib/stripe.ts` — fait
- [ ] **Enregistrer le webhook** dans Stripe dashboard (test + live) : URL `https://brainlo.ai/api/stripe/webhook`, événements : `checkout.session.completed`, `customer.subscription.deleted`, `invoice.payment_failed`
- [ ] **Tester le cycle complet** : paiement → PRO → annulation → FREE automatique

---

## 📊 Résumé effort restant

| Priorité | Items | Effort estimé |
|---|---|---|
| 🔴 Mise en production | 4 items | ~3h |
| 🟡 UI manquante | 3 items | ~5h |
| 🔵 Qualité technique | 6 items | ~1,5 jour |
| 🟢 Croissance | 4 items | ~4h |
| **Total** | **17 items** | **~3 jours** |