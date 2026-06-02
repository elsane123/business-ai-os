# TODO — Brainlo Roadmap

> Dernière mise à jour : 2026-05-27  
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

- [ ] **Accessibilité WCAG → 90+/100** — Score estimé 78/100 après le sprint WCAG. Aller plus loin : contrastes couleurs (#818cf8 sur fond sombre), modales avec focus-trap, alertes ARIA dans les pages dashboard
- [ ] **Tests E2E Playwright** — Mettre à jour les tests existants pour couvrir les nouveaux composants WCAG (skip-nav, aria-expanded, progressbar)
- [ ] **Tests E2E Playwright** — Ajouter couverture des pages : `/onboarding`, `/settings#enrich`, flux Stripe checkout complet
- [ ] **Performance** — Vérifier bundle size Next.js, lazy loading images, code splitting (score estimé 70/100)
- [ ] **`.env.example` incomplet** — Ajouter les variables manquantes : `CRON_SECRET`, `NODE_ENV`, `DISABLE_RATE_LIMIT` (présentes dans `.env` mais non documentées)
- [ ] **Doublon variable Python URL** — `.env` contient `PYTHON_AGENT_URL` et `PYTHON_API_URL` qui pointent vers la même URL. Consolider en une seule variable et nettoyer les références dans le code

---

## 🟣 Priorité 5 — Acquisition Client AI (Epics 8)

- [ ] **E8.1 ICP Builder** — Bouton "Générer mon ICP" dans le pipeline : l'agent CRO analyse les deals WON + Business Brain → génère le Profil Client Idéal → sauvegarde dans `BRAIN.md` section `## Profil Client Idéal (ICP)`. Endpoint : `POST /api/pipeline/icp/generate`. Panel résultat dans la page pipeline. Score mécanique actuel (`calcLeadScore`) conservé tel quel.
- [ ] **E8.2 Séquence Cold Email** — Agent CRO génère 5 emails de prospection contextualisés (offre Brain + ton + ICP) pour un prospect cible. Export copier/coller par email. Tonalité configurable.
- [ ] **E8.3 LinkedIn Outreach** — Agent CMO rédige + publie un post LinkedIn ciblé ICP. Connexion via `LINKEDIN_ACCESS_TOKEN` (déjà en secrets). Preview avant publication. Analytics impressions/engagement.

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