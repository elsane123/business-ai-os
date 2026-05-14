# 🧪 Business AI OS — Stratégie de Tests Complète

> **Version** : 1.0 | **Date** : 10 mai 2026 | **URL** : http://51.159.164.33:50082
> **Compte demo** : `demo@businessaios.com` / `Demo1234!`

---

## 📋 Vue d'ensemble — Statut des modules

| # | Module | URL | Statut | Priorité |
|---|---|---|---|---|
| 1 | Authentification | `/login`, `/onboarding` | ✅ Livré | 🔴 Critique |
| 2 | Daily Focus | `/focus` | ✅ Livré | 🔴 Critique |
| 3 | Module Cash | `/cash` | ✅ Livré | 🔴 Critique |
| 4 | Pipeline Kanban | `/pipeline` | ✅ Livré | 🔴 Critique |
| 5 | Chat Business Brain | `/chat` | ✅ Livré | 🟡 Haute |
| 6 | LLM Wiki | interne | ✅ Livré | 🟡 Haute |

---

## 🔐 Module 1 — Authentification

### Onboarding (`/onboarding`)

| # | Test | Action | Résultat attendu |
|---|---|---|---|
| 1.1 | Boot screen | Charger `/onboarding` | Animation orbe IA 2.7s → formulaire étape 1 |
| 1.2 | Inscription complète | Remplir 4 étapes → soumettre | Redirect `/focus`, wiki créé dans `wiki-data/{userId}/` |
| 1.3 | Email déjà utilisé | Soumettre `demo@businessaios.com` | Redirect `/login?email=demo@...&fromRegister=true` avec banner bleu |
| 1.4 | Champs vides | Soumettre sans nom | Erreur de validation, formulaire bloque |
| 1.5 | Wiki initialisé | Vérifier après inscription | `BRAIN.md`, `index.md`, `log.md` + 4 dossiers créés |

```bash
# Test register API
curl -X POST http://51.159.164.33:50082/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"name":"Test","email":"nouveau@test.com","password":"Test1234!","businessName":"MaCo","sector":"Tech"}'
# → HTTP 201 | {success:true, token:"...", user:{id,email,plan:"FREE"}}
```

### Login (`/login`)

| # | Test | Action | Résultat attendu |
|---|---|---|---|
| 1.6 | Login valide | Email + MDP corrects | Redirect `/focus`, cookie `auth_token` httpOnly posé |
| 1.7 | Mauvais MDP | MDP incorrect | Message "Email ou mot de passe incorrect" |
| 1.8 | Email inconnu | Email non inscrit | Message d'erreur |
| 1.9 | Email pré-rempli | `/login?email=x@x.com&fromRegister=true` | Email pré-rempli + banner bleu |
| 1.10 | Redirect connecté | Accéder `/login` avec cookie valide | Redirect `/focus` automatique |

### Sécurité

| # | Test | Action | Résultat attendu |
|---|---|---|---|
| 1.11 | Middleware sans auth | Accéder `/focus` sans cookie | Redirect `/login` |
| 1.12 | Logout | `POST /api/auth/logout` | Cookie effacé, accès protégé bloqué |
| 1.13 | Isolation données | Login 2 comptes différents | Chaque user voit uniquement ses données |

---

## ⚡ Module 2 — Daily Focus (`/focus`)

| # | Test | Action | Résultat attendu |
|---|---|---|---|
| 2.1 | Chargement page | Accéder `/focus` | Date du jour visible, no hydration error |
| 2.2 | État vide | Pas de focus aujourd'hui | Bouton "✨ Générer mon focus" visible |
| 2.3 | Générer focus | Cliquer "Générer" | Spinner 2-5s → 3 actions affichées avec priorités |
| 2.4 | Contenu contextuel | Lire les actions | Noms réels (Acme Corp, etc.) mentionnés |
| 2.5 | Structure action | Inspecter une action | Titre + description + priorité (Haute/Moyenne/Faible) + durée estimée |
| 2.6 | Persistance | Recharger page | Focus rechargé depuis DB (pas de nouveau LLM call) |
| 2.7 | Régénérer | Cliquer "Regénérer ✨" | Nouvelles actions générées et remplacent les précédentes |

```bash
TOKEN=$(curl -s -X POST http://51.159.164.33:50082/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"demo@businessaios.com","password":"Demo1234!"}' \
  | python3 -c 'import sys,json; print(json.load(sys.stdin)["token"])')

curl -X POST http://51.159.164.33:50082/api/focus \
  -H 'Content-Type: application/json' -H "Cookie: auth_token=$TOKEN" \
  -d '{"regenerate":true}'
# → {focus:{actions:[{title,description,priority,estimatedMinutes}]}}
```

---

## 💰 Module 3 — Module Cash (`/cash`)

### KPIs & Runway

