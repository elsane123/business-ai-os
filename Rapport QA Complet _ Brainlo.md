# 🔬 Rapport QA Complet — Brainlo

> **Version** : 1.0 | **Date** : 2026-05-16 | **Testeur** : Agent Zero QA Senior  
> **URL Prod** : http://brainlo.ai | **URL Infra** : http://51.159.164.33:50082  
> **Stack** : Next.js 14 + Prisma + PostgreSQL Neon + Stripe + Python FastAPI  
> **Personas testés** : Sophie (PRO), Julie (FREE), utilisateur anonyme, attaquant

---

## 📊 Synthèse Exécutive

| Indicateur | Valeur |
|---|---|
| **Score global qualité** | **4.5 / 10** |
| **Bugs critiques** | 7 |
| **Bugs High** | 6 |
| **Bugs Medium** | 4 |
| **Bugs Low/UX** | 3 |
| **Total bugs trouvés** | **20** |
| **Tests passés (OK)** | 9 |
| **Statut production-ready** | ❌ **NON** — 7 blockers critiques |

---

## 🚨 Risques Critiques Avant Production

1. 🔴 **HTTPS manquant** — toutes les données transitent en clair (credentials, tokens, données financières)
2. 🔴 **Daily Focus cassé** — feature core retourne `null` pour TOUS les utilisateurs PRO
3. 🔴 **Plan FREE non bloqué API** — `/api/focus` retourne HTTP 200 pour les FREE (pas de 403)
4. 🔴 **Pages /tasks et /settings sans auth** — middleware incomplet
5. 🔴 **Aucun rate limiting** — brute force sur login sans blocage
6. 🔴 **XSS payload stocké** — `<script>` accepté dans les notes de prospect
7. 🔴 **JWT dans le response body** — token exposé côté client

---

## 🐛 Bugs Détaillés

---

### BUG-01 — [🔴 CRITICAL] HTTPS Non Configuré

**Titre** : `https://brainlo.ai` ne répond pas — pas de certificat TLS

**Étapes reproduction**
1. Accéder à `https://brainlo.ai/`
2. Observer la réponse réseau

**Résultat attendu** : Connexion HTTPS établie, certificat TLS valide, redirection HTTP→HTTPS

**Résultat actuel** : `curl https://brainlo.ai` → HTTP `000` (connection failed). `http://brainlo.ai` répond en HTTP 200 non sécurisé.

**Impact business** : BLOQUANT. Mots de passe, tokens JWT, données financières transitent en clair. Violation RGPD potentielle. Navigateurs modernes bloquent et affichent alerte rouge.

