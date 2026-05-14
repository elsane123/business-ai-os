# Business AI OS — Stratégie de Test Complète
## Personas Fictifs, Données de Test & Scénarios End-to-End

> **Version** : 2.0 | **Date** : 2026-05-15  
> **URL App** : http://51.159.164.33:50082  
> **Python API** : http://51.159.164.33:8000

---

## 📋 Table des matières

1. [Personas Utilisateurs Fictifs](#1-personas-utilisateurs-fictifs)
2. [Jeux de Données de Test](#2-jeux-de-données-de-test)
3. [Scénarios End-to-End](#3-scénarios-end-to-end)
4. [Tests par Module](#4-tests-par-module)
5. [Tests API (cURL)](#5-tests-api-curl)
6. [Tests de Sécurité](#6-tests-de-sécurité)
7. [Matrice de Couverture](#7-matrice-de-couverture)

---

## 1. Personas Utilisateurs Fictifs

### 👩‍💻 Persona A — Sophie Martin (Solo Pro)

| Champ | Valeur |
|---|---|
| **Nom** | Sophie Martin |
| **Email** | `sophie@designstudio.fr` |
| **Mot de passe** | `Sophie1234!` |
| **Entreprise** | Design Studio Sophie |
| **Secteur** | Design & Créativité |
| **Forme juridique** | Auto-entrepreneur |
| **SIRET** | `84472651200015` |
| **Adresse** | 12 rue des Lilas, 75011 Paris |
| **Plan** | Solo Pro (29€/mois) |
| **Objectif CA** | 5 000€/mois |
| **Charges fixes** | 800€/mois |
| **LinkedIn** | `linkedin.com/in/sophiemartindesign` |
| **Cal.com** | `cal.com/sophiemartin/rdv` |
| **TVA** | Non assujettie (AE) |
| **Délai paiement** | 30 jours |

**Contexte** : Freelance UX/UI depuis 3 ans. 3–4 clients simultanément. Cherche à automatiser les relances et générer du contenu LinkedIn régulièrement.

---

### 👨‍💼 Persona B — Marc Lefebvre (Consultant IT)

| Champ | Valeur |
|---|---|
| **Nom** | Marc Lefebvre |
| **Email** | `marc@conseiltech.fr` |
| **Mot de passe** | `Marc5678!` |
| **Entreprise** | ConseilTech SARL |
| **Secteur** | Conseil & Technologie |
| **Forme juridique** | SARL |
| **SIRET** | `48251763900031` |
| **Adresse** | 8 avenue de la République, 69002 Lyon |
| **Plan** | Solo Pro (29€/mois) |
| **Objectif CA** | 12 000€/mois |
| **Charges fixes** | 2 400€/mois |
| **LinkedIn** | `linkedin.com/in/marclefebvreconseil` |
| **Capital social** | 10 000€ |
| **TVA** | FR12482517639 |
| **Délai paiement** | 45 jours |

**Contexte** : Consultant senior en transformation digitale. Grosses missions (15–30k€). Cycle de vente long (2–3 mois). Priorité : suivi pipeline et relances.

---

### 👩‍🎨 Persona C — Julie Moreau (FREE → upgrade)

| Champ | Valeur |
|---|---|
| **Nom** | Julie Moreau |
| **Email** | `julie@agencecreative.com` |
| **Mot de passe** | `Julie9012!` |
| **Entreprise** | Agence Creative JM |
| **Secteur** | Communication & Marketing |
| **Forme juridique** | Auto-entrepreneur |
| **SIRET** | `91345872400028` |
| **Adresse** | 5 boulevard Gambetta, 33000 Bordeaux |
| **Plan** | FREE (test upgrade vers PRO) |
| **Objectif CA** | 3 000€/mois |
| **Charges fixes** | 400€/mois |
| **LinkedIn** | `linkedin.com/in/juliemoreaucreative` |
| **TVA** | Non assujettie |

**Contexte** : Débute son activité. Peu de données. Permet de tester les limitations FREE et le parcours d'upgrade vers Solo Pro.

---

## 2. Jeux de Données de Test

### 2.1 Transactions — Persona A (Sophie)

#### Revenus
| # | Description | Montant | Catégorie | Date | Type |
|---|---|---|---|---|---|
| T01 | Mission UX/UI — TechCorp | 2 400€ | Consulting | 2026-05-02 | INCOME |
| T02 | Formation Figma — StartupX | 800€ | Formation | 2026-05-08 | INCOME |
| T03 | Refonte logo — Boulangerie Dupont | 450€ | Design | 2026-04-28 | INCOME |
| T04 | Maintenance site — Atelier Durand | 300€ | Maintenance | 2026-04-15 | INCOME |
| T05 | Audit UX — FinTechParis | 1 200€ | Consulting | 2026-03-30 | INCOME |

#### Dépenses
| # | Description | Montant | Catégorie | Date | Type |
|---|---|---|---|---|---|
| T06 | Abonnement Figma | 15€ | Logiciels & SaaS | 2026-05-01 | EXPENSE |
| T07 | Adobe Creative Cloud | 60€ | Logiciels & SaaS | 2026-05-01 | EXPENSE |
| T08 | Loyer bureau partagé | 400€ | Loyer | 2026-05-01 | EXPENSE |
| T09 | Comptable | 150€ | Comptabilité | 2026-05-03 | EXPENSE |
| T10 | Déjeuner client TechCorp | 42€ | Repas | 2026-05-07 | EXPENSE |
| T11 | Abonnement Business AI OS | 29€ | Logiciels & SaaS | 2026-05-01 | EXPENSE |
| T12 | Transport — meeting Lyon | 67€ | Transport | 2026-04-22 | EXPENSE |

---

### 2.2 Prospects — Persona A (Sophie)

| # | Nom | Entreprise | Email | Statut | Valeur | Dernier contact | Notes |
|---|---|---|---|---|---|---|---|
| P01 | Camille Dupont | TechCorp | camille@techcorp.fr | PROPOSAL | 3 600€ | 2026-05-04 | Devis envoyé le 4 mai, sans réponse |
| P02 | Thomas Renard | StartupX | thomas@startupx.io | INTERESTED | 2 800€ | 2026-05-10 | Appel découverte fait, envoie brief |
| P03 | Marie Laurent | FinTechParis | marie@fintechparis.com | NEGOTIATION | 5 500€ | 2026-05-12 | Négo prix, propose -10% |
| P04 | Lucas Petit | InnoLab | lucas@inolab.fr | CONTACTED | 1 200€ | 2026-04-28 | Email envoyé, pas de retour |
| P05 | Emma Faure | Webagence | emma@webagence.com | IDENTIFIED | 900€ | — | Trouvée sur LinkedIn, pas encore contactée |
| P06 | Pierre Martin | Retail360 | pierre@retail360.fr | WON | 2 400€ | 2026-04-15 | Mission terminée, facturée |
| P07 | Clara Vincent | MediaGroup | clara@mediagroup.fr | LOST | 4 000€ | 2026-04-01 | Choisi un concurrent moins cher |

---

### 2.3 Tâches — Persona A (Sophie)

| # | Titre | Catégorie | Priorité | Statut | Échéance | Durée est. | Lié à |
|---|---|---|---|---|---|---|---|
| TK01 | Relancer Camille — devis 3 600€ | CLIENTS | HIGH | TODO | 2026-05-16 | 15 min | P01 |
| TK02 | Finaliser maquette TechCorp v2 | CLIENTS | HIGH | IN_PROGRESS | 2026-05-17 | 180 min | P01 |
| TK03 | Envoyer facture Pierre Martin | CASH | HIGH | TODO | 2026-05-15 | 10 min | P06 |
| TK04 | Publier post LinkedIn semaine | VISIBILITY | MEDIUM | TODO | 2026-05-16 | 20 min | — |
| TK05 | Déclaration URSSAF mai | ADMIN | HIGH | TODO | 2026-05-31 | 30 min | — |
| TK06 | Brief Thomas — StartupX | CLIENTS | MEDIUM | TODO | 2026-05-18 | 45 min | P02 |
| TK07 | Vérifier devis Marie — contre-offre | CLIENTS | HIGH | TODO | 2026-05-15 | 20 min | P03 |
| TK08 | Mettre à jour portfolio site web | VISIBILITY | LOW | TODO | 2026-05-30 | 120 min | — |

---

### 2.4 Devis — Persona A (Sophie)

#### DEVIS-2026-001 (P01 — TechCorp)
```json
{
  "number": "DEVIS-2026-001",
  "status": "SENT",
  "prospectId": "P01",
  "validUntil": "2026-06-04",
  "clientInfo": {
    "name": "TechCorp SAS",
    "address": "42 avenue Montaigne",
    "zipCode": "75008",
    "city": "Paris",
    "siret": "52384726100044"
  },
  "lines": [
    { "title": "Audit UX & Wireframes", "description": "Analyse parcours utilisateur + 15 écrans wireframe", "qty": 1, "unitPrice": 1800, "vatRate": 0, "unit": "forfait" },
    { "title": "Maquettes Figma HD", "description": "Design complet responsive — 15 écrans", "qty": 1, "unitPrice": 1800, "vatRate": 0, "unit": "forfait" }
  ],
  "subtotalHT": 3600,
  "totalVAT": 0,
  "totalTTC": 3600,
  "notes": "Acompte 30% à la commande. Solde à la livraison."
}
```

#### DEVIS-2026-002 (P03 — FinTechParis)
```json
{
  "number": "DEVIS-2026-002",
  "status": "DRAFT",
  "lines": [
    { "title": "Consulting UX Strategy", "qty": 5, "unitPrice": 800, "vatRate": 0, "unit": "jour" },
    { "title": "Livrables & Documentation", "qty": 1, "unitPrice": 500, "vatRate": 0, "unit": "forfait" }
  ],
  "subtotalHT": 4500,
  "totalTTC": 4500
}
 200€ | Formation | 2026-04-10 | INCOME |
| M04 | Loyer bureau Lyon | 1 200€ | Loyer | 2026-05-01 | EXPENSE |
| M05 | Assurance RC Pro | 180€ | Assurance | 2026-05-05 | EXPENSE |
| M06 | Frais déplacement Paris | 230€ | Transport | 2026-05-06 | EXPENSE |
| M07 | Abonnement suite Office | 22€ | Logiciels & SaaS | 2026-05-01 | EXPENSE |

---

### 2.7 Prospects — Persona B (Marc)

| # | Nom | Entreprise | Email | Statut | Valeur | SIRET |
|---|---|---|---|---|---|---|
| MP01 | Isabelle Morin | Banque Nationale | i.morin@banquenat.fr | WON | 17 000€ | 30002005500087 |
| MP02 | David Schmitt | RetailGroup | d.schmitt@retailgroup.fr | NEGOTIATION | 25 000€ | 55208131766522 |
| MP03 | Anne-Lise Perrin | LegalTech SA | alperrin@legaltech.fr | PROPOSAL | 18 000€ | 78234516900021 |
| MP04 | Julien Castel | HealthData | j.castel@healthdata.io | INTERESTED | 12 000€ | — |
| MP05 | Sarah Ben Ali | GovConnect | s.benali@govconnect.fr | CONTACTED | 8 000€ | — |

---

### 2.8 Données Julie (FREE — Plan limité)

| # | Donnée | Valeur |
|---|---|---|
| J01 | Transaction revenus | 1 x 1 200€ (seule entrée) |
| J02 | Prospects | 3 (limite FREE = 3 max) |
| J03 | Posts LinkedIn | 4 (limite FREE = 4/mois) |
| J04 | Daily Focus | ❌ bloqué (FREE) |
| J05 | Devis | ❌ bloqué (FREE) |
| J06 | Chat | ❌ bloqué (FREE) |

---

## 3. Scénarios End-to-End

### 🔄 E2E-01 — Nouveau client → Devis → Facture → Trésorerie

**Persona** : Sophie Martin (Plan PRO)  
**Durée estimée** : 15 min  
**Modules couverts** : Pipeline → Devis → Factures → Cash

#### Contexte
Sophie est contactée par une nouvelle entreprise (Agence Bloom) pour une mission UX à 2 200€. Elle doit créer le prospect, lui envoyer un devis, convertir en facture et enregistrer le paiement.

#### Étapes

| # | Action | Module | Résultat attendu |
|---|---|---|---|
| 1 | Login `sophie@designstudio.fr` | Auth | Redirect `/focus` |
| 2 | Aller dans **Pipeline** | Pipeline | Vue Kanban |
| 3 | Cliquer **+ Nouveau prospect** | Pipeline | Modal création |
| 4 | Taper `"Agence Bloom"` dans Entreprise | Pipeline | Suggestions API gouv.fr |
| 5 | Sélectionner `Agence Bloom Communication SAS` | Pipeline | Champs SIRET, adresse remplis automatiquement |
| 6 | Compléter : Contact `"Nathalie Brun"`, Email `"n.brun@agencebloom.fr"`, Valeur `2200€` | Pipeline | Formulaire complété |
| 7 | Cliquer **Ajouter** | Pipeline | Prospect créé en colonne IDENTIFIED |
| 8 | Glisser la carte vers **PROPOSAL** | Pipeline | Statut mis à jour, wiki mis à jour |
| 9 | Cliquer **📄 Créer un devis** sur la carte | Pipeline | Redirect `/invoices` avec infos client pré-remplies |
| 10 | Dans le champ brief : *"Mission UX Discovery 2 jours à 800€/j + livrable synthèse 600€"* | Devis | Parse-brief IA génère les lignes |
| 11 | Vérifier les lignes générées | Devis | 2 lignes correctes, total 2 200€ |
| 12 | Cliquer **Aperçu PDF** | Devis | PDF correct avec infos légales Sophie |
| 13 | Cliquer **Enregistrer** puis **Marquer comme envoyé** | Devis | Statut SENT, date d'envoi enregistrée |
| 14 | Simuler acceptation : cliquer **✅ Accepté** | Devis | Statut ACCEPTED |
| 15 | Cliquer **Convertir en facture** | Devis | FAC-2026-XXX créée automatiquement |
| 16 | Dans Factures, vérifier la facture créée | Factures | Toutes infos reprises du devis |
| 17 | Cliquer **💰 Marquer comme payée** | Factures | Statut PAID, date paiement enregistrée |
| 18 | Aller dans **Cash** | Cash | Transaction INCOME 2 200€ visible |
| 19 | Vérifier le Runway mis à jour | Cash | Runway recalculé avec le nouveau solde |
| 20 | Aller dans **Daily Focus** | Focus | Vérifier que l'action "Facturer Agence Bloom" disparaît |

**✅ Critères de succès**
- [ ] Prospect enrichi auto depuis l'API
- [ ] Devis créé depuis brief NLP
- [ ] PDF conforme avec mentions légales
- [ ] Facture créée depuis devis en 1 clic
- [ ] Transaction cash créée automatiquement
- [ ] Runway mis à jour

---

### 🔄 E2E-02 — Prospect froid → Relance IA → RDV → Deal

**Persona** : Sophie Martin  
**Durée estimée** : 10 min  
**Modules couverts** : Pipeline → Relances → Calendrier → Focus

#### Contexte
Lucas Petit (P04) n'a pas répondu depuis 17 jours. Sophie génère une relance IA, l'envoie, puis Lucas prend un RDV via Cal.com. L'événement apparaît automatiquement.

#### Étapes

| # | Action | Module | Résultat attendu |
|---|---|---|---|
| 1 | Pipeline → repérer Lucas Petit en CONTACTED | Pipeline | Badge `⏰ 17j sans réponse` visible |
| 2 | Cliquer **✉️ Générer une relance** | Pipeline | Message IA personnalisé généré |
| 3 | Vérifier le contenu : mention du contexte initial | Relance | Référence à la première prise de contact |
| 4 | Cliquer **📋 Copier** | Relance | Message copié dans clipboard |
| 5 | Cliquer **Enregistrer la relance** | Relance | Date dernier contact mise à jour |
| 6 | Glisser Lucas vers **INTERESTED** | Pipeline | Statut mis à jour |
| 7 | Simuler réception webhook Cal.com (booking créé) | Calendrier | CalendarEvent créé automatiquement |
| 8 | Aller dans **Calendrier** | Calendrier | Voir RDV Lucas Petit, lien vers prospect |
| 9 | Vérifier **Daily Focus** du lendemain | Focus | Action "Préparer appel Lucas Petit" présente |
| 10 | Après le RDV : glisser vers **PROPOSAL** | Pipeline | Pipeline avancé, wiki mis à jour |

**✅ Critères de succès**
- [ ] Relance contextualisée générée
- [ ] RDV Cal.com → CalendarEvent automatique
- [ ] Lien prospect ↔ calendrier établi
- [ ] Focus du lendemain mis à jour

---

### 🔄 E2E-03 — Matin type d'entrepreneur (Daily Flow)

**Persona** : Marc Lefebvre  
**Durée estimée** : 8 min  
**Modules couverts** : Focus → Tasks → Cash → Chat

#### Contexte
Marc commence sa journée. Il consulte son Daily Focus, traite les actions prioritaires, saisit une dépense, et interroge son Business Brain.

#### Étapes

| # | Action | Module | Résultat attendu |
|---|---|---|---|
| 1 | Login Marc, arriver sur `/focus` | Auth + Focus | 3 actions du jour affichées |
| 2 | Lire l'action #1 : *"Relancer Anne-Lise Perrin — devis 18k€, 8j sans réponse"* | Focus | Justification visible |
| 3 | Depuis Focus, cliquer le lien vers le prospect | Pipeline | Fiche Anne-Lise Perrin ouverte |
| 4 | Générer relance IA | Relance | Message adapté au stade PROPOSAL |
| 5 | Copier et envoyer | Relance | Relance enregistrée |
| 6 | Retour Focus, cocher l'action #1 ✅ | Focus | Score 33% |
| 7 | Action #2 : *"Enregistrer acompte RetailGroup 5 000€"* | Focus | |
| 8 | Aller dans **Cash**, saisir en NLP : *"Reçu acompte RetailGroup 5000€"* | Cash | Parse-brief : INCOME 5 000€ Consulting |
| 9 | Valider la transaction | Cash | Solde mis à jour |
| 10 | Retour Focus, cocher #2 ✅ | Focus | Score 67% |
| 11 | Chat → *"Quel est mon CA total ce mois ?"* | Chat | Réponse avec données réelles |
| 12 | Cocher action #3 ✅ | Focus | Score 100%, badge 🔥 |
| 13 | Vérifier streak | Focus | +1 jour consécutif |

**✅ Critères de succès**
- [ ] 3 actions cohérentes avec données Marc
- [ ] Score progresse à chaque complétion
- [ ] NLP Cash fonctionne
- [ ] Chat répond avec CA réel du mois

---

### 🔄 E2E-04 — Publication contenu LinkedIn + suivi

**Persona** : Sophie Martin  
**Durée estimée** : 8 min  
**Modules couverts** : Content → Chat → Focus

#### Étapes

| # | Action | Module | Résultat attendu |
|---|---|---|---|
| 1 | Aller dans **Contenu** | Content | Calendrier éditorial visible |
| 2 | Cliquer **✨ Générer un post** | Content | Options de types |
| 3 | Choisir type `victory`, thème *"refonte UX +34% conversion"* | Content | Post généré en 3s |
| 4 | Vérifier que le post mentionne le secteur UX/Design | Content | Contenu contextualisé |
| 5 | Modifier un mot, cliquer **Sauvegarder brouillon** | Content | Statut DRAFT |
| 6 | Cliquer **Programmer** → Mardi 9h | Content | Statut SCHEDULED |
| 7 | Simuler publication : statut → PUBLISHED | Content | Badge PUBLIÉ |
| 8 | Saisir les stats : `1500 impressions, 62 réactions` | Content | Stats enregistrées |
| 9 | Chat → *"Quel est mon meilleur post de mai ?"* | Chat | Répond avec le post victory |
| 10 | Vérifier le wiki `content/what-works.md` | Wiki | Mention du post ajoutée |

---

### 🔄 E2E-05 — Onboarding Julie + Test limites FREE + Upgrade

**Persona** : Julie Moreau  
**Durée estimée** : 10 min  
**Modules couverts** : Onboarding → Limites FREE → Stripe Checkout

#### Étapes

| # | Action | Résultat attendu |
|---|---|---|
| 1 | Créer compte `julie@agencecreative.com` via `/onboarding` | Compte créé, plan FREE |
| 2 | Aller sur `/focus` | UpgradeBanner visible (Daily Focus = PRO) |
| 3 | Cliquer **Générer le focus** | Redirect ou modale upgrade |
| 4 | Aller dans Pipeline, créer 3 prospects | 3 prospects créés OK |
| 5 | Tenter de créer un 4ème prospect | Message "Limite FREE atteinte (3/3)" |
| 6 | Aller dans Contenu, générer 4 posts | 4 posts OK |
| 7 | Tenter de générer le 5ème post | Message "Limite 4 posts/mois atteinte" |
| 8 | Tenter créer un devis | UpgradeBanner |
| 9 | Cliquer **Passer à Solo Pro** | Redirect vers Stripe Checkout |
| 10 | (Test) Utiliser carte Stripe `4242 4242 4242 4242` | Paiement accepté |
| 11 | Retour app | Plan mis à jour → PRO, UpgradeBanner disparu |
| 12 |
Créer son 1er devis | Devis | Fonctionne normalement |
| 13 | Générer Daily Focus | Focus | 3 actions affichées (accès PRO) |

**✅ Critères de succès**
- [ ] Limites FREE correctement bloquées avec message explicite
- [ ] UpgradeBanner visible sur chaque feature PRO
- [ ] Stripe Checkout fonctionne avec carte de test `4242 4242 4242 4242`
- [ ] Plan mis à jour en base après paiement Stripe

---

### 🔄 E2E-06 — Upload document + interrogation via Chat

**Persona** : Marc Lefebvre  
**Durée estimée** : 6 min  
**Modules couverts** : Knowledge Base → Chat

| # | Action | Résultat attendu |
|---|---|---|
| 1 | Aller dans **Base de connaissances** | Liste vide ou existante |
| 2 | Uploader `Contrat_type_mission.pdf` (catégorie : Juridique) | Statut PROCESSING |
| 3 | Attendre indexation | Statut → INDEXED, 8 pages |
| 4 | Uploader `Methodo_consulting_Marc.docx` (catégorie : Commercial) | Statut → INDEXED |
| 5 | Aller dans **Chat** | Interface chat |
| 6 | Demander : *"Quelles sont les clauses de résiliation dans mon contrat type ?"* | Réponse citant le PDF |
| 7 | Demander : *"Résume ma méthodologie de consulting"* | Réponse basée sur le DOCX |
| 8 | Demander : *"Compare les délais de paiement dans mes documents"* | Synthèse cross-documents |

---

## 4. Tests par Module

### 4.1 Module Authentification

| ID | Test | Données | Action | Résultat attendu | Priorité |
|---|---|---|---|---|---|
| AUTH-01 | Inscription nouveau | Email: `sophie@designstudio.fr`, MDP: `Sophie1234!` | POST `/api/auth/register` | HTTP 201, cookie posé, wiki créé | 🔴 |
| AUTH-02 | Login valide | `sophie@designstudio.fr` / `Sophie1234!` | POST `/api/auth/login` | HTTP 200, token JWT | 🔴 |
| AUTH-03 | Login MDP invalide | MDP: `mauvais` | POST `/api/auth/login` | HTTP 401, message d'erreur | 🔴 |
| AUTH-04 | Email doublon | `sophie@designstudio.fr` déjà créé | POST `/api/auth/register` | Redirect `/login?email=...` | 🔴 |
| AUTH-05 | Route protégée sans token | Aucun cookie | GET `/api/focus` | HTTP 401 | 🔴 |
| AUTH-06 | Route protégée avec token | Cookie valide | GET `/api/auth/me` | HTTP 200, données user | 🔴 |
| AUTH-07 | Logout | Cookie valide | POST `/api/auth/logout` | HTTP 200, cookie effacé | 🟡 |
| AUTH-08 | Changement MDP | Ancien: `Sophie1234!`, Nouveau: `Sophie5678!` | POST `/api/auth/change-password` | HTTP 200, login avec nouveau MDP OK | 🟡 |
| AUTH-09 | Mise à jour profil | `businessName: "Studio S"`, `monthlyGoal: 6000` | PUT `/api/auth/profile` | HTTP 200, données mises à jour | 🟡 |
| AUTH-10 | Isolation données | Login Sophie puis Marc | GET `/api/cash/transactions` | Chaque user voit ses données uniquement | 🔴 |

---

### 4.2 Module Daily Focus

| ID | Test | Données | Action | Résultat attendu | Priorité |
|---|---|---|---|---|---|
| FOCUS-01 | Génération focus | Compte Sophie PRO avec données | GET `/api/focus` | 3 actions avec priorités Cash→Clients→Vis | 🔴 |
| FOCUS-02 | Persistance focus | Focus existant du jour | GET `/api/focus` (2ème appel) | Même focus retourné, pas de nouvel appel LLM | 🔴 |
| FOCUS-03 | Régénération | Focus du jour existant | POST `/api/focus` avec `{regenerate: true}` | Nouveau focus généré | 🟡 |
| FOCUS-04 | Complétion action | `{actionIndex: 0, status: "done"}` | POST `/api/focus` | Statut mis à jour, score recalculé | 🔴 |
| FOCUS-05 | Score 0% → 100% | Cocher 3 actions | 3x POST `/api/focus` | Score 0 → 33 → 67 → 100 | 🟡 |
| FOCUS-06 | Streak +1 | Focus complété hier | GET `/api/focus/streak` | streak = streak_hier + 1 | 🟡 |
| FOCUS-07 | Historique | Compte avec 7 jours de focus | GET `/api/focus/history` | Array de 7 entrées avec dates et scores | 🟢 |
| FOCUS-08 | FREE bloqué | Compte Julie FREE | GET `/api/focus` | HTTP 403 ou UpgradeBanner | 🔴 |
| FOCUS-09 | Contextuel | Compte avec prospect "Camille" en PROPOSAL | Générer focus | Action mentionne Camille et le montant | 🟡 |

---

### 4.3 Module Cash

| ID | Test | Données | Action | Résultat attendu | Priorité |
|---|---|---|---|---|---|
| CASH-01 | Créer transaction INCOME | T01 (2 400€ Consulting) | POST `/api/cash/transactions` | HTTP 201, transaction créée | 🔴 |
| CASH-02 | Créer transaction EXPENSE | T06 (15€ Figma) | POST `/api/cash/transactions` | HTTP 201 | 🔴 |
| CASH-03 | Lister transactions | Mois courant | GET `/api/cash/transactions?month=2026-05` | Toutes transactions de mai | 🔴 |
| CASH-04 | Runway calculator | 10 transactions saisies | GET `/api/cash/runway` | 3 scénarios avec dates | 🔴 |
| CASH-05 | Parse-brief NLP | `"Payé loyer 400€ ce matin"` | POST `/api/cash/parse-brief` | EXPENSE 400€, catégorie Loyer | 🟡 |
| CASH-06 | Catégorisation IA | `{description: "Netflix", type: "EXPENSE"}` | POST `/api/cash/categorize` | Catégorie: `Logiciels & SaaS` | 🟡 |
| CASH-07 | OCR reçu | Image reçu restaurant | POST `/api/cash/ocr` (multipart) | Montant + catégorie extraits | 🟡 |
| CASH-08 | Charges récurrentes | Loyer 400€ mensuel | POST `/api/cash/recurrences` | Récurrence créée | 🟢 |
| CASH-09 | Solde calculé | 5 revenus + 3 dépenses | GET `/api/cash/transactions` | Solde = somme INCOME - somme EXPENSE | 🔴 |

---

### 4.4 Module Pipeline CRM

| ID | Test | Données | Action | Résultat attendu | Priorité |
|---|---|---|---|---|---|
| PIPE-01 | Créer prospect | Données P01 (Camille TechCorp) | POST `/api/pipeline/prospects` | HTTP 201, prospect créé | 🔴 |
| PIPE-02 | Enrichissement auto | `{name: "Decathlon"}` | POST `/api/pipeline/enrich` | SIRET + adresse + taille retournés | 🔴 |
| PIPE-03 | Changer statut | P01 IDENTIFIED → PROPOSAL | PUT `/api/pipeline/prospects/{id}` | Statut mis à jour, wiki ingesté | 🔴 |
| PIPE-04 | Lister par statut | Filtre `?status=PROPOSAL` | GET `/api/pipeline/prospects?status=PROPOSAL` | Seulement prospects PROPOSAL | 🟡 |
| PIPE-05 | Générer relance | P04 Lucas, 17j sans contact | POST `/api/pipeline/relance` | Message contextualisé généré | 🔴 |
| PIPE-06 | Parse-brief NLP | *"Nouveau prospect Lucas Martin, Dataflow, 4000€"* | POST `/api/pipeline/parse-brief` | Prospect structuré extrait | 🟡 |
| PIPE-07 | Supprimer prospect | DELETE `{id: P07}` | DELETE `/api/pipeline/prospects/{id}` | HTTP 200, prospect supprimé | 🟢 |
| PIPE-08 | Deal WON → wiki | P06 statut → WON | PUT statut WON | `business/icp.md` mis à jour | 🟡 |
| PIPE-09 | Limite FREE | Julie avec 3 prospects | POST 4ème prospect | HTTP 403 ou message limite | 🔴 |

---

### 4.5 Module Devis & Factures

| ID | Test | Données | Action | Résultat attendu | Priorité |
|---|---|---|---|---|---|
| QUOTE-01 | Créer devis manuel | DEVIS-2026-001 (TechCorp 3 600€) | POST `/api/quotes` | HTTP 201, numérotation auto | 🔴 |
| QUOTE-02 | Parse-brief devis | *"3j consulting UX, 800€/j, TVA 20%"* | POST `/api/quotes/parse-brief` | Lignes structurées + totaux calculés | 🔴 |
| QUOTE-03 | Aperçu PDF | Devis créé | GET `/print/quote/{id}` | PDF avec mentions légales Sophie | 🔴 |
| QUOTE-04 | Statut SENT | Devis DRAFT | PUT `{status: "SENT"}` | sentAt renseigné | 🟡 |
| QUOTE-05 | Conversion en facture | Devis ACCEPTED | POST convert | FAC-2026-XXX créée avec lignes reprises | 🔴 |
| QUOTE-06 | Facture payée → cash | Facture SENT | PUT `{status: "PAID"}` | Transaction INCOME créée automatiquement | 🔴 |
| QUOTE-07 | Numérotation auto | 3 devis créés | GET `/api/quotes` | Numéros séquentiels DEVIS-2026-001, 002, 003 | 🟡 |
| QUOTE-08 | Infos client pré-remplies | Devis depuis prospect enrichi | Vérifier clientInfo | SIRET + adresse du prospect présents | 🟡 |

---

### 4.6 Module Tâches

| ID | Test | Données | Action | Résultat attendu | Priorité |
|---|---|---|---|---|---|
| TASK-01 | Créer tâche | TK01 (Relancer Camille) | POST `/api/tasks` | HTTP 201 | 🔴 |
| TASK-02 | Parse-brief NLP | *"Préparer démo TechStart mardi, 45min"* | POST `/api/tasks/parse-brief` | Tâche structurée avec date | 🟡 |
| TASK-03 | Priorisation IA | 5 tâches variées | POST `/api/tasks/prioritize` | Scores 0–100 avec justifications | 🔴 |
| TASK-04 | Compléter tâche | TK03 TODO → DONE | PUT `/api/tasks/{id}` `{status: "DONE"}` | completedAt renseigné | 🔴 |
| TASK-05 | Tâche récurrente | TK05 fin de mois | POST avec `{isRecurring: true, recurrenceType: "MONTHLY_END"}` | Badge récurrence visible | 🟡 |
| TASK-06 | Lier prospect | TK01 → P01 | PUT `{linkedProspectId: "P01"}` | Lien établi, visible sur la tâche | 🟡 |
| TASK-07 | Filtrer par catégorie | `?category=CASH` | GET `/api/tasks?category=CASH` | Seulement tâches CASH | 🟢 |
| TASK-08 | Supprimer tâche | TK08 | DELETE `/api/tasks/{id}` | HTTP 200 | 🟢 |

---

### 4.7 Module Contenu LinkedIn

| ID | Test | Données | Action | Résultat attendu | Priorité |
|---|---|---|---|---|---|
| CONT-01 | Générer post insight | Secteur Design, thème UX | POST `/api/content/generate` | Post 800–1200 chars, ton expert | 🔴 |
| CONT-02 | Générer post victory | Thème *"mission réussie"* | POST generate `{postType: "victory"}` | Post avec résultats concrets | 🟡 |
| CONT-03 | Sauvegarder brouillon | Post généré | POST `/api/content/posts` `{status: "DRAFT"}` | Sauvegardé | 🔴 |
| CONT-04 | Programmer post | Post DRAFT | PUT `{status: "SCHEDULED", scheduledAt: 
ié | Post SCHEDULED | PUT `{status:"PUBLISHED", impressions: 1500}` | Statut PUBLISHED, stats enregistrées | 🟡 |
| CONT-06 | Limite FREE posts | Julie avec 4 posts | POST 5ème post | Erreur limite 4/mois | 🔴 |
| CONT-07 | Wiki mis à jour | Post publié | Vérifier `content/what-works.md` | Mention du post ajoutée | 🟡 |

---

### 4.8 Module Chat Business Brain

| ID | Test | Données | Action | Résultat attendu | Priorité |
|---|---|---|---|---|---|
| CHAT-01 | Question CA mensuel | Sophie avec 5 transactions | *"Quel est mon CA de mai ?"* | Réponse avec montant exact 3 200€ | 🔴 |
| CHAT-02 | Question prospects | Pipeline rempli | *"Qui sont mes prospects chauds ?"* | Liste avec statuts et valeurs | 🔴 |
| CHAT-03 | Conseil stratégique | Données complètes | *"Dois-je prospecter ou finir ma mission ?"* | Réponse nuancée avec analyse données | 🟡 |
| CHAT-04 | Action rapide santé | Bouton prédéfini | Clic **Santé financière** | Synthèse complète < 3s | 🟡 |
| CHAT-05 | Mémoire conversation | Contexte précédent | *"Et par rapport au mois dernier ?"* | Réponse cohérente avec contexte chat | 🟡 |
| CHAT-06 | Wiki interrogé | Wiki avec prospects | *"Parle-moi de TechCorp"* | Réponse citant le wiki prospect | 🟡 |
| CHAT-07 | FREE bloqué | Julie FREE | Envoyer message | UpgradeBanner ou HTTP 403 | 🔴 |
| CHAT-08 | Historique messages | 5 messages envoyés | GET `/api/chat` | Messages persistés en BDD | 🟢 |

---

### 4.9 Module Base de Connaissances

| ID | Test | Données | Action | Résultat attendu | Priorité |
|---|---|---|---|---|---|
| KB-01 | Upload PDF | `Contrat_type.pdf` (8 pages) | POST `/api/knowledge/file` | HTTP 201, statut PROCESSING | 🔴 |
| KB-02 | Indexation complète | PDF uploadé | Attendre 10s, GET `/api/knowledge` | Statut → INDEXED, pageCount = 8 | 🔴 |
| KB-03 | Upload DOCX | `Methodo.docx` | POST multipart | HTTP 201, INDEXED | 🟡 |
| KB-04 | Upload PPTX | `Presentation.pptx` | POST multipart | HTTP 201, INDEXED | 🟡 |
| KB-05 | Interroger via chat | PDF indexé | Chat: *"Clauses de résiliation ?"* | Réponse citant le document | 🔴 |
| KB-06 | Lister documents | 3 docs indexés | GET `/api/knowledge` | Liste avec statuts | 🟡 |
| KB-07 | Catégories | Doc catégorie Juridique | POST avec `{category: "Juridique"}` | Catégorie enregistrée | 🟢 |

---

### 4.10 Module Calendrier Cal.com

| ID | Test | Données | Action | Résultat attendu | Priorité |
|---|---|---|---|---|---|
| CAL-01 | Webhook booking créé | Payload Cal.com BOOKING_CREATED | POST `/api/calcom/webhook` | HTTP 200, CalendarEvent créé | 🔴 |
| CAL-02 | Webhook HMAC valide | Signature correcte | POST webhook | Événement traité | 🔴 |
| CAL-03 | Webhook HMAC invalide | Mauvaise signature | POST webhook | HTTP 401 | 🔴 |
| CAL-04 | Lier prospect | Email attendee = email prospect | POST webhook | Prospect lié automatiquement | 🟡 |
| CAL-05 | Lister événements | 3 RDV créés | GET `/api/calcom/events` | Liste des 3 événements | 🟡 |
| CAL-06 | Annulation | Payload BOOKING_CANCELLED | POST webhook | Statut → CANCELLED | 🟡 |
| CAL-07 | Reprogrammation | Payload BOOKING_RESCHEDULED | POST webhook | Nouvelles dates mises à jour | 🟢 |

---

### 4.11 Module Assessment

| ID | Test | Données | Action | Résultat attendu | Priorité |
|---|---|---|---|---|---|
| ASSESS-01 | Soumission complète | Thomas Leclerc, toutes questions | POST `/api/assessment` | HTTP 201, synthèse IA | 🔴 |
| ASSESS-02 | Score calculé | Réponses moyennes (3/5) | POST assessment | Score 55–70/100 | 🔴 |
| ASSESS-03 | ROI calculé | CA 2800€, 8h perdues/sem | POST assessment | ROI estimé en euros | 🔴 |
| ASSESS-04 | Page publique | Aucun cookie | GET `/assessment` | Page accessible sans auth | 🔴 |
| ASSESS-05 | Synthèse personnalisée | Réponses différentes A vs B | Comparer 2 soumissions | Synthèses différentes | 🟡 |
| ASSESS-06 | Lead capturé | Email `thomas@freelance.io` | GET BDD après soumission | AssessmentLead créé | 🟡 |

---

## 5. Tests API (cURL)

> **Prérequis** : Remplacer `$TOKEN` par le token obtenu à la connexion.

### 5.1 Obtenir un token

```bash
# Connexion et récupération du token
TOKEN=$(curl -s -X POST http://51.159.164.33:50082/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"sophie@designstudio.fr","password":"Sophie1234!"}' \
  | python3 -c 'import sys,json; d=json.load(sys.stdin); print(d.get("token",""))')
echo "TOKEN: $TOKEN"
```

### 5.2 Tests Auth

```bash
# Inscription
curl -s -X POST http://51.159.164.33:50082/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"name":"Sophie Martin","email":"sophie@designstudio.fr","password":"Sophie1234!","businessName":"Design Studio Sophie","sector":"Design","monthlyGoal":5000,"fixedCharges":800}' | python3 -m json.tool

# Profil courant
curl -s http://51.159.164.33:50082/api/auth/me \
  -H "Cookie: auth_token=$TOKEN" | python3 -m json.tool

# Mise à jour profil
curl -s -X PUT http://51.159.164.33:50082/api/auth/profile \
  -H 'Content-Type: application/json' \
  -H "Cookie: auth_token=$TOKEN" \
  -d '{"businessName":"Design Studio S","monthlyGoal":6000}' | python3 -m json.tool
```

### 5.3 Tests Cash

```bash
# Créer transaction INCOME
curl -s -X POST http://51.159.164.33:50082/api/cash/transactions \
  -H 'Content-Type: application/json' \
  -H "Cookie: auth_token=$TOKEN" \
  -d '{"amount":2400,"type":"INCOME","category":"Consulting","description":"Mission UX/UI — TechCorp","date":"2026-05-02"}' | python3 -m json.tool

# Parse-brief NLP
curl -s -X POST http://51.159.164.33:50082/api/cash/parse-brief \
  -H 'Content-Type: application/json' \
  -H "Cookie: auth_token=$TOKEN" \
  -d '{"brief":"J ai payé mon abonnement Figma 15 euros ce matin"}' | python3 -m json.tool

# Runway
curl -s http://51.159.164.33:50082/api/cash/runway \
  -H "Cookie: auth_token=$TOKEN" | python3 -m json.tool
```

### 5.4 Tests Pipeline

```bash
# Créer prospect
curl -s -X POST http://51.159.164.33:50082/api/pipeline/prospects \
  -H 'Content-Type: application/json' \
  -H "Cookie: auth_token=$TOKEN" \
  -d '{"name":"Camille Dupont","company":"TechCorp","email":"camille@techcorp.fr","value":3600,"status":"PROPOSAL"}' | python3 -m json.tool

# Enrichir prospect
curl -s -X POST http://51.159.164.33:50082/api/pipeline/enrich \
  -H 'Content-Type: application/json' \
  -H "Cookie: auth_token=$TOKEN" \
  -d '{"name":"TechCorp","company":"TechCorp SAS"}' | python3 -m json.tool

# Générer relance
curl -s -X POST http://51.159.164.33:50082/api/pipeline/relance \
  -H 'Content-Type: application/json' \
  -H "Cookie: auth_token=$TOKEN" \
  -d '{"prospectId":"PROSPECT_ID_ICI"}' | python3 -m json.tool
```

### 5.5 Tests Focus

```bash
# Générer focus
curl -s -X POST http://51.159.164.33:50082/api/focus \
  -H "Cookie: auth_token=$TOKEN" | python3 -m json.tool

# Score
curl -s http://51.159.164.33:50082/api/focus/score \
  -H "Cookie: auth_token=$TOKEN" | python3 -m json.tool

# Streak
curl -s http://51.159.164.33:50082/api/focus/streak \
  -H "Cookie: auth_token=$TOKEN" | python3 -m json.tool
```

### 5.6 Tests Devis

```bash
# Parse-brief devis
curl -s -X POST http://51.159.164.33:50082/api/quotes/parse-brief \
  -H 'Content-Type: application/json' \
  -H "Cookie: auth_token=$TOKEN" \
  -d '{"brief":"3 jours consulting UX pour TechCorp, 800 euros jour, sans TVA"}' | python3 -m json.tool

# Créer devis
curl -s -X POST http://51.159.164.33:50082/api/quotes \
  -H 'Content-Type: application/json' \
  -H "Cookie: auth_token=$TOKEN" \
  -d '{"lines":[{"title":"Consulting UX","qty":3,"unitPrice":800,"vatRate":0,"unit":"jour"}],"clientInfo":{"name":"TechCorp","city":"Paris"}}' | python3 -m json.tool
```

### 5.7 Test Webhook Cal.com (simulation)

```bash
# Simuler webhook Cal.com BOOKING_CREATED
curl -s -X POST http://51.159.164.33:50082/api/calcom/webhook \
  -H 'Content-Type: application/json' \
  -H 'X-Cal-Signature-256: HMAC_SIGNATURE_ICI' \
  -d '{
    "triggerEvent": "BOOKING_CREATED",
    "payload": {
      "uid": "test-uid-001",
      "title": "Call découverte — TechCorp",
      "startTime": "2026-05-20T10:00:00Z",
      "endTime": "2026-05-20T11:00:00Z",
      "attendees": [{"name": "Camille Dupont", "email": "camille@techcorp.fr"}],
      "meetingUrl": "https://meet.google.com/abc-def-ghi"
    }
  }' | python3 -m json.tool
```

### 5.8 Test Assessment

```bash
# Soumettre assessment complet
curl -s -X POST http://51.159.164.33:50082/api/assessment \
  -H 'Content-Type: application/json' \
  -d '{
    "firstName": "Thomas",
    "lastName": "Leclerc",
    "email": "thomas@freelance.io",
    "answers": [
      {"questionId": "cash_1", "value": 2},
      {"questionId": "cash_2", "value": 3},
      {"questionId": "clients_1", "value": 2},
      {"questionId": "clients_2", "value": 1},
      {"questionId": "visibility_1", "value": 3}
    ],
    "roiData": {"currentRevenue": 2800, "timeWastedHours": 8}
  }

|---|---|---|---|
| SEC-01 | Accès sans JWT | GET `/api/cash/transactions` sans cookie | HTTP 401 Unauthorized |
| SEC-02 | JWT expiré | Cookie avec token expiré | HTTP 401, redirect `/login` |
| SEC-03 | JWT falsifié | Cookie modifié manuellement | HTTP 401 |
| SEC-04 | Cross-user data | Token Sophie, GET transactions Marc | HTTP 403 ou données vides |
| SEC-05 | Injection SQL | `email: "' OR 1=1--"` | Erreur validation, pas de fuite |
| SEC-06 | XSS contenu | Note prospect `<script>alert(1)</script>` | Affiché encodé, pas exécuté |
| SEC-07 | Webhook Stripe sans signature | POST `/api/stripe/webhook` sans header | HTTP 400 |
| SEC-08 | Webhook Cal.com HMAC invalide | POST webhook avec fausse signature | HTTP 401 |
| SEC-09 | Élévation FREE → PRO | Plan FREE, POST `/api/focus` direct | HTTP 403 |
| SEC-10 | Plan PRO sans paiement | Modifier `user.plan` en BDD | UpgradeBanner devrait réapparaître au prochain reload |
| SEC-11 | Brute force login | 20 tentatives rapides mauvais MDP | Idéalement rate-limit (429) |
| SEC-12 | Données isolation wiki | Wiki Sophie accessible par Marc | `/wiki-data/{sophieId}/` non lisible par Marc |

---

## 7. Matrice de Couverture

### 7.1 Couverture par module

| Module | Tests unitaires | Tests E2E | Persona testée | Priorité |
|---|:---:|:---:|---|---|
| Auth / Onboarding | AUTH 01–10 | E2E-01, E2E-05 | Sophie, Julie | 🔴 Critique |
| Daily Focus | FOCUS 01–09 | E2E-03 | Sophie, Marc, Julie | 🔴 Critique |
| Cash / Trésorerie | CASH 01–09 | E2E-01, E2E-03 | Sophie, Marc | 🔴 Critique |
| Pipeline CRM | PIPE 01–09 | E2E-01, E2E-02 | Sophie, Marc | 🔴 Critique |
| Relances IA | inclus PIPE-05 | E2E-02, E2E-03 | Sophie, Marc | 🔴 Critique |
| Devis & Factures | QUOTE 01–08 | E2E-01 | Sophie | 🔴 Critique |
| Tâches | TASK 01–08 | E2E-03 | Sophie | 🟡 Haute |
| Contenu LinkedIn | CONT 01–07 | E2E-04 | Sophie | 🟡 Haute |
| Chat Business Brain | CHAT 01–08 | E2E-03, E2E-06 | Sophie, Marc | 🟡 Haute |
| Knowledge Base | KB 01–07 | E2E-06 | Marc | 🟡 Haute |
| Calendrier Cal.com | CAL 01–07 | E2E-02 | Sophie | 🟡 Haute |
| Assessment | ASSESS 01–06 | — | Thomas (lead) | 🟡 Haute |
| Sécurité | SEC 01–12 | — | Tous | 🔴 Critique |
| Limites FREE | FOCUS-08, PIPE-09, CONT-06, CHAT-07 | E2E-05 | Julie | 🔴 Critique |
| Upgrade Stripe | — | E2E-05 | Julie | 🔴 Critique |

### 7.2 Couverture par persona

| Persona | Modules testés | Scénarios E2E | Nb tests |
|---|---|---|---|
| 👩‍💻 **Sophie** (PRO) | Auth, Focus, Cash, Pipeline, Devis, Tâches, Content, Chat, Cal.com | E2E-01, E2E-02, E2E-03, E2E-04 | ~60 |
| 👨‍💼 **Marc** (PRO) | Auth, Focus, Cash, Pipeline, Chat, Knowledge Base | E2E-03, E2E-06 | ~25 |
| 👩‍🎨 **Julie** (FREE→PRO) | Auth, Limites FREE, Upgrade Stripe | E2E-05 | ~15 |
| 🧑 **Thomas** (lead) | Assessment (non connecté) | — | ~6 |

### 7.3 Ordre d'exécution recommandé

```
🔴 PHASE 1 — Critique (bloquer le reste si KO)
  1. AUTH-01 à AUTH-06        (inscription + login)
  2. CASH-01 à CASH-04        (transactions + runway)
  3. PIPE-01 à PIPE-05        (prospects + enrichissement)
  4. FOCUS-01 à FOCUS-04      (génération + complétion)
  5. SEC-01 à SEC-04          (isolation données)

🟡 PHASE 2 — Haute priorité
  6. QUOTE-01 à QUOTE-06      (devis + factures)
  7. TASK-01 à TASK-04        (tâches + priorisation IA)
  8. CONT-01 à CONT-05        (génération posts)
  9. CHAT-01 à CHAT-06        (chat business brain)
  10. CAL-01 à CAL-04         (webhooks Cal.com)

🟢 PHASE 3 — Couverture complète
  11. KB-01 à KB-07           (knowledge base)
  12. ASSESS-01 à ASSESS-06   (assessment)
  13. E2E-01 à E2E-06         (scénarios bout-en-bout)
  14. SEC-05 à SEC-12         (sécurité avancée)
  15. Limites FREE            (Julie persona)
```

---

## Annexe — Cartes Stripe de Test

| Carte | Numéro | Résultat |
|---|---|---|
| Visa succès | `4242 4242 4242 4242` | Paiement accepté |
| Visa refusé | `4000 0000 0000 0002` | Paiement refusé |
| Authentification 3DS | `4000 0027 6000 3184` | Demande 3DS |
| Fonds insuffisants | `4000 0000 0000 9995` | Décliné insufficient_funds |

> Date d'expiration : n'importe quelle date future | CVV : `123` | ZIP : `75001`

---

## Annexe — Payload Webhook Cal.com (Test)

```json
{
  "triggerEvent": "BOOKING_CREATED",
  "payload": {
    "uid": "cal-test-uid-001",
    "title": "Call découverte Sophie",
    "startTime": "2026-05-20T10:00:00.000Z",
    "endTime": "2026-05-20T11:00:00.000Z",
    "status": "ACCEPTED",
    "attendees": [
      {
        "name": "Camille Dupont",
        "email": "camille@techcorp.fr",
        "timeZone": "Europe/Paris"
      }
    ],
    "organizer": {
      "name": "Sophie Martin",
      "email": "sophie@designstudio.fr"
    },
    "meetingUrl": "https://meet.google.com/xyz-abc-def",
    "description": "Appel découverte pour mission UX"
  }
}
```

---

> 🧪 **Document créé par Agent Zero — Business AI OS**  
> Fichier : `/a0/usr/projects/business_ai_os/STRATEGIE_DE_TEST_COMPLETE.md`  
> **3 personas | 6 scénarios E2E | 100+ cas de test | Données fictives complètes**
