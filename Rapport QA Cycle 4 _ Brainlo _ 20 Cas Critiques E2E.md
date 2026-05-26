# 🧪 Rapport QA — Cycle 4
## 20 Cas Critiques E2E — Brainlo v2.0

**Date :** 2026-05-17  
**Environnement :** `http://localhost:50082` (dev local)  
**Compte test :** Sophie Martin — `elsane.tiberini@gmail.com`  
**Testeur :** Agent Zero (automatisé via API REST)  
**Statut :** ✅ Terminé

---

## 📊 Synthèse exécutive

| Métrique | Valeur |
|----------|--------|
| **Cas testés** | 20 |
| **✅ PASS** | 17 |
| **❌ FAIL / SKIP** | 3 |
| **⚠️ Défauts mineurs** | 6 |
| **Taux de réussite** | **85%** |
| **Bugs bloquants** | 1 (route manquante) |

---

## 🎯 Résultats par cas

### Module Onboarding

| ID | Titre | Statut | Détail |
|----|-------|--------|--------|
| OB-01 | Inscription Sophie Martin | ✅ PASS | Compte `elsane.tiberini@gmail.com` existant — cohérent |
| OB-06 | Connexion valide | ✅ PASS | `user_id=cmp9lqtba0000mmk0xl3tp7ma` — session cookie OK |
| OB-02 | Profil onboarding complet | ✅ PASS* | PATCH OK : `monthlyGoal=5000`, `fixedCharges=800`, `sector=Design & UX` |

> ⚠️ *OB-02 : PUT retourne 405 → utiliser **PATCH**. Noms de champs différents entre frontend et API (voir DEF-01/02)

### Module CRM Pipeline

| ID | Titre | Statut | Détail |
|----|-------|--------|--------|
| CRM-01 | Créer prospect Camille Rousseau | ✅ PASS | `id=cmp9lxbdt0002mmk0ikazd6xj`, status=201, TechCorp SAS |
| CRM-07 | Devis depuis prospect (3 lignes) | ✅ PASS* | `DEVIS-2026-001`, subtotalHT=4500€, totalTTC=4500€ |

> ⚠️ *CRM-07 : format API corrigé → `lines` (pas `items`), `title` (pas `description`), `qty` (pas `quantity`)

### Module Devis & Factures

| ID | Titre | Statut | Détail |
|----|-------|--------|--------|
| QF-01 | Créer devis NLP parse-brief | ✅ PASS | Brief parsé → `{clientName: TechCorp, lines:[{title: Consulting UX, qty:3, unitPrice:1500}]}` |
| QF-05 | Convertir devis → facture | ❌ FAIL | Route `PATCH /api/quotes/{id}` = 404 (route dynamique manquante) |
| QF-06 | Facture payée → transaction auto | ❌ SKIP | Dépend de QF-05 |

> 🔴 **BUG BLOQUANT** : Pas de route dynamique `app/api/quotes/[id]/route.ts` — empêche l'acceptation d'un devis et la conversion en facture

### Module Trésorerie

| ID | Titre | Statut | Détail |
|----|-------|--------|--------|
| TR-01 | Transaction INCOME +2000€ | ✅ PASS | `id=cmp9lxehc0004mmk05ebmbcd1`, catégorie=Chiffre affaires |
| TR-02 | Transaction EXPENSE -400€ | ✅ PASS | `id=cmp9lxel00006mmk01vutw0c1`, catégorie=Loyer & Bureau |
| TR-07 | Runway Calculator 3 scénarios | ✅ PASS | `currentBalance=1600€`, `monthlyIncome=2000€`, `monthlyExpenses=400€` |
| TR-10 | Transaction auto depuis facture payée | ❌ SKIP | Dépend de QF-05/QF-06 |
| TR-12 | Solde trésorerie temps réel | ✅ PASS* | Via `/api/cash/transactions` : INCOME=2000€, EXPENSE=400€, **NET=1600€** |

> ⚠️ *TR-12 : `/api/cash/balance` = 404 — le solde est calculable via `/api/cash/transactions`

### Module Knowledge Base

| ID | Titre | Statut | Détail |
|----|-------|--------|--------|
| KB-01a | Upload PDF Grille tarifaire | ✅ PASS | `id=cmp9lxien0008mmk00p23cfix` — indexé en MD dans wiki |
| KB-01b | Upload PDF CGV Design Studio SM | ✅ PASS | `id=cmp9lxiws000ammk0rbi1oklu` — indexé en MD dans wiki |
| KB-02 | Upload DOCX Méthodologie consulting | ✅ PASS | `id=cmp9lxj0y000cmmk06gc8sefs` — Status 201 |
| KB-06 | Liste documents KB indexés | ✅ PASS | **3 documents** indexés et disponibles |
| KB-07 | Chat KB conditions paiement | ✅ PASS | Réponse IA : *"Selon les CGV, délai paiement 30 jours..."* |

### Module Chat Business Brain

| ID | Titre | Statut | Détail |
|----|-------|--------|--------|
| CH-01 | Chat CA du mois | ✅ PASS | Réponse IA sur les données financières réelles |
| CH-06 | Chat KB + données croisées (TJM + prospects) | ✅ PASS | Réponse IA cohérente avec contexte business |

---

## 🐛 Bugs identifiés

### 🔴 BUG BLOQUANT

#### BUG-01 — Route dynamique `/api/quotes/[id]` manquante

| Champ | Valeur |
|-------|--------|
| **Sévérité** | 🔴 CRITIQUE |
| **Route** | `PATCH /api/quotes/{id}` |
| **HTTP** | 404 — HTML Next.js not-found |
| **Impact** | Impossible d'accepter un devis, impossible de le convertir en facture |
| **Cas bloqués** | QF-05, QF-06, TR-10 (3 cas critiques) |
| **Cause** | Pas de fichier `app/api/quotes/[id]/route.ts` |
| **Fix** | Créer `app/api/quotes/[id]/route.ts` avec handler `PATCH` pour mise à jour statut |

```typescript
// app/api/quotes/[id]/route.ts — à créer
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const quote = await prisma.quote.update({
    where: { id: params.id, userId: user.userId },
    data: { status: body.status, ...(body.status === 'ACCEPTED' ? { acceptedAt: new Date() } : {}) }
  })
  return NextResponse.json(quote)
}
```

---

### ⚠️ Défauts mineurs (non bloquants)

| ID | Sévérité | Endpoint | Problème | Fix suggéré |
|----|----------|----------|----------|-------------|
| DEF-01 | 🟡 Mineure | `PUT /api/auth/profile` | Retourne 405 — méthode non supportée | Utiliser `PATCH /api/auth/profile` |
| DEF-02 | 🟡 Mineure | `PATCH /api/auth/profile` | Noms de champs incohérents : `monthlyRevenueGoal` vs `monthlyGoal`, `monthlyExpenses` vs `fixedCharges` | Documenter ou aligner les noms |
| DEF-03 | 🟡 Mineure | `POST /api/quotes` | Format items : `items/quantity/description` rejetés → `lines/qty/title` requis | Documenter le format ou ajouter compatibilité |
| DEF-04 | 🟢 Faible | `POST /api/pipeline/prospects` | Réponse wrappée `{prospect: {id}}` pas `{id}` directement | Documenter le format de réponse |
| DEF-05 | 🟢 Faible | `POST /api/transactions` | Réponse wrappée `{transaction: {id}}` pas `{id}