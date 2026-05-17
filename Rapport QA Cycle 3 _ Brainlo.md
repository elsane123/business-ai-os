# 🔬 Rapport QA Complet — Brainlo — Cycle 3

> **Date** : 17 Mai 2026  
> **Comptes test** : qa2.sophie@designstudio.fr (PRO) · qa2.marc@consulting.fr (PRO) · qa2.julie@agencecreative.com (FREE)  
> **Environnement** : http://51.159.164.33:50082 (dev) — PostgreSQL Neon  
> **Score global : 7.0 / 10** ⚠️  
> **Statut : NON production-ready** — 2 blockers critiques

---

## 📊 Synthèse

| Catégorie | Tests | ✅ Pass | ❌ Fail | ⚠️ Partiel |
|---|---|---|---|---|
| Landing page | 8 | 6 | 1 | 1 |
| Auth & Sécurité | 15 | 13 | 0 | 2 |
| Dashboard modules | 18 | 16 | 0 | 2 |
| Stripe / Paiements | 4 | 2 | 2 | 0 |
| Sécurité avancée | 8 | 7 | 0 | 1 |
| Performance | 5 | 4 | 1 | 0 |
| **TOTAL** | **58** | **48 (83%)** | **4 (7%)** | **6 (10%)** |

---

## 🔴 BUGS CRITIQUES

---

### BUG-QA3-01 — [CRITICAL] Stripe Checkout → HTTP 500 pour TOUS les utilisateurs

**Étapes reproduction**
1. Se connecter avec n'importe quel compte
2. Appeler `POST /api/stripe/checkout`

**Résultat attendu** : Création d'une session Stripe Checkout, retour d'une URL de paiement

**Résultat actuel** : `{"error":"Erreur lors de la création de la session"}` HTTP 500

**Impact business** : ❌ **ZÉRO revenu possible**. Aucun utilisateur FREE ne peut upgrader vers Solo Pro. Toute la monétisation est bloquée.

**Cause probable** :
- `NEXT_PUBLIC_APP_URL` pointe vers `http://localhost:50082` ou est non défini → URLs de succès/annulation invalides pour Stripe
- La clé `sk_live_51TM862...` est valide mais l'URL de callback ne correspond pas au domaine configuré dans le dashboard Stripe
- Le `STRIPE_WEBHOOK_SECRET=whsec_placeholder` n'est pas configuré réellement

**Fix recommandé** :
```bash
# Dans .env — corriger NEXT_PUBLIC_APP_URL
NEXT_PUBLIC_APP_URL=https://brainlo.ai  # ou http://51.159.164.33:50082
# Vérifier que le price_id existe dans le compte Stripe live
STRIPE_PRICE_ID_SOLO_PRO=price_1TVZgQ15CfWk772eyM3Uxms6
# Configurer le webhook réel dans dashboard Stripe
STRIPE_WEBHOOK_SECRET=whsec_REAL_SECRET_HERE
```

**Logs** : `{"error":"Erreur lors de la création de la session"}` HTTP 500

---

### BUG-QA3-02 — [CRITICAL] Champs de profil étendus non persistés à l'inscription

**Étapes reproduction**
1. Créer un compte avec tous les champs étendus (city, siret, legalName, vatNumber, activityType, urssafRate, paymentTerms, address, zipCode)
2. Appeler `GET /api/auth/me`

**Résultat attendu** : Tous les champs retournés avec les valeurs saisies

**Résultat actuel** : `city=None siret=None vatNumber=None legalName=None` — tous null

**Impact business** : Les utilisateurs doivent remplir leur profil en 2 temps (inscription + settings). Génération de devis/factures incorrecte. URSSAF et TVA non configurés.

**Cause probable** : Le handler `POST /api/auth/register` ne sauvegarde que les champs de base (`name, email, passwordHash, businessName, sector, monthlyGoal, fixedCharges`). Les champs étendus sont ignorés.

