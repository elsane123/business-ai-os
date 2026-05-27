# 📋 Cahier des Charges — Tests Fonctionnels Brainlo

> **Version :** 1.0 — Mai 2026  
> **Application :** Brainlo (Business AI OS)  
> **Environnement cible :** Production / Staging  

---

## Conventions

| Colonne | Description |
|---|---|
| **ID** | Identifiant unique du test |
| **Fonctionnalité** | Action ou scénario testé |
| **Résultat attendu** | Comportement correct de l'application |
| **Gestion d'erreur** | Comportement attendu en cas d'échec |

---

## 1. Authentification

### 1.1 Page Login `/login`

| ID | Fonctionnalité | Résultat attendu | Gestion d'erreur |
|---|---|---|---|
| AUTH-01 | Connexion avec email + mot de passe valides | Redirection vers `/focus` (ou dashboard), session créée | — |
| AUTH-02 | Connexion avec mot de passe incorrect | Rester sur `/login` | Message : "Email ou mot de passe incorrect" |
| AUTH-03 | Connexion avec email inexistant | Rester sur `/login` | Message d'erreur générique (ne pas révéler si l'email existe) |
| AUTH-04 | Connexion avec champs vides | Blocage à la soumission | Message : "Champs obligatoires" |
| AUTH-05 | Connexion avec email mal formé | Blocage à la soumission | Message : "Format email invalide" |
| AUTH-06 | Clic sur "Mot de passe oublié" | Redirection vers `/forgot-password` | — |
| AUTH-07 | Accès à `/login` étant déjà connecté | Redirection automatique vers le dashboard | — |

### 1.2 Page Mot de passe oublié `/forgot-password`

| ID | Fonctionnalité | Résultat attendu | Gestion d'erreur |
|---|---|---|---|
| AUTH-08 | Soumettre un email enregistré | Message de confirmation envoi d'email | — |
| AUTH-09 | Soumettre un email inconnu | Message de confirmation générique (anti-énumération) | — |
| AUTH-10 | Soumettre avec champ vide | Blocage à la soumission | Message : "Email requis" |

### 1.3 Page Réinitialisation `/reset-password`

| ID | Fonctionnalité | Résultat attendu | Gestion d'erreur |
|---|---|---|---|
| AUTH-11 | Accès avec token valide | Formulaire de saisie nouveau mot de passe affiché | — |
| AUTH-12 | Accès avec token expiré ou invalide | Message d'erreur + lien retour à `/forgot-password` | Message : "Lien invalide ou expiré" |
| AUTH-13 | Soumission mot de passe trop court | Blocage | Message : "Mot de passe trop court (min. 8 caractères)" |
| AUTH-14 | Soumission mot de passe ≠ confirmation | Blocage | Message : "Les mots de passe ne correspondent pas" |
| AUTH-15 | Réinitialisation réussie | Redirection vers `/login` avec message succès | — |

### 1.4 Page Onboarding `/onboarding`

| ID | Fonctionnalité | Résultat attendu | Gestion d'erreur |
|---|---|---|---|
| AUTH-16 | Compléter les étapes avec des données valides | Profil créé, redirection vers le dashboard | — |
| AUTH-17 | Passer une étape sans remplir les champs requis | Blocage avec message de validation | Message : "Ce champ est requis" |
| AUTH-18 | Accéder à l'onboarding si déjà complété | Redirection vers `/focus` | — |

---

## 2. Dashboard Principal

### 2.1 Page Dashboard `/(dashboard)`

| ID | Fonctionnalité | Résultat attendu | Gestion d'erreur |
|---|---|---|---|
| DASH-01 | Chargement initial | Widgets KPI visibles (CA, prospects, tâches) | Skeleton loaders pendant le chargement |
| DASH-02 | Affichage checklist premiers pas | Les étapes non complétées s'affichent | — |
| DASH-03 | Clic sur une étape de la checklist | Navigation vers la page concernée | — |
| DASH-04 | Navigation via sidebar (tous les liens) | Redirection correcte vers chaque module | — |
| DASH-05 | Déconnexion via menu utilisateur | Session détruite, redirection vers `/login` | — |
| DASH-06 | Accès sans authentification | Redirection vers `/login` | — |

---

## 3. Focus IA

### 3.1 Page Focus `/(dashboard)/focus`

| ID | Fonctionnalité | Résultat attendu | Gestion d'erreur |
|---|---|---|---|
| FOC-01 | Chargement de la page | Date du jour affichée, focus IA du jour chargé | Skeleton loader |
| FOC-02 | Génération du focus IA (1ère fois) | 3 actions prioritaires générées et affichées | Message d'erreur si l'IA est indisponible |
| FOC-03 | Cocher une action comme accomplie | Statut "done", score de focus mis à jour | — |
| FOC-04 | Décocher une action | Statut revient à "todo", score recalculé | — |
| FOC-05 | Score de focus 100% | Indicateur vert, message de félicitations | — |
| FOC-06 | Régénérer le focus | Nouvelles actions générées, anciennes remplacées | Confirmation avant écrasement |
| FOC-07 | Consulter l'historique | Liste des jours passés avec scores | Message si aucun historique |
| FOC-08 | Widget streak | Nombre de jours consécutifs affiché correctement | — |
| FOC-09 | Widget calendrier | Jours complétés surlignés | — |
| FOC-10 | Checklist onboarding visible si données manquantes | 3 étapes d'onboarding affichées avec CTA | — |

### 3.2 Restrictions Plan FREE — Focus IA (HTTP 403)

