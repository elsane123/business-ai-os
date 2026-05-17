# 🧪 Plan de Test — Brainlo
## Persona : Le Solopreneur Actif (Solo Pro 29€/mois)

> **Objectif** : Valider que chaque fonctionnalité Solo Pro fonctionne de bout en bout pour un freelance/consultant établi avec 3 000–10 000€/mois de CA.

---

## 🔑 Credentials & URLs

| Item | Valeur |
|---|---|
| **URL App** | http://51.159.164.33:50082 |
| **Compte PRO (existant)** | `demo@brainlo.ai` / `Demo1234!` |
| **Compte FREE (test upgrade)** | Créer via `/onboarding` |
| **Python API** | http://51.159.164.33:8000 |

---

## 📋 MODULE 1 — Authentification & Onboarding

### TC-AUTH-01 — Inscription nouveau compte

| Champ | Détail |
|---|---|
| **Priorité** | 🔴 Critique |
| **URL** | `/onboarding` |

**Étapes :**
1. Ouvrir `/onboarding`
2. Étape 1 : nom, email unique, mot de passe (8+ chars, 1 maj, 1 chiffre)
3. Étape 2 : nom du business, secteur (ex: Conseil)
4. Étape 3 : objectif CA mensuel (ex: 5000), charges fixes (ex: 800)
5. Cliquer "Créer mon compte"

**Résultat attendu :**
- ✅ Redirection vers `/focus`
- ✅ Cookie `auth_token` présent
- ✅ Wiki utilisateur créé dans `wiki-data/{userId}/`
- ✅ `BRAIN.md` initialisé avec les données onboarding

---

### TC-AUTH-02 — Login compte existant

| Champ | Détail |
|---|---|
| **Priorité** | 🔴 Critique |
| **URL** | `/login` |

**Étapes :**
1. Saisir `demo@brainlo.ai` / `Demo1234!`
2. Cliquer "Se connecter"

**Résultat attendu :**
- ✅ Redirection vers `/focus`
- ✅ Plan PRO visible, pas d'UpgradeBanner

```bash
curl -s -X POST http://51.159.164.33:50082/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"demo@brainlo.ai","password":"Demo1234!"}' \
  -c /tmp/cookies.txt | jq .
# Attendu : {"user":{...}, "token":"eyJ..."} HTTP 200
```

---

### TC-AUTH-03 — Protection des routes

**Étapes :** Accéder sans auth à `/focus`, `/pipeline`, `/cash`

**Résultat attendu :** ✅ Redirection vers `/login` dans tous les cas

---

### TC-AUTH-04 — Doublon email

**Étapes :** Créer un compte avec `demo@brainlo.ai` (déjà existant)

**Résultat attendu :**
- ✅ Redirection vers `/login?email=demo@brainlo.ai`
- ✅ Banner "Ce compte existe déjà" + email pré-rempli

---

## 📋 MODULE 2 — Daily Focus ⚡

### TC-FOCUS-01 — Génération des 3 actions IA

| Champ | Détail |
|---|---|
| **Priorité** | 🔴 Critique |
| **Plan requis** | Solo Pro |

**Étapes :**
1. Connecté en PRO, aller sur `/focus`
2. Observer le chargement du Daily Focus

**Résultat attendu :**
- ✅ Exactement 3 actions (icône + texte + bouton)
- ✅ Priorisation : Cash > Clients > Visibilité
- ✅ Date du jour affichée sans erreur d'hydration

```bash
TOKEN=$(curl -s -X POST http://51.159.164.33:50082/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"demo@brainlo.ai","password":"Demo1234!"}' | jq -r '.token')

curl -s -X POST http://51.159.164.33:50082/api/focus \
  -H "Authorization: Bearer $TOKEN" | jq .
# Attendu : {"actions":[{"priority":1,"icon":"💰","text":"..."},...]} HTTP 200
```

---

### TC-FOCUS-02 — Persistance (pas de re-génération)