**Fix recommandé** :
```typescript
// app/api/auth/register/route.ts — ajouter dans data:
const user = await prisma.user.create({
  data: {
    name, email, passwordHash,
    businessName, sector,
    monthlyGoal: monthlyGoal ? parseFloat(monthlyGoal) : 0,
    fixedCharges: fixedCharges ? parseFloat(fixedCharges) : 0,
    // Champs étendus manquants:
    legalName: legalName || null,
    address: address || null,
    zipCode: zipCode || null,
    city: city || null,
    siret: siret || null,
    legalForm: legalForm || null,
    activityType: activityType || null,
    urssafRate: urssafRate ? parseFloat(urssafRate) : null,
    vatNumber: vatNumber || null,
    paymentTerms: paymentTerms ? parseInt(paymentTerms) : 30,
  }
})
```

---

## 🟠 BUGS HIGH

---

### BUG-QA3-03 — [HIGH] Page /blog — Temps de chargement : 3.9 secondes

**Étapes reproduction** : Naviguer vers `/blog`

**Résultat attendu** : < 1 seconde (comme `/` → 0.17s)

**Résultat actuel** : 3.9 secondes (23x plus lent que la home page)

**Impact business** : Taux de rebond élevé. Impact négatif sur le référencement SEO (Core Web Vitals). Mauvaise expérience utilisateur.

**Cause probable** : Rendu serveur des articles de blog sans cache. Probablement lecture de fichiers Markdown au runtime sans cache statique.

**Fix recommandé** : Activer le cache statique Next.js (`generateStaticParams`), ajouter `export const revalidate = 86400` sur les pages blog, ou utiliser ISR.

---

### BUG-QA3-04 — [HIGH] Pas de HTTPS — Données transmises en clair

**Étapes reproduction** : Accéder à http://51.159.164.33:50082 (HTTP)

**Résultat attendu** : Toutes les communications via HTTPS avec certificat valide

**Résultat actuel** : HTTP en clair. Les cookies d'authentification, mots de passe et données business transitent sans chiffrement.

**Impact business** : RGPD violation potentielle. Interception réseau possible (MITM). Les navigateurs modernes afficheront une alerte de sécurité sur brainlo.ai.

**Cause probable** : Caddy/Nginx + Certbot non configuré sur le serveur de production.

**Fix recommandé** :
```bash
# Caddy (le plus simple)
apt install caddy
cat > /etc/caddy/Caddyfile << 'EOF'
brainlo.ai {
  reverse_proxy localhost:50082
}
EOF
systemctl start caddy
```

---

### BUG-QA3-05 — [HIGH] Cookie auth_token sans flag Secure (HTTP uniquement)

**Étapes reproduction** : Intercepter les headers de réponse de `POST /api/auth/login`

**Résultat attendu** : `Set-Cookie: auth_token=...; HttpOnly; Secure; SameSite=Lax`

**Résultat actuel** : Cookie posé mais sans flag `Secure` visible (HTTP non HTTPS)

**Impact business** : En production HTTP, le cookie peut être transmis sur des connexions non sécurisées, rendant le token volable par interception réseau.

**Cause probable** : Next.js ne pose pas `Secure` automatiquement en `NODE_ENV=development` ou sans HTTPS.

**Fix recommandé** : Déployer HTTPS (voir BUG-QA3-04). En mode production, vérifier que le cookie a `Secure: true` dans `lib/auth.ts`.

---

## 🟡 BUGS MEDIUM

---

### BUG-QA3-06 — [MEDIUM] Stripe Portal HTTP 400 pour utilisateurs PRO sans stripeCustomerId

**Étapes reproduction** :
1. Créer un compte et se mettre en PRO via la DB
2. Appeler `POST /api/stripe/portal`

**Résultat attendu** : Accès au portail de gestion d'abonnement Stripe

**Résultat actuel** : `{"error":"Aucun abonnement Stripe trouvé. Veuillez d'abord souscrire."}
---

### BUG-QA3-07 — [MEDIUM] /register → HTTP 308 (Pas de page dédiée)

**Résultat attendu** : Page /register accessible (HTTP 200) avec formulaire d'inscription
**Résultat actuel** : HTTP 308 redirect permanente
**Fix** : Créer `app/(auth)/register/page.tsx` ou utiliser 302 vers /onboarding

---

### BUG-QA3-08 — [MEDIUM] sitemap.xml inclut /onboarding (page privée)

**Résultat attendu** : Sitemap = pages publiques uniquement
**Résultat actuel** : `<loc>https://brainlo.ai/onboarding</loc>` présent dans le sitemap
**Fix** : Retirer /onboarding de `app/sitemap.ts`