| ID | Fonctionnalité | Résultat attendu | Message UI affiché |
|---|---|---|---|
| PLAN-01 | Accéder à `/focus` avec un compte FREE | Page Focus chargée mais génération bloquée | — (page s'affiche normalement) |
| PLAN-02 | Cliquer "Générer mon Focus" en FREE | API `GET /api/focus` retourne `403` + `upgradeRequired: true` | 🚀 Modale : titre *"Fonctionnalité Solo Pro"*, texte *"La génération de Focus IA est réservée aux abonnés Solo Pro."*, boutons *"Plus tard"* et *"Upgrader — 29€/mois"* |
| PLAN-03 | Tenter de lire un focus existant en FREE | API `GET /api/focus` bloquée `403` | Même modale d'upgrade |

---

## 4. Trésorerie & Runway

### 4.1 Page Cash `/(dashboard)/cash`

| ID | Fonctionnalité | Résultat attendu | Gestion d'erreur |
|---|---|---|---|
| CASH-01 | Chargement de la page | KPIs (balance, revenus, charges) affichés | Skeleton loaders |
| CASH-02 | Ajouter une transaction (revenu) | Transaction visible dans la liste, solde mis à jour | Message si champs requis manquants |
| CASH-03 | Ajouter une transaction (dépense) | Transaction visible, solde diminué | Message si montant négatif ou invalide |
| CASH-04 | Sélectionner une catégorie | Catégorie enregistrée avec la transaction | — |
| CASH-05 | Sélectionner un taux de TVA | TVA calculée et affichée correctement | — |
| CASH-06 | Modifier une transaction existante | Données mises à jour, solde recalculé | Message si données invalides |
| CASH-07 | Supprimer une transaction | Transaction retirée, solde recalculé | Confirmation avant suppression |
| CASH-08 | Widget Runway affiché | 3 scénarios (pessimiste/réaliste/optimiste) avec dates | Message si données insuffisantes |
| CASH-09 | Progression vers l'objectif mensuel | Barre de progression correcte vs objectif Settings | — |
| CASH-10 | Filtrer les transactions par période | Liste filtrée correctement | Message si aucune transaction dans la période |
| CASH-11 | Saisie en langage naturel (IA) | L'IA pré-remplit montant, catégorie, date | Message d'erreur si IA indisponible |
| CASH-12 | Scanner un reçu OCR | Données extraites et pré-remplies dans le formulaire | Message d'erreur si fichier non supporté |

---

## 5. Pipeline CRM

### 5.1 Page Pipeline `/(dashboard)/pipeline`

| ID | Fonctionnalité | Résultat attendu | Gestion d'erreur |
|---|---|---|---|
| PIP-01 | Chargement du Kanban | Colonnes (Identifié, Contacté, Intéressé, Devis, Gagné) affichées | Skeleton loaders |
| PIP-02 | Ajouter un prospect | Fiche créée dans la colonne "Identifié" | Message si nom requis manquant |
| PIP-03 | Déplacer un prospect (drag & drop) | Statut mis à jour, prospect dans la bonne colonne | — |
| PIP-04 | Changer le statut via menu | Prospect déplacé dans la colonne correspondante | — |
| PIP-05 | Modifier les infos d'un prospect | Données sauvegardées correctement | Message si erreur API |
| PIP-06 | Supprimer un prospect | Prospect retiré du Kanban | Confirmation avant suppression |
| PIP-07 | Badge de chaleur (🔥/⚡/🧊) | Badge correct selon date du dernier contact | — |
| PIP-08 | Ajouter une relance | Relance enregistrée dans l'historique de la fiche | Message si champ vide |
| PIP-09 | Enrichissement IA (SIRET/API) | Fiche enrichie avec données entreprise | Message si SIRET non trouvé |
| PIP-10 | Lead scoring visible | Score affiché sur chaque fiche | — |
| PIP-11 | Filtrer les prospects | Liste filtrée par statut ou recherche texte | Message si aucun résultat |
| PIP-12 | Totaux par colonne | Valeur totale (€) et nombre de fiches corrects | — |

### 5.2 Restrictions Plan FREE — Pipeline CRM

#### Limite 3 prospects (HTTP 402)

| ID | Fonctionnalité | Résultat attendu | Message UI affiché |
|---|---|---|---|
| PLAN-04 | Ajouter un 1er, 2ème, 3ème prospect en FREE | Prospects créés normalement | — |
| PLAN-05 | Tenter d'ajouter un 4ème prospect en FREE | API `POST /api/pipeline/prospects` retourne `402` + `upgradeRequired: true` | 🚀 Modale : titre *"Fonctionnalité Solo Pro"*, texte *"La génération de relances IA est réservée aux abonnés Solo Pro..."* ⚠️ *(Bug UI : texte incorrect — voir §18.2 PLAN-05)* |
| PLAN-06 | Modifier un prospect existant en FREE | Modification autorisée | — |
| PLAN-07 | Supprimer un prospect FREE puis en recréer un | Création autorisée (retombe sous la limite) | — |

#### Relance IA — Bloquée (HTTP 403)

| ID | Fonctionnalité | Résultat attendu | Message UI affiché |
|---|---|---|---|
| PLAN-11 | Cliquer "Générer une relance IA" sur une fiche prospect FREE | API `POST /api/pipeline/relance` retourne `403` + `upgradeRequired: true` | 🚀 Modale : titre *"Fonctionnalité Solo Pro"*, texte *"La génération de relances IA est réservée aux abonnés Solo Pro. Débloquez des messages personnalisés pour chaque prospect avec l'IA."*, boutons *"Plus tard"* et *"Upgrader maintenant — 29€/mois"* |
| PLAN-12 | Affichage du bouton relance IA en FREE | Bouton visible, modale déclenchée au clic | — |

---

## 6. Tâches

### 6.1 Page Tâches `/(dashboard)/tasks`

| ID | Fonctionnalité | Résultat attendu | Gestion d'erreur |
|---|---|---|---|
| TASK-01 | Chargement de la liste des tâches | Tâches affichées groupées par statut ou catégorie | Skeleton loaders |
| TASK-02 | Créer une tâche | Tâche créée avec titre, catégorie, priorité | Message si titre manquant |
| TASK-03 | Définir une priorité (Haute/Moyenne/Basse) | Badge priorité affiché correctement | — |
| TASK-04 | Définir une catégorie (Cash/Clients/Visibilité/Admin/Autre) | Catégorie enregistrée et visible | — |
| TASK-05 | Définir une durée estimée | Durée affichée sur la fiche | — |
| TASK-06 | Définir une date d'échéance | Date affichée, tâche mise en avant si en retard | — |
| TASK-07 | Lier une tâche à un prospect | Nom du prospect affiché sur la tâche | Message si prospect inexistant |
| TASK-08 | Passer une tâche à "En cours" | Statut mis à jour | — |
| TASK-09 | Passer une tâche à "Terminée" | Tâche marquée complète, date de complétion enregistrée | — |
| TASK-10 | Annuler une tâche | Statut CANCELLED, tâche grisée | Confirmation avant annulation |
| TASK-11 | Supprimer une tâche | Tâche retirée de la liste | Confirmation avant suppression |
| TASK-12 | Créer une tâche récurrente | Récurrence configurée (quotidien/hebdo/mensuel) | Message si récurrence invalide |
| TASK-13 | Score IA de priorité | Score et raison affichés sur les tâches | Message si calcul impossible |
| TASK-14 | Filtrer par catégorie | Liste filtrée | Message si aucun résultat |

---

## 7. Devis & Factures

### 7.1 Page Facturation `/(dashboard)/invoices`

**Devis (Quotes)**

| ID | Fonctionnalité | Résultat attendu | Gestion d'erreur |
|---|---|---|---|
| INV-01 | Créer un devis | Devis créé en statut DRAFT avec numéro auto | Message si aucune ligne ajoutée |
| INV-02 | Ajouter des lignes au devis | Totaux HT/TVA/TTC recalculés dynamiquement | Message si qté ou prix invalide |
| INV-03 | Lier un devis à un prospect | Nom du prospect associé au devis | — |
| INV-04 | Modifier un devis DRAFT | Données sauvegardées | Message si devis non DRAFT |
| INV-05 | Passer le devis en SENT | Statut mis à jour, date d'envoi enregistrée | — |
| INV-06 | Passer le devis en ACCEPTED | Statut ACCEPTED, bouton conversion en facture disponible | — |
| INV-07 | Passer le devis en DECLINED / EXPIRED | Statut mis à jour | — |
| INV-08 | Convertir un devis accepté en facture | Facture créée avec les mêmes lignes, devis lié | Message si devis non accepté |
| INV-09 | Prévisualiser / Imprimer
| INV-09 | Prévisualiser / Imprimer un devis | Page d'impression `/print/quote/[id]` s'ouvre correctement | Message si devis inexistant |

**Factures (Invoices)**

| ID | Fonctionnalité | Résultat attendu | Gestion d'erreur |
|---|---|---|---|
| INV-10 | Créer une facture | Facture créée en statut DRAFT avec numéro auto | Message si aucune ligne ajoutée |
| INV-11 | Ajouter des lignes à la facture | Totaux HT/TVA/TTC recalculés dynamiquement | Message si qté ou prix invalide |
| INV-12 | Définir une date d'échéance | Date enregistrée et affichée | — |
| INV-13 | Passer la facture en SENT | Statut mis à jour, date d'envoi enregistrée | — |
| INV-14 | Passer la facture en PAID | Statut PAID, date de paiement enregistrée | — |
| INV-15 | Passer la facture en OVERDUE | Statut mis à jour automatiquement si date échue | — |
| INV-16 | Annuler une facture | Statut CANCELLED | Confirmation avant annulation |
| INV-17 | Lier une facture à une transaction cash | Transaction créée dans le module Cash | Message si liaison impossible |
| INV-18 | Prévisualiser / Imprimer une facture | Page d'impression `/print/invoice/[id]` s'ouvre correctement | Message si facture inexistante |

### 7.2 Restrictions Plan FREE — Devis & Factures (HTTP 402)

| ID | Fonctionnalité | Résultat attendu | Message UI affiché |
|---|---|---|---|
| PLAN-08 | Créer un 1er, 2ème, 3ème devis en FREE | Devis créés normalement | — |
| PLAN-09 | Tenter de créer un 4ème devis en FREE | API `POST /api/quotes` retourne `402` + `upgradeRequired: true` | ⚠️ Bannière inline dans le modal : *"⚠️ Limite de 3 devis atteinte sur le plan gratuit"* (pas de CTA upgrade direct) |
| PLAN-10 | Convertir un devis accepté en facture en FREE | Conversion autorisée — les factures ne sont pas limitées | — |

---

## 8. Pages d'Impression

### 8.1 Impression Devis `/print/quote/[id]`

| ID | Fonctionnalité | Résultat attendu | Gestion d'erreur |
|---|---|---|---|
| PRT-01 | Affichage du devis à imprimer | Toutes les lignes, totaux, infos client et dates affichés | Message 404 si devis inexistant |
| PRT-02 | Mise en page propre (sans sidebar) | Rendu imprimable sans UI de navigation | — |
| PRT-03 | Impression via navigateur | PDF généré fidèle à l'affichage | — |
| PRT-04 | Accès avec un ID invalide | Page d'erreur appropriée | Message : "Devis introuvable" |

### 8.2 Impression Facture `/print/invoice/[id]`

| ID | Fonctionnalité | Résultat attendu | Gestion d'erreur |
|---|---|---|---|
| PRT-05 | Affichage de la facture à imprimer | Toutes les lignes, totaux, mentions légales affichés | Message 404 si facture inexistante |
| PRT-06 | Mise en page propre (sans sidebar) | Rendu imprimable sans UI de navigation | — |
| PRT-07 | Impression via navigateur | PDF généré fidèle à l'affichage | — |
| PRT-08 | Accès avec un ID invalide | Page d'erreur appropriée | Message : "Facture introuvable" |

---

## 9. Chat IA

### 9.1 Page Chat `/(dashboard)/chat`

| ID | Fonctionnalité | Résultat attendu | Gestion d'erreur |
|---|---|---|---|
| CHAT-01 | Chargement de la page | Historique des messages chargé | Démarrage avec chat vide si erreur API |
| CHAT-02 | Envoyer un message | Réponse de l'assistant affichée | Message d'erreur si API IA indisponible |
| CHAT-03 | Cliquer sur une question exemple | Question pré-remplie dans le champ | — |
| CHAT-04 | Envoyer un message vide | Blocage de l'envoi | Champ vide non soumis |
| CHAT-05 | Scroll automatique vers le bas | Dernier message toujours visible | — |
| CHAT-06 | Persistance de l'historique | Historique rechargé à la prochaine visite | — |
| CHAT-07 | Requête contextualisée (pipeline, cash) | Réponse cohérente avec les données de l'utilisateur | Message si données insuffisantes |
| CHAT-08 | Indicateur de chargement | Spinner ou animation pendant la génération | — |

---

## 10. Base de Connaissances

### 10.1 Page Knowledge Base `/(dashboard)/knowledge-base`

| ID | Fonctionnalité | Résultat attendu | Gestion d'erreur |
|---|---|---|---|
| KB-01 | Chargement de la liste des documents | Documents indexés affichés avec statut | Skeleton loaders |
| KB-02 | Upload d'un fichier PDF | Document uploadé, statut "Indexation..." puis "Indexé" | Message si format non supporté |
| KB-03 | Upload d'un fichier DOCX/PPTX/TXT/MD | Document uploadé et indexé | Message si taille dépasse la limite |
| KB-04 | Renseigner un nom de document | Nom personnalisé enregistré | — |
| KB-05 | Sélectionner une catégorie | Catégorie associée au document | — |
| KB-06 | Filtrer par catégorie | Liste filtrée | Message si aucun résultat |
| KB-07 | Statut PROCESSING affiché | Badge animé "Indexation..." visible | — |
| KB-08 | Statut INDEXED affiché | Badge vert "Indexé" visible | — |
| KB-09 | Statut ERROR affiché | Badge rouge "Erreur" visible | — |
| KB-10 | Supprimer un document | Document retiré de la liste | Confirmation avant suppression |
| KB-11 | Upload sans fichier sélectionné | Blocage du formulaire | Message : "Veuillez sélectionner un fichier" |
| KB-12 | Upload d'un fichier trop lourd | Rejet avec message | Message : "Fichier trop volumineux" |

---

## 11. Contenu LinkedIn

### 11.1 Page Contenu `/(dashboard)/content`

| ID | Fonctionnalité | Résultat attendu | Gestion d'erreur |
|---|---|---|---|
| CNT-01 | Chargement de la page | Générateur et historique des posts affichés | Skeleton loaders |
| CNT-02 | Sélectionner un type de post | Type sélectionné, description affichée | — |
| CNT-03 | Saisir un sujet et générer | Post LinkedIn généré et affiché | Message d'erreur si IA indisponible |
| CNT-04 | Générer sans sujet | Blocage | Message : "Sujet requis" |
| CNT-05 | Compteur de caractères | Compteur mis à jour en temps réel (vert si 800-1300) | — |
| CNT-06 | Copier le post généré | Contenu copié dans le presse-papier, confirmation affichée | Message si copie impossible |
| CNT-07 | Sauvegarder le post en brouillon | Post ajouté à l'historique avec statut DRAFT | Message si erreur API |
| CNT-08 | Publier un post | Statut passe à PUBLISHED, date enregistrée | Message si erreur |
| CNT-09 | Filtrer l'historique (Tous / Brouillons / Publiés) | Liste filtrée correctement | Message si aucun post |
| CNT-10 | Modifier un post existant | Contenu mis à jour | Message si erreur API |
| CNT-11 | Supprimer un post | Post retiré de l'historique | Confirmation avant suppression |

---

## 12. Agents IA

### 12.1 Page Agents `/(dashboard)/agents`

| ID | Fonctionnalité | Résultat attendu | Gestion d'erreur |
|---|---|---|---|
| AGT-01 | Chargement du catalogue | Tous les agents disponibles affichés avec leurs infos | Skeleton loaders |
| AGT-02 | Filtrer par domaine | Liste filtrée (Finance, Commercial, Marketing, etc.) | — |
| AGT-03 | Voir le détail d'un agent | Capacités et questions exemples affichées | — |
| AGT-04 | Activer un agent (plan suffisant) | Agent activé, compteur de slots mis à jour | Message si slots pleins |
| AGT-05 | Activer un agent (plan insuffisant) | Blocage avec message d'upgrade | Message : "Plan PRO requis" |
| AGT-06 | Désactiver un agent | Agent désactivé, slot libéré | Confirmation avant désactivation |
| AGT-07 | Accéder à la page détail d'un agent `/(dashboard)/agents/[id]` | Page de l'agent avec ses capacités et chat dédié | Message 404 si agent inexistant |
| AGT-08 | Interagir avec un agent spécifique | Réponse contextuelle au domaine de l'agent | Message si agent non activé |
| AGT-09 | Limite de slots affichée | Nombre d'agents actifs / maximum visible | — |

### 12.2 Restrictions Plan FREE — Agents IA

| ID | Fonctionnalité | Résultat attendu | Message UI affiché |
|---|---|---|---|
| PLAN-13 | Accéder au catalogue agents en FREE | Catalogue visible, tous les agents affichés | Badge inline : *"⚡ Passez en Solo Pro pour activer des agents"* |
| PLAN-14 | Tenter d'activer un agent en FREE | API `POST /api/agents/[id]/activate` retourne `403` | Erreur inline (pas de modale) : *"Upgrade requis pour activer des agents"* |
| PLAN-15 | Atteindre la limite de 2 agents actifs PRO | API retourne `403` | Erreur inline : *"⚡ Limite atteinte — désactivez un agent ou upgradez votre plan"* |
| PLAN-16 | Compteur de slots en FREE | Affiche 0 slot disponible | Badge : *"⚡ Passez en Solo Pro pour activer des agents"* |

---

## 13. Wiki (Guide d'utilisation)

### 13.1 Page Wiki `/(dashboard)/wiki`

| ID | Fonctionnalité | Résultat attendu | Gestion d'erreur |
|---|---|---|---|
| WIKI-01 | Chargement de la page | Toutes les sections du guide affichées | — |
| WIKI-02 | Rechercher une section | Résultats filtrés en temps réel | Message si aucun résultat |
| WIKI-03 | Cliquer sur un lien de section | Navigation vers la page concernée | — |
| WIKI-04 | Afficher les étapes d'une section | Étapes déroulées avec titres et descriptions | — |
| WIKI-05 | Badge PRO sur section restreinte | Badge visible pour les fonctionnalités PRO | — |

---

---

## 🌐 Tests — Pages Publiques (sans compte utilisateur)

> Ces pages sont accessibles **sans connexion**. Aucun compte Brainlo n'est requis pour les tester.

---

## 14. Blog

> 🌐 **Page publique** — Accessible sans compte.

### 14.1 Page Blog `/blog`

| ID | Fonctionnalité | Résultat attendu | Gestion d'erreur |
|---|---|---|---|
| BLOG-01 | Chargement de la liste des articles | Articles affichés avec titre, date, extrait | Message si aucun article |
| BLOG-02 | Cliquer sur un article | Navigation vers `/blog/[slug]` | — |

### 14.2 Page Article `/blog/[slug]`

| ID | Fonctionnalité | Résultat attendu | Gestion d'erreur |
|---|---|---|---|
| BLOG-03 | Affichage d'un article valide | Contenu complet de l'article affiché | — |
| BLOG-04 | Accès à un slug inexistant | Page 404 | Message : "Article introuvable" |

---

## 15. Assessment

> 🌐 **Page publique** — Accessible sans compte. Le visiteur fournit ses coordonnées (prénom, nom, email) pour recevoir son rapport par email.

### 15.1 Page Assessment `/assessment`

#### Questionnaire

| ID | Fonctionnalité | Résultat attendu | Gestion d'erreur |
|---|---|---|---|
| ASS-01 | Chargement du questionnaire | 30 questions affichées par étapes (6 sections) | — |
| ASS-02 | Répondre à toutes les questions (choix + sliders) | Score calculé par section et score global affiché | — |
| ASS-03 | Soumettre sans répondre à toutes les questions | Blocage de la progression | Message : "Veuillez répondre à toutes les questions" |
| ASS-04 | Résultat affiché avec recommandation | Score global, détail par section, ROI estimé et recommandation personnalisée affichés | — |

#### Formulaire de collecte de coordonnées et envoi email

| ID | Fonctionnalité | Résultat attendu | Gestion d'erreur |
|---|---|---|---|
| ASS-05 | Affichage du formulaire de coordonnées après le questionnaire | Champs Prénom, Nom, Email affichés | — |
| ASS-06 | Soumettre le formulaire avec coordonnées valides | `POST /api/assessment` appelé, rapport envoyé par email, message de confirmation affiché | Message si erreur d'envoi |
| ASS-07 | Message de confirmation affiché après envoi | *"Ce rapport a été envoyé à {email}. Vérifiez votre boîte mail."* visible à l'écran | — |
| ASS-08 | Réception de l'email avec le rapport | Email reçu à l'adresse fournie avec le détail des scores et recommandations | Message si email non reçu dans les 5 min |
| ASS-09 | Soumettre le formulaire avec email invalide | Blocage | Message : "Format email invalide" |
| ASS-10 | Soumettre le formulaire avec champs vides | Blocage | Message : "Tous les champs sont requis." |
| ASS-11 | Soumettre avec prénom uniquement (nom manquant) | Blocage | Message : "Tous les champs sont requis." |

#### Données de test recommandées pour ASS-06 à ASS-08

| Champ | Valeur de test |
|---|---|
| Prénom | Jean |
| Nom | Test |
| Email | une adresse email réelle accessible pour vérification |

---

## 🔐 Tests — Compte Administrateur

> Ces tests nécessitent un **compte administrateur dédié**. Ils sont à exécuter **séparément** des tests utilisateur standard. Ne pas utiliser un compte client pour ces tests.

---

## 16. Administration

> 🔐 **Accès admin uniquement** — Requiert un compte avec droits administrateur. Inaccessible aux comptes clients standards.

### 16.1 Page Admin `/admin`

| ID | Fonctionnalité | Résultat attendu | Gestion d'erreur |
|---|---|---|---|
| ADM-01 | Accès avec un compte client standard (non admin) | Redirection ou page 403 | Message : "Accès non autorisé" |
| ADM-02 | Accès sans être connecté | Redirection vers `/login` | — |
| ADM-03 | Accès avec compte administrateur | Dashboard admin affiché | — |
| ADM-04 | Voir la liste des utilisateurs `/admin/users` | Tableau des utilisateurs affiché avec plan et date d'inscription | Skeleton loaders |
| ADM-05 | Voir le détail d'un utilisateur `/admin/users/[id]` | Informations complètes du compte affichées | Message 404 si utilisateur inexistant |
| ADM-06 | Modifier le plan d'un utilisateur (FREE → PRO) | Plan mis à jour en base, changement visible immédiatement | Message si erreur API |
| ADM-07 | Désactiver un compte utilisateur | Compte désactivé, accès bloqué pour cet utilisateur | Confirmation avant désactivation |

---

## 17. Paramètres

### 17.1 Page Settings `/(dashboard)/settings`

| ID | Fonctionnalité | Résultat attendu | Gestion d'erreur |
|---|---|---|---|
| SET-01 | Chargement du profil | Données actuelles pré-remplies dans les champs | Skeleton loaders |
| SET-02 | Modifier le nom et email | Données sauvegardées, message de confirmation | Message si champs requis vides |
| SET-03 | Modifier le nom d'entreprise et secteur | Données sauvegardées | — |
| SET-04 | Modifier l'objectif mensuel (€) | Valeur enregistrée, impacte le widget Cash | Message si valeur non numérique |
| SET-05 | Modifier les charges fixes (€) | Valeur enregistrée, impacte le Runway | Message si valeur non numérique |
| SET-06 | Renseigner l'URL LinkedIn | URL sauvegardée | Message si format URL invalide |
| SET-07 | Configurer le webhook Cal.com | Secret et URL sauvegardés | Message si champs vides |
| SET-08 |
| SET-08 | Changer le mot de passe | Nouveau mot de passe enregistré, ancienne session invalide | Message si mot de passe actuel incorrect |
| SET-09 | Enregistrer avec champs numériques invalides | Blocage | Message : "Veuillez entrer un nombre valide" |
| SET-10 | Accéder aux settings sans être connecté | Redirection vers `/login` | — |

---

## Résumé — Couverture des tests

| Module | Nombre de cas | Pages couvertes |
|---|---|---|
| 🔐 Authentification | 18 | `/login`, `/forgot-password`, `/reset-password`, `/onboarding` |
| 🏠 Dashboard | 6 | `/(dashboard)` |
| ⚡ Focus IA | 10 | `/(dashboard)/focus` |
| 💰 Trésorerie | 12 | `/(dashboard)/cash` |
| 👥 Pipeline CRM | 12 | `/(dashboard)/pipeline` |
| ✅ Tâches | 14 | `/(dashboard)/tasks` |
| 🧾 Devis & Factures | 18 | `/(dashboard)/invoices` |
| 🖨️ Impression | 8 | `/print/quote/[id]`, `/print/invoice/[id]` |
| 🤖 Chat IA | 8 | `/(dashboard)/chat` |
| 📚 Base de connaissances | 12 | `/(dashboard)/knowledge-base` |
| ✍️ Contenu LinkedIn | 11 | `/(dashboard)/content` |
| 🧠 Agents IA | 9 | `/(dashboard)/agents`, `/(dashboard)/agents/[id]` |
| 📖 Wiki | 5 | `/(dashboard)/wiki` |
| 📰 Blog | 4 | `/blog`, `/blog/[slug]` |
| 📋 Assessment | 4 | `/assessment` |
| 🔧 Administration | 6 | `/admin`, `/admin/users`, `/admin/users/[id]` |
| ⚙️ Paramètres | 10 | `/(dashboard)/settings` |
| **TOTAL** | **167** | **22 pages** |

---

> 📌 **Note :** Ce cahier des charges couvre les tests fonctionnels manuels. Pour les tests automatisés (E2E Playwright), se référer aux fichiers dans `/e2e/`.

---

## 18. Gestion des Plans FREE / PRO

### 18.1 Tableau des restrictions par plan

| Fonctionnalité | Plan FREE | Plan PRO | Code HTTP renvoyé |
|---|---|---|---|
| §3. Focus IA — génération + lecture | ❌ Bloqué | ✅ Illimité | `403` |
| §4. Trésorerie & Runway — transactions | ✅ Illimité | ✅ Illimité | — |
| §5. Pipeline CRM — nombre de prospects | ⚠️ Max 3 | ✅ Illimité | `402` |
| §5. Pipeline CRM — Relance IA | ❌ Bloqué | ✅ Illimité | `403` |
| §6. Tâches | ✅ Illimité | ✅ Illimité | — |
| §7. Devis & Factures — nombre de devis | ⚠️ Max 3 | ✅ Illimité | `402` |
| §7. Devis & Factures — factures | ✅ Illimité | ✅ Illimité | — |
| §9. Chat IA | ✅ Illimité | ✅ Illimité | — |
| §10. Base de Connaissances | ✅ Illimité | ✅ Illimité | — |
| §11. Contenu LinkedIn | ✅ Illimité | ✅ Illimité | — |
| §12. Agents IA — activation | ❌ 0 slot | ✅ 2 slots | `403` |
| §17. Paramètres | ✅ Illimité | ✅ Illimité | — |

### 18.2 Tests des restrictions Plan FREE — Messages UI exacts

> Messages **réels** affichés dans l'interface, extraits du code source.

#### Focus IA — Bloqué en FREE (HTTP 403)

| ID | Fonctionnalité | Résultat attendu | Message UI affiché |
|---|---|---|---|
| PLAN-01 | Accéder à `/focus` avec un compte FREE | Page Focus chargée mais génération bloquée | — (page s'affiche normalement) |
| PLAN-02 | Cliquer "Générer mon Focus" en FREE | API `GET /api/focus` retourne `403` + `upgradeRequired: true` | 🚀 **Modale** : titre *"Fonctionnalité Solo Pro"*, texte *"La génération de Focus IA est réservée aux abonnés Solo Pro."*, boutons *"Plus tard"* et *"Upgrader — 29€/mois"* |
| PLAN-03 | Tenter de lire un focus existant en FREE | API `GET /api/focus` bloquée `403` | Même modale d'upgrade |

#### Pipeline — Limite 3 prospects (HTTP 402)

| ID | Fonctionnalité | Résultat attendu | Message UI affiché |
|---|---|---|---|
| PLAN-04 | Ajouter un 1er, 2ème, 3ème prospect en FREE | Prospects créés normalement | — |
| PLAN-05 | Tenter d'ajouter un 4ème prospect en FREE | API `POST /api/pipeline/prospects` retourne `402` + `upgradeRequired: true` | 🚀 **Modale** : titre *"Fonctionnalité Solo Pro"*, texte *"La génération de relances IA est réservée aux abonnés Solo Pro..."* ⚠️ *Bug UI : le texte mentionne les relances IA alors que l'erreur concerne la limite de prospects — modale partagée à corriger* |
| PLAN-06 | Modifier un prospect existant en FREE | Modification autorisée (pas de limite sur update) | — |
| PLAN-07 | Supprimer un prospect FREE puis en recréer un | Création autorisée (retombe sous la limite) | — |

#### Devis — Limite 3 devis (HTTP 402)

| ID | Fonctionnalité | Résultat attendu | Message UI affiché |
|---|---|---|---|
| PLAN-08 | Créer un 1er, 2ème, 3ème devis en FREE | Devis créés normalement | — |
| PLAN-09 | Tenter de créer un 4ème devis en FREE | API `POST /api/quotes` retourne `402` + `upgradeRequired: true` | ⚠️ **Bannière inline dans le modal de création** : *"⚠️ Limite de 3 devis atteinte sur le plan gratuit"* (état `createError`, pas de CTA upgrade direct — amélioration possible) |
| PLAN-10 | Convertir un devis accepté en facture en FREE | Conversion autorisée (factures non limitées) | — |

#### Relance IA — Bloquée en FREE (HTTP 403)

| ID | Fonctionnalité | Résultat attendu | Message UI affiché |
|---|---|---|---|
| PLAN-11 | Cliquer "Générer une relance IA" sur une fiche prospect FREE | API `POST /api/pipeline/relance` retourne `403` + `upgradeRequired: true` | 🚀 **Modale** : titre *"Fonctionnalité Solo Pro"*, texte *"La génération de relances IA est réservée aux abonnés Solo Pro. Débloquez des messages personnalisés pour chaque prospect avec l'IA."*, boutons *"Plus tard"* et *"Upgrader maintenant — 29€/mois"* |
| PLAN-12 | Affichage du bouton relance IA en FREE | Bouton visible, modale déclenchée au clic | — |

#### Agents IA — 0 slot en FREE (HTTP 403)

| ID | Fonctionnalité | Résultat attendu | Message UI affiché |
|---|---|---|---|
| PLAN-13 | Accéder au catalogue agents en FREE | Catalogue visible, tous les agents affichés | Badge inline : *"⚡ Passez en Solo Pro pour activer des agents"* |
| PLAN-14 | Tenter d'activer un agent en FREE | API `POST /api/agents/[id]/activate` retourne `403` | **Erreur inline** (pas de modale) : valeur de `j.error` — *"Upgrade requis pour activer des agents"* |
| PLAN-15 | Atteindre la limite de 2 agents actifs PRO | API retourne `403` | **Erreur inline** : *"⚡ Limite atteinte — désactivez un agent ou upgradez votre plan"* |
| PLAN-16 | Compteur de slots en FREE | Affiche 0 slot disponible | Badge : *"⚡ Passez en Solo Pro pour activer des agents"* |

#### 🐛 Bug UI identifié — PLAN-05

> **Pipeline — modale prospect 402 :** La modale d'upgrade affiche *"La génération de relances IA est réservée aux abonnés Solo Pro"* au lieu d'un message relatif à la limite de prospects. La modale est partagée entre les deux cas.
> **Correction recommandée :** Différencier le contenu de la modale selon la source de l'erreur (prospects vs relances).

#### Passage en PRO — Déblocage immédiat

| ID | Fonctionnalité | Résultat attendu | Gestion d'erreur |
|---|---|---|---|
| PLAN-17 | Upgrade vers PRO effectué | Toutes les fonctionnalités bloquées deviennent accessibles immédiatement | — |
| PLAN-18 | Focus IA après upgrade | Génération fonctionnelle, plus de message d'erreur 403 | — |
| PLAN-19 | Ajout de prospects après upgrade | Plus de limite à 3, création libre | — |
| PLAN-20 | Activation d'agents après upgrade | 2 slots disponibles, activation possible | — |

---

## 19. Workflow de Paiement Stripe

### 19.1 Schéma du flux de paiement

```
Utilisateur FREE
     │
     ▼
Clic "Passer à Solo Pro" (CTA upgrade)
     │
     ▼
POST /api/stripe/checkout
     │
     ├── [Mode Test STRIPE_TEST_MODE=true] ──► Upgrade direct en base → Redirect /focus?upgrade=success&mock=true
     │
     └── [Mode Live] ──► Création session Stripe Checkout
                              │
                              ▼
                    Page Stripe Checkout (hébergée)
                              │
               ┌──────────────┴──────────────┐
               │                             │
        Paiement accepté              Paiement refusé / annulé
               │                             │
               ▼                             ▼
  /focus?upgrade=success           /focus?upgrade=cancel
  &session_id={SESSION_ID}
` | Retourne `400 Missing stripe-signature` | — |
| STR-25 | Réception webhook avec signature invalide | Retourne `400 Invalid signature` | — |
| STR-26 | Réception `customer.subscription.deleted` avec `customerId` valide | Plan utilisateur remis à FREE en base | — |
| STR-27 | Réception webhook Stripe non configuré (clé absente) | Webhook ignoré gracieusement, retourne `{ received: true }` | Log d'avertissement côté serveur |
| STR-28 | Réception d'un type d'événement non géré | Ignoré silencieusement, retourne `{ received: true }` | — |

#### Portail client Stripe (gestion abonnement)

| ID | Fonctionnalité | Résultat attendu | Gestion d'erreur |
|---|---|---|---|
| STR-29 | Clic "Gérer mon abonnement" (compte PRO avec `stripeCustomerId`) | `POST /api/stripe/portal` appelé, redirection vers le portail Stripe | Message d'erreur si portail indisponible |
| STR-30 | Compte PRO sans `stripeCustomerId` en base | Fallback : redirection vers le checkout Stripe | — |
| STR-31 | Stripe non configuré (clé absente) | Fallback : redirection vers `/focus` | Log d'avertissement côté serveur |
| STR-32 | Annulation de l'abonnement via le portail Stripe | Webhook `customer.subscription.deleted` reçu → plan remis à FREE | Accès aux fonctionnalités PRO révoqué |
| STR-33 | Retour du portail Stripe (bouton retour) | Redirection vers `/dashboard` | — |

### 19.3 Cartes de test Stripe (référence)

| Carte | Numéro | Comportement |
|---|---|---|
| ✅ Paiement accepté | `4242 4242 4242 4242` | Succès immédiat |
| ❌ Carte refusée | `4000 0000 0000 0002` | Refus générique |
| ❌ Fonds insuffisants | `4000 0000 0000 9995` | Decline insufficient_funds |
| 🔐 3D Secure requis | `4000 0027 6000 3184` | Popup 3DS (succès si confirmé) |
| ❌ 3D Secure échoue | `4000 0084 0000 1629` | Échec après 3DS |

> 💡 Date d'expiration : toute date future. CVC : n'importe quels 3 chiffres.

### 19.4 Variables d'environnement requises pour les tests Stripe

| Variable | Valeur attendue | Rôle |
|---|---|---|
| `STRIPE_SECRET_KEY` | `sk_test_...` | Clé secrète Stripe test |
| `STRIPE_PRICE_ID_SOLO_PRO` | `price_...` | ID du prix Solo Pro |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | Secret pour vérification webhook |
| `STRIPE_TEST_MODE` | `false` | `true` = bypass Stripe (upgrade direct sans paiement) |
| `NEXT_PUBLIC_APP_URL` | `https://...` | URL de base pour les redirections |

---

## Résumé global — Couverture mise à jour

| Module | Cas de tests | Pages / Périmètre |
|---|---|---|
| 🔐 Authentification | 18 | Login, Forgot password, Reset, Onboarding |
| 🏠 Dashboard | 6 | Dashboard principal |
| ⚡ Focus IA | 10 | Daily Focus, streak, calendrier, historique |
| 💰 Trésorerie | 12 | Transactions, runway 3 scénarios, OCR |
| 👥 Pipeline CRM | 12 | Kanban, enrichissement, lead scoring, relances |
| ✅ Tâches | 14 | CRUD, récurrence, scoring IA, liaison prospect |
| 🧾 Devis & Factures | 18 | Création, statuts, conversion, impression |
| 🖨️ Impression | 8 | Print devis, print facture |
| 🤖 Chat IA | 8 | Historique, envoi, contexte, persistance |
| 📚 Base de connaissances | 12 | Upload, indexation, filtres, suppression |
| ✍️ Contenu LinkedIn | 11 | Générateur, types, statuts, historique |
| 🧠 Agents IA | 9 | Catalogue, activation, slots, plan |
| 📖 Wiki | 5 | Sections, recherche, navigation |
| 📰 Blog | 4 | Liste, article, 404 |
| 📋 Assessment | 4 | Questions, résultats, validation |
| 🔧 Administration | 6 | Users, plans, désactivation |
| ⚙️ Paramètres | 10 | Profil, objectifs, Cal.com, mot de passe |
| 🆓 Plans FREE / PRO | 20 | Restrictions par fonctionnalité, messages d'upgrade |
| 💳 Paiement Stripe | 33 | Checkout, paiement accepté/refusé, webhook, portail |
| **TOTAL** | **220 cas** | **22 pages + flux Stripe complet** |

---

> 📌 **Note :** Ce cahier des charges couvre les tests fonctionnels manuels et les cas limites métier.  
> Pour les tests automatisés E2E (Playwright), voir les fichiers dans `/e2e/`.  
> Pour les tests Stripe en mode live, utiliser le dashboard Stripe CLI : `stripe listen --forward-to localhost:3000/api/stripe/webhook`

---

## 20. Profils Utilisateurs de Test — Business Brain

> Ces profils sont conçus pour valider la **personnalisation du Business Brain** selon les contextes métier : secteur, offres, objectifs et documents importés.

### 20.1 Définition des profils

| Profil | Nom | Secteur | Plan | Objectif mensuel | Cas couverts |
|---|---|---|---|---|---|
| 👨‍💻 P1 | Alex Dupont | SaaS / Tech | PRO | 8 000 € | Focus IA, agents, relances |
| 🧑‍🏫 P2 | Sophie Martin | Conseil / Coaching | FREE → PRO | 5 000 € | Upgrade Stripe, limite prospects |
| 🎨 P3 | Karim Belhadj | Freelance / Design | FREE | 3 500 € | Restrictions FREE, devis |
| 🏥 P4 | Marie Lefebvre | Santé / Bien-être | PRO | 6 000 € | Knowledge base, OCR, content |
| 🏢 P5 | Thomas Bernard | Formation / Education | PRO | 12 000 € | Pipeline complet, factures |

---

### 20.2 Profil P1 — Alex Dupont (SaaS / Tech, PRO)

**Configuration onboarding :**

| Champ | Valeur |
|---|---|
| Nom | Alex Dupont |
| Entreprise | DevFlow SaaS |
| Secteur | SaaS / Tech |
| Objectif CA mensuel | 8 000 € |
| Charges fixes | 1 200 € |
| LinkedIn | linkedin.com/in/alexdupont |
| Plan | PRO |

**Offres à configurer dans le Business Brain :**
- Abonnement SaaS mensuel : 49 €/mois
- Licence annuelle : 490 €/an
- Intégration custom : 1 500 € (one-shot)

**Documents à importer (Knowledge Base) :**

| Document | Format | Catégorie | Contenu attendu |
|---|---|---|---|
| Grille tarifaire SaaS 2026 | PDF | Offres & Tarifs | Plans Starter/Pro/Enterprise avec prix |
| Présentation produit DevFlow | PPTX | Produits & Services | Features, roadmap, screenshots |
| Contrat SaaS type | DOCX | Admin & Légal | CGV, conditions d'utilisation |

**Prospects à créer dans le pipeline :**
- 5 prospects en IDENTIFIED (startups tech)
- 2 en INTERESTED avec valeur > 1 500 €
- 1 en PROPOSAL avec devis envoyé

**Tests spécifiques P1 :**

| ID | Test | Résultat attendu |
|---|---|---|
| P1-01 | Génération Focus IA avec 5 prospects et 1 devis en attente | Action 1 : relancer le prospect PROPOSAL ; priorité CLIENTS |
| P1-02 | Chat IA : "Quels sont mes prospects les plus chauds ?" | Liste des prospects contactés récemment avec badge 🔥 |
| P1-03 | Chat IA : "Génère une relance pour mon devis en attente" | Message de relance personnalisé avec montant du devis |
| P1-04 | Content IA : générer un post LinkedIn de type "Case Study" sur un client SaaS | Post généré avec mentions du secteur Tech, 800-1300 caractères |
| P1-05 | Activation de 2 agents (Commercial + Finance) | 2 agents actifs, slot maximal PRO atteint |
| P1-06 | Chat avec agent Finance : "Quel est mon runway ?" | Calcul basé sur solde + charges fixes 1 200 €/mois |
| P1-07 | Vérifier que le BRAIN.md contient "SaaS / Tech" et l'objectif 8 000 € | Données du profil correctement injectées dans le brain |

---

### 20.3 Profil P2 — Sophie Martin (Conseil / Coaching, FREE → PRO)

**Configuration onboarding :**

| Champ | Valeur |
|---|---|
| Nom | Sophie Martin |
| Entreprise | Sophie Martin Coaching |
| Secteur | Conseil / Coaching |
| Objectif CA mensuel | 5 000 € |
| Charges fixes | 400 € |
| LinkedIn | linkedin.com/in/sophiemartin-coach |
| Plan | FREE (puis upgrade en cours de test) |

**Offres à configurer dans le Business Brain :**
- Séance de coaching individuel : 150 €/h
- Programme accompagnement 3 mois : 1 800 €
- Atelier groupe (8 personnes) : 600 €

**Documents à importer (Knowledge Base) :**

| Document | Format | Catégorie | Contenu attendu |
|---|---|---|---|
| Brochure offres coaching 2026 | PDF | Offres & Tarifs | Programmes, durées, tarifs, témoignages |
| Guide méthodologie coaching | DOCX | Produits & Services | Étapes, outils utilisés, résultats clients |

**Tests spécifiques P2 (FREE → PRO) :**

| ID | Test | Résultat attendu |
|---|---|---|
| P2-01 | Ajouter 3 prospects en FREE | 3 prospects créés sans erreur |
| P2-02 | Tenter d'ajouter un 4ème prospect | Blocage HTTP 402 + modale upgrade affichée |
| P2-03 | Tenter d'accéder au Focus IA en FREE | Blocage HTTP 403 + message "Fonctionnalité Solo Pro" |
| P2-04 | Clic CTA upgrade → paiement Stripe accepté (4242...) | Plan passe à PRO, redirect /focus?upgrade=success |
| P2-05 | Après upgrade : ajouter un 4ème prospect | Création réussie, plus de blocage |
| P2-06 | Après upgrade : générer le Focus IA | 3 actions générées, contexte Conseil/Coaching |
| P2-07 | Chat IA : "Propose-moi un plan de relance pour mes prospects" | Plan adapté au secteur coaching avec messages personnalisés |
| P2-08 | Content IA : générer un post LinkedIn "Insight" sur le coaching | Post en français, ton expert, secteur Conseil |
| P2-09 | Import document "Brochure offres" → Chat IA : "Quelles sont mes offres ?" | IA cite les offres de la brochure importée |

---

### 20.4 Profil P3 — Karim Belhadj (Freelance / Design, FREE)

**Configuration onboarding :**

| Champ | Valeur |
|---|---|
| Nom | Karim Belhadj |
| Entreprise | Karim Belhadj Studio |
| Secteur | Freelance / Indépendant |
| Objectif CA mensuel | 3 500 € |
| Charges fixes | 200 € |
| LinkedIn | — |
| Plan | FREE |

**Offres à configurer dans le Business Brain :**
- Identité visuelle complète : 1 200 €
- Refonte site web : 2 500 €
- Motion design (vidéo 30s) : 800 €

**Tests spécifiques P3 (plan FREE - restrictions) :**

| ID | Test | Résultat attendu |
|---|---|---|
| P3-01 | Créer 3 devis (identité visuelle, refonte, motion) en FREE | 3 devis créés normalement |
| P3-02 | Tenter de créer un 4ème devis | Blocage HTTP 402 + message "Limite de 3 devis atteinte" |
| P3-03 | Convertir un devis accepté en facture | Facture créée, pas de limite sur les factures |
| P3-04 | Tenter d'activer un agent IA en FREE | Blocage + message "Upgrade requis pour activer des agents" |
| P3-05 | Tenter de générer une relance IA | Blocage HTTP 403 + message upgrade |
| P3-06 | Ajouter 2 transactions (revenu + dépense) | Trésorerie mise à jour, runway calculé |
| P3-07 | Consulter le widget Runway en FREE | Runway affiché avec les 3 scénarios (fonctionnel en FREE) |
| P3-08 | Créer 5 tâches en FREE | Création libre (pas de limite sur les tâches en FREE) |
| P3-09 | Utiliser le Chat IA en FREE | Chat fonctionnel (pas de limite sur le chat en FREE) |

---

### 20.5 Profil P4 — Marie Lefebvre (Santé / Bien-être, PRO)

**Configuration onboarding :**

| Champ | Valeur |
|---|---|
| Nom | Marie Lefebvre |
| Entreprise | Équilibre & Santé |
| Secteur | Santé / Bien-être |
| Objectif CA mensuel | 6 000 € |
| Charges fixes | 800 € |
| LinkedIn | linkedin.com/in/marie-lefebvre-sante |
| Plan | PRO |

**Offres à configurer dans le Business Brain :**
- Consultation naturopathie (1h) : 90 €
- Bilan santé complet : 250 €
- Programme bien-être 6 semaines : 650 €

**Documents à importer (Knowledge Base) — focus OCR/formats variés :**

| Document | Format | Catégorie | Test spécifique |
|---|---|---|---|
| Fiche tarifs consultations 2026 | PDF | Offres & Tarifs | Import standard, indexation correcte |
| Protocoles soins naturopathie | DOCX | Produits & Services | Import DOCX, recherche sémantique |
| Témoignages clients anonymisés | TXT | Commercial | Import TXT, réponses IA sur résultats |
| Reçu fournisseur scanné | Image/PDF | Admin & Légal | Test OCR trésorerie : extraction montant + date |

**Tests spécifiques P4 (Knowledge Base & OCR) :**

| ID | Test | Résultat attendu |
|---|---|---|
| P4-01 | Upload PDF tarifs → statut PROCESSING puis INDEXED | Indexation en moins de 30s, badge vert |
| P4-02 | Upload DOCX protocoles → statut INDEXED | Document consultable par le Chat IA |
| P4-03 | Chat IA : "Quels sont mes tarifs de consultation ?" | IA cite les tarifs du PDF importé |
| P4-04 | Chat IA : "Que disent mes clients de mes résultats ?" | IA s'appuie sur les témoignages TXT |
| P4-05 | OCR trésorerie : scanner reçu fournisseur | Montant, catégorie et date extraits automatiquement |
| P4-06 | Content IA : post LinkedIn "Story" sur un résultat patient | Post adapté au secteur Santé, RGPD-compatible (anonymisé) |
| P4-07 | Supprimer un document de la KB | Document retiré, IA ne peut plus y faire référence |
| P4-08 | Upload fichier non supporté (ex: .xls) | Message d'erreur : format non supporté |

---

### 20.6 Profil P5 — Thomas Bernard (Formation / Education, PRO)

**Configuration onboarding :**

| Champ | Valeur |
|---|---|
| Nom | Thomas Bernard |
| Entreprise | FormaPro Consulting |
| Secteur | Formation / Education |
| Objectif CA mensuel | 12 000 € |
| Charges fixes | 2 000 € |
| LinkedIn | linkedin.com/in/thomas-bernard-formation |
| Plan | PRO |

**Offres à configurer dans le Business Brain :**
- Formation présentielle (2 jours) : 2 400 € / groupe
- E-learning parcours complet : 990 €/participant
- Accompagnement OPCO / CPF : sur devis

**Documents à importer (Knowledge Base) :**

| Document | Format | Catégorie | Contenu attendu |
|---|---|---|---|
| Catalogue formations 2026 | PDF | Offres & Tarifs | Titres, durées, objectifs, prix, financement OPCO |
| Dossier de financement CPF | DOCX | Admin & Légal | Procédures, codes CPF, certifications Qualiopi |
| Références clients entreprises | PDF | Références | Noms entreprises, secteurs, résultats formations |

**Tests spécifiques P5 (pipeline complet + facturation) :**

| ID | Test | Résultat attendu |
|---|---|---|
| P5-01 | Créer un pipeline complet : 3 prospects IDENTIFIED → 1 WON | Kanban mis à jour à chaque étape |
| P5-02 | Enrichissement IA sur prospect entreprise (SIRET) | Fiche enrichie avec adresse, NAF, effectif |
|
| P5-03 | Créer un devis formation (2 jours groupe, 2 400 €) et l'envoyer | Devis SENT, PDF imprimable correct |
| P5-04 | Convertir devis ACCEPTED en facture, passer en PAID | Facture PAID, transaction cash créée automatiquement |
| P5-05 | Chat IA : "Mon CA ce mois-ci par rapport à mon objectif ?" | Ratio CA/objectif 12 000 € calculé et affiché |
| P5-06 | Chat IA après import KB : "Quelles formations sont finançables OPCO ?" | IA répond en citant le dossier CPF importé |
| P5-07 | Générer relance IA pour un prospect PROPOSAL inactif depuis 5 jours | Message de relance personnalisé, badge ⚡ Tiède détecté |
| P5-08 | Activer 2 agents : Commercial + Stratégie | 2 agents actifs, 3ème activation bloquée (limite PRO atteinte) |
| P5-09 | Focus IA avec objectif 12 000 € et CA actuel < 50% | Action Cash en priorité 1, action Clients en priorité 2 |

---

### 20.7 Tests transversaux multi-profils

#### Isolation des données entre profils

| ID | Test | Résultat attendu |
|---|---|---|
| TP-01 | Connexion avec P1 (Alex) après avoir travaillé avec P2 (Sophie) | Les données de P2 ne sont pas visibles dans le compte P1 |
| TP-02 | Le BRAIN.md de P1 contient "SaaS / Tech" et non "Conseil / Coaching" | Isolation complète du wiki par userId |
| TP-03 | Les prospects de P3 (Karim) n'apparaissent pas dans le pipeline de P4 (Marie) | Isolation correcte par userId en base |
| TP-04 | Les documents KB de P4 ne sont pas accessibles au Chat IA de P5 | Knowledge Base isolée par utilisateur |

#### Personnalisation du Business Brain par secteur

| ID | Test | Profil | Résultat attendu |
|---|---|---|---|
| TP-05 | Focus IA généré | P1 (SaaS) | Actions orientées conversion SaaS, upsell, rétention |
| TP-06 | Focus IA généré | P2 (Coaching) | Actions orientées acquisition coaching, programme, visibilité LinkedIn |
| TP-07 | Focus IA généré | P4 (Santé) | Actions orientées rendez-vous, témoignages, référencement local |
| TP-08 | Focus IA généré | P5 (Formation) | Actions orientées OPCO, CPF, partnerships entreprises |
| TP-09 | Content IA : post LinkedIn | P1 (SaaS) | Ton tech, vocabulaire produit SaaS, métriques (MRR, churn) |
| TP-10 | Content IA : post LinkedIn | P4 (Santé) | Ton bienveillant, vocabulaire bien-être, RGPD respecté |

#### Cohérence du Business Brain après import de documents

| ID | Test | Résultat attendu |
|---|---|---|
| TP-11 | P2 importe sa brochure coaching → Chat IA : "Quelles sont mes offres ?" | IA cite les 3 offres de la brochure (séance 150€, programme 1800€, atelier 600€) |
| TP-12 | P5 importe catalogue formations → Chat IA : "Donne-moi le prix de ma formation 2 jours" | IA répond 2 400 € en citant le catalogue importé |
| TP-13 | P4 importe témoignages → Chat IA : "Que pensent mes clients ?" | IA résume les témoignages avec des citations anonymisées |
| TP-14 | P1 pose une question hors secteur (ex: "Parle-moi de la naturopathie") | IA répond sur son domaine SaaS, pas sur un autre secteur |

#### Scénarios de stress et cas limites

| ID | Test | Résultat attendu |
|---|---|---|
| TP-15 | P3 (FREE) tente d'importer un document KB | Import autorisé (pas de limite KB en FREE) |
| TP-16 | P3 (FREE) demande au Chat IA une analyse basée sur ses documents KB | Chat IA fonctionnel en FREE avec KB |
| TP-17 | P2 upgrade de FREE à PRO en cours de session | Fonctionnalités débloquées sans nécessité de re-login |
| TP-18 | P1 (PRO) désactive un agent puis en active un autre | Slot libéré, nouvelle activation possible |
| TP-19 | P5 crée un prospect avec SIRET invalide et tente l'enrichissement | Message : SIRET non trouvé, fiche non enrichie |
| TP-20 | Tous les profils : accès à la page Wiki | Même contenu affiché pour tous les plans |

---

### 20.8 Données de test — Credentials des profils

> ⚠️ Ces identifiants sont réservés aux environnements de test/staging uniquement.

| Profil | Email | Mot de passe suggéré | Plan | Notes |
|---|---|---|---|---|
| P1 — Alex Dupont | test.alex@devflow.io | Test@1234! | PRO | Pré-charger 5 prospects + 3 transactions |
| P2 — Sophie Martin | test.sophie@coaching.fr | Test@1234! | FREE→PRO | Tester le flow upgrade Stripe |
| P3 — Karim Belhadj | test.karim@studio.fr | Test@1234! | FREE | Valider toutes les restrictions FREE |
| P4 — Marie Lefebvre | test.marie@equilibre.fr | Test@1234! | PRO | Pré-charger 3 documents KB variés |
| P5 — Thomas Bernard | test.thomas@formapro.fr | Test@1234! | PRO | Pré-charger pipeline complet + factures |

---

## Résumé global — Couverture finale

| Module | Cas de tests | Périmètre |
|---|---|---|
| 🔐 Authentification | 18 | Login, Forgot password, Reset, Onboarding |
| 🏠 Dashboard | 6 | Dashboard principal |
| ⚡ Focus IA | 10 | Daily Focus, streak, calendrier, historique |
| 💰 Trésorerie | 12 | Transactions, runway 3 scénarios, OCR |
| 👥 Pipeline CRM | 12 | Kanban, enrichissement, lead scoring, relances |
| ✅ Tâches | 14 | CRUD, récurrence, scoring IA, liaison prospect |
| 🧾 Devis & Factures | 18 | Création, statuts, conversion, impression |
| 🖨️ Impression | 8 | Print devis, print facture |
| 🤖 Chat IA | 8 | Historique, envoi, contexte, persistance |
| 📚 Base de connaissances | 12 | Upload, indexation, filtres, suppression |
| ✍️ Contenu LinkedIn | 11 | Générateur, types, statuts, historique |
| 🧠 Agents IA | 9 | Catalogue, activation, slots, plan |
| 📖 Wiki | 5 | Sections, recherche, navigation |
| 📰 Blog | 4 | Liste, article, 404 |
| 📋 Assessment | 4 | Questions, résultats, validation |
| 🔧 Administration | 6 | Users, plans, désactivation |
| ⚙️ Paramètres | 10 | Profil, objectifs, Cal.com, mot de passe |
| 🆓 Plans FREE / PRO | 20 | Restrictions par fonctionnalité, messages upgrade |
| 💳 Paiement Stripe | 33 | Checkout, paiement accepté/refusé, webhook, portail |
| 👤 Profils Test — Business Brain | 67 | 5 personas, 12 secteurs, KB, IA contextuelle, isolation données |
| **TOTAL** | **287 cas** | **22 pages + flux Stripe + 5 profils métier** |

---

> 📌 **Note :** Environnements requis : Staging avec Stripe Test Mode activé.  
> CLI Stripe pour les webhooks : `stripe listen --forward-to localhost:3000/api/stripe/webhook`  
> Tests E2E automatisés : voir `/e2e/` (Playwright).