**Étapes :** Générer un focus → F5 → naviguer ailleurs → revenir

**Résultat attendu :** ✅ Mêmes 3 actions, pas de nouvel appel LLM ce jour

---

### TC-FOCUS-03 — Blocage plan FREE

**Étapes :** Se connecter avec un compte FREE, accéder à `/focus`

**Résultat attendu :**
- ✅ UpgradeBanner visible
- ✅ API `/api/focus` → HTTP 403 `{"upgradeRequired": true}`

---

## 📋 MODULE 3 — Trésorerie & Runway 💰

### TC-CASH-01 — Affichage KPIs

| Champ | Détail |
|---|---|
| **Priorité** | 🔴 Critique |
| **Plan requis** | Gratuit+ |

**Résultat attendu :**
- ✅ Solde actuel, Revenus, Charges, Barre de progression CA
- ✅ Couleur barre : 🟢 >80% · 🟡 50-80% · 🔴 <50%

---

### TC-CASH-02 — Ajout transaction

**Étapes :** Cliquer "+ Ajouter", saisir montant 1500, type INCOME, catégorie "Prestation", valider

**Résultat attendu :** ✅ Transaction dans la liste, KPIs recalculés

```bash
curl -s -X POST http://51.159.164.33:50082/api/cash/transactions \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"amount":1500,"type":"INCOME","category":"Prestation","description":"Mission Acme"}' | jq .
# Attendu : HTTP 201
```

---

### TC-CASH-03 — Suppression transaction

**Étapes :** Cliquer poubelle sur une transaction, confirmer

**Résultat attendu :** ✅ Transaction supprimée, KPIs mis à jour

---

### TC-CASH-04 — Runway Calculator (3 scénarios)

**Résultat attendu :**
- ✅ **Pessimiste** : 0% revenus → mois restants + date limite
- ✅ **Réaliste** : moyenne 3 derniers mois
- ✅ **Optimiste** : +20% sur la moyenne
- ✅ Alerte rouge si < 2 mois (pessimiste)

```bash
curl -s http://51.159.164.33:50082/api/cash/runway \
  -H "Authorization: Bearer $TOKEN" | jq .
# Attendu : {"pessimistic":{"months":X,"until":"..."},"realistic":{...},"optimistic":{...}}
```

---

### TC-CASH-05 — Alerte objectif en danger

**Résultat attendu :** ✅ Si revenus < 50% objectif → message d'alerte contextuel visible

---

## 📋 MODULE 4 — Pipeline Kanban 👥

### TC-PIPE-01 — Affichage colonnes

| Champ | Détail |
|---|---|
| **Priorité** | 🔴 Critique |
| **Plan requis** | Solo Pro |

**Résultat attendu :**
- ✅ 5 colonnes : `Prospect → Contacté → Devis envoyé → Négociation → Gagné/Perdu`
- ✅ Heat badges 🔴🟡🟢 selon ancienneté du dernier contact

---

### TC-PIPE-02 — Ajout prospect

**Étapes :** Cliquer "+ Nouveau", saisir nom "Sophie Durand", entreprise, email, valeur 3500€, valider

**Résultat attendu :**
- ✅ Prospect dans colonne "Prospect"
- ✅ Page wiki `wiki-data/{userId}/prospects/sophie-durand.md` créée

```bash
curl -s -X POST http://51.159.164.33:50082/api/pipeline/prospects \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"name":"Sophie Durand","company":"DigitalCorp","email":"sophie@dc.fr","value":3500,"status":"PROSPECT"}' | jq .
# Attendu : HTTP 201
```

---

### TC-PIPE-03 — Déplacement de colonne (Drag & Drop)

**Étapes :** Glisser-déposer un prospect de "Prospect" vers "Contacté"

**Résultat attendu :**
- ✅ Prospect dans la nouvelle colonne immédiatement
- ✅ Statut mis à jour en base de données
- ✅ Wiki prospect mis à jour avec le nouveau statut