| # | Test | Action | Résultat attendu |
|---|---|---|---|
| 3.1 | Chargement KPIs | Accéder `/cash` | 4 cards: Solde, CA mois, Charges mois, Objectif % |
| 3.2 | Calcul solde | Vérifier avec demo data | Solde = Σ INCOME − Σ EXPENSE toutes périodes |
| 3.3 | CA du mois | Vérifier | Somme INCOME du mois courant uniquement |
| 3.4 | Barre objectif | Vérifier % | CA_mois / monthlyGoal × 100 |
| 3.5 | 3 scénarios runway | Section Runway | 🔴 Pessimiste ≤ 🟡 Réaliste ≤ 🟢 Optimiste (en mois) |
| 3.6 | Dates épuisement | Vérifier dates | Dates cohérentes avec nb de mois |
| 3.7 | Alerte critique | Runway < 2 mois | Bannière rouge en haut de page |

```bash
curl http://51.159.164.33:50082/api/cash/runway -H "Cookie: auth_token=$TOKEN"
# → {currentBalance, monthlyIncome, monthlyExpenses, goalProgress, runway:{pessimistic,realistic,optimistic}}
```

### Transactions

| # | Test | Action | Résultat attendu |
|---|---|---|---|
| 3.8 | Ajouter revenu | Formulaire INCOME → Ajouter | Transaction verte dans liste, KPIs mis à jour |
| 3.9 | Ajouter charge | Formulaire EXPENSE → Ajouter | Transaction rouge dans liste |
| 3.10 | Supprimer | Cliquer 🗑️ | Transaction retirée, KPIs recalculés immédiatement |
| 3.11 | Catégories | Sélectionner catégorie | Catégorie correctement associée et affichée |
| 3.12 | Date passée | Saisir date passée | Transaction dans bonne période (hors CA mois courant) |

```bash
# Ajouter
curl -X POST http://51.159.164.33:50082/api/cash/transactions \
  -H 'Content-Type: application/json' -H "Cookie: auth_token=$TOKEN" \
  -d '{"amount":2000,"type":"INCOME","category":"Facture client","description":"Test mission","date":"2026-05-10"}'

# Supprimer (remplacer ID)
curl -X DELETE 'http://51.159.164.33:50082/api/cash/transactions?id=<ID>' \
  -H "Cookie: auth_token=$TOKEN"
```

---

## 👥 Module 4 — Pipeline Kanban (`/pipeline`)

### Affichage

| # | Test | Action | Résultat attendu |
|---|---|---|---|
| 4.1 | 5 colonnes | Voir kanban | 📬 Identifié → 📞 Contacté → 💡 Intéressé → 📄 Devis → ✅ Gagné |
| 4.2 | KPIs barre | Lire les métriques | Prospects actifs, Valeur pipeline €, Gagnés mois, Taux conversion % |
| 4.3 | Badge chaleur | Inspecter carte | 🔥 < 3j / ⚡ 3-7j / 🧊 > 7j ou jamais contacté |
| 4.4 | Toggle perdus | Cliquer "👁 Voir perdus" | Colonne LOST apparaît à droite |

### CRUD Prospects

| # | Test | Action | Résultat attendu |
|---|---|---|---|
| 4.5 | Ajouter prospect | "+ Nouveau prospect" → formulaire | Prospect visible dans la colonne correspondante |
| 4.6 | Avancer statut | Cliquer ▶ | Prospect déplacé à la colonne suivante |
| 4.7 | Reculer statut | Cliquer ◀ | Prospect déplacé à la colonne précédente |
| 4.8 | Rollback UI | Simuler erreur réseau | Prospect revient à sa position initiale |

### Relances IA

| # | Test | Action | Résultat attendu |
|---|---|---|---|
| 4.9 | Ouvrir modale | Cliquer ✉ Relancer | Modale avec sélection ton + canal |
| 4.10 | Email Professionnel | Générer (Email, 🤝 Pro) | Sujet + message formel affiché |
| 4.11 | LinkedIn Expert | Générer (LinkedIn, 🎓 Expert) | Message court format LinkedIn, ton expert |
| 4.12 | Copier | 📋 Copier | Contenu dans presse-papier (feedback "✓ Copié !") |
| 4.13 | Régénérer | Cliquer Régénérer | Nouveau message différent généré |

```bash
# Créer prospect
curl -X POST http://51.159.164.33:50082/api/pipeline/prospects \
  -H 'Content-Type: application/json' -H "Cookie: auth_token=$TOKEN" \
  -d '{"name":"Test User","company":"TestCo","email":"t@t.fr","value":3000,"status":"IDENTIFIED"}'

# Générer relance
curl -X POST http://51.159.164.33:50082/api/pipeline/relance \
  -H 'Content-Type: application/json' -H "Cookie: auth_token=$TOKEN" \
  -d '{"prospectId":"<ID>","tone":"professionnel","channel":"email"}'
# → {subject, message, hook, channel}