---

## 🟢 BUGS LOW

### BUG-QA3-09 — [LOW] dev.db et dev.db.backup présents dans prisma/

**Fix** : `rm prisma/dev.db prisma/dev.db.backup` — données maintenant sur Neon PostgreSQL

### BUG-QA3-10 — [LOW] Chat response format non documenté (clé `message.content` vs `reply`)

**Résultat actuel** : `{"message":{"role":"ASSISTANT","content":"..."}}`
**Fix** : Documenter le format ou normaliser la réponse

---

## ✅ Régressions précédentes — TOUTES CONFIRMÉES RÉSOLUES

| Feature | Test | Résultat |
|---|---|---|
| JWT absent du body login | token_in_body=False | ✅ |
| Rate limiting | 429 au 6ème essai | ✅ |
| IDOR protection | Marc voit 0 prospects Sophie | ✅ |
| Invalid cookie | 401 | ✅ |
| Routes protégées (7) | 307 redirect | ✅ |
| SQL injection | 401 | ✅ |
| XSS login | 400 | ✅ |
| CORS | non reflété | ✅ |
| Source maps | 404 | ✅ |
| Headers sécurité | CSP + 5 headers | ✅ |
| Daily Focus PRO | 3 actions IA générées | ✅ |
| Daily Focus FREE | 403 | ✅ |
| Pipeline CRUD | POST/PATCH/DELETE | ✅ |
| Relance IA | OK | ✅ |
| Cash transactions | OK | ✅ |
| NLP parse-brief | loyer 1200€ → EXPENSE | ✅ |
| Runway 3 scénarios | OK | ✅ |
| Quotes (quantity) | totalTTC=6480 | ✅ |
| Invoices (quantity) | totalTTC=7200 | ✅ |
| Chat Business Brain | Réponse IA OK | ✅ |
| Wiki/KB query | 2 résultats | ✅ |
| Assessment public | HTTP 200 | ✅ |
| Agents catalog | 7 agents | ✅ |
| Tasks prioritize | HTTP 200 prioritized=1 | ✅ |
| Forgot/reset password | Token requis, email envoyé | ✅ |
| Webhook sans signature | 400 | ✅ |
| robots.txt | 200 | ✅ |
| sitemap.xml | 200 | ✅ |

---

## ⚡ Quick Wins — Top 5 corrections immédiates

| Priorité | Action | Temps |
|---|---|---|
| 1 | Fix Stripe checkout (NEXT_PUBLIC_APP_URL + vérifier price_id dans Stripe dashboard) | 15 min |
| 2 | Fix register → sauvegarder champs étendus (city, siret, legalName, etc.) | 30 min |
| 3 | Configurer HTTPS (Caddy + Let's Encrypt) | 30 min |
| 4 | Optimiser /blog (revalidate + cache statique) | 1h |
| 5 | Retirer /onboarding du sitemap.xml | 5 min |

---

## 📈 Progression QA globale

| Cycle | Score | Statut |
|---|---|---|
| Cycle 1 (initial) | 4.5/10 | ❌ |
| Cycle 2 (sécurité) | 6.5/10 | ⚠️ |
| Sprints 1-2-3 | 8.5/10 | ✅ |
| Cycle 3 (complet) | **7.0/10** | ⚠️ |
| **Après 5 quick wins** | **8.5/10** | ✅ |

> Le score Cycle 3 est à 7.0 (vs 8.5 post-sprints) car 2 nouveaux bugs critiques ont été découverts :
> Stripe Checkout 500 (config NEXT_PUBLIC_APP_URL) + Champs profil non persistés à l'inscription

---

## 🚨 Risques critiques avant production publique

1. 🔴 **Stripe cassé** → 0 revenu possible
2. 🔴 **Pas de HTTPS** → RGPD violation, alerte navigateur
3. 🟠 **Profil incomplet** → devis/factures sans coordonnées
4. 🟠 **DATABASE_URL** en clair dans .env → credentials Neon exposés si repo public

---

*Rapport généré automatiquement — Agent Zero QA — Brainlo Cycle 3 — 17 Mai 2026*