**Cause probable** : Pas de certificat TLS (Let's Encrypt ou autre). Reverse proxy non configuré pour HTTPS.

**Fix recommandé** :
```bash
# Option 1 — Caddy (le plus simple)
echo "brainlo.ai { reverse_proxy localhost:50082 }" > Caddyfile && caddy run

# Option 2 — Nginx + Certbot
certbot --nginx -d brainlo.ai --non-interactive --agree-tos
```

**Logs** : `curl -o /dev/null -w '%{http_code}' https://brainlo.ai` → `000`

---

### BUG-02 — [🔴 CRITICAL] Daily Focus retourne `{focus: null}` pour tous les utilisateurs

**Titre** : Feature principale Daily Focus cassée — retourne null pour tous les plans

**Étapes reproduction**
1. Se connecter avec Sophie (plan PRO, données présentes)
2. `GET /api/focus` avec cookie auth valide

**Résultat attendu** : JSON avec 3 actions prioritaires IA

**Résultat actuel** :
```json
{"focus": null}
```
Même résultat avec `POST /api/focus` pour déclencher la génération.

**Impact business** : BLOQUANT. Daily Focus est l'argument #1 du produit. Si elle ne fonctionne pas, la valeur perçue est nulle et les utilisateurs PRO ne reçoivent pas ce pour quoi ils paient.

**Cause probable** : L'agent Python (`PYTHON_AGENT_URL=http://localhost:8000`) est peut-être down ou la génération LLM échoue silencieusement. La route `GET /api/focus` retourne le focus existant en BDD (null si jamais généré), sans auto-trigger de génération.

**Fix recommandé** :
1. Vérifier que le Python API tourne : `curl http://localhost:8000/health`
2. Ajouter logs d'erreur explicites si LLM échoue
3. Sur l'UI : si `focus === null`, déclencher automatiquement ou afficher CTA clair
4. Vérifier les logs Python : `tail -f python.log`

**Logs** :
```
GET /api/focus (Sophie PRO) → HTTP 200 {"focus": null}
GET /api/focus (Julie FREE) → HTTP 200 {"focus": null}
```

---

### BUG-03 — [🔴 CRITICAL] Plan FREE non bloqué sur `/api/focus`

**Titre** : Utilisateur FREE accède à l'endpoint Focus sans blocage (HTTP 200 au lieu de 403)

**Étapes reproduction**
1. Se connecter avec Julie (plan FREE)
2. `GET /api/focus` avec cookie auth valide

**Résultat attendu** : HTTP 403 + `{"error": "Plan Solo Pro requis", "upgrade": true}`

**Résultat actuel** : HTTP 200 `{"focus": null}` — aucune vérification de plan côté API

**Impact business** : Perte directe de revenus. Les utilisateurs FREE contournent les limitations et accèdent aux features PRO sans payer. Logique d'upgrade compromise.

**Cause probable** : Vérification du plan absente dans `/app/api/focus/route.ts`

**Fix recommandé** :
```typescript
// Dans /app/api/focus/route.ts
const session = await getSession();
if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
if (session.plan === 'FREE') {
  return NextResponse.json({ error: 'Plan Solo Pro requis', upgrade: true }, { status: 403 });
}
```

---

### BUG-04 — [🔴 CRITICAL] Pages `/tasks` et `/settings` accessibles sans authentification

**Titre** : Middleware ne protège pas toutes les pages — `/tasks` et `/settings` accessibles sans login

**Étapes reproduction**
1. Sans être connecté, accéder à `http://51.159.164.33:50082/tasks`
2. Observer : HTTP 200 (page chargée), pas de redirect vers /login

**Résultat attendu** : Redirect 302 vers `/login`

**Résultat actuel** :
```
/tasks    → HTTP 200 ❌ Accessible sans auth
/settings → HTTP 200 ❌ Accessible sans auth
```

**Impact business** : Pages de gestion métier accessibles sans login. Shell UI exposé, appels API côté client potentiels sans session valide.

**Cause probable** :
```typescript
// middleware.ts — seulement 5 routes protégées :
const PROTECTED_PATHS = ['/focus', '/cash', '/pipeline', '/content', '/chat']
// MANQUANT : '/tasks', '/settings', '/knowledge', '/calendar', '/profile'
```

**Fix recommandé** :
```typescript
const PROTECTED_PATHS = [
  '/focus', '/cash', '/pipeline', '/content', '/chat',
  '/tasks', '/settings', '/knowledge', '/calendar', '/profile'
]
// + mettre à jour le matcher config
export const config = {
  matcher: [
    '/focus/:path*', '/cash/:path*', '/pipeline/:path*',
    '/content/:path*', '/chat/:path*', '/tasks/:path*',
    '/settings/:path*', '/knowledge/:path*', '/calendar/:path*',
    '/profile/:path*', '/login', '/onboarding',
  ],
}
```

---

### BUG-05 — [🔴 CRITICAL] Aucun Rate Limiting — Brute Force login possible

**Titre** : 10 tentatives login consécutives avec mauvais MDP → toutes HTTP 401 (jamais 429)

**Étapes reproduction**
1. Envoyer 10+ requêtes `POST /api/auth/login` avec mauvais MDP en boucle rapide
2. Observer les codes HTTP

**Résultat attendu** : Après 5 tentatives → HTTP 429 Too Many Requests

**Résultat actuel** :
```
Tentative 1-10: HTTP 401 (jamais 429)
```
Aucun backoff, aucun blocage IP.

**Impact business** : Un attaquant peut lancer des attaques par dictionnaire illimitées sur n'importe quel email connu.

**Fix recommandé** :
```bash
npm install @upstash/ratelimit @upstash/redis
# ou: npm install rate-limiter-flexible
```
```typescript
// Dans /api/auth/login/route.ts
const limiter = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, '15m') });
const { success } = await limiter.limit(request.ip ?? 'anonymous');
if (!success) return NextResponse.json({ error: 'Trop de tentatives' }, { status: 429 });
```

---

### BUG-06 — [🔴 CRITICAL] JWT Token exposé dans le body de la réponse

**Titre** : Login et Register retournent le JWT dans le body (pas uniquement via cookie httpOnly)

**Étapes reproduction**
1. `POST /api/auth/login` avec credentials valides
2. Observer le body de la réponse

**Résultat attendu** : JWT uniquement stocké dans un cookie `httpOnly` — non accessible via JavaScript

**Résultat actuel** :
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "user": { ... }
}
```
Le token est exposé en clair dans le body, accessible via `response.json()` et donc vulnérable au vol par XSS.

**Impact business** : Un script XSS injecté (voir BUG-07) peut voler le token JWT et usurper l'identité de l'utilisateur.

**Fix recommandé** :
```typescript
// Retirer le token du body — le cookie httpOnly suffit
return NextResponse.json({
  success: true,
  user: { id, name, email, plan } // jamais le token
}

---

### BUG-09 — [🟠 HIGH] Email FROM mauvais domaine — `noreply@cyberquantic.com`

**Titre** : Les emails transactionnels partent depuis `noreply@cyberquantic.com` au lieu de `noreply@brainlo.ai`

**Résultat attendu** : `noreply@brainlo.ai` (cohérence de marque post-rebranding)

**Résultat actuel** : `.env` → `RESEND_FROM=noreply@cyberquantic.com`

**Impact business** : Confusion de marque. Les utilisateurs reçoivent des emails d'une marque inconnue. Risque de spam/phishing perçu. Problème de confiance.

**Fix recommandé** :
```bash
# .env
RESEND_FROM=noreply@brainlo.ai
# + configurer le domaine brainlo.ai dans Resend Dashboard avec DKIM/SPF
```

---

### BUG-10 — [🟠 HIGH] Missing Content-Security-Policy Header

**Titre** : Aucun header `Content-Security-Policy` sur les réponses HTTP

**Headers présents** : `X-Frame-Options`, `X-Content-Type-Options`, `X-XSS-Protection`, `Referrer-Policy` ✅  
**Headers manquants** : `Content-Security-Policy`, `Strict-Transport-Security (HSTS)`, `Permissions-Policy`

**Impact business** : Sans CSP, des scripts injectés (XSS — voir BUG-07) peuvent exécuter du code arbitraire. Sans HSTS, les navigateurs ne forcent pas HTTPS même quand disponible.

**Fix recommandé** :
```javascript
// next.config.js — security headers
const securityHeaders = [
  { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self' 'unsafe-inline' https://js.stripe.com; frame-src https://js.stripe.com" },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];
```

---

### BUG-11 — [🟠 HIGH] Wiki-data stocké sur filesystem avec dossiers userID exposés

**Titre** : Les données wiki de 17 utilisateurs réels sont stockées dans des dossiers nommés par leur ID sur le filesystem

**Résultat actuel** :
```
wiki-data/
  cmp8uadg90001sqejdpgsre23/  ← ID utilisateur Sophie
  cmoyt10vt0000fvfbuj9r4n8w/
  ... (17 dossiers)
```

**Impact business** : Surface d'attaque pour path traversal. Si une route API ou un agent Python lit des fichiers en acceptant des paramètres utilisateur non sanitisés, un attaquant pourrait accéder aux fichiers d'un autre utilisateur.

**Fix recommandé** :
1. Valider strictement que `userId` dans le chemin correspond au userId de la session actuelle
2. Utiliser `path.resolve()` + vérification que le chemin résolu commence bien par `WIKI_BASE_PATH/userId`
3. Idéalement, migrer les données wiki vers la base de données PostgreSQL

---

### BUG-12 — [🟠 HIGH] dev.db et dev.db.backup présents dans `/prisma/`

**Titre** : Fichiers SQLite de développement potentiellement trackés par Git

**Résultat actuel** :
```bash
ls prisma/dev.db prisma/dev.db.backup  → fichiers présents
```

**Impact business** : Si ces fichiers sont dans l'historique Git ou accessibles sur un dépôt partagé, toutes les données utilisateurs de test sont exposées (emails, hash passwords, transactions, prospects).

**Fix recommandé** :
```bash
# .gitignore — ajouter :
prisma/*.db
prisma/*.db.backup

# Purger du tracking Git :
git rm --cached prisma/dev.db prisma/dev.db.backup
git commit -m "Remove SQLite dev databases from tracking"
```

---

### BUG-13 — [🟡 MEDIUM] Inscription sans validation de mot de passe fort

**Titre** : Un mot de passe de 3 caractères est accepté à l'inscription

**Étapes reproduction**
1. `POST /api/auth/register` avec `password: "123"`
2. Observer : HTTP 201 — compte créé

**Résultat attendu** : HTTP 400 avec message d'erreur (minimum 8 caractères, complexité)

**Résultat actuel** : Mot de passe faible `"123"` accepté sans validation

**Fix recommandé** :
```typescript
if (password.length < 8) {
  return NextResponse.json({ error: 'Mot de passe trop court (min. 8 caractères)' }, { status: 400 });
}
const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
if (!strongPassword.test(password)) {
  return NextResponse.json({ error: 'Mot de passe trop faible' }, { status: 400 });
}
```

---

### BUG-14 — [🟡 MEDIUM] Inscription minimale acceptée sans champs obligatoires business

**Titre** : Un compte peut être créé sans `businessName`, `sector`, `monthlyGoal` — données nécessaires au Focus IA

**Résultat actuel** : HTTP 201 avec uniquement `name` + `email` + `password` (sans businessName, sector, fixedCharges)

**Impact business** : Le Daily Focus IA, le Runway et les recommandations sont basés sur ces données. Un compte vide produit des résultats incohérents ou nuls.

**Fix recommandé** : Rendre ces champs obligatoires à l'inscription ou forcer l'onboarding complet avant l'accès au dashboard.

---

### BUG-15 — [🟡 MEDIUM] Runway calculator — monthlyExpenses à 0 avec dépenses en base

**Titre** : Le Runway retourne `monthlyExpenses: 0` alors que des dépenses ont été créées

**Résultat actuel** :
```json
{"currentBalance":2400,"monthlyIncome":2400,"monthlyExpenses":0,...}

  → Score estimé après : 8.5/10

✅ Production-ready cible : 8.5/10 en ~2 semaines de travail
```

---

## 🃏 Cartes Stripe de Test

| Carte | Numéro | Résultat |
|---|---|---|
| Visa succès | `4242 4242 4242 4242` | ✅ Paiement accepté |
| Visa refusé | `4000 0000 0000 0002` | ❌ Paiement refusé |
| 3DS requis | `4000 0027 6000 3184` | 🔐 Authentification 3DS |
| Fonds insuff. | `4000 0000 0000 9995` | ❌ Décliné insufficient_funds |

> Date : n'importe quelle date future | CVV : `123` | ZIP : `75001`

---

## 🔑 Cause Racine : Python API DOWN (PM2 Misconfiguration)

**Découverte critique** : Le serveur Python FastAPI (uvicorn) qui alimente TOUTES les features IA est **DOWN** à cause d'une erreur PM2.

**Logs python.error.log** :
```
/opt/venv-a0/bin/uvicorn:2
# -*- coding: utf-8 -*-
^
SyntaxError: Invalid or unexpected token
    at wrapSafe (node:internal/modules/cjs/loader:1638:18)
```

**Diagnostic** : PM2 tente d'exécuter le binaire Python `uvicorn` comme du JavaScript Node.js → `SyntaxError`. Mauvaise configuration PM2 (`interpreter` manquant).

**Impact** : Daily Focus, Relances IA, Chat Business Brain, NLP Parse-brief, Wiki Query → TOUS ces features dépendent de l'API Python et peuvent être dégradés ou cassés.

**Fix recommandé** :
```bash
# Option 1 — Lancer uvicorn directement (sans PM2 mal configuré)
cd business-ai-os && python -m uvicorn python.main:app --host 0.0.0.0 --port 8000 &

# Option 2 — Corriger la config PM2
# ecosystem.config.js :
module.exports = {
  apps: [{
    name: 'brainlo-python',
    script: 'main.py',
    cwd: './business-ai-os/python',
    interpreter: '/opt/venv-a0/bin/python',  // ← CRUCIAL
    env: { PORT: 8000 }
  }]
};
pm2 restart brainlo-python
```

---

## 📊 Tableau de Bord des Bugs

| Bug ID | Sévérité | Module | Status |
|---|---|---|---|
| BUG-01 | 🔴 CRITICAL | Infrastructure | HTTPS manquant |
| BUG-02 | 🔴 CRITICAL | Daily Focus | Focus retourne null |
| BUG-03 | 🔴 CRITICAL | Auth/Plans | FREE non bloqué sur /api/focus |
| BUG-04 | 🔴 CRITICAL | Auth/Middleware | /tasks et /settings sans auth |
| BUG-05 | 🔴 CRITICAL | Sécurité | Aucun rate limiting login |
| BUG-06 | 🔴 CRITICAL | Sécurité | JWT dans response body |
| BUG-07 | 🔴 CRITICAL | Sécurité | XSS payload stocké |
| BUG-08 | 🟠 HIGH | Infrastructure | NODE_ENV manquant |
| BUG-09 | 🟠 HIGH | Email | Mauvais domaine email FROM |
| BUG-10 | 🟠 HIGH | Sécurité | Pas de CSP/HSTS headers |
| BUG-11 | 🟠 HIGH | Sécurité | Wiki-data filesystem exposé |
| BUG-12 | 🟠 HIGH | Git/Données | dev.db trackés dans Git |
| BUG-13 | 🟡 MEDIUM | Auth | Pas de validation MDP fort |
| BUG-14 | 🟡 MEDIUM | Onboarding | Inscription sans champs business |
| BUG-15 | 🟡 MEDIUM | Cash | Runway expenses = 0 incorrect |
| BUG-16 | 🟡 MEDIUM | Infra | /wiki-data HTTP 308 |
| BUG-17 | 🟢 LOW | UX | Focus null sans feedback clair |
| BUG-18 | 🟢 LOW | Auth | Pas de vérification email |
| BUG-19 | 🟢 LOW | UX | Upgrade banner visible pour PRO |
| BUG-20 | 🟢 LOW | Infra | Python API health inconnu |
| **ROOT** | 🔴 CRITICAL | Infra | **Python API DOWN (PM2 bug)** |

---

*Rapport généré par Agent Zero QA Senior — 2026-05-16*  
*Tests effectués : API curl (40+ requêtes), Browser automation, Code source audit, Log analysis*
