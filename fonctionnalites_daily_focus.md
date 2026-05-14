# 🎯 Fonctionnalités Daily Focus — Business AI OS

> Document de référence complet — Version 2.0 — Mai 2026

---

## 📋 Vue d'ensemble

Le **Daily Focus** est la feature core de Business AI OS (Solo Pro). Chaque matin, l'IA génère 3 actions prioritaires personnalisées basées sur les données réelles de l'entrepreneur. Le module évolue avec 5 couches d'intelligence qui se renforcent mutuellement.

---

## 1. 🤖 Génération IA des 3 Actions Prioritaires

### Description
L'agent Python `daily_focus.py` analyse le contexte complet de l'entrepreneur et génère exactement 3 actions actionnables en moins d'une journée.

### Données analysées
- **Wiki Business Brain** : contexte entreprise, ICP, patterns de vente, historique
- **Trésorerie** : solde actuel, objectif CA mensuel, charges fixes, runway
- **Pipeline** : prospects chauds, deals en attente, relances en retard
- **Tâches haute priorité** : les 3 tâches HIGH priority en cours
- **Skip patterns** : types d'actions ignorées par l'entrepreneur (pattern learning)

### Format de chaque action
```
├── Titre de l'action (concret, actionnable)
├── Contexte (détails de mise en oeuvre)
├── Pourquoi maintenant (raison de la priorité)
├── Temps estimé (en minutes)
└── Niveau de priorité : Haute / Moyenne / Faible
```

### Exemple de Focus généré
```
📍 Focus du jour — Mercredi 14 mai
💰 Cash : 3 240€ | Objectif : 62%

🔴 #1 HAUTE — Relancer Camille Dupont (devis 890€, 11j sans réponse)
   Contexte : Son budget trimestriel se termine fin mai
   Pourquoi : Relance J+11 = fenêtre critique avant perte du deal
   ⏱ 30 min

🟡 #2 MOYENNE — Facturer Stéphane Martin (mission terminée lundi)
   Contexte : Préparer facture FAC-2026-014, montant 1 500€ HT
   Pourquoi : Chaque jour de retard impacte votre runway
   ⏱ 15 min

🟢 #3 FAIBLE — Publier post LinkedIn sur résultat client
   Contexte : Post rédigé hier sur transformation de TechCorp
   Pourquoi : Mardi-jeudi 8h-9h = meilleur créneau engagement
   ⏱ 10 min
```

### Règles de priorisation de l'agent
1. **Cash en priorité absolue** : factures impayées, relances commerciales urgentes
2. **Clients ensuite** : deals chauds, opportunités à risque de perte
3. **Visibilité en dernier** : contenu, réseau, notoriété
4. **Contraintes** : max 3 actions, chacune faisable en < 1 journée
5. **Évitement** : les actions marquées comme ignorées > 60% du temps sont reformulées

### Accès
- **Plan requis** : Solo Pro (29€/mois)
- **Plan Free** : pas de génération IA (affichage onboarding uniquement)
- **Régénération** : possible à tout moment via bouton "Regénérer ✨"
- **Unicité** : 1 focus par jour par utilisateur (upsert sur date)

---

## 2. ✅ Feedback Loop — Actions en temps réel

### Description
Chaque action dispose de 3 boutons de statut. Chaque interaction met à jour le statut en base et **alimente la mémoire wiki** de l'entrepreneur.

### Les 4 statuts

| Statut | Icône | Comportement UI | Effet Wiki |
|---|---|---|---|
| `pending` | ⏳ | Action affichée normalement | — |
| `done` | ✅ | Texte barré, fond vert sombre | Log + `business/patterns.md` |
| `snoozed` | 🔄 | Texte grisé, fond violet | Log entrée "reporté" |
| `skipped` | ❌ | Texte barré grisé, opacité 60% | Log entrée "ignoré" |

### Effets wiki par statut