---

### TC-PIPE-04 — Relance IA en 1 clic

| Champ | Détail |
|---|---|
| **Priorité** | 🔴 Critique |
| **Plan requis** | Solo Pro |

**Étapes :**
1. Cliquer l'icône relance ⚡ sur un prospect
2. Observer la génération du message

**Résultat attendu :**
- ✅ Message personnalisé (nom du prospect + contexte deal)
- ✅ Bouton "Copier" fonctionnel
- ✅ Wiki prospect mis à jour avec trace de la relance

```bash
curl -s -X POST http://51.159.164.33:50082/api/pipeline/relance \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"prospectId":"PROSPECT_ID"}' | jq .
# Attendu : {"message":"Bonjour Sophie..."} HTTP 200
```

---

### TC-PIPE-05 — Blocage relance IA sur FREE

**Étapes :** Avec compte FREE, tenter une relance IA

**Résultat attendu :** ✅ HTTP 403 `{"upgradeRequired": true}`

---

### TC-PIPE-06 — Limite 3 prospects sur FREE

**Étapes :** Avec compte FREE, tenter d'ajouter un 4ème prospect

**Résultat attendu :** ✅ Erreur "Limite de 3 prospects atteinte — passez à Solo Pro"

---

## 📋 MODULE 5 — Chat Business Brain 🧠

### TC-CHAT-01 — Interface de chat

| Champ | Détail |
|---|---|
| **Priorité** | 🔴 Critique |
| **Plan requis** | Solo Pro |

**Étapes :** Aller sur `/chat`, observer l'interface

**Résultat attendu :**
- ✅ Zone de saisie + historique des messages
- ✅ Bulles utilisateur (droite) vs IA (gauche)
- ✅ Avatar distinct pour chaque rôle

---

### TC-CHAT-02 — Question sur données cash

**Étapes :** Saisir "Puis-je me payer 500€ ce mois ?"

**Résultat attendu :**
- ✅ Réponse en < 10 secondes
- ✅ Réponse basée sur le solde réel (pas une réponse générique)
- ✅ Mention du solde ou du runway actuel

```bash
curl -s -X POST http://51.159.164.33:50082/api/chat \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"message":"Puis-je me payer 500€ ce mois ?"}' | jq .
# Attendu : {"response":"Avec votre solde actuel de..."} HTTP 200

---

### TC-CHAT-03 — Question sur pipeline

**Étapes :** Saisir "Qui dois-je relancer en priorité ?"

**Résultat attendu :**
- ✅ Réponse nomme un prospect réel du pipeline
- ✅ Mention de l'ancienneté du dernier contact ou du montant du deal
- ✅ Réponse contextuelle (pas une réponse générique)

---

### TC-CHAT-04 — Persistance de l'historique

**Étapes :**
1. Poser 3 questions de suite
2. Rafraîchir la page (F5)
3. Ouvrir `/chat` dans un nouvel onglet

**Résultat attendu :**
- ✅ Historique complet visible après F5
- ✅ Contexte conservé — le chat se souvient des échanges précédents

---

### TC-CHAT-05 — Blocage plan FREE

**Étapes :** Avec compte FREE, accéder à `/chat`

**Résultat attendu :** ✅ UpgradeBanner affiché, zone de saisie désactivée

---

## 📋 MODULE 6 — LinkedIn Generator 📣

### TC-LK-01 — Génération d'un post

| Champ | Détail |
|---|---|
| **Priorité** | 🔴 Critique |
| **Plan requis** | Gratuit (4/mois) · Pro (illimité) |

**Étapes :**
1. Aller sur `/content`
2. Sélectionner un type de post (ex: Expertise)
3. Cliquer "Générer"

**Résultat attendu :**
- ✅ Post généré en moins de 15 secondes
- ✅ Contenu basé sur le secteur et l'expertise réels (pas générique)
- ✅ Format LinkedIn : accroche + corps + CTA + hashtags
- ✅ Bouton "Copier" fonctionnel

```bash
curl -s -X POST http://51.159.164.33:50082/api/content/generate \
  -H "Authorization: Bearer TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"postType":"expertise"}' | jq .
