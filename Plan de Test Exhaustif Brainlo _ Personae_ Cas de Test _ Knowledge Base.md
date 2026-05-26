# 🧪 Plan de Test Exhaustif Brainlo
## Personae, Cas de Test E2E & Données Knowledge Base

**Version :** 1.0.0  
**Date :** 2026-05-17  
**Portée :** Tests fonctionnels de bout en bout — brainlo.ai  
**Statut :** Draft — À valider avant exécution

---

## Table des matières

1. [Stratégie de test globale](#1-stratégie-de-test-globale)
2. [Personae de test](#2-personae-de-test)
3. [Données de test — Prospects](#3-données-de-test--prospects)
4. [Données de test — Devis](#4-données-de-test--devis)
5. [Données de test — Factures](#5-données-de-test--factures)
6. [Données de test — Transactions financières](#6-données-de-test--transactions-financières)
7. [Documents Knowledge Base à créer](#7-documents-knowledge-base-à-créer)
8. [Cas de test — Module Onboarding](#8-cas-de-test--module-onboarding)
9. [Cas de test — Module CRM Pipeline](#9-cas-de-test--module-crm-pipeline)
10. [Cas de test — Module Devis & Factures](#10-cas-de-test--module-devis--factures)
11. [Cas de test — Module Trésorerie](#11-cas-de-test--module-trésorerie)
12. [Cas de test — Knowledge Base](#12-cas-de-test--knowledge-base)
13. [Cas de test — Chat Business Brain](#13-cas-de-test--chat-business-brain)
14. [Cas de test — Daily Focus IA](#14-cas-de-test--daily-focus-ia)
15. [Cas de test — Gestion des Tâches IA](#15-cas-de-test--gestion-des-tâches-ia)
16. [Scénarios E2E complets](#16-scénarios-e2e-complets)
17. [Matrice de couverture](#17-matrice-de-couverture)

---

## 1. Stratégie de test globale

### 1.1 Approche

La stratégie repose sur **5 niveaux de test** :

| Niveau | Type | Outils | Couverture cible |
|--------|------|--------|------------------|
| L1 | Smoke test | Manuel / curl | Accès aux modules |
| L2 | Test fonctionnel unitaire | Manuel / Postman | Chaque action CRUD |
| L3 | Test d'intégration | Manuel / API | Flux entre modules |
| L4 | Test E2E scénarisé | Manuel / Playwright | Parcours utilisateur complet |
| L5 | Test de non-régression | Automatisé | Toutes les fonctions stables |

### 1.2 Priorités de test

```
🔴 CRITIQUE  : Inscription, Authentification, Devis→Facture, Paiement Stripe
🟠 HAUTE     : CRM Pipeline, Trésorerie, Knowledge Base upload/query
🟡 MOYENNE   : Daily Focus IA, Tâches IA, Relances, LinkedIn Content
🟢 BASSE     : Rapport mensuel, Email notifications, Assessment
```

### 1.3 Environnements

| Env | URL | Usage |
|-----|-----|-------|
| Production | https://brainlo.ai | Tests de validation finale |
| Dev local | http://localhost:50082 | Tests de développement |

---

## 2. Personae de test

### 👩‍💻 PERSONA A — Sophie Martin *(existant — enrichi)*
**Profil :** Freelance UX/UI Designer, 3 ans d'expérience

| Champ | Valeur |
|-------|--------|
| **Nom** | Sophie Martin |
| **Email** | `elsane.tiberini@gmail.com` *(adresse réelle — tests email)* |
| **Mot de passe** | `SophieTest2026!` |
| **Entreprise** | Design Studio SM |
| **SIRET** | 81234567800012 |
| **Statut juridique** | Auto-entrepreneur |
| **Secteur** | Design & UX |
| **Plan** | Solo Pro (29€/mois) |
| **CA objectif** | 5 000€/mois |
| **Charges fixes** | 800€/mois |
| **Solde initial** | 3 200€ |
| **TVA** | Non assujettie |
| **Adresse** | 12 rue des Artistes, 75011 Paris |
| **Objectifs Brainlo** | Automatiser relances, générer contenu LinkedIn |

**Usage test :** Plan Solo Pro, pipeline UX/Design, devis design, transactions mixtes.

---

### 👨‍💼 PERSONA B — Marc Lefebvre *(existant — enrichi)*
**Profil :** Consultant IT senior, transformation digitale

| Champ | Valeur |
|-------|--------|
| **Nom** | Marc Lefebvre |
| **Email** | `sales@quotium.com` *(adresse réelle — tests email)* |
| **Mot de passe** | `MarcTest2026!` |
| **Entreprise** | ConseilTech SARL |
| **SIRET** | 52345678900034 |
| **Statut juridique** | SARL |
| **Secteur** | Consulting IT |
| **Plan** | Solo Pro (29€/mois) |
| **CA objectif** | 12 000€/mois |
| **Charges fixes** | 2 400€/mois |
| **Solde initial** | 8 500€ |
| **TVA** | Assujetti 20% |
| **Adresse** | 45 avenue de la République, 69002 Lyon |
| **Objectifs Brainlo** | Suivi pipeline long cycle, relances, KB contrats |

**Usage test :** Longs cycles de vente, gros devis, knowledge base juridique et méthodologique.

---

### 👩‍🎨 PERSONA C — Julie Moreau *(existant — enrichi)*
**Profil :** Créatrice de contenu & community manager débutante

| Champ | Valeur |
|-------|--------|
| **Nom** | Julie Moreau |
| **Email** | `elsane@yahoo.fr` *(adresse réelle — tests email)* |
| **Mot de passe** | `JulieTest2026!` |
| **Entreprise** | Julie Creative |
| **SIRET** | 91234567800056 |
| **Statut juridique** | Auto-entrepreneur |
| **Secteur** | Communication & Contenu |
| **Plan** | FREE (puis upgrade Solo Pro) |
| **CA objectif** | 3 000€/mois |
| **Charges fixes** | 400€/mois |
| **Solde initial** | 1 200€ |
| **TVA** | Non assujettie |
| **Adresse** | 8 rue des Lilas, 33000 Bordeaux |
| **Objectifs Brainlo** | Structurer son activité, premiers devis |

**Usage test :** Limites plan FREE, parcours upgrade Stripe, premier devis, onboarding simplifié.

---

### 🏗️ PERSONA D — Antoine Dubois *(NOUVEAU)*
**Profil :** Architecte indépendant, cabinet unipersonnel

| Champ | Valeur |
|-------|--------|
| **Nom** | Antoine Dubois |
| **Email** | `antoine@architecte-dubois.fr` |
| **Mot de passe** | `AntoineTest2026!` |
| **Entreprise** | Cabinet Dubois Architecture |
| **SIRET** | 44556677800078 |
| **Statut juridique** | Entreprise individuelle |
| **Secteur** | Architecture & BTP |
| **Plan** | Solo Pro (29€/mois) |
| **CA objectif** | 8 000€/mois |
| **Charges fixes** | 1 500€/mois |
| **Solde initial** | 12 000€ |
| **TVA** | Assujetti 20% |
| **Adresse** | 22 boulevard Haussmann, 75009 Paris |
| **Objectifs Brainlo** | Suivi missions longues, facturation échelonnée, gestion sous-traitants |

**Usage test :** Devis complexes multi-phases, acomptes, notes d'honoraires, KB réglementaire.

**Spécificités :**
- Missions longues (6-18 mois)
- Facturation en plusieurs tranches (acompte 30%, situation 40%, solde 30%)
- Documents KB : normes architecturales, contrats MOE, CGV cabinet
- Clients : promoteurs immobiliers, collectivités, particuliers aisés

---

### 💊 PERSONA E — Isabelle Fontaine *(NOUVEAU)*
**Profil :** Pharmacienne conseil / formatrice santé, reconversion pro

| Champ | Valeur |
|-------|--------|
| **Nom** | Isabelle Fontaine |
| **Email** | `isabelle@pharmaformation.fr` |
| **Mot de passe** | `IsabelleTest2026!` |
| **Entreprise** | PharmaFormation |
| **SIRET** | 77889900100090 |
| **Statut juridique** | SASU |
| **Secteur** | Formation & Santé |
| **Plan** | Solo Pro (29€/mois) |
| **CA objectif** | 6 500€/mois |
| **Charges fixes** | 950€/mois |
| **Solde initial** | 5 800€ |
| **TVA** | Non applicable (formation exonérée) |
| **N° Datadock** | 76-34-12345-0 |
| **Adresse** | 15 rue du Palais, 34000 Montpellier |
| **Objectifs Brainlo** | Gérer inscriptions formations, devis organismes, trésorerie OPCO |

**Usage test :** Secteur formation, TVA exonérée, conventions de formation, devis OPCO, KB pédagogique.

**Spécificités :**
- Devis envoyés à des OPCO (Uniformation, OPCO Santé)
- Conventions de formation (pas de factures classiques)
- Remboursements OPCO avec délais longs (60-90 jours)
- Documents KB : programme de formation, Qualiopi, attestations, CGV formation

---

### 🔍 PERSONA F — Thomas Leclerc *(LEAD / Non connecté)*
**Profil :** Ingénieur freelance, prospect de l'Assessment uniquement

| Champ | Valeur |
|-------|--------|
| **Nom** | Thomas Leclerc |
| **Email** | `thomas@freelance.io` |
| **Entreprise** | TL Engineering |
| **Secteur** | Ingénierie & R&D |
| **Accès** | Assessment public uniquement (sans compte) |

**Usage test :** Test de l'outil Assessment sans authentification, formulaire diagnostic.

---

## 3. Données de test — Prospects

### 3.1 Prospects de Sophie Martin (Persona A)

| ID | Nom complet | Entreprise | SIRET | Statut pipeline | Valeur estimée | Dernier contact | Source |
|----|-------------|------------|-------|-----------------|---------------|-----------------|--------|
| SP-01 | Camille Rousseau | TechCorp SAS | 73204482600034 | PROPOSAL | 4 500€ | 2026-05-10 | LinkedIn |
| SP-02 | Thomas Girard | StartupX | 83140217400021 | CONTACTED | 2 200€ | 2026-05-08 | Referral |
| SP-03 | Marie Dubois | Agence Nova | 64521039800045 | INTERESTED | 6 800€ | 2026-05-12 | Cold email |
| SP-04 | Lucas Petit | Innov Labs | 91234567800012 | PROPOSAL | 3 300€ | 2026-04-28 | Portfolio |
| SP-05 | Nathalie Bernard | RetailFrance | 55678901200067 | NEGOTIATION | 8 500€ | 2026-05-14 | Événement

| SP-06 | Raphaël Morin | GreenTech | 38901234500023 | IDENTIFIED | 1 800€ | 2026-05-15 | Cold email |
| SP-07 | Clara Vidal | Studio Pixel | 27890123400034 | WON | 5 200€ | 2026-04-15 | Referral |
| SP-08 | Kevin Blond | FinTech Wave | 66780123500045 | LOST | 2 900€ | 2026-04-20 | LinkedIn |

> 🔴 **SP-04 Lucas Petit** → 19 jours sans contact → éligible test relance IA  
> 🟡 **SP-01 Camille Rousseau** → Devis DEVIS-2026-001 associé  
> ✅ **SP-07 Clara Vidal** → WON → Facture FAC-2026-001 payée

---

### 3.2 Prospects de Marc Lefebvre (Persona B)

| ID | Nom complet | Entreprise | SIRET | Statut pipeline | Valeur estimée | Dernier contact | Source |
|----|-------------|------------|-------|-----------------|---------------|-----------------|--------|
| MP-01 | Anne-Lise Perrin | BanqueDirecte SA | 44200193600089 | PROPOSAL | 18 000€ | 2026-05-05 | Conférence |
| MP-02 | David Schmitt | LogisticPro | 55310284700034 | NEGOTIATION | 24 500€ | 2026-05-13 | Referral |
| MP-03 | Sébastien Roy | Assur Plus | 63420375800023 | CONTACTED | 9 200€ | 2026-04-30 | LinkedIn |
| MP-04 | Patricia Lemaire | HoldingNord | 71530466900012 | INTERESTED | 32 000€ | 2026-05-11 | Email entrant |
| MP-05 | Yann Beaumont | SantéCorp | 82640557000001 | IDENTIFIED | 7 500€ | 2026-05-16 | Cold call |
| MP-06 | Élise Fontaine | RH Solutions | 91750648100090 | LOST | 15 000€ | 2026-04-01 | LinkedIn |

> 🔴 **MP-01 Anne-Lise Perrin** → 12 jours sans réponse → test relance IA  
> 🟠 **MP-02 David Schmitt** → Devis DEVIS-2026-003 en négociation (24 500€)  
> 📊 **MP-04 Patricia Lemaire** → Prospect le plus chaud en valeur → test Daily Focus IA

---

### 3.3 Prospects d'Antoine Dubois (Persona D)

| ID | Nom complet | Entreprise | SIRET | Statut pipeline | Valeur estimée | Dernier contact | Source |
|----|-------------|------------|-------|-----------------|---------------|-----------------|--------|
| AP-01 | Jean-Michel Garnier | Promo Immo 75 | 34100890200056 | NEGOTIATION | 45 000€ | 2026-05-09 | Recommandation |
| AP-02 | Sylvie Charpentier | Mairie de Vincennes | 21940100300067 | PROPOSAL | 28 000€ | 2026-05-02 | Appel d'offres |
| AP-03 | Laurent Picard | SCI Les Acacias | 45200110400078 | INTERESTED | 12 000€ | 2026-05-14 | Referral |
| AP-04 | Martine Collin | Résidence Privée | 56300220500089 | IDENTIFIED | 8 500€ | 2026-05-16 | Bouche à oreille |

> 💼 **AP-01 Garnier** → Mission longue 14 mois, facturation en 3 tranches → test cas complexe  
> 🏛️ **AP-02 Mairie Vincennes** → Client public, 90 jours de délai paiement → test runway

---

### 3.4 Prospects d'Isabelle Fontaine (Persona E)

| ID | Nom complet | Entreprise | SIRET | Statut pipeline | Valeur estimée | Dernier contact | Source |
|----|-------------|------------|-------|-----------------|---------------|-----------------|--------|
| IP-01 | Directrice Formation | OPCO Uniformation | N/A (OPCO) | PROPOSAL | 6 800€ | 2026-05-07 | Appel entrant |
| IP-02 | DRH | Clinique Saint-Roch | 73100330600034 | NEGOTIATION | 4 200€ | 2026-05-12 | LinkedIn |
| IP-03 | Responsable RH | Pharmacie Centrale | 84200440700045 | CONTACTED | 2 800€ | 2026-05-10 | Réseau pharma |
| IP-04 | Coordinatrice | Mutuelle SantéVie | 95300550800056 | INTERESTED | 9 500€ | 2026-05-15 | Webinaire |

> 📋 **IP-01 OPCO Uniformation** → Convention de formation (pas de devis classique) → test flux atypique  
> 💊 **IP-02 Clinique Saint-Roch** → Formation en intra, prise en charge OPCO Santé

---

### 3.5 Prospects de Julie Moreau (Persona C — Plan FREE)

| ID | Nom complet | Entreprise | Statut pipeline | Valeur estimée | Note |
|----|-------------|------------|-----------------|---------------|------|
| JP-01 | Hugo Denis | Resto Le Vieux Port | IDENTIFIED | 800€ | 1er prospect → test onboarding |
| JP-02 | Aurélie Masso | Boutique Mode | CONTACTED | 1 200€ | Test limite FREE (max 3 prospects ?) |
| JP-03 | Benoît Faure | Agence Voyage | INTERESTED | 2 100€ | Déclencheur upgrade Solo Pro |

---

## 4. Données de test — Devis

### 4.1 Devis de Sophie Martin

| ID | N° Devis | Client | Description | Lignes | Montant HT | TVA | Statut | Date |
|----|---------|--------|-------------|--------|------------|-----|--------|------|
| DS-01 | DEVIS-2026-001 | Camille Rousseau / TechCorp | Refonte UX application mobile | 3 lignes | 4 500€ | 0% | ACCEPTED | 2026-04-20 |
| DS-02 | DEVIS-2026-002 | Marie Dubois / Agence Nova | Audit UX + livrables | 4 lignes | 3 200€ | 0% | SENT | 2026-05-05 |
| DS-03 | DEVIS-2026-003 | Lucas Petit / Innov Labs | Design système complet | 5 lignes | 6 800€ | 0% | DRAFT | 2026-05-10 |
| DS-04 | DEVIS-2026-004 | Nathalie Bernard / RetailFrance | Sprint UX e-commerce | 2 lignes | 8 500€ | 0% | SENT | 2026-05-14 |

**Détail DS-01 — Test NLP brief :**
```
Brief saisi : "3 jours de consulting UX pour TechCorp, refonte app mobile, 1500€/jour"
→ Ligne 1 : Audit UX existant — 1 jour — 1 500€
→ Ligne 2 : Wireframes & prototypes — 1 jour — 1 500€
→ Ligne 3 : Tests utilisateurs + rapport — 1 jour — 1 500€
Total HT : 4 500€ | TVA : 0% | Total TTC : 4 500€
```

**Détail DS-03 — Test devis multi-lignes complexe :**
```
→ Ligne 1 : Charte graphique — 1 — 1 200€
→ Ligne 2 : Design system Figma — 1 — 2 000€
→ Ligne 3 : Composants UI (x50) — 50 — 30€/u = 1 500€
→ Ligne 4 : Formation équipe — 0.5 — 800€ → prorata 400€
→ Ligne 5 : Maintenance 3 mois — 3 — 566,67€/mois = 1 700€
Total HT : 6 800€
```

---

### 4.2 Devis de Marc Lefebvre

| ID | N° Devis | Client | Description | Montant HT | TVA 20% | Total TTC | Statut | Date |
|----|---------|--------|-------------|------------|---------|-----------|--------|------|
| DM-01 | DEVIS-2026-001 | Anne-Lise Perrin / BanqueDirecte | Audit transformation digitale | 15 000€ | 3 000€ | 18 000€ | SENT | 2026-04-25 |
| DM-02 | DEVIS-2026-002 | Sébastien Roy / Assur Plus | Diagnostic SI & roadmap | 7 666,67€ | 1 533,33€ | 9 200€ | DRAFT | 2026-05-03 |
| DM-03 | DEVIS-2026-003 | David Schmitt / LogisticPro | Mission conseil 6 mois | 20 416,67€ | 4 083,33€ | 24 500€ | ACCEPTED | 2026-05-01 |
| DM-04 | DEVIS-2026-004 | Patricia Lemaire / HoldingNord | Stratégie digitale groupe | 26 666,67€ | 5 333,33€ | 32 000€ | DRAFT | 2026-05-15 |

**Cas de test spéciaux Persona B :**
- **DM-03** → Devis ACCEPTED → conversion en facture (test flux principal Marc)
- **DM-04** → Devis 26 666€ → test plafond de valeur + rendu PDF correct
- **DM-01** → 12 jours sans réponse → test relance IA depuis fiche devis

---

### 4.3 Devis d'Antoine Dubois (Persona D — Cas complexes)

| ID | N° Devis | Client | Mission | Montant HT | Facturation | Statut |
|----|---------|--------|---------|------------|-------------|--------|
| DA-01 | DEVIS-2026-001 | Garnier / Promo Immo 75 | MOE Résidence 12 logements | 37 500€ HT | 3 tranches (30/40/30) | ACCEPTED |
| DA-02 | DEVIS-2026-002 | Mairie Vincennes | Réhabilitation école primaire | 23 333,33€ HT | 2 tranches (50/50) | SENT |
| DA-03 | DEVIS-2026-003 | SCI Les Acacias | Rénovation villa 350m² | 10 000€ HT | Forfait | DRAFT |

**Détail DA-01 — Tranche 1 (Acompte 30%) :**
```
Description : Honoraires MOE — Phase APS/APD
Montant tranche : 37 500 × 30% = 11 250€ HT
TVA 20% : 2 250€
Total TTC : 13 500€
→ Génère FAC-2026-001
```

---

### 4.4 Devis d'Isabelle Fontaine (Persona E — Formation)

| ID | N° Devis | Client | Formation | Durée | Montant | TVA | Statut |
|----|---------|--------|-----------|-------|---------|-----|--------|
| DI-01 | DEVIS-2026-001 | OPCO Uniformation | Formation Pharmaco-vigilance | 2 jours | 2 800€ | Exonérée | SENT |
| DI-02 | DEVIS-2026-002 | Clinique Saint-Roch | Formation gestion des erreurs médicales | 1 jour | 1 400€ | Exonérée | ACCEPTED |
| DI-03 | DEVIS-2026-003 | Mutuelle SantéVie | Parcours de formation e-learning | 4 modules | 3 200€ | Exonérée | DRAFT |

> ⚠️ **Cas particulier TVA :** Toutes les formations sont exonérées de TVA (Article 261-4-4a CGI)  
> 📋 **DI-01** → Générer une Convention de Formation plutôt qu'un devis → test workflow atypique

---

### 4.5 Devis de Julie Moreau (Persona C — Limites FREE)

| ID | N° Devis | Client | Description | Montant | Statut | Objectif test |
|----|---------|--------|-------------|---------|--------|---------------|
| DJ-01 | DEVIS-2026-001 | Hugo Denis | Pack réseaux sociaux — 3 mois | 900

| DJ-01 | DEVIS-2026-001 | Hugo Denis | Pack réseaux sociaux — 3 mois | 900€ | DRAFT | Test premier devis plan FREE |
| DJ-02 | DEVIS-2026-002 | Aurélie Masso | Shooting photo + retouches | 450€ | — | Test limite max devis FREE |

---

## 5. Données de test — Factures

### 5.1 Factures de Sophie Martin

| ID | N° Facture | Source | Client | Montant TTC | Statut | Date émission | Date paiement | Transaction créée |
|----|-----------|--------|--------|------------|--------|---------------|---------------|-------------------|
| FS-01 | FAC-2026-001 | DS-01 converti | TechCorp / Camille Rousseau | 4 500€ | PAID | 2026-04-25 | 2026-05-03 | ✅ T-INCOME-001 |
| FS-02 | FAC-2026-002 | DS-02 converti | Agence Nova / Marie Dubois | 3 200€ | SENT | 2026-05-08 | — | ❌ En attente |
| FS-03 | FAC-2026-003 | Manuel | Clara Vidal / Studio Pixel | 5 200€ | PAID | 2026-04-10 | 2026-04-18 | ✅ T-INCOME-002 |

**Cas particuliers à tester (Sophie) :**
```
🔴 AVOIR : Facture FAC-2026-002 → litige partiel → émettre avoir de 800€
🟡 RELANCE : FAC-2026-002 non payée à J+9 → test relance paiement
🟢 SÉQUENCE : Vérifier numérotation FAC-2026-001 → FAC-2026-002 → FAC-2026-003
```

---

### 5.2 Factures de Marc Lefebvre

| ID | N° Facture | Source | Client | Montant HT | TVA 20% | Total TTC | Statut | Date paiement |
|----|-----------|--------|--------|------------|---------|-----------|--------|---------------|
| FM-01 | FAC-2026-001 | DM-03 converti | LogisticPro / David Schmitt | 20 416,67€ | 4 083,33€ | 24 500€ | PAID | 2026-05-10 |
| FM-02 | FAC-2026-002 | DM-01 converti | BanqueDirecte / Anne-Lise Perrin | 15 000€ | 3 000€ | 18 000€ | SENT | — |
| FM-03 | FAC-2026-003 | Manuel | HoldingNord / Patricia Lemaire | 8 000€ | 1 600€ | 9 600€ | OVERDUE | — |

**Cas particuliers à tester (Marc) :**
```
🔴 RETARD : FM-03 en OVERDUE (30 jours dépassés) → test statut OVERDUE + relance
🟡 ACOMPTE : FM-02 paiement partiel 9 000€ → marquer paiement partiel
🟠 TVA : Vérifier mention TVA 20% correcte sur toutes les factures Marc
```

---

### 5.3 Factures d'Antoine Dubois (Facturation par tranches)

| ID | N° Facture | Mission | Tranche | Montant HT | TVA | TTC | Statut |
|----|-----------|---------|---------|------------|-----|-----|--------|
| FA-01 | FAC-2026-001 | Garnier — MOE | Acompte 30% — Phase APS | 11 250€ | 2 250€ | 13 500€ | PAID |
| FA-02 | FAC-2026-002 | Garnier — MOE | Situation 40% — Phase PRO | 15 000€ | 3 000€ | 18 000€ | SENT |
| FA-03 | FAC-2026-003 | Garnier — MOE | Solde 30% — Phase EXE | 11 250€ | 2 250€ | 13 500€ | DRAFT |
| FA-04 | FAC-2026-004 | Mairie Vincennes | Tranche 1 / 50% | 11 666,67€ | 2 333,33€ | 14 000€ | SENT |

**Cas particuliers à tester (Antoine) :**
```
🏗️ MULTI-TRANCHES : Vérifier que 3 factures liées au même devis DA-01 sont tracées
🏛️ CLIENT PUBLIC : FA-04 → délai légal 90 jours → vérifier impact sur runway
🔢 NUMÉROTATION : FA-01 → FA-02 → FA-03 séquentielles pour même client
```

---

### 5.4 Factures d'Isabelle Fontaine (Conventions de formation)

| ID | N° Document | Type | Client | Montant | TVA | Statut | Remboursement OPCO |
|----|------------|------|--------|---------|-----|--------|-------------------|
| FI-01 | CONV-2026-001 | Convention formation | OPCO Uniformation | 2 800€ | Exonérée | SIGNED | Attendu J+60 |
| FI-02 | FAC-2026-001 | Facture formation | Clinique Saint-Roch | 1 400€ | Exonérée | PAID | Direct client |
| FI-03 | FAC-2026-002 | Facture formation | Mutuelle SantéVie | 1 600€ | Exonérée | SENT | Via OPCO Santé |

**Cas particuliers à tester (Isabelle) :**
```
📋 CONVENTION : Test génération d'un document "Convention de formation" (format spécifique)
⏳ OPCO DÉLAI : FI-01 remboursement à J+60 → impact sur runway calculator
✅ EXONÉRATION : Vérifier mention "Exonération TVA Art. 261-4-4a CGI" sur toutes les factures
```

---

## 6. Données de test — Transactions financières

### 6.1 Transactions de Sophie Martin

#### Revenus (INCOME)

| ID | Date | Description | Montant | Catégorie | Source | Mode saisie |
|----|------|-------------|---------|-----------|--------|-------------|
| T-01 | 2026-05-03 | Paiement facture TechCorp — FAC-2026-001 | +4 500€ | Chiffre d'affaires | Auto (facture payée) | Automatique |
| T-02 | 2026-04-18 | Paiement Clara Vidal — Studio Pixel | +5 200€ | Chiffre d'affaires | Auto (facture payée) | Automatique |
| T-03 | 2026-05-01 | Virement client Nathalie Bernard (acompte) | +2 000€ | Chiffre d'affaires | Manuel | Manuel |
| T-04 | 2026-04-05 | Mission UX Startup XYZ | +1 800€ | Chiffre d'affaires | Manuel | Manuel |
| T-05 | 2026-05-12 | Remboursement frais déplacement | +150€ | Remboursements | Manuel | Langage naturel |

**Brief NLP T-05 :** `"Remboursement Decathlon pour mes frais de déplacement atelier UX, 150€ reçu hier"`

#### Dépenses (EXPENSE)

| ID | Date | Description | Montant | Catégorie | Mode saisie |
|----|------|-------------|---------|-----------|-------------|
| T-06 | 2026-05-01 | Abonnement Figma | -15€ | Logiciels & Abonnements | Langage naturel |
| T-07 | 2026-05-01 | Loyer bureau partagé | -400€ | Loyer & Bureau | Manuel |
| T-08 | 2026-05-05 | Adobe Creative Cloud | -65€ | Logiciels & Abonnements | Manuel |
| T-09 | 2026-05-10 | Déplacement client Lyon | -85€ | Transports | OCR reçu |
| T-10 | 2026-05-14 | Repas client Camille Rousseau | -48€ | Frais de représentation | OCR reçu |
| T-11 | 2026-05-01 | URSSAF charges sociales | -280€ | Charges sociales | Manuel |
| T-12 | 2026-05-15 | Matériel (stylet Wacom) | -120€ | Matériel & Équipement | Manuel |

**Solde théorique Sophie en fin de période :**
```
Solde initial : 3 200€
+ Revenus mai : 4 500 + 2 000 + 150 = 6 650€
- Dépenses mai : 15 + 400 + 65 + 85 + 48 + 280 + 120 = 1 013€
Solde calculé : 3 200 + 6 650 - 1 013 = 8 837€
Charges fixes/mois : 800€ → Runway optimiste ≈ 11 mois
```

---

### 6.2 Transactions de Marc Lefebvre

#### Revenus (INCOME)

| ID | Date | Description | Montant HT | TVA | TTC | Catégorie |
|----|------|-------------|------------|-----|-----|-----------|
| TM-01 | 2026-05-10 | Paiement LogisticPro — FAC-2026-001 | 20 416,67€ | 4 083,33€ | 24 500€ | CA Consulting |
| TM-02 | 2026-04-15 | Mission Assur Plus — Phase 1 | 4 166,67€ | 833,33€ | 5 000€ | CA Consulting |
| TM-03 | 2026-05-05 | Formation équipe SantéCorp | 2 500€ | 500€ | 3 000€ | Formation |

#### Dépenses (EXPENSE)

| ID | Date | Description | Montant HT | TVA | TTC | Catégorie |
|----|------|-------------|------------|-----|-----|-----------|
| TM-04 | 2026-05-01 | Loyer bureau Lyon | -1 000€ | -200€ | -1 200€ | Loyer |
| TM-05 | 2026-05-01 | Expert-comptable | -300€ | -60€ | -360€ | Services professionnels |
| TM-06 | 2026-05-08 | Billet TGV Lyon-Paris | -145€ | -29€ | -174€ | Transports |
| TM-07 | 2026-05-01 | Abonnements SaaS (Notion, Slack) | -80€ | -16€ | -96€ | Logiciels |
| TM-08 | 2026-05-12 | Déjeuner prospect BanqueDirecte | -95€ | -19€ | -114€ | Frais commerciaux |

**Solde théorique Marc :**
```
Solde initial : 8 500€
+ Revenus : 24 500 + 5 000 + 3 000 = 32 500€ TTC
- Dépenses : 1 200 + 360 + 174 + 96 + 114 = 1 944€ TTC
Solde calculé : 39 056€
Charges fixes : 2 400€/mois → Runway optimiste > 16 mois
```

---

### 6.3 Transactions d'Antoine Dubois

| ID | Date | Description | Montant | Type | Note |
|----|------|-------------|---------|------|------|
| TA-01 | 2026-04-20 | Acompte Garnier — FAC-2026-001 | +13 500€ | INCOME | Auto depuis facture payée |
| TA-02 | 2026-05-01 | Loyer cabinet + charges | -1 800€ | EXPENSE | Manuel |
| TA-03 | 2026-05-05 | Assurance décennale | -350€ | EXPENSE | Manuel |
| TA-04 | 2026-05-10 | Logiciel ArchiCAD (licence annuelle) | -2 400€ | EXPENSE | Manuel (annuel) |
| TA-05 | 2026-05-15 | Frais géomètre sous-traitant | -1 200€ | EXPENSE | OCR facture |

---

### 6.4 Transactions d'Isabelle Fontaine

| ID | Date | Description | Montant | Type | Note |
|----|------|-------------|---------|------|------|
| TI-01 | 2026-05-02 | Paiement formation Clinique Saint-Roch | +1 400€ | INCOME | Auto (facture payée) |
| TI-02 | 2026-05-15 | Versement OPCO (partiel) | +1 200€ | INCOME | Manuel |
| TI-03 | 2026-05-01 | Loyer domicile pro (quote-part) | -200€ | EXPENSE | Manuel |
| TI-04 | 2026-05-08 | Achat matériel pédagogique | -180€ | EXPENSE | OCR
 |
| TI-05 | 2026-05-10 | Plateforme e-learning (Teachizy) | -49€ | EXPENSE | Manuel |

---

## 7. Documents Knowledge Base à créer

Ces documents doivent être créés en amont et uploadés dans la KB de chaque persona pour tester l'indexation sémantique et l'interrogation via le Chat Business Brain.

---

### 7.1 Documents pour Sophie Martin (Persona A — Design UX)

#### 📄 KB-S01 — Grille tarifaire Design Studio SM
**Fichier :** `Grille_tarifaire_Design_Studio_SM_2026.pdf`  
**Catégorie KB :** Commercial  
**Format :** PDF (2 pages)  
**Contenu à créer :**

```
GRILLE TARIFAIRE — Design Studio SM
Mise à jour : Janvier 2026

1. PRESTATIONS UX/UI
   - Audit UX (heuristique + tests users) : 1 500€/jour
   - Wireframes & Prototypes (Figma) : 1 200€/jour
   - Design système & charte graphique : Forfait 3 200€
   - Refonte complète application mobile : Forfait à partir de 8 500€
   - Tests utilisateurs (recrutement + sessions + rapport) : 2 200€ forfait

2. CONSEIL & FORMATION
   - Atelier UX collaboratif (demi-journée) : 900€
   - Formation équipe design (journée) : 1 800€
   - Revue de design critique : 600€/session

3. CONDITIONS
   - Acompte 30% à la signature du devis
   - Paiement à 30 jours fin de mois
   - Frais de déplacement en sus (IK barème URSSAF)
   - Non assujettie à TVA (Art. 293B CGI)
   - Validité du devis : 30 jours

4. REMISES
   - Mission > 5 jours : -5%
   - Mission > 10 jours : -10%
   - Client fidèle (2e mission+) : -8%
```

**Requêtes de test :**
- `"Quel est mon tarif journalier pour un audit UX ?"`
- `"Quelles remises est-ce que j'applique sur les longues missions ?"`
- `"Quelles sont mes conditions de paiement ?"`

---

#### 📄 KB-S02 — Proposition commerciale type UX
**Fichier :** `Proposition_commerciale_type_UX_2026.docx`  
**Catégorie KB :** Commercial  
**Format :** DOCX (5 pages)  
**Contenu à créer :**

```
PROPOSITION COMMERCIALE — Refonte UX Application
Design Studio SM — Sophie Martin

1. CONTEXTE & ENJEUX
   Compréhension des objectifs client, diagnostic de l'existant.

2. NOTRE APPROCHE
   Phase 1 — Découverte (2j) : interviews, personas, parcours utilisateurs
   Phase 2 — Design (3j) : wireframes, prototypes Figma haute fidélité
   Phase 3 — Validation (1j) : tests utilisateurs, rapport de recommandations

3. LIVRABLES
   - Rapport d'audit UX (PDF)
   - Fichier Figma (wireframes + prototype)
   - Rapport tests utilisateurs
   - Présentation exécutive (15 slides)

4. INVESTISSEMENT
   Total forfait : 9 000€ HT
   Acompte : 2 700€ (30%)
   Solde : 6 300€ (à livraison)

5. CONDITIONS DE PAIEMENT
   30 jours fin de mois à réception de facture.
   Pénalités de retard : 3× taux légal.

6. DÉLAIS
   Démarrage sous 2 semaines après signature.
   Durée totale : 4 semaines.
```

**Requêtes de test :**
- `"Quelles sont les phases décrites dans ma proposition commerciale type ?"`
- `"Quels livrables est-ce que je propose dans mes missions UX ?"`
- `"Quel est le délai de démarrage prévu dans mes propositions ?"`

---

#### 📄 KB-S03 — CGV Design Studio SM
**Fichier :** `CGV_Design_Studio_SM_2026.pdf`  
**Catégorie KB :** Juridique  
**Format :** PDF (3 pages)  
**Contenu à créer :**

```
CONDITIONS GÉNÉRALES DE VENTE
Design Studio SM — SIRET 81234567800012

Art. 1 — Champ d'application
Art. 2 — Devis et commande (validité 30 jours)
Art. 3 — Prix et modalités de paiement
  - Acompte 30% à la commande
  - Solde à livraison des travaux
  - Pénalités de retard : taux BCE + 10 points
Art. 4 — Délais d'exécution
Art. 5 — Propriété intellectuelle
  - Cession des droits après paiement intégral
  - Portfolio : droit de citation accordé
Art. 6 — Responsabilité et garanties
Art. 7 — Confidentialité (NDA sur demande)
Art. 8 — Résiliation
  - Résiliation client : frais engagés + 20%
  - Résiliation prestataire : remboursement acompte
Art. 9 — Litiges (Tribunal compétent : Paris)
```

**Requêtes de test :**
- `"Quelles sont les pénalités de retard dans mes CGV ?"`
- `"Quand est-ce que les droits de propriété intellectuelle sont cédés ?"`
- `"Comment se passe une résiliation client dans mes CGV ?"`

---

### 7.2 Documents pour Marc Lefebvre (Persona B — Consulting IT)

#### 📄 KB-M01 — Contrat de mission type (Juridique)
**Fichier :** `Contrat_type_mission_consulting_2026.pdf`  
**Catégorie KB :** Juridique  
**Format :** PDF (8 pages) — *déjà référencé dans la stratégie existante*  
**Contenu à enrichir :**

```
CONTRAT DE MISSION DE CONSEIL
ConseilTech SARL — SIRET 52345678900034

Art. 1 — Objet de la mission
Art. 2 — Durée et planning
  - Durée indicative : 3 à 6 mois
  - Révisable par avenant
Art. 3 — Honoraires
  - Tarif journalier : 1 500€ HT/jour
  - Frais de déplacement : barème URSSAF
  - Facturation mensuelle sur relevé de jours
Art. 4 — Paiement
  - 30 jours net à réception de facture
  - Intérêts de retard : 3× taux légal
Art. 5 — Indépendance du consultant
Art. 6 — Confidentialité (5 ans post-mission)
Art. 7 — Non-sollicitation (12 mois)
Art. 8 — Propriété des livrables
Art. 9 — Résiliation
  - Préavis 30 jours
  - Facturation des jours effectués
Art. 10 — Loi applicable (droit français)
```

**Requêtes de test :**
- `"Quelles sont les clauses de résiliation dans mon contrat type ?"`
- `"Quel est le préavis de résiliation ?"`
- `"Quelle est la durée de la clause de confidentialité ?"`

---

#### 📄 KB-M02 — Grille tarifaire Consulting IT 2026
**Fichier :** `Grille_tarifaire_ConseilTech_2026.pdf`  
**Catégorie KB :** Commercial  
**Format :** PDF (2 pages)  
**Contenu à créer :**

```
GRILLE TARIFAIRE — ConseilTech SARL
Exercice 2026

1. TARIFS JOURNALIERS (TJM) HT
   - Audit & Diagnostic SI : 1 600€/jour
   - Conseil stratégique transformation digitale : 1 500€/jour
   - Architecture technique : 1 400€/jour
   - Formation & Coaching équipe : 1 200€/jour
   - Gestion de projet IT : 1 100€/jour

2. FORFAITS
   - Diagnostic 360° (5j) : 7 000€ HT
   - Roadmap digitale (3j) : 4 000€ HT
   - Audit sécurité SI : 5 500€ HT
   - Accompagnement trimestriel (1j/semaine) : 18 000€ HT/trimestre

3. CONDITIONS
   - TVA 20% applicable sur toutes les prestations
   - Acompte 30% à la signature
   - Paiement 30 jours net
   - Déplacements : IK + hébergement sur justificatifs
   - Validité devis : 45 jours

4. REMISES VOLUME
   - Mission 10–20j : -8%
   - Mission 20j+ : -15%
   - Contrat cadre annuel : tarif négocié
```

**Requêtes de test :**
- `"Quel est mon TJM pour du conseil stratégique ?"`
- `"Quelles remises est-ce que je propose sur les grosses missions ?"`
- `"Quel est le tarif de mon forfait Diagnostic 360° ?"`

---

#### 📄 KB-M03 — Méthodologie Consulting Marc
**Fichier :** `Methodo_consulting_Marc.docx`  
**Catégorie KB :** Commercial  
**Format :** DOCX — *déjà référencé*  
**Contenu à enrichir :**

```
MÉTHODOLOGIE DE CONSEIL — ConseilTech

1. PHASE DÉCOUVERTE (Semaine 1-2)
   - Entretiens dirigeants et équipes clés
   - Audit de l'existant (SI, processus, organisation)
   - Benchmark sectoriel
   - Livrable : Rapport de diagnostic

2. PHASE DESIGN (Semaine 3-4)
   - Co-construction de la cible (workshops)
   - Définition de la roadmap
   - Priorisation des chantiers (matrice impact/effort)
   - Livrable : Roadmap digitale + business case

3. PHASE PILOTAGE (Mois 2-6)
   - Gouvernance projet (comités hebdo)
   - Suivi KPI et tableau de bord
   - Gestion des risques
   - Livrable : Rapport mensuel d'avancement

4. PHASE BILAN (Fin de mission)
   - Mesure des gains réalisés
   - Transfert de compétences
   - Livrable : Rapport de clôture + recommandations
```

**Requêtes de test :**
- `"Résume ma méthodologie de consulting"`
- `"Quelle est la phase Découverte dans ma méthode ?"`
- `"Combien de phases y a-t-il dans ma méthodologie ?"`

---

#### 📄 KB-M04 — Présentation cabinet ConseilTech
**Fichier :** `Presentation_ConseilTech.pptx`  
**Catégorie KB :** Commercial  
**Format :** PPTX (12 slides)  
**Contenu :**

```
Slide 1 : Titre — ConseilTech, Conseil en Transformation Digitale
Slide 2 : Notre mission & valeurs
Slide 3 : Profil Marc Lefebvre (15 ans XP, ex-DSI BNP)
Slide 4 : Secteurs d'expertise (Banque, Assurance, Logistique, Santé)
Slide 5 : Notre approche en 4 phases
Slide 6 : Références clients (anonymisées)
Slide 7 : Cas client — Transformation DSI Banque Régionale
Slide 8 : Cas client — Digitalisation RH Groupe Logistique
Slide 9 : Nos engagements (délais, confidentialité, résultats)
Slide 10 : Grille tarifaire résumée
Slide 11 : Témoignages clients
Slide 12 : Contact & prochaines étapes
```

**Requêtes de test :**
- `"Quels secteurs sont mentionnés dans ma présentation cabinet ?"`
- `"Combien d'années d'expérience ai-je selon ma présentation ?"`

---

### 7.3 Documents pour Antoine Dubois (Persona D — Architecture)

#### 📄 KB-A01 — Contrat de Maîtrise d'Œuvre type
**Fichier :** `Contrat_MOE_type_Cabinet_Dubois.pdf`  
**Catégorie KB :** Juridique  
**Format :** PDF (10 pages)  
**Contenu à créer :**

```

---

### 7.3 (suite) Documents pour Antoine Dubois (Persona D — Architecture)

#### 📄 KB-A01 — Contrat de Maîtrise d'Œuvre type
**Fichier :** `Contrat_MOE_type_Cabinet_Dubois.pdf`  
**Catégorie KB :** Juridique | **Format :** PDF (10 pages)

```
CONTRAT DE MAÎTRISE D'ŒUVRE
Cabinet Dubois Architecture — SIRET 44556677800078

Art. 1 — Objet : Mission MOE complète (APS, APD, PRO, EXE, OPC)
Art. 2 — Honoraires
  - Base : % du coût travaux (8 à 12% selon complexité)
  - Forfait sur devis accepté
Art. 3 — Modalités de règlement
  - Acompte 30% à la signature
  - Situation 40% dépôt PC ou DCE
  - Solde 30% réception des travaux
Art. 4 — Planning & délais
  - APS : 4 semaines
  - APD + PC : 6 semaines
  - PRO + DCE : 8 semaines
  - Suivi chantier : durée travaux
Art. 5 — Responsabilités et assurances
  - RC Professionnelle : AXA n°ARQ-2026-448
  - Garantie décennale
Art. 6 — Propriété intellectuelle des plans
Art. 7 — Résiliation (préavis 15 jours, frais engagés facturés)
Art. 8 — Litiges (Tribunal : Paris)
```

**Requêtes de test :**
- `"Quelles sont les phases de ma mission MOE et leurs délais ?"`
- `"Quel est le barème de mes honoraires d'architecte ?"`
- `"Quelles sont mes assurances professionnelles selon mon contrat ?"`

---

#### 📄 KB-A02 — Grille tarifaire Cabinet Dubois 2026
**Fichier :** `Grille_Honoraires_Cabinet_Dubois_2026.pdf`  
**Catégorie KB :** Commercial | **Format :** PDF (2 pages)

```
GRILLE D'HONORAIRES — Cabinet Dubois Architecture
Exercice 2026

1. MISSIONS COMPLÈTES MOE
   - Maison individuelle neuve : 10% du coût travaux HT
   - Réhabilitation / Extension : 11% du coût travaux HT
   - Logements collectifs (≤20 lots) : 8,5%
   - Logements collectifs (>20 lots) : 7,5%
   - Bâtiments publics (MOP) : 8%

2. MISSIONS PARTIELLES (au forfait)
   - Esquisse seule : 1 500€ HT
   - APS + APD : 4 500€ HT
   - Dépôt permis de construire : 2 000€ HT
   - Assistance marchés (ACT) : 2 500€ HT
   - OPC (coordination) : 1 200€ HT/mois

3. PRESTATIONS ANNEXES
   - Dossier diagnostic technique (DDT) : 800€ HT
   - Étude thermique RT2020 : 1 200€ HT
   - Plans 3D / Rendu architectural : 1 500€ HT

4. CONDITIONS
   - TVA 20% sur toutes prestations
   - Paiement 30 jours réception facture
   - Frais reprographie et déplacements en sus
```

**Requêtes de test :**
- `"Quel est mon honoraire pour une maison individuelle neuve ?"`
- `"Quel est le tarif d'un dépôt de permis de construire ?"`

---

### 7.4 Documents pour Isabelle Fontaine (Persona E — Formation)

#### 📄 KB-I01 — Programme de formation Pharmacovigilance
**Fichier :** `Programme_Formation_Pharmacovigilance_2026.pdf`  
**Catégorie KB :** Commercial | **Format :** PDF (4 pages)

```
PROGRAMME DE FORMATION
Pharmacien Conseil : Maîtriser la Pharmacovigilance
PharmaFormation — N° Datadock 76-34-12345-0

OBJECTIFS PÉDAGOGIQUES
- Identifier les obligations réglementaires de déclaration
- Appliquer les procédures de signalement EIG
- Gérer la relation patient en cas d'effet indésirable

CONTENU (2 jours / 14h)
Jour 1 :
  - Cadre réglementaire (Directive 2010/84/UE, ANSM)
  - Rôle du pharmacien dans le système national
  - Exercices pratiques : cas de signalement
Jour 2 :
  - Gestion de crise et communication patient
  - Outils numériques de déclaration (Vigibase, BNPV)
  - Évaluation finale + attestation

MODALITÉS
- Format : Intra-établissement (présentiel)
- Groupe : 8 à 15 participants
- Prérequis : Diplôme de pharmacien
- Tarif : 1 400€ HT/jour (TVA exonérée Art. 261-4-4a)

FINANCEMENT
- Prise en charge OPCO Santé
- Éligible CPF (code formation : 331459)
```

**Requêtes de test :**
- `"Quels sont les objectifs de ma formation pharmacovigilance ?"`
- `"Quel est mon numéro Datadock ?"`
- `"Ma formation est-elle éligible au CPF ?"`

---

#### 📄 KB-I02 — CGV Organisme de Formation
**Fichier :** `CGV_PharmaFormation_2026.pdf`  
**Catégorie KB :** Juridique | **Format :** PDF (3 pages)

```
CONDITIONS GÉNÉRALES DE VENTE — FORMATION
PharmaFormation SASU — SIRET 77889900100090

Art. 1 — Inscription et confirmation
  Devis ou convention signée = inscription définitive
Art. 2 — Prix et règlement
  - Tarifs HT, exonérés TVA (Art. 261-4-4a CGI)
  - Acompte 30% à la signature
  - Solde à l'issue de la formation
  - Paiement OPCO : sur présentation accord de prise en charge
Art. 3 — Annulation par le client
  - > 15 jours : remboursement intégral
  - 8 à 15 jours : 30% de frais retenus
  - < 8 jours : 50% de frais retenus
Art. 4 — Annulation par le formateur
  - Remboursement intégral + report prioritaire
Art. 5 — Attestation de présence
  Délivrée à chaque participant à l'issue
Art. 6 — Propriété intellectuelle des supports
Art. 7 — Évaluation qualité (questionnaire Qualiopi)
Art. 8 — Litiges (Médiation CNPM)
```

**Requêtes de test :**
- `"Quels sont les frais d'annulation dans mes CGV formation ?"`
- `"Comment fonctionne le paiement OPCO selon mes CGV ?"`
- `"Quelle attestation est délivrée à mes apprenants ?"`

---

#### 📄 KB-I03 — Grille tarifaire PharmaFormation 2026
**Fichier :** `Grille_Tarifaire_PharmaFormation_2026.xlsx`  
**Catégorie KB :** Commercial | **Format :** XLSX (tableur)

```
GRILLE TARIFAIRE — PharmaFormation
Exercice 2026 | TVA exonérée Art. 261-4-4a CGI

FORMATIONS INTRA-ÉTABLISSEMENT (prix/session)
Formation          | Durée | Tarif HT  | Groupes
Pharmacovigil.     | 2 j   | 2 800€    | 8-15 pers.
Bonnes pratiques   | 1 j   | 1 400€    | 6-12 pers.
Gestion erreurs    | 1 j   | 1 400€    | 8-15 pers.
Communication pat. | 0.5 j | 800€      | 6-10 pers.
Parcours e-learn   | 4 mod | 3 200€    | Illimité

FORMATIONS INTER-ÉTABLISSEMENT (par stagiaire)
Formation          | Durée | Tarif/pers | Dates 2026
Pharmacovigil.     | 2 j   | 390€       | 15-16 juin
Bonnes pratiques   | 1 j   | 210€       | 22 mai

FINANCEMENT
- OPCO Santé, Uniformation, OPCO EP
- CPF (codes formation fournis)
- Prise en charge DPC possible
```

**Requêtes de test :**
- `"Quel est le tarif de ma formation en inter par stagiaire ?"`
- `"Quelles formations puis-je financer via le DPC ?"`

---

### 7.5 Documents pour Julie Moreau (Persona C — Contenu)

#### 📄 KB-J01 — Offre de services Community Management
**Fichier :** `Offre_Services_Julie_Creative_2026.pdf`  
**Catégorie KB :** Commercial | **Format :** PDF (2 pages)

```
OFFRE DE SERVICES — Julie Creative
Community Management & Création de Contenu

1. FORMULES MENSUELLES
   Starter : 450€/mois
     - 3 posts/semaine (Instagram + Facebook)
     - 1 story interactive/semaine
     - Rapport mensuel

   Essentielle : 750€/mois
     - 5 posts/semaine (3 réseaux)
     - Stories quotidiennes
     - Veille concurrentielle
     - Rapport bi-mensuel + call bilan

   Premium : 1 200€/mois
     - Contenu illimité (tous réseaux)
     - 1 shooting photo/mois (2h)
     - Publicité Meta gérée (budget client)
     - Reporting hebdomadaire + call dédié

2. PRESTATIONS À LA CARTE
   - Shooting photo (demi-journée) : 350€
   - Création Reel / vidéo courte : 150€/vidéo
   - Audit réseaux sociaux : 250€
   - Formation équipe (2h) : 400€

3. CONDITIONS
   - Engagement minimum 3 mois
   - Paiement le 1er de chaque mois
   - Non assujettie TVA (Art. 293B CGI)
   - Résiliation avec 1 mois de préavis
```

**Requêtes de test :**
- `"Quelles sont mes formules de community management ?"`
- `"Quel est le prix de mon shooting photo à la carte ?"`

---

## 8. Cas de test — Module Onboarding

| ID | Titre | Persona | Préconditions | Étapes | Résultat attendu | Priorité |
|----|-------|---------|---------------|--------|-----------------|----------|
| OB-01 | Inscription compte nouveau | Julie (C) | Email non existant | 1. Aller sur brainlo.ai/signup 2. Saisir email/mdp 3. Valider | Compte créé, email de confirmation envoyé | 🔴 |
| OB-02 | Onboarding profil complet | Sophie (A) | Compte créé OB-01 | 1. Remplir nom/entreprise 2. SIRET 3. Secteur 4. Objectifs 5. Valider | Dashboard accessible, profil sauvegardé | 🔴 |
| OB-03 | Tentative email existant | Marc (B) | Email déjà inscrit | 1. Saisir email déjà utilisé | Message erreur «Email déjà utilisé» | 🟠 |
| OB-04 | Mot de passe faible | Antoine (D) | Nouveau compte | 1. Saisir mdp «1234» | Blocage + message exigences sécurité | 🟡 |
| OB-05 | Onboarding incomplet (champs vides) | Julie (C) | Profil non complété | 1. Laisser SIRET vide 2. Valider | Erreur champ requis OU passage autorisé | 🟡 |
| OB-06 | Connexion valide | Sophie (A) | Compte existant | 1. Saisir email/mdp corrects | Redirection dashboard, session ouverte | 🔴 |
| OB-07 | Connexion mdp erroné | Marc (B) | Compte existant | 1. Saisir mauvais mdp | Message «Identifiants incorrects» | 🟠 |
| OB-08 | Changement mot de passe | Antoine (D) | Connecté | 1. Compte >

| OB-08 | Changement mot de passe | Antoine (D) | Connecté, onglet Sécurité | 1. Saisir ancien mdp 2. Nouveau mdp 3. Confirmer | Mdp changé, session maintenue | 🟡 |
| OB-09 | Mise à jour profil légal | Isabelle (E) | Connectée | 1. Modifier SIRET 2. Adresse 3. Sauvegarder | Infos mises à jour visibles sur PDF devis | 🟠 |
| OB-10 | Déconnexion | Sophie (A) | Connectée | 1. Cliquer Déconnexion | Session terminée, redirection login | 🟡 |

---

## 9. Cas de test — Module CRM Pipeline

| ID | Titre | Persona | Préconditions | Étapes | Résultat attendu | Priorité |
|----|-------|---------|---------------|--------|-----------------|----------|
| CRM-01 | Créer prospect manuel | Sophie (A) | Connectée, onglet Pipeline | 1. Clic «Nouveau prospect» 2. Saisir SP-03 (Marie Dubois) 3. Valider | Fiche créée, carte visible en colonne IDENTIFIED | 🔴 |
| CRM-02 | Enrichissement SIRET | Sophie (A) | Prospect SP-01 créé | 1. Ouvrir fiche SP-01 2. Clic «Enrichir» | SIRET 73204482600034 → adresse, effectif, NAF auto-remplis | 🟠 |
| CRM-03 | Déplacer carte Kanban | Marc (B) | MP-03 en CONTACTED | 1. Glisser MP-03 vers INTERESTED | Statut mis à jour, wiki enrichi | 🟠 |
| CRM-04 | Créer prospect NLP | Sophie (A) | Connectée | 1. Clic «Brief» 2. Saisir «Nouveau client Lucas Petit, startup IA, budget 3000€» | Fiche SP-04 créée avec champs pré-remplis | 🟡 |
| CRM-05 | Filtrer prospects par statut | Marc (B) | 6 prospects créés | 1. Filtre «PROPOSAL» | Seuls MP-01 et MP-04 affichés | 🟡 |
| CRM-06 | Relance IA prospect inactif | Sophie (A) | SP-04 Lucas — 19j sans contact | 1. Ouvrir fiche SP-04 2. Clic «Générer relance» | Message personnalisé généré mentionnant Lucas, le projet et le délai | 🟠 |
| CRM-07 | Créer devis depuis fiche prospect | Sophie (A) | SP-01 en PROPOSAL | 1. Ouvrir fiche SP-01 2. Clic «Créer devis» | Redirection module devis avec client pré-rempli (TechCorp + SIRET) | 🔴 |
| CRM-08 | Prospect LOST — archivage | Marc (B) | MP-06 Élise Fontaine | 1. Déplacer en colonne LOST | Carte grisée, prospect exclu des filtres actifs | 🟡 |
| CRM-09 | Prospect WON — vérif wiki | Sophie (A) | SP-07 Clara Vidal → WON | 1. Déplacer en WON | Entrée ajoutée dans wiki prospects, solde trésorerie mis à jour si facture liée | 🟠 |
| CRM-10 | Recherche prospect | Antoine (D) | 4 prospects créés | 1. Taper «Garnier» dans recherche | AP-01 affiché en premier résultat | 🟡 |
| CRM-11 | Relance prospect Isabelle / OPCO | Isabelle (E) | IP-01 OPCO Uniformation, 10j sans réponse | 1. Ouvrir fiche 2. Générer relance | Message adapté au contexte OPCO et formation | 🟡 |
| CRM-12 | Limite prospects plan FREE | Julie (C) | Plan FREE, 3 prospects créés | 1. Tenter création d'un 4e prospect | Message limitation FREE + CTA upgrade | 🟠 |

---

## 10. Cas de test — Module Devis & Factures

| ID | Titre | Persona | Préconditions | Étapes | Résultat attendu | Priorité |
|----|-------|---------|---------------|--------|-----------------|----------|
| QF-01 | Créer devis via NLP | Sophie (A) | Connectée | 1. Brief : «3 jours consulting UX TechCorp 1500€/jour» 2. Valider | DS-01 créé, 3 lignes, total 4 500€, numéro DEVIS-2026-001 | 🔴 |
| QF-02 | Créer devis multi-lignes manuels | Antoine (D) | Connecté | 1. Créer DA-01 avec 3 tranches manuelles | Devis 37 500€ HT créé, TVA 20% calculée | 🔴 |
| QF-03 | Aperçu PDF devis | Marc (B) | DM-01 créé | 1. Clic «Aperçu PDF» | PDF généré avec logo, mentions légales, TVA, adresse client | 🟠 |
| QF-04 | Marquer devis SENT | Sophie (A) | DS-02 en DRAFT | 1. Clic «Marquer comme envoyé» | Statut → SENT, date d'envoi enregistrée | 🟠 |
| QF-05 | Convertir devis en facture | Marc (B) | DM-03 en ACCEPTED | 1. Clic «Convertir en facture» | FAC-2026-001 créée, lignes reprises, numéro auto | 🔴 |
| QF-06 | Facture payée → transaction auto | Marc (B) | FM-01 en SENT | 1. Clic «Marquer comme payée» | Transaction TM-01 créée automatiquement dans Cash (+24 500€) | 🔴 |
| QF-07 | Vérifier numérotation séquentielle | Sophie (A) | 3 devis créés | 1. Créer DS-02 puis DS-03 | Numéros DEVIS-2026-001, -002, -003 séquentiels | 🟠 |
| QF-08 | Client pré-rempli depuis prospect | Sophie (A) | SP-01 enrichi via SIRET | 1. Créer devis depuis fiche SP-01 | Nom, adresse, SIRET client pré-remplis automatiquement | 🟠 |
| QF-09 | Devis TVA 0% (non assujetti) | Sophie (A) | Profil TVA = non assujettie | 1. Créer DS-01 | Montant HT = TTC, mention «TVA non applicable Art.293B» sur PDF | 🟠 |
| QF-10 | Devis TVA 20% (assujetti) | Marc (B) | Profil TVA = 20% | 1. Créer DM-01 15 000€ HT | TVA 3 000€ calculée, TTC = 18 000€ sur PDF | 🟠 |
| QF-11 | Devis exonération formation | Isabelle (E) | Connectée | 1. Créer DI-01 2 800€ | Mention «Exonération TVA Art. 261-4-4a CGI» sur PDF | 🟠 |
| QF-12 | Facture retard OVERDUE | Marc (B) | FM-03 SENT depuis 31 jours | 1. Consulter liste factures | FM-03 apparaît avec badge OVERDUE rouge | 🟠 |
| QF-13 | Limite devis plan FREE | Julie (C) | Plan FREE | 1. Créer DJ-01 900€ | Devis créé, puis test si un 2e est bloqué ou non | 🟡 |
| QF-14 | Devis depuis brief complexe multi-services | Antoine (D) | Connecté | 1. Brief: «MOE résidence 12 logements Garnier, 8% de 468 750€ de travaux» | Montant 37 500€ HT calculé et proposé | 🟡 |
| QF-15 | Télécharger PDF facture | Marc (B) | FM-01 PAID | 1. Clic «Télécharger PDF» | Fichier PDF téléchargé, mentions légales complètes | 🟡 |

---

## 11. Cas de test — Module Trésorerie

| ID | Titre | Persona | Préconditions | Étapes | Résultat attendu | Priorité |
|----|-------|---------|---------------|--------|-----------------|----------|
| TR-01 | Saisir transaction INCOME manuel | Sophie (A) | Connectée | 1. Onglet Cash 2. «Nouvelle transaction» 3. T-03 2 000€ acompte | Transaction créée, solde +2 000€ | 🔴 |
| TR-02 | Saisir transaction EXPENSE manuel | Marc (B) | Connecté | 1. Créer TM-04 Loyer -1 200€ TTC | Transaction créée, solde -1 200€ | 🔴 |
| TR-03 | Saisie NLP revenue | Sophie (A) | Connectée | 1. Saisir «Remboursement Decathlon 150€ reçu hier» | T-05 créé : INCOME 150€, catégorie Remboursements | 🟠 |
| TR-04 | Saisie NLP dépense | Sophie (A) | Connectée | 1. Saisir «J'ai payé mon abonnement Figma 15€ ce matin» | T-06 créé : EXPENSE 15€, catégorie Logiciels | 🟠 |
| TR-05 | OCR reçu photo | Sophie (A) | Image reçu ticket restaurant 48€ | 1. Upload image T-10 | Montant 48€ extrait, catégorie «Frais de représentation» suggérée | 🟠 |
| TR-06 | Catégorisation IA automatique | Marc (B) | Transaction TM-08 saisie | 1. Saisir «Déjeuner prospect BanqueDirecte 114€» | Catégorie «Frais commerciaux» assignée automatiquement | 🟡 |
| TR-07 | Runway Calculator 3 scénarios | Sophie (A) | 12 transactions saisies | 1. Ouvrir Runway Calculator | 3 scénarios affichés : pessimiste ~5m, réaliste ~8m, optimiste ~11m | 🔴 |
| TR-08 | Runway impact client public 90j | Antoine (D) | FA-04 Mairie Vincennes SENT | 1. Consulter Runway | Scénario pessimiste intègre délai 90j de la mairie | 🟡 |
| TR-09 | Liste transactions du mois | Marc (B) | 8 transactions créées | 1. Filtre «Ce mois» | 8 transactions du mois affichées, total INCOME et EXPENSE calculés | 🟠 |
| TR-10 | Transaction auto depuis facture payée | Marc (B) | Facture FM-01 → PAID | 1. Marquer FM-01 payée | TM-01 créée automatiquement +24 500€ dans Cash | 🔴 |
| TR-11 | Charges récurrentes | Sophie (A) | Connectée | 1. Ajouter charge fixe «Loyer bureau 400€/mois» | Charge apparaît dans les projections Runway | 🟡 |
| TR-12 | Solde temps réel | Sophie (A) | Solde initial 3 200€, T-01 à T-12 saisies | 1. Voir solde dashboard | Solde = 8 837€ (calcul vérifié) | 🔴 |

---

## 12. Cas de test — Knowledge Base

| ID | Titre | Persona | Fichier de test | Étapes | Résultat attendu | Priorité |
|----|-------|---------|----------------|--------|-----------------|----------|
| KB-01 | Upload PDF commercial | Sophie (A) | KB-S01 Grille tarifaire PDF | 1. Onglet Wiki/KB 2. Upload fichier 3. Catégorie «Commercial» | Statut PROCESSING → INDEXED, pages comptées | 🔴 |
| KB-02 | Upload DOCX | Marc (B) | KB-M03 Methodo_consulting_Marc.docx | 1. Upload DOCX 2. Catégorie «Commercial» | Indexé en < 30s | 🔴 |
| KB-03 | Upload PPTX | Marc (B) | KB-M04 Presentation_ConseilTech.pptx | 1. Upload PPTX | Statut INDEXED, slides comptés | 🟠 |
| KB-04 | Upload XLSX | Isabelle (E) | KB-I03 Grille_Tarifaire_PharmaFormation.xlsx | 1. Upload XLSX | Statut INDEXED | 🟠 |
| KB-05 | Upload TXT / Markdown | Antoine (D) | Extrait Contrat_MOE_type.txt | 1. Upload .txt | Indexé correctement | 🟡 |
| KB-06 | Interrogation KB via Chat — tarif | Sophie (A) | KB-S01 indexé | 1. Chat: «Quel est mon tarif journalier pour un audit UX ?» | Réponse: «1 500€/jour» avec référence au document | 🔴 |
| KB-07 | Interrogation KB — conditions paiement | Sophie (A) | KB-S03
 CGV indexées | 1. Chat: «Quelles sont mes conditions de paiement ?» | Réponse extraite des CGV avec référence Art.3 | 🔴 |
| KB-08 | Interrogation multi-docs — croisement | Marc (B) | KB-M01 + KB-M02 indexés | 1. Chat: «Quel est mon TJM et mon préavis de résiliation ?» | Réponse combinant Grille tarifaire (1 500€) et Contrat (30j) | 🟠 |
| KB-09 | Interrogation KB juridique contrat MOE | Antoine (D) | KB-A01 indexé | 1. Chat: «Quelles sont mes assurances professionnelles ?» | RC Pro AXA ARQ-2026-448 + garantie décennale mentionnées | 🟠 |
| KB-10 | Interrogation KB formation | Isabelle (E) | KB-I01 + KB-I02 indexés | 1. Chat: «Ma formation pharmacovigilance est-elle éligible CPF ?» | Réponse affirmative avec code CPF 331459 | 🟠 |
| KB-11 | Suppression document KB | Marc (B) | KB-M03 indexé | 1. Supprimer Methodo_consulting_Marc.docx | Document supprimé, statut DELETED, plus interrogeable | 🟡 |
| KB-12 | Format non supporté | Sophie (A) | Fichier .mp4 | 1. Tenter upload video.mp4 | Message erreur «Format non supporté» | 🟡 |
| KB-13 | Catégorisation document | Marc (B) | KB-M04 PPTX | 1. Upload + choisir catégorie «Commercial» | Document classé Commercial, visible dans filtre KB | 🟡 |
| KB-14 | Interrogation sans document indexé | Julie (C) | Aucun doc KB | 1. Chat: «Quels sont mes tarifs ?» | Réponse IA indique qu'aucun document tarifaire n'est disponible | 🟡 |

---

## 13. Cas de test — Chat Business Brain

| ID | Titre | Persona | Préconditions | Question Chat | Résultat attendu | Priorité |
|----|-------|---------|---------------|---------------|-----------------|----------|
| CH-01 | Question CA du mois | Sophie (A) | Transactions T-01 à T-12 saisies | «Quel est mon CA ce mois-ci ?» | Réponse : CA revenus mai calculé (6 650€) avec sources | 🔴 |
| CH-02 | Prospects chauds | Marc (B) | 6 prospects créés | «Qui sont mes prospects les plus chauds ?» | MP-02 (NEGOTIATION) et MP-04 (INTERESTED 32k€) cités en priorité | 🟠 |
| CH-03 | Conseil stratégique | Sophie (A) | Pipeline + trésorerie renseignés | «J'hésite entre prospecter ou finir ma mission en cours» | Conseil contextuel basé sur solde, pipeline et charges fixes | 🟠 |
| CH-04 | Action rapide Santé financière | Marc (B) | 8 transactions, 4 factures | Clic action rapide «Santé financière» | Résumé : solde, CA, charges, runway, factures en attente | 🟠 |
| CH-05 | Action rapide Analyse du mois | Sophie (A) | Données mai complètes | Clic «Analyse du mois» | Synthèse : revenus, dépenses, prospects actifs, tâches | 🟡 |
| CH-06 | Question KB + données | Marc (B) | KB-M02 Grille tarifaire indexée | «Quel est mon TJM pour du conseil stratégique et qui est mon prospect le plus avancé ?» | Réponse combinée : TJM 1 500€ (KB) + MP-02 David Schmitt (NEGOTIATION) | 🔴 |
| CH-07 | Mémoire conversationnelle | Sophie (A) | Session Chat active | 1. Q: «Mon prospect SP-01 est-il intéressant ?» 2. Q: «Et sa valeur estimée ?» | 2e réponse comprend le contexte de SP-01 sans répétition | 🟠 |
| CH-08 | Question hors périmètre | Julie (C) | Connectée | «Donne-moi la météo à Paris» | Réponse indique que c'est hors du périmètre business | 🟡 |
| CH-09 | Question trésorerie formation OPCO | Isabelle (E) | TI-01 et TI-02 saisies | «Quel est mon solde actuel et qu'est-ce que j'attends encore en remboursement OPCO ?» | Solde + mention remboursement OPCO Uniformation en attente | 🟠 |
| CH-10 | Question runway | Antoine (D) | Transactions TA-01 à TA-05, client public | «Dans combien de temps est-ce que je risque d'être à court de trésorerie ?» | Runway en mois avec les 3 scénarios et mention délai Mairie | 🟠 |

---

## 14. Cas de test — Daily Focus IA

| ID | Titre | Persona | Préconditions | Étapes | Résultat attendu | Priorité |
|----|-------|---------|---------------|--------|-----------------|----------|
| DF-01 | Génération 3 priorités du jour | Sophie (A) | Données pipeline + cash + tâches | 1. Ouvrir dashboard | 3 actions affichées avec justifications contextuelles | 🔴 |
| DF-02 | Priorité basée trésorerie critique | Marc (B) | Solde bas (<1 mois runway) | 1. Modifier solde à 2 000€ 2. Actualiser Focus | 1 action = «Relancer factures impayées» ou «Contacter prospect chaud» | 🟠 |
| DF-03 | Priorité basée prospect inactif | Sophie (A) | SP-04 Lucas : 19j sans contact | 1. Voir Focus | Action «Relancer Lucas Petit» présente dans les 3 priorités | 🟠 |
| DF-04 | Cocher une action accomplie | Sophie (A) | Focus généré | 1. Cocher 1ère action | Action cochée, progression visible, streak mis à jour | 🟡 |
| DF-05 | Email Daily Focus Solo Pro | Marc (B) | Plan Solo Pro, 8h UTC passé | 1. Vérifier boîte email | Email «⚡ Votre Focus Brainlo du [date]» reçu avec 3 actions | 🟡 |
| DF-06 | Daily Focus indisponible plan FREE | Julie (C) | Plan FREE | 1. Ouvrir dashboard | Focus affiché en mode limité ou CTA upgrade | 🟢 |

---

## 15. Cas de test — Gestion des Tâches IA

| ID | Titre | Persona | Préconditions | Étapes | Résultat attendu | Priorité |
|----|-------|---------|---------------|--------|-----------------|----------|
| TK-01 | Créer tâche via brief NLP | Sophie (A) | Connectée | 1. Brief: «Préparer présentation UX pour TechCorp vendredi» | Tâche créée, date détectée (vendredi), priorité assignée | 🟠 |
| TK-02 | Score de priorisation IA | Marc (B) | 5 tâches créées | 1. Demander priorisation | Scores 0–100 affichés avec justifications (ex: 92/100) | 🟠 |
| TK-03 | Tâche récurrente mensuelle | Sophie (A) | Connectée | 1. Créer «Relance clients en attente» récurrente le 1er du mois | Tâche récurrente créée, prochaine occurrence calculée | 🟡 |
| TK-04 | Marquer tâche terminée | Marc (B) | Tâche TK-01 créée | 1. Cocher tâche | Statut DONE, retirée de la liste active | 🟠 |
| TK-05 | Lien tâche → prospect | Sophie (A) | SP-01 et tâche créées | 1. Lier tâche «Envoyer devis» à SP-01 | Tâche apparaît dans la fiche prospect SP-01 | 🟡 |

---

## 16. Scénarios E2E complets

### 🎬 Scénario E2E-01 — Parcours freelance designer (Sophie) — *Happy path complet*

```
Durée estimée : 45 min | Persona : Sophie Martin | Plan : Solo Pro

ÉTAPE 1 — Onboarding
  ✓ OB-01 : Créer compte sophie@designstudio.fr
  ✓ OB-02 : Compléter profil (SIRET, adresse, secteur Design)
  → Vérifier : Dashboard accessible avec données vides

ÉTAPE 2 — Alimenter la KB
  ✓ KB-01 : Upload Grille_tarifaire_Design_Studio_SM_2026.pdf
  ✓ KB-01 : Upload CGV_Design_Studio_SM_2026.pdf
  → Vérifier : Statut INDEXED sur les 2 docs en < 30s

ÉTAPE 3 — Créer le pipeline
  ✓ CRM-01 : Créer SP-03 Marie Dubois (Agence Nova)
  ✓ CRM-02 : Enrichir SP-01 Camille Rousseau via SIRET
  ✓ CRM-04 : Créer SP-04 Lucas Petit via NLP
  → Vérifier : 3 prospects dans Kanban, statuts corrects

ÉTAPE 4 — Créer et envoyer un devis
  ✓ CRM-07 : Ouvrir fiche SP-01 → «Créer devis»
  ✓ QF-01 : Brief NLP «3 jours UX TechCorp 1500€/jour» → DS-01
  ✓ QF-09 : Vérifier TVA 0% sur PDF
  ✓ QF-04 : Marquer DS-01 SENT
  → Vérifier : DEVIS-2026-001 SENT, date d'envoi enregistrée

ÉTAPE 5 — Convertir en facture
  ✓ QF-05 : Devis DS-01 ACCEPTED → Convertir en FAC-2026-001
  ✓ QF-06 : Marquer FAC-2026-001 payée
  → Vérifier : Transaction T-01 +4 500€ créée automatiquement dans Cash

ÉTAPE 6 — Saisir les dépenses
  ✓ TR-04 : NLP «Figma 15€ ce matin» → T-06
  ✓ TR-05 : OCR reçu déplacement 85€ → T-09
  → Vérifier : Solde mis à jour en temps réel

ÉTAPE 7 — Consulter la santé financière
  ✓ TR-07 : Runway Calculator 3 scénarios
  ✓ CH-01 : Chat «Quel est mon CA ce mois-ci ?»
  ✓ CH-06 : Chat «Quelles sont mes conditions de paiement ?» → KB-S03
  → Vérifier : Réponses cohérentes avec données saisies

ÉTAPE 8 — Relancer un prospect inactif
  ✓ CRM-06 : SP-04 Lucas (19j) → Générer relance IA
  → Vérifier : Message personnalisé avec prénom, projet, délai

ÉTAPE 9 — Daily Focus
  ✓ DF-01 : Voir 3 priorités du jour
  ✓ DF-04 : Cocher 1 action
  → Vérifier : Streak mis à jour

RÉSULTAT ATTENDU GLOBAL :
  Toutes les étapes passent sans blocage
  Données cohérentes inter-modules (Cash ↔ Factures ↔ Pipeline ↔ KB ↔ Chat)
  Solde final Sophie = ~8 837€
```

---

### 🎬 Scénario E2E-02 — Consultant long cycle (Marc) — *Pipeline → KB → Devis complexe*

```
Durée estimée : 30 min | Persona : Marc Lefebvre | Plan : Solo Pro

ÉTAPE 1 — Onboarding
  ✓ OB-02 : Profil Marc (SARL, TVA 20%, Lyon)

ÉTAPE 2 — KB métier
  ✓ KB-02 : Upload Methodo_consulting_Marc.docx
  ✓ KB-03 : Upload Presentation_ConseilTech.pptx
  ✓ KB-01 : Upload Grille_tarifaire_ConseilTech_2026.pdf
  → Vérifier : 3 docs INDEXED

ÉTAPE 3 — Pipeline
  ✓ CRM-03 : MP-03 CONTACTED → INTERESTED
  ✓ CRM-06 : MP-01 Anne-Lise (12j) → Relance IA
  → Vérifier : Message relance adapté au contexte BanqueDirecte

ÉTAPE 4 — Gros devis avec TVA
  ✓ QF-02 : Créer DM-03 20 416€ HT + TVA 20% = 24 500€ TTC
  ✓ QF-10 : Vérifier TVA calculée correctement sur PDF
  ✓ QF-05 : DM-03
 ACCEPTED → FAC-2026-001
  ✓ QF-06 : FAC-2026-001 payée → TM-01 +24 500€ dans Cash
  → Vérifier : Transaction auto créée, solde Cash mis à jour

ÉTAPE 5 — Trésorerie
  ✓ TR-02 : Saisir dépenses TM-04 à TM-08
  ✓ TR-09 : Lister transactions du mois
  → Vérifier : Solde = 39 056€

ÉTAPE 6 — KB + Chat croisé
  ✓ KB-08 : Chat «Quel est mon TJM et mon préavis de résiliation ?»
  → Vérifier : Réponse croise Grille tarifaire (1 500€) + Contrat (30j)

ÉTAPE 7 — Daily Focus
  ✓ DF-02 : Focus avec trésorerie saine → conseil pipeline mis en avant
  → Vérifier : Prospect MP-04 HoldingNord (32k€) mentionné

RÉSULTAT ATTENDU GLOBAL :
  Flux complet pipeline → devis → facture → cash → KB → Chat fonctionnel
  TVA 20% correcte sur tous les documents Marc
  Solde final Marc = ~39 056€
```

---

### 🎬 Scénario E2E-03 — Architecte facturation par tranches (Antoine) — *Cas complexe*

```
Durée estimée : 30 min | Persona : Antoine Dubois | Plan : Solo Pro

ÉTAPE 1 — Onboarding Antoine
  ✓ OB-02 : Profil Antoine (Entreprise individuelle, TVA 20%, Paris)

ÉTAPE 2 — Pipeline prospects
  ✓ CRM-01 : Créer AP-01 Jean-Michel Garnier (Promo Immo 75)
  ✓ CRM-02 : Enrichissement SIRET 34100890200056
  → Vérifier : Adresse et activité pré-remplies

ÉTAPE 3 — KB réglementaire
  ✓ KB-01 : Upload Contrat_MOE_type_Cabinet_Dubois.pdf
  ✓ KB-01 : Upload Grille_Honoraires_Cabinet_Dubois_2026.pdf
  → Vérifier : 2 docs INDEXED

ÉTAPE 4 — Devis complexe multi-tranches
  ✓ QF-14 : Créer DA-01 via brief NLP «MOE résidence 12 logements, 8% de 468 750€»
  → Vérifier : Montant 37 500€ HT calculé
  ✓ QF-02 : Ajouter 3 lignes manuelles (Tranche APS 30%, PRO 40%, EXE 30%)
  ✓ QF-03 : Aperçu PDF da-01 avec TVA 20%
  ✓ QF-04 : Marquer DA-01 SENT puis ACCEPTED

ÉTAPE 5 — Facturation tranche 1
  ✓ QF-05 : Convertir DA-01 tranche APS → FA-01 (11 250€ HT + 2 250€ TVA)
  ✓ QF-06 : FA-01 payée → TA-01 +13 500€ dans Cash
  → Vérifier : Transaction auto, solde = 12 000 + 13 500 - 4 350 charges = ~21 150€

ÉTAPE 6 — Impact client public sur runway
  ✓ CRM-01 : Créer AP-02 Mairie de Vincennes avec note «délai légal 90j»
  ✓ TR-07 : Runway Calculator
  ✓ CH-10 : Chat «Dans combien de temps est-ce que je risque d'être à court de trésorerie ?»
  → Vérifier : Scénario pessimiste intègre délai 90j Mairie

ÉTAPE 7 — KB interrogation MOE
  ✓ KB-09 : Chat «Quelles sont mes assurances professionnelles ?»
  → Vérifier : RC Pro AXA + garantie décennale mentionnées

RÉSULTAT ATTENDU GLOBAL :
  Devis complexe multi-tranches créé et converti correctement
  3 factures séquentielles liées au même devis (FA-01, FA-02, FA-03)
  KB MOE répond avec précision au contrat indexé
```

---

### 🎬 Scénario E2E-04 — Formatrice santé (Isabelle) — *TVA exonérée + OPCO*

```
Durée estimée : 25 min | Persona : Isabelle Fontaine | Plan : Solo Pro

ÉTAPE 1 — Onboarding Isabelle
  ✓ OB-02 : Profil Isabelle (SASU, TVA exonérée, Montpellier, N° Datadock)

ÉTAPE 2 — KB pédagogique
  ✓ KB-01 : Upload Programme_Formation_Pharmacovigilance_2026.pdf
  ✓ KB-02 : Upload CGV_PharmaFormation_2026.pdf
  ✓ KB-04 : Upload Grille_Tarifaire_PharmaFormation_2026.xlsx
  → Vérifier : 3 docs INDEXED

ÉTAPE 3 — Pipeline
  ✓ CRM-11 : Créer IP-02 Clinique Saint-Roch, statut NEGOTIATION
  ✓ CRM-01 : Créer IP-01 OPCO Uniformation, statut PROPOSAL

ÉTAPE 4 — Devis formation TVA exonérée
  ✓ QF-11 : Créer DI-02 1 400€ formation Clinique Saint-Roch
  → Vérifier : Mention «Exonération TVA Art.261-4-4a CGI» sur PDF
  ✓ QF-04 : Marquer DI-02 SENT
  ✓ QF-05 : DI-02 ACCEPTED → FI-02
  ✓ QF-06 : FI-02 payée → TI-01 +1 400€ Cash

ÉTAPE 5 — Trésorerie OPCO
  ✓ TR-01 : Saisir TI-02 Versement OPCO partiel +1 200€
  ✓ CH-09 : Chat «Quel est mon solde et qu'est-ce que j'attends en remboursement OPCO ?»
  → Vérifier : Réponse mentionne les 1 600€ OPCO Santé en attente (FI-03)

ÉTAPE 6 — KB formation interrogation
  ✓ KB-10 : Chat «Ma formation pharmacovigilance est-elle éligible CPF ?»
  → Vérifier : Réponse affirmative avec code CPF 331459
  ✓ KB-07 : Chat «Quels sont les frais d'annulation dans mes CGV ?»
  → Vérifier : Art.3 CGV cité (< 8j = 50% frais retenus)

RÉSULTAT ATTENDU GLOBAL :
  Devis et factures sans TVA avec mentions légales correctes
  KB formation répond précisément aux questions OPCO/CPF/CGV
  Trésorerie reflète les encaissements partiels OPCO
```

---

### 🎬 Scénario E2E-05 — Plan FREE vers upgrade (Julie) — *Test de friction et conversion*

```
Durée estimée : 20 min | Persona : Julie Moreau | Plan : FREE → Solo Pro

ÉTAPE 1 — Onboarding Julie plan FREE
  ✓ OB-01 : Créer compte julie@agencecreative.com
  ✓ OB-02 : Profil Julie (auto-entrepreneur, Bordeaux, CM)

ÉTAPE 2 — Tester les limites FREE
  ✓ CRM-01 : Créer JP-01 Hugo Denis → OK
  ✓ CRM-01 : Créer JP-02 Aurélie Masso → OK
  ✓ CRM-01 : Créer JP-03 Benoît Faure → OK
  ✓ CRM-12 : Tenter 4e prospect → Message limitation FREE affiché
  → Vérifier : CTA upgrade présent et fonctionnel

ÉTAPE 3 — Premier devis plan FREE
  ✓ QF-13 : Créer DJ-01 Hugo Denis 900€
  → Vérifier : Devis créé, PDF généré sans erreur

ÉTAPE 4 — Daily Focus limité
  ✓ DF-06 : Consulter Daily Focus en plan FREE
  → Vérifier : Mode limité ou CTA upgrade affiché

ÉTAPE 5 — Parcours upgrade Stripe
  1. Cliquer sur un CTA upgrade
  2. Redirection page pricing
  3. Sélectionner Solo Pro 29€/mois
  4. Saisir carte test Stripe (4242 4242 4242 4242, 12/29, 123)
  5. Valider le paiement
  → Vérifier : Plan mis à jour en Solo Pro, fonctionnalités débloquées

ÉTAPE 6 — Post-upgrade
  ✓ CRM-01 : Créer 4e prospect JP-03 maintenant possible
  ✓ DF-01 : Daily Focus complet accessible
  → Vérifier : Toutes les restrictions FREE levées

RÉSULTAT ATTENDU GLOBAL :
  Limites FREE bien appliquées (prospects, fonctionnalités)
  Parcours upgrade Stripe fluide et fonctionnel
  Post-upgrade : toutes les fonctions Solo Pro accessibles immédiatement
```

---

## 17. Matrice de couverture

### 17.1 Couverture par module

| Module | Cas de test | 🔴 Critique | 🟠 Haute | 🟡 Moyenne | 🟢 Basse |
|--------|------------|------------|---------|-----------|----------|
| Onboarding | 10 | 3 | 3 | 3 | 1 |
| CRM Pipeline | 12 | 1 | 5 | 6 | 0 |
| Devis & Factures | 15 | 5 | 6 | 4 | 0 |
| Trésorerie | 12 | 5 | 4 | 3 | 0 |
| Knowledge Base | 14 | 3 | 6 | 5 | 0 |
| Chat Business Brain | 10 | 2 | 6 | 2 | 0 |
| Daily Focus IA | 6 | 1 | 2 | 1 | 2 |
| Tâches IA | 5 | 0 | 3 | 2 | 0 |
| **TOTAL** | **84** | **20** | **35** | **26** | **3** |

### 17.2 Couverture par persona

| Persona | Plan | Prospects | Devis | Factures | Transactions | Docs KB | Scénario E2E |
|---------|------|-----------|-------|----------|-------------|---------|---------------|
| Sophie Martin (A) | Solo Pro | 8 | 4 | 3 | 12 | 3 (S01-S03) | E2E-01 ✓ |
| Marc Lefebvre (B) | Solo Pro | 6 | 4 | 3 | 8 | 4 (M01-M04) | E2E-02 ✓ |
| Julie Moreau (C) | FREE→Pro | 3 | 2 | 0 | 0 | 1 (J01) | E2E-05 ✓ |
| Antoine Dubois (D) | Solo Pro | 4 | 3 | 4 | 5 | 2 (A01-A02) | E2E-03 ✓ |
| Isabelle Fontaine (E) | Solo Pro | 4 | 3 | 3 | 5 | 3 (I01-I03) | E2E-04 ✓ |
| Thomas Leclerc (F) | Lead/Aucun | 0 | 0 | 0 | 0 | 0 | Assessment |
| **TOTAL** | | **25** | **16** | **13** | **30** | **13** | **5 scénarios** |

### 17.3 Couverture des flux d'intégration

| Flux inter-modules | Testé dans | Cas de test | Priorité |
|-------------------|-----------|------------|----------|
| Prospect → Devis (pré-remplissage) | CRM-07, QF-08 | 2 | 🔴 |
| Devis → Facture (conversion) | QF-05 | 1 | 🔴 |
| Facture payée → Transaction Cash | QF-06, TR-10 | 2 | 🔴 |
| Transaction → Solde temps réel | TR-12 | 1 | 🔴 |
| Cash → Runway Calculator | TR-07 | 1 | 🔴
 |
| KB document indexé → Chat interrogation | KB-06, KB-07, KB-08 | 3 | 🔴 |
| KB croisement multi-docs | KB-08, CH-06 | 2 | 🟠 |
| Prospect inactif → Relance IA | CRM-06, CRM-11 | 2 | 🟠 |
| Dashboard → Daily Focus → tâche | DF-01, DF-04 | 2 | 🟠 |
| Plan FREE → Limitation → Upgrade Stripe | CRM-12, QF-13, DF-06 | 3 | 🟠 |
| Profil légal → PDF devis/facture | QF-09, QF-10, QF-11 | 3 | 🟠 |
| Facture OVERDUE → Relance | QF-12 | 1 | 🟠 |
| Runway → Cash projections | TR-07, TR-08, TR-11 | 3 | 🟠 |

---

### 17.4 Documents Knowledge Base — Récapitulatif à créer

| ID Doc | Fichier | Format | Persona | Catégorie KB | Requêtes de test clés |
|--------|---------|--------|---------|-------------|----------------------|
| KB-S01 | Grille_tarifaire_Design_Studio_SM_2026.pdf | PDF | Sophie (A) | Commercial | Tarif audit UX, remises, conditions |
| KB-S02 | Proposition_commerciale_type_UX_2026.docx | DOCX | Sophie (A) | Commercial | Phases, livrables, délais |
| KB-S03 | CGV_Design_Studio_SM_2026.pdf | PDF | Sophie (A) | Juridique | Pénalités retard, PI, résiliation |
| KB-M01 | Contrat_type_mission_consulting_2026.pdf | PDF | Marc (B) | Juridique | Résiliation, préavis, confidentialité |
| KB-M02 | Grille_tarifaire_ConseilTech_2026.pdf | PDF | Marc (B) | Commercial | TJM, forfaits, remises volume |
| KB-M03 | Methodo_consulting_Marc.docx | DOCX | Marc (B) | Commercial | Phases méthode, livrables |
| KB-M04 | Presentation_ConseilTech.pptx | PPTX | Marc (B) | Commercial | Secteurs, XP, références |
| KB-A01 | Contrat_MOE_type_Cabinet_Dubois.pdf | PDF | Antoine (D) | Juridique | Phases MOE, honoraires, assurances |
| KB-A02 | Grille_Honoraires_Cabinet_Dubois_2026.pdf | PDF | Antoine (D) | Commercial | % travaux, forfaits partiels |
| KB-I01 | Programme_Formation_Pharmacovigilance_2026.pdf | PDF | Isabelle (E) | Commercial | Objectifs, CPF, OPCO |
| KB-I02 | CGV_PharmaFormation_2026.pdf | PDF | Isabelle (E) | Juridique | Annulation, OPCO, attestation |
| KB-I03 | Grille_Tarifaire_PharmaFormation_2026.xlsx | XLSX | Isabelle (E) | Commercial | Tarifs intra/inter, financement |
| KB-J01 | Offre_Services_Julie_Creative_2026.pdf | PDF | Julie (C) | Commercial | Formules CM, tarifs à la carte |

**Total : 13 documents à créer, couvrant 4 formats (PDF, DOCX, PPTX, XLSX)**

---

### 17.5 Synthèse des cas de test critiques prioritaires

Les **20 cas de test CRITIQUE 🔴** à exécuter en priorité absolue :

| Priorité | ID | Module | Description |
|----------|----|--------|-------------|
| 1 | OB-01 | Onboarding | Inscription nouveau compte |
| 2 | OB-02 | Onboarding | Onboarding profil complet |
| 3 | OB-06 | Onboarding | Connexion valide |
| 4 | CRM-01 | Pipeline | Créer prospect manuel |
| 5 | CRM-07 | Pipeline | Devis depuis fiche prospect |
| 6 | QF-01 | Devis | Créer devis via NLP |
| 7 | QF-02 | Devis | Devis multi-lignes manuels |
| 8 | QF-05 | Devis→Facture | Convertir devis en facture |
| 9 | QF-06 | Facture→Cash | Facture payée → transaction auto |
| 10 | TR-01 | Trésorerie | Saisir transaction INCOME |
| 11 | TR-02 | Trésorerie | Saisir transaction EXPENSE |
| 12 | TR-07 | Trésorerie | Runway Calculator 3 scénarios |
| 13 | TR-10 | Trésorerie | Transaction auto depuis facture |
| 14 | TR-12 | Trésorerie | Solde temps réel |
| 15 | KB-01 | Knowledge Base | Upload PDF commercial |
| 16 | KB-02 | Knowledge Base | Upload DOCX |
| 17 | KB-06 | KB→Chat | Interrogation KB tarif |
| 18 | KB-07 | KB→Chat | Interrogation conditions paiement |
| 19 | CH-01 | Chat | Question CA du mois |
| 20 | CH-06 | Chat+KB | Question croisée KB + données |

---

## Annexe — Carte Stripe de test

Pour les tests du parcours upgrade Julie (E2E-05) :

| Champ | Valeur |
|-------|--------|
| Numéro carte | `4242 4242 4242 4242` |
| Expiration | `12/29` |
| CVC | `123` |
| Code postal | `75011` |
| Résultat attendu | Paiement accepté, plan Solo Pro activé |

Carte de test refus (pour tester l'échec Stripe) :

| Champ | Valeur |
|-------|--------|
| Numéro carte | `4000 0000 0000 0002` |
| Résultat attendu | Message «Votre carte a été refusée» |

---

## Historique des versions

| Version | Date | Auteur | Modifications |
|---------|------|--------|---------------|
| 1.0.0 | 2026-05-17 | Agent Zero | Création initiale — 6 personae, 25 prospects, 16 devis, 13 factures, 30 transactions, 13 docs KB, 84 cas de test, 5 scénarios E2E |

---

*Document généré automatiquement par Agent Zero à partir du MANUEL_UTILISATEUR_DEMO.md et de la STRATEGIE_DE_TEST_COMPLETE.md du projet Brainlo.*  
*Fichier : `/a0/usr/projects/business_ai_os/Plan de Test Exhaustif Brainlo _ Personae_ Cas de Test _ Knowledge Base.md`*