**Quand `done`** :
```markdown
# log.md — entrée ajoutée
## [2026-05-14T08:32:11] focus_action_done
✅ Action complétée [14/05/2026] : Relancer Camille Dupont (30 min)

# business/patterns.md — section ajoutée
### [14/05/2026] Action réalisée
> Relancer Camille Dupont (devis 890€, 11j sans réponse)
_Contexte : Son budget trimestriel se termine fin mai_
```

**Quand `skipped`** :
```markdown
# log.md — entrée ajoutée
## [2026-05-14T08:32:11] focus_action_skipped
❌ Action ignorée [14/05/2026] : Facturer Stéphane Martin
```

### Comportement optimiste (UX)
- Le statut change **immédiatement** côté client (pas d'attente serveur)
- Si erreur serveur → **rollback automatique** au statut précédent
- Bouton "↩ Annuler" disponible pour revenir à `pending` sur tous les statuts

### Mise à jour en cascade
Quand un statut change :
1. PATCH `/api/focus` → Prisma ORM update (PostgreSQL compatible)
2. Wiki ingest non-bloquant (try/catch silencieux)
3. `refreshKey` incrémenté → Score + Streak se rafraîchissent automatiquement

---

## 3. 🔥 Streak Tracker — Série de régularité

### Description
Widget sidebar droit qui mesure et gamifie la **régularité** de l'entrepreneur. Inspiré du système Duolingo.

### Métriques affichées

| Métrique | Calcul | Affichage |
|---|---|---|
| **Série active** | Jours consécutifs avec ≥1 action `done` | Nombre + icône 🔥 orange |
| **Record personnel** | Meilleure série historique | Nombre violet |
| **Taux de complétion** | % actions `done` / total sur 30 jours | % coloré vert/jaune/gris |
| **Heatmap 14 jours** | 14 points colorés (jour par jour) | Dots interactifs |

### Légende heatmap

| Couleur | Signification |
|---|---|
| 🟢 Vert | Toutes les actions du jour complétées |
| 🔵 Indigo | Certaines actions complétées (partiel) |
| ⚫ Gris foncé | Focus généré mais aucune action faite |
| 🌑 Très sombre | Aucun focus ce jour-là |

### Tooltips sur les dots
Survol d'un dot → popup : `"14/05 — 2/3 faites ✅"`

### Messages motivants contextuels
```
1 jour  → "🔥 Belle reprise ! Continuez demain."
2 jours → "🔥🔥 2 jours consécutifs — la machine est lancée !"
3-6j    → "🔥 X jours de suite ! Ne brisez pas la chaîne."
7-29j   → "🏆 X jours — vous êtes en feu !"
30j+    → "🚀 X jours consécutifs — discipline légendaire !"
0 jour  → "Complétez une action aujourd'hui pour relancer votre série 💪"
```

### Règle de calcul de la série
- **Aujourd'hui** : compte si ≥1 action `done` ce jour
- **Jours passés** : compte si ≥1 action `done` et jours strictement consécutifs
- **Jour sans focus** : brise la série
- **Jour avec focus mais 0 done** : brise la série

### API
```
GET /api/focus/streak
Réponse : { currentStreak, longestStreak, totalDays, completionRate, last14Days[] }
```

---

## 4. 🧠 Pattern Learning — L'IA qui s'adapte

### Description
Système d'apprentissage automatique qui analyse les 30 derniers jours d'interactions pour identifier les types d'actions systématiquement ignorées, et **adapter les futures générations** en conséquence.

### Algorithme de détection

```
1. Pour chaque focus des 30 derniers jours :
   a. Extraire les mots-clés des actions (stopwords filtrés, longueur > 3)
   b. Créer une clé = 3 premiers mots significatifs
   c. Comptabiliser : total_vues et total_ignorées par clé

2. Pattern détecté si :
   - total_vues ≥ 2 (assez de données)
   - total_ignorées / total_vues > 60%

3. Maximum 5 patterns remontés
```

### Double usage du pattern

**→ Affichage dans l'historique** :
```
🧠 Pattern détecté
Ces types d'actions sont souvent ignorées : relancer prospects, publier linkedin.
L'IA les ajustera dans votre prochain Focus.
```

**→ Injection dans le prompt de génération** :
```python
# Prompt enrichi automatiquement
⚠️ PATTERNS D'ACTIONS SOUVENT IGNORÉES :
- 'relancer prospects'
- 'publier linkedin'

Ces actions ont été ignorées >60% du temps.
Évite de reproduire les mêmes formulations.
Propose des variantes plus actionnables, change l'angle,
ou décompose en étape plus petite.
```

### Résultat concret
Si l'entrepreneur ignore systématiquement les relances LinkedIn :
- Avant : *"Relancer vos 3 prospects via LinkedIn"*
- Après : *"Envoyer 1 message vocal à votre prospect le plus chaud"* ou *"Préparer 3 phrases d'accroche personnalisées"*

### API
```
GET /api/focus/history?days=7
Réponse : { history[], skipPatterns[] }

skipPatterns est aussi injecté dans POST /api/focus (génération)
```

---

## 5. 📅 Historique Focus — Timeline des 7/14/30 jours

### Description
Widget collapsible sous les cartes du jour qui permet de **consulter et analyser** les Focus passés.

### Fonctionnalités

**Sélecteur de période** : boutons `7j` / `14j` / `30j` en haut à droite

**Par entrée (chaque jour passé)** :
- Date en français (ex : *"Lundi 12 mai"*)
- Barre de progression colorée (vert/indigo/jaune selon complétion)
- Compteur `done/total` (ex : 2/3)
- Score badge coloré (ex : `85pts`)
- Chevron pour déplier/replier

**Détail déplié (click)** :
- Liste des 3 actions avec leur statut final
- Icône statut : ✅ Fait / ❌ Ignoré / 🔄 Reporté / ⏳ Non traité
- Nom de l'action (barré si done/skipped)
- Temps estimé

**Exclusion automatique** : le jour en cours n'apparaît pas dans l'historique (il est visible dans les cartes principales)

**Chargement intelligent** : l'historique se rafraîchit automatiquement à chaque changement de statut (via `refreshKey`)

### Score dans l'historique

| Points | Source |
|---|---|
| 0-70 pts | Ratio actions complétées (proportionnel) |
| +20 pts | Bonus si 100% des actions faites |
| -5 pts | Pénalité par action ignorée (max -20) |

Ex : 2 done / 3 total / 1 skipped = (2/3×70) + 0 - 5 = **41 pts**

### API
```
GET /api/focus/history?days=7  (7 par défaut, max 30)
Réponse : {
  history: HistoryEntry[],
  skipPatterns: string[]  // patterns pour pattern learning
}

---

## 6. 🎯 Score Journalier — Ring animé 0-100

### Description
Widget sidebar avec anneau SVG animé qui mesure la **performance journalière globale** de l'entrepreneur sur 100 points.

### Formule de calcul

```
Score = CompletionPoints + PerfectBonus + RevenueBonus

├── CompletionPoints : (actions_done / total_actions) × 70  → max 70 pts
├── PerfectBonus    : +20 si TOUTES les actions sont faites  → max 20 pts
└── RevenueBonus    : +10 si revenu saisi aujourd'hui        → max 10 pts
                                                    TOTAL   = max 100 pts
```

### Exemples concrets

| Situation | Calcul | Score |
|---|---|---|
| 0 action faite, pas de revenu | 0 + 0 + 0 | **0 pts** |
| 1/3 actions faites | (1/3×70) + 0 + 0 | **23 pts** |
| 2/3 actions faites | (2/3×70) + 0 + 0 | **47 pts** |
| 3/3 actions faites | 70 + 20 + 0 | **90 pts** |
| 3/3 faites + revenu saisi | 70 + 20 + 10 | **100 pts** |
| 2/3 faites + revenu saisi | (2/3×70) + 0 + 10 | **57 pts** |

### Labels et couleurs

| Score | Label | Couleur |
|---|---|---|
| 90-100 | Excellent 🏆 | Vert (#4ade80) |
| 70-89 | Très bien 🎯 | Indigo (#818cf8) |
| 40-69 | Bien 👍 | Jaune (#facc15) |
| 1-39 | En cours ⚡ | Orange (#fb923c) |
| 0 | Non démarré | Gris (#2a2a42) |

### Breakdown visuel
L'anneau est accompagné de 3 mini-barres de progression :
- ✅ **Actions complétées** — X/70 pts
- 🏆 **Bonus tout complété** — X/20 pts
- 💰 **Revenu saisi aujourd'hui** — X/10 pts

### Comportements contextuels
- Si `todayRevenue = 0` et score > 0 → hint : *"Saisissez un revenu pour +10 pts 💡"*
- Si `todayRevenue > 0` → affichage : *"+1 500€ de revenu saisi aujourd'hui 💶"*
- **Rafraîchissement automatique** à chaque changement de statut (via `refreshKey`)

### API
```
GET /api/focus/score
Réponse : {
  total: number,          // 0-100
  completionPoints: number,
  perfectBonus: number,
  revenueBonus: number,
  label: string,          // 'Excellent 🏆' | 'Très bien 🎯' | ...
  color: string,          // classe CSS Tailwind
  doneCount: number,
  totalCount: number,
  todayRevenue: number    // somme des INCOME du jour
}
```

---

## 7. 🖥️ Layout de la Page Focus

### Disposition responsive

```
┌─────────────────────────────────────────────────────────────────────┐
│  HEADER                                                             │
│  Bonjour 👋, votre focus du jour    [Regénérer ✨]                  │
│  Mercredi 14 mai 2026                                               │
│  ████████████░░  2/3 faits                                          │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  CALENDRIER (CalendarWidget — RDV Cal.com du jour)                  │
└─────────────────────────────────────────────────────────────────────┘

┌── Bannière "Tout résolu" (si toutes actions traitées) ─────────────┐
│  🎉 Bravo ! 3 actions accomplies aujourd'hui 🎯                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────┐  ┌──────────────────────────┐
│  CARTES ACTIONS (flex 1)            │  │  SIDEBAR (xl:w-72)       │
│                                     │  │                          │
│  ┌─────────┐ ┌─────────┐ ┌───────┐ │  │  ┌────────────────────┐  │
│  │ #1 HAUTE│ │#2 MOYEN │ │#3 BAS │ │  │  │  Score du jour     │  │
│  │ Action  │ │ Action  │ │Action │ │  │  │  [Ring SVG 0-100]  │  │
│  │ Contexte│ │ Contexte│ │Contx. │ │  │  │  ✅ X/70 pts       │  │
│  │ Pourquoi│ │ Pourquoi│ │Pourq. │ │  │  │  🏆 X/20 pts       │  │
│  │ ⏱ 30min │ │ ⏱ 15min │ │⏱10min │ │  │  │  💰 X/10 pts       │  │
│  │ ✅🔄❌  │ │ ✅🔄❌  │ │✅🔄❌ │ │  │  └────────────────────┘  │
│  └─────────┘ └─────────┘ └───────┘ │  │                          │
└─────────────────────────────────────┘  │  ┌────────────────────┐  │
                                         │  │  Régularité 🔥     │  │
                                         │  │  [🔥 5] [⭐12] [73%]│  │
                                         │  │  ● ● ● ○ ● ● ○ ●  │  │
                                         │  │  14 derniers jours │  │
                                         │  └────────────────────┘  │
                                         └──────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  HISTORIQUE FOCUS              [7j] [14j] [30j]                     │
│  ┌─────────────────────────────────────────────────┐                │
│  │ ▼ Mardi 13 mai ─────────────████░ 2/3   85pts  │                │
│  │   └─ ✅ Relancer Camille (30min)                │                │
│  │   └─ ✅ Facturer Martin (15min)                 │                │
│  │   └─ ⏳ Publier LinkedIn (10min)               │                │
│  └─────────────────────────────────────────────────┘                │
│  ┌─────────────────────────────────────────────────┐                │
│  │ ► Lundi 12 mai ─────────────██████ 3/3  100pts │                │
│  └─────────────────────────────────────────────────┘                │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  CITATION (si focus non résolu)                                     │
│  « Chaque grande réussite commence par une seule action bien choisie »│
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  ACTIVITÉ RÉCENTE (wiki logs)                                       │
└─────────────────────────────────────────────────────────────────────┘
```

### États de la page

| État | Condition | Affichage |
|---|---|---|
| **Onboarding** | `!hasData && !focus` | 3 étapes (Cash → Pipeline → Focus) |
| **Prêt à générer** | `hasData && !focus` | Bouton central "⚡ Générer mon Focus du jour" |
| **Tout résolu** | `allResolved === true` | Bannière 🎉 + récapitulatif |
| **Focus actif** | `focus !== null` | Cartes + Sidebar + Historique |
| **Plan Free** | Plan = FREE + clic Générer | Modal Upgrade → 29€/mois |

---

## 8. 🔌 Récapitulatif des APIs

### Routes Next.js API — Daily Focus

| Méthode | Route | Description | Auth | Plan |
|---|---|---|---|---|
| `GET` | `/api/focus` | Charger le focus du jour | ✅ JWT | Free + Pro |
| `POST` | `/api/focus` | Générer / regénérer le focus | ✅ JWT | **Pro only** |
| `PATCH` | `/api/focus` | Mettre à jour le statut d'une action | ✅ JWT | Pro |
| `GET` | `/api/focus/streak` | Streak + heatmap 14 jours | ✅ JWT | Pro |
| `GET` | `/api/focus/history?days=7` | Historique 7/14/30 jours + skip patterns | ✅ JWT | Pro |
| `GET` | `/api/focus/score` | Score journalier 0-100 | ✅ JWT | Pro |

### Route Python FastAPI

| Route | Body | Description |
|---|---|---|
| `POST /focus/generate` | FocusRequest | Génère les 3 actions avec LLM (Claude/GPT) |

### Corps PATCH `/api/focus`
```typescript
{ actionIndex: number, status: 'pending' | 'done' | 'skipped' | 'snoozed' }
```

---

## 9. 📦 Fichiers du Module Daily Focus

### Backend

| Fichier | Rôle |
|---|---|
| `app/api/focus/route.ts` | GET (charger) + POST (générer) + PATCH (statut) |
| `app/api/focus/streak/route.ts` | Calcul streak + heatmap |
| `app/api/focus/history/route.ts` | Historique + détection skip patterns |
| `app/api/focus/score/route.ts` | Score journalier 0-100 |
| `python/agents/daily_focus.py` | Agent LLM génération 3 actions |
| `python/models/schemas.py` | FocusRequest + FocusResponse + FocusAction |

### Frontend

| Fichier | Rôle |
|---|---|
| `app/(dashboard)/focus/page.tsx` | Page principale Daily Focus |
| `components/dashboard/DailyFocus.tsx` | Carte action individuelle (statuts) |
| `components/dashboard/FocusScore.tsx` | Ring SVG animé + breakdown points |
| `components/dashboard/FocusStreak.tsx` | Streak + heatmap 14 jours |
| `components/dashboard/FocusHistory.tsx` | Historique collapsible + insight patterns |

---

## 10. 🔮 Évolutions Futures Envisagées

| Feature | Description | Priorité |
|---|---|---|
| **Notification push J+1** | Email/push si streak > 3j pour maintenir la motivation | 🔴 High |
| **Focus vocal** | Lecture TTS des 3 actions au réveil (Web Speech API) | 🟡 Medium |
| **Décomposition d'action** | "Casser" une action en sous-tâches si trop complexe | 🟡 Medium |
| **Temps réel** | Timer Pomodoro intégré sur chaque action | 🟡 Medium |
| **Partage focus** | Partager son focus du jour sur LinkedIn en 1 clic | 🟠 Low |
| **IA proactive** | Business Brain envoie une alerte si aucun focus depuis 2j | 🔴 High |
| **Focus hebdo** | Vue récapitulative de la semaine + tendance | 🟡 Medium |
| **Corrélation CA** | Graphique : jours avec focus 100% vs revenus | 🟠 Low |

---

*Document généré automatiquement par Agent Zero — Business AI OS v2.0*  
*Dernière mise à jour : Mai 2026*