# Attendu : {"content":"...","id":"..."} HTTP 200
```

---

### TC-LK-02 — Rotation des 5 types de posts

**Étapes :** Générer un post de chaque type : Expertise · Victoire client · Apprentissage · Point de vue · Storytelling

**Résultat attendu :**
- ✅ Chaque type produit un post distinct dans le bon format
- ✅ Ton adapté : informatif / célébration / réflexif / opinion / narratif

---

### TC-LK-03 — Historique des posts générés

**Étapes :** Générer 3 posts, puis observer la liste historique

**Résultat attendu :**
- ✅ Les 3 posts apparaissent dans l'historique avec date et statut DRAFT
- ✅ Chaque post affiche le type et un aperçu du contenu

---

### TC-LK-04 — Limite 4 posts/mois sur FREE

**Étapes :** Avec compte FREE, générer un 5ème post dans le même mois

**Résultat attendu :** ✅ Message "Limite de 4 posts/mois atteinte — passez à Solo Pro"

---

### TC-LK-05 — Illimité sur Solo Pro

**Étapes :** Avec compte PRO, générer 10 posts consécutifs

**Résultat attendu :** ✅ Aucune limite, chaque post se génère normalement

---

## 📋 MODULE 7 — LLM Wiki (Business Brain Memory) 🧠

### TC-WIKI-01 — Initialisation au register

**Étapes :** Créer un nouveau compte et vérifier le wiki

**Résultat attendu :**
- ✅ Dossier `wiki-data/{userId}/` créé avec tous les sous-dossiers
- ✅ Fichiers présents : `BRAIN.md`, `index.md`, `log.md`
- ✅ `BRAIN.md` contient les données d'onboarding (secteur, CA cible, charges)

```bash
ls -la /a0/usr/projects/business_ai_os/brainlo/wiki-data/{USER_ID}/
cat /a0/usr/projects/business_ai_os/brainlo/wiki-data/{USER_ID}/BRAIN.md
```

---

### TC-WIKI-02 — Mise à jour après ajout de prospect

**Étapes :** Ajouter un prospect "Marc Dupont" via `/pipeline`

**Résultat attendu :**
- ✅ Fichier `wiki-data/{userId}/prospects/marc-dupont.md` créé
- ✅ Contient : nom, entreprise, valeur deal, date, statut initial

---

### TC-WIKI-03 — Mise à jour après transaction

**Étapes :** Ajouter une transaction 2000€ INCOME, puis vérifier `finance/patterns.md`

**Résultat attendu :**
- ✅ `finance/patterns.md` mis à jour avec la nouvelle transaction
- ✅ `log.md` contient une entrée chronologique de l'événement

---

### TC-WIKI-04 — Contexte wiki injecté dans le chat

**Étapes :**
1. Ajouter un prospect "Julie Chen" avec une note spécifique
2. Dans le chat, demander "Parle-moi de Julie Chen"

**Résultat attendu :**
- ✅ Le chat mentionne Julie Chen avec des détails issus du wiki
- ✅ Pas de réponse "Je n'ai pas cette information"

---

### TC-WIKI-05 — Pertinence BM25 (recherche contextuelle)

**Étapes :** Dans le chat, demander "Quel est mon meilleur deal en cours ?"

**Résultat attendu :**
- ✅ La réponse cite le deal avec la plus haute valeur du pipeline réel
- ✅ Cohérence avec les données en base de données

---

## 📋 MODULE 8 — Stripe et Upgrade 💳

### TC-STRIPE-01 — Bouton upgrade FREE vers PRO

| Champ | Détail |
|---|---|
| **Priorité** | 🔴 Critique |
| **Plan requis** | Compte FREE |

**Étapes :**
1. Connecté en compte FREE, observer le UpgradeBanner
2. Cliquer "Passer à Solo Pro"

**Résultat attendu :**
- ✅ Redirection vers Stripe Checkout (URL `checkout.stripe.com`)
- ✅ Plan "Solo Pro — 29€/mois" visible dans la page Stripe

```bash
curl -s -X POST http://51.159.164.33:50082/api/stripe/checkout \
  -H "Authorization: Bearer TOKEN_FREE" \
  -H 'Content-Type: application/json' | jq .
