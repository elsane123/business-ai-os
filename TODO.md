# TODO — Brainlo Roadmap

> Dernière mise à jour : 2026-05-26  
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

---

## 🟡 Priorité 2 — UI manquante

- [ ] **Page Rapports dashboard** — L'API `/api/reports/monthly` fonctionne (HTTP 200) mais aucune page Next.js pour visualiser les données. Créer `/app/(dashboard)/reports/page.tsx` avec graphiques CA mensuel, tâches, prospects
- [ ] **Page `/fonctionnalites` intégrée Next.js** — Un fichier HTML statique existe dans `public/fonctionnalites.html` mais n'est pas une vraie page avec navigation. Créer `/app/fonctionnalites/page.tsx` avec tableau comparatif FREE/PRO
- [ ] **Email de bienvenue** — Déclenché à l'inscription dans le code mais bloqué par Resend (dépend Priorité 1)

---

## 🔵 Priorité 3 — Qualité technique

- [ ] **Accessibilité WCAG → 90+/100** — Score estimé 78/100 après le sprint WCAG. Aller plus loin : contrastes couleurs (#818cf8 sur fond sombre), modales avec focus-trap, alertes ARIA dans les pages dashboard
- [ ] **Tests E2E Playwright** — Mettre à jour les tests existants pour couvrir les nouveaux composants WCAG (skip-nav, aria-expanded, progressbar)
- [ ] **Tests E2E Playwright** — Ajouter couverture des pages : `/onboarding`, `/settings#enrich`, flux Stripe checkout complet
- [ ] **Performance** — Vérifier bundle size Next.js, lazy loading images, code splitting (score estimé 70/100)

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

## 📊 Résumé effort restant

| Priorité | Items | Effort estimé |
|---|---|---|
| 🔴 Mise en production | 3 items | ~2h30 |
| 🟡 UI manquante | 3 items | ~5h |
| 🔵 Qualité technique | 4 items | ~1,5 jour |
| 🟢 Croissance | 4 items | ~4h |
| **Total** | **14 items** | **~3 jours** |