# Attendu : {"url":"https://checkout.stripe.com/..."} HTTP 200
```

---

### TC-STRIPE-02 — Webhook activation PRO

**Étapes :** Simuler un paiement réussi via Stripe CLI

```bash
stripe trigger checkout.session.completed
```

**Résultat attendu :**
- ✅ Plan utilisateur mis à jour en PRO dans la DB
- ✅ UpgradeBanner disparaît au prochain chargement
- ✅ Daily Focus et relances IA débloqués immédiatement

---

### TC-STRIPE-03 — Portal de gestion abonnement

**Étapes :** Accéder à la page de gestion abonnement depuis les Settings

**Résultat attendu :**
- ✅ Redirection vers le portail Stripe
- ✅ Options disponibles : changer plan, annuler, voir factures

```bash
curl -s -X POST http://51.159.164.33:50082/api/stripe/portal \
  -H "Authorization: Bearer TOKEN" | jq .
# Attendu : {"url":"https://billing.stripe.com/..."}

# Attendu : {"url":"https://billing.stripe.com/..."} HTTP 200
```

---

### TC-STRIPE-04 — Downgrade vers FREE après annulation

**Étapes :** Simuler l'événement `customer.subscription.deleted` via webhook Stripe

**Résultat attendu :**
- ✅ Plan repassé à FREE dans la DB
- ✅ Features PRO bloquées (403 sur `/api/focus`)
- ✅ UpgradeBanner réapparaît au prochain chargement

---

## 📊 Récapitulatif — Matrice de Tests

| ID | Module | Test | Priorité | Plan | Statut |
|---|---|---|---|---|---|
| TC-AUTH-01 | Auth | Inscription nouveau compte | 🔴 Critique | Tous | ⬜ |
| TC-AUTH-02 | Auth | Login compte existant | 🔴 Critique | Tous | ⬜ |
| TC-AUTH-03 | Auth | Protection des routes | 🔴 Critique | Tous | ⬜ |
| TC-AUTH-04 | Auth | Doublon email | 🟡 Important | Tous | ⬜ |
| TC-FOCUS-01 | Daily Focus | Génération 3 actions IA | 🔴 Critique | PRO | ⬜ |
| TC-FOCUS-02 | Daily Focus | Persistance du focus | 🟡 Important | PRO | ⬜ |
| TC-FOCUS-03 | Daily Focus | Blocage FREE | 🔴 Critique | FREE | ⬜ |
| TC-CASH-01 | Cash | Affichage KPIs | 🔴 Critique | Tous | ⬜ |
| TC-CASH-02 | Cash | Ajout transaction | 🔴 Critique | Tous | ⬜ |
| TC-CASH-03 | Cash | Suppression transaction | 🟡 Important | Tous | ⬜ |
| TC-CASH-04 | Cash | Runway 3 scénarios | 🔴 Critique | Tous | ⬜ |
| TC-CASH-05 | Cash | Alerte objectif | 🟡 Important | Tous | ⬜ |
| TC-PIPE-01 | Pipeline | Affichage colonnes | 🔴 Critique | PRO | ⬜ |
| TC-PIPE-02 | Pipeline | Ajout prospect | 🔴 Critique | PRO | ⬜ |
| TC-PIPE-03 | Pipeline | Drag and Drop colonne | 🟡 Important | PRO | ⬜ |
| TC-PIPE-04 | Pipeline | Relance IA 1 clic | 🔴 Critique | PRO | ⬜ |
| TC-PIPE-05 | Pipeline | Blocage relance FREE | 🔴 Critique | FREE | ⬜ |
| TC-PIPE-06 | Pipeline | Limite 3 prospects FREE | 🔴 Critique | FREE | ⬜ |
| TC-CHAT-01 | Chat | Interface chat | 🔴 Critique | PRO | ⬜ |
| TC-CHAT-02 | Chat | Question données cash | 🔴 Critique | PRO | ⬜ |
| TC-CHAT-03 | Chat | Question pipeline | 🔴 Critique | PRO | ⬜ |
| TC-CHAT-04 | Chat | Persistance historique | 🟡 Important | PRO | ⬜ |
| TC-CHAT-05 | Chat | Blocage plan FREE | 🔴 Critique | FREE | ⬜ |
| TC-LK-01 | LinkedIn | Génération post | 🔴 Critique | Tous | ⬜ |
| TC-LK-02 | LinkedIn | Rotation 5 types | 🟡 Important | Tous | ⬜ |
| TC-LK-03 | LinkedIn | Historique posts | 🟡 Important | Tous | ⬜ |
| TC-LK-04 | LinkedIn | Limite 4/mois FREE | 🔴 Critique | FREE | ⬜ |
| TC-LK-05 | LinkedIn | Illimité PRO | 🟡 Important | PRO | ⬜ |
| TC-WIKI-01 | Wiki | Init au register | 🔴 Critique | Tous | ⬜ |
| TC-WIKI-02 | Wiki | MAJ après prospect | 🔴 Critique | Tous | ⬜ |
| TC-WIKI-03 | Wiki | MAJ après transaction | 🟡 Important | Tous | ⬜ |
| TC-WIKI-04 | Wiki | Contexte injecté chat | 🔴 Critique | PRO | ⬜ |
| TC-WIKI-05 | Wiki | Pertinence BM25 | 🟡 Important | PRO | ⬜ |
| TC-STRIPE-01 | Stripe | Bouton upgrade FREE→PRO | 🔴 Critique | FREE | ⬜ |
| TC-STRIPE-02 | Stripe | Webhook activation PRO | 🔴 Critique | FREE | ⬜ |
| TC-STRIPE-03 | Stripe | Portal gestion abonnement | 🟡 Important | PRO | ⬜ |
| TC-STRIPE-04 | Stripe | Downgrade après annulation | 🔴 Critique | PRO | ⬜ |

---

## 🏁 Critères de Validation — Definition of Done

### ✅ Prêt pour Beta privée si :
- Tous les tests 🔴 Critique passent
- 0 erreur HTTP 500 en navigation normale
- Temps de réponse LLM < 15 secondes
- Wiki créé automatiquement à l'inscription
- Upgrade Stripe fonctionnel de bout en bout

### ⚠️ Acceptable avec dette technique si :
- Tests 🟡 Important échouent (non bloquant)
- Drag & Drop non fluide sur mobile
- Historique chat limité à 20 messages

### ❌ Bloquant (ne pas shipper si) :
- Auth token exposé côté client
- Données d'un user visibles par un autre
- Stripe webhook non sécurisé
- Wiki non créé à l'inscription → Daily Focus vide

---

## 🚀 Ordre d'Exécution Recommandé

```
1. TC-AUTH-01 → TC-AUTH-04   (fondation)
2. TC-CASH-01 → TC-CASH-05   (module gratuit, rapide à valider)
3. TC-FOCUS-01 → TC-FOCUS-03 (feature PRO core)
4. TC-PIPE-01 → TC-PIPE-06   (pipeline complet)
5. TC-WIKI-01 → TC-WIKI-05   (mémoire IA)
6. TC-CHAT-01 → TC-CHAT-05   (intelligence)
7. TC-LK-01 → TC-LK-05       (contenu)
8. TC-STRIPE-01 → TC-STRIPE-04 (monetisation)
```

---

*Document généré par Brainlo Agent — Mai 2026*
