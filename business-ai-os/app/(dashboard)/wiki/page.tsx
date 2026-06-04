'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'

interface WikiSection {
  id: string
  icon: string
  title: string
  href?: string
  isPro?: boolean
  summary: string
  keyPoints: string[]
  steps: { title: string; description: string }[]
}

const WIKI_SECTIONS: WikiSection[] = [
  {
    id: 'onboarding',
    icon: '🚀',
    title: 'Inscription & Onboarding',
    summary: 'Passez de zéro à un OS business opérationnel en moins de 2 minutes.',
    keyPoints: [
      'Aucune carte bancaire requise pour commencer',
      'Formulaire unique en 3 étapes — les données alimentent tous vos agents IA',
      'La checklist dashboard guide la découverte progressive des modules',
      'Enrichissement du profil à votre rythme depuis les Settings',
    ],
    steps: [
      { title: 'Créer votre compte', description: 'Renseignez nom, email, mot de passe et nom d’entreprise. Ces informations sécurisent votre espace et personnalisent vos agents IA.' },
      { title: 'Configurer votre profil', description: 'Sélectionnez votre secteur d’activité et votre objectif de CA mensuel. L’IA s’adapte à votre réalité.' },
      { title: 'Activer Brainlo', description: 'Cliquez sur « Activer Brainlo » — votre Business Brain est initialisé en quelques secondes.' },
      { title: 'Suivre la checklist', description: 'La checklist « Premiers pas » vous guide module par module à votre rythme (9 étapes).' },
    ],
  },
  {
    id: 'focus',
    icon: '⚡',
    title: 'Daily Focus IA',
    href: '/focus',
    summary: 'Chaque matin, l’IA analyse votre situation et vous génère les 3 actions prioritaires du jour.',
    keyPoints: [
      'Basé sur vos vraies données (transactions, prospects, tâches)',
      'Règle de priorisation : Cash → Clients → Visibilité',
      'Score de focus journalier + streak de jours consécutifs',
      'Possibilité de regénérer si votre situation évolue dans la journée',
    ],
    steps: [
      { title: 'Accéder au Focus', description: 'Cliquez sur « Focus » dans la sidebar. Les 3 actions du jour sont générées automatiquement.' },
      { title: 'Agir et cocher', description: 'Cochez chaque action accomplie. Votre score de focus monte en temps réel.' },
      { title: 'Consulter l’historique', description: 'Cliquez sur « Historique » pour voir vos tendances et analyser vos meilleurs jours.' },
      { title: 'Régénérer', description: 'Si votre situation change, cliquez « Régénérer le focus » — l’IA recalcule immédiatement.' },
    ],
  },
  {
    id: 'cash',
    icon: '💰',
    title: 'Trésorerie & Runway',
    href: '/cash',
    summary: 'Suivez votre cash en temps réel et anticipez vos besoins avec le calculateur de runway à 3 scénarios.',
    keyPoints: [
      'Saisie en langage naturel — décrivez votre transaction, l’IA comprend',
      'OCR reçus — photographiez vos justificatifs, l’IA les saisit',
      'Runway en 3 scénarios : pessimiste, réaliste, optimiste',
      'Chaque transaction saisie ici alimente automatiquement le Daily Focus',
    ],
    steps: [
      { title: 'Ajouter une transaction', description: 'Cliquez « + Ajouter une transaction » et remplissez type, montant, catégorie et date.' },
      { title: 'Saisie en langage naturel', description: 'Tapez « J’ai payé mon abonnement Figma 15€ ce matin » — l’IA pré-remplit tout.' },
      { title: 'Scanner un reçu (OCR)', description: 'Cliquez « Scanner un reçu » et uploadez une photo — montant, catégorie et date sont extraits automatiquement.' },
      { title: 'Consulter le Runway', description: 'Scrollez jusqu’au widget Runway pour voir vos 3 scénarios et la date limite de chaque hypothèse.' },
    ],
  },

  {
    id: 'pipeline',
    icon: '👥',
    title: 'Pipeline CRM & Enrichissement',
    href: '/pipeline',
    summary: 'Gérez vos prospects en Kanban et enrichissez automatiquement chaque fiche via l’API officielle française.',
    keyPoints: [
      'Enrichissement automatique SIRET — tapez le nom d’entreprise, tout se remplit',
      '7 colonnes Kanban : Identifié → Contacté → Intéressé → Proposition → Négociation → Gagné → Perdu',
      'Devis pré-rempli depuis la fiche prospect en un clic',
      'Le wiki prospect se met à jour à chaque mouvement de pipeline',
    ],
    steps: [
      { title: 'Ajouter un prospect', description: 'Cliquez « + Nouveau prospect » et tapez le nom de l’entreprise — l’autocomplétion enrichit SIRET, adresse et taille automatiquement.' },
      { title: 'Gérer le Kanban', description: 'Glissez-déposez les cartes entre colonnes pour refléter l’avancement de chaque deal.' },
      { title: 'Ouvrir le profil', description: 'Cliquez sur une carte pour voir l’historique complet : contacts, notes, relances, valeur du deal.' },
      { title: 'Créer un devis', description: 'Depuis la fiche prospect, cliquez « Créer un devis » — les informations client sont déjà renseignées.' },
    ],
  },
  {
    id: 'relances',
    icon: '✉️',
    title: 'Relances IA',
    href: '/pipeline',
    summary: 'Générez des messages de relance personnalisés en 3 secondes, basés sur l’historique réel de chaque prospect.',
    keyPoints: [
      'Message contextualisé — l’IA lit la fiche prospect, pas un template générique',
      'Ton adapté à l’étape du pipeline (Intéressé ≠ Négociation)',
      'Relance tracée : la date de dernier contact se met à jour automatiquement',
      'Vous gardez le contrôle : copiez, ajustez, envoyez',
    ],
    steps: [
      { title: 'Identifier le prospect', description: 'Dans le Pipeline, repérez une carte avec le badge « X jours sans réponse ».' },
      { title: 'Générer la relance', description: 'Cliquez « Générer une relance » — l’IA produit un message en 3 secondes avec le contexte exact de votre échange.' },
      { title: 'Copier et adapter', description: 'Copiez le message, ajustez un mot ou deux selon votre feeling, puis envoyez depuis votre messagerie.' },
      { title: 'Enregistrer', description: 'Cliquez « Enregistrer la relance » — la date est tracée et le wiki prospect mis à jour.' },
    ],
  },
  {
    id: 'invoices',
    icon: '📄',
    title: 'Devis & Factures',
    href: '/invoices',
    summary: 'De la description en langage naturel au devis professionnel en 30 secondes, puis conversion en facture en un clic.',
    keyPoints: [
      'Brief langage naturel → devis structuré avec lignes, quantités et TVA',
      'Numérotation automatique DEVIS-YYYY-XXX / FAC-YYYY-XXX',
      'Paiement facture → transaction Cash automatique',
      'Facture X (EN 16931) — conformité facturation électronique européenne intégrée',
    ],
    steps: [
      { title: 'Créer un devis', description: 'Cliquez « + Nouveau devis » et tapez votre mission (ex : « 3 jours consulting UX, 850€/jour HT, TVA 20% »).' },
      { title: 'Vérifier et envoyer', description: 'Contrôlez les lignes générées, cliquez « Aperçu PDF » puis « Marquer comme envoyé ».' },
      { title: 'Convertir en facture', description: 'Cliquez « Convertir en facture » — tout est repris automatiquement avec numérotation FAC-.' },
      { title: 'Marquer comme payée', description: 'Cliquez « Marquer comme payée » — le montant apparaît automatiquement dans votre trésorerie.' },
      { title: 'Télécharger Facture X', description: 'Cliquez « Factur-X » pour télécharger le PDF hybride conforme EN 16931 (B2B France 2026). Prérequis : SIRET, adresse et TVA dans votre profil.' },
    ],
  },
  {
    id: 'tasks',
    icon: '📋',
    title: 'Gestion des Tâches IA',
    href: '/tasks',
    summary: 'Créez des tâches depuis un brief naturel, laissez l’IA les prioriser avec un score 0–100 et une justification.',
    keyPoints: [
      'Brief langage naturel → tâche avec catégorie, priorité, durée et deadline',
      'Score IA 0–100 avec justification (ex : « Bloque 3 deals en cours »)',
      'Tâches récurrentes automatiques (fin de mois, hebdomadaire…)',
      'Liaison tâche ↔ prospect pour contexte complet dans le Daily Focus',
    ],
    steps: [
      { title: 'Ajouter une tâche', description: 'Cliquez « + Ajouter une tâche », tapez votre brief et cliquez « Analyser ».' },
      { title: 'Prioriser avec l’IA', description: 'Cliquez « Prioriser avec l’IA » — les tâches se réordonnent avec scores et justifications.' },
      { title: 'Créer une récurrence', description: 'Activez le toggle « Récurrente » et choisissez la fréquence — la tâche se recréera automatiquement.' },
      { title: 'Lier un prospect', description: 'Ouvrez une tâche et cliquez « Lier un prospect » pour associer la tâche à un deal en cours.' },
    ],
  },

  {
    id: 'content',
    icon: '📣',
    title: 'Générateur LinkedIn',
    href: '/content',
    isPro: true,
    summary: 'Générez des posts LinkedIn contextualisés avec votre voix et votre expertise en 30 secondes.',
    keyPoints: [
      '4 formats : Insight expert, Victoire, Apprentissage, Conseil pratique',
      'Post contextuel basé sur votre profil, secteur et wiki — pas un template générique',
      'Calendrier éditorial visuel avec statuts Brouillon / Programmé / Publié',
      'L’IA apprend quels sujets performent le mieux pour vous',
    ],
    steps: [
      { title: 'Générer un post', description: 'Cliquez « Générer un post », choisissez le format (Insight, Victoire…), entrez votre thème et cliquez « Générer ».' },
      { title: 'Modifier et sauvegarder', description: 'Ajustez le texte généré selon votre feeling, puis cliquez « Sauvegarder en brouillon ».' },
      { title: 'Programmer', description: 'Cliquez « Programmer », choisissez le créneau (mardi et jeudi matin sont recommandés) — le post passe en statut PROGRAMMÉ.' },
      { title: 'Suivre les performances', description: 'Sur les posts PUBLIÉS, saisissez vos stats (impressions, réactions) — l’IA apprend votre ligne éditoriale.' },
    ],
  },
  {
    id: 'chat',
    icon: '🧠',
    title: 'Chat Business Brain',
    href: '/chat',
    isPro: true,
    summary: 'Un conseiller business IA disponible 24h/24 qui connaît parfaitement votre entreprise, vos clients et votre trésorerie.',
    keyPoints: [
      'Contextuel : lit votre wiki, vos transactions, votre pipeline en temps réel',
      'Pas un chatbot générique — répond avec vos vraies données',
      'Actions rapides pour les analyses récurrentes (santé financière, priorités…)',
      'Mémoire conversationnelle : se souvient du contexte en cours de session',
    ],
    steps: [
      { title: 'Poser une question', description: 'Cliquez sur « Chat » dans la sidebar et tapez votre question (ex : « Quel est mon CA ce mois-ci par rapport à l’objectif ? »).' },
      { title: 'Utiliser les actions rapides', description: 'Cliquez sur « Analyse du mois », « Mes priorités » ou « Santé financière » pour une synthèse instantanée.' },
      { title: 'Demander un conseil', description: 'Posez une question stratégique (ex : « J’hésite entre prospecter ou finir ma mission. Qu’est-ce que tu recommandes ? ») — l’IA analyse votre situation complète.' },
      { title: 'Explorer vos prospects', description: 'Demandez « Qui sont mes prospects les plus chauds en ce moment ? » — l’IA lit votre pipeline et vous répond avec les données réelles.' },
    ],
  },
  {
    id: 'knowledge-base',
    icon: '📚',
    title: 'Base de Connaissances',
    href: '/knowledge-base',
    isPro: true,
    summary: 'Uploadez vos documents (PDF, Word, PPTX) et interrogez-les en langage naturel via le Chat Business Brain.',
    keyPoints: [
      'Upload PDF, DOCX, PPTX, TXT, Markdown — indexé en quelques secondes',
      'Interrogeable en langage naturel via le Chat',
      'Catégories : Commercial, Juridique, Technique, Général, RH',
      'L’IA peut croiser plusieurs documents pour répondre',
    ],
    steps: [
      { title: 'Uploader un document', description: 'Cliquez « + Ajouter un document », glissez-déposez votre fichier, sélectionnez la catégorie et cliquez « Uploader ».' },
      { title: 'Attendre l’indexation', description: 'Le statut passe de « Indexation en cours… » à « Indexé (X pages) » en quelques secondes.' },
      { title: 'Interroger via le Chat', description: 'Dans le Chat Business Brain, posez une question sur le contenu (ex : « Quelles sont les conditions de paiement dans ma proposition commerciale type ? »).' },
      { title: 'Organiser par catégorie', description: 'Utilisez les catégories pour affiner les recherches — l’IA filtre par catégorie si besoin.' },
    ],
  },
  {
    id: 'calendar',
    icon: '📅',
    title: 'Calendrier Cal.com',
    href: '/settings',
    summary: 'Intégrez Cal.com pour synchroniser vos rendez-vous automatiquement et les relier à vos prospects.',
    keyPoints: [
      'Zéro action manuelle : webhook Cal.com → événement créé automatiquement',
      'Matching automatique email ↔ prospect',
      'RDV du jour intégré dans le Daily Focus',
      'Annulations et reprogrammations synchronisées en temps réel',
    ],
    steps: [
      { title: 'Configurer le webhook', description: 'Allez dans « Paramètres → Intégrations → Cal.com », copiez l’URL du webhook et collez-la dans les paramètres de Cal.com.' },
      { title: 'Recevoir les RDV', description: 'Dès qu’un client prend RDV sur Cal.com, l’événement apparaît automatiquement dans votre calendrier Brainlo.' },
      { title: 'Voir le prospect lié', description: 'Si l’email du client correspond à un prospect de votre pipeline, les deux fiches sont automatiquement reliées.' },
      { title: 'Focus du jour', description: 'Vos RDV du jour apparaissent dans le Daily Focus — vous ne pouvez plus oublier de préparer vos appels.' },
    ],
  },
  {
    id: 'emails',
    icon: '📧',
    title: 'Emails Automatiques',
    isPro: true,
    summary: 'Recevez chaque matin vos 3 priorités du jour et chaque 1er du mois un bilan complet de votre activité, sans rien configurer.',
    keyPoints: [
      'Email Daily Focus envoyé automatiquement chaque matin à 8h UTC (10h Paris)',
      'Rapport mensuel le 1er de chaque mois : CA, pipeline, tâches, streak',
      'Lien direct vers le dashboard pour agir immédiatement',
      'Fonctionnalité Solo Pro — aucune configuration nécessaire',
    ],
    steps: [
      { title: 'Email Daily Focus', description: 'Chaque matin à 8h UTC, vous recevez « ⚡ Votre Focus Brainlo du [date] » avec vos 3 priorités du jour personnalisées.' },
      { title: 'Cliquer pour agir', description: 'Cliquez sur « Voir mon Focus complet » dans l’email — vous atterrissez directement sur votre dashboard avec toutes vos actions.' },
      { title: 'Rapport mensuel', description: 'Le 1er de chaque mois, recevez un bilan complet : CA vs objectif, top dépenses, pipeline, tâches et streak de focus.' },
      { title: 'Activation automatique', description: 'Ces emails s’activent automatiquement avec le plan Solo Pro — aucun paramétrage requis.' },
    ],
  },
  {
    id: 'security',
    icon: '🔒',
    title: 'Sécurité & Compte',
    href: '/settings',
    summary: 'Gérez votre profil légal, changez votre mot de passe et protégez votre accès avec la protection anti-brute force.',
    keyPoints: [
      'Profil complet avec informations légales pour la facturation (SIRET, TVA, adresse)',
      'Changement de mot de passe sécurisé (8 caractères min, majuscule, chiffre)',
      'Réinitialisation par email avec token sécurisé (TTL 1h)',
      'Protection anti-brute force : blocage après 5 tentatives / 15 min',
    ],
    steps: [
      { title: 'Compléter votre profil', description: 'Allez dans « Paramètres » et renseignez SIRET, adresse, TVA — ces données alimentent automatiquement vos devis et factures.' },
      { title: 'Changer de mot de passe', description: 'Dans « Paramètres → Sécurité », entrez l’ancien mot de passe puis un nouveau mot de passe fort.' },
      { title: 'Mot de passe oublié', description: 'Sur la page de connexion, cliquez « Mot de passe oublié » — vous recevrez un lien de réinitialisation sécurisé valable 1 heure.' },
      { title: 'Protection automatique', description: 'Après 5 tentatives de connexion échouées, votre compte est protégé automatiquement pendant 15 minutes.' },
    ],
  },
  {
    id: 'profile',
    icon: '🧠',
    title: 'Brain Power Score & Profil',
    href: '/profile',
    isPro: true,
    summary: 'Votre Business Brain est d’autant plus puissant qu’il est enrichi. Le Brain Power Score mesure la qualite du contexte disponible pour vos agents IA.',
    keyPoints: [
      'Score 0-100 calcule sur la completude de votre profil, offres, objectifs et base de connaissances',
      'Suggestions contextuelles pour ameliorer chaque dimension du score',
      'Badge Brain actif dans la sidebar des que le score depasse 50%',
      'Les agents IA generent des questions dynamiques personnalisees si le Brain est bien configure',
    ],
    steps: [
      { title: 'Consulter votre score', description: 'Cliquez sur « Profil » dans la sidebar — votre Brain Power Score s’affiche avec la jauge de progression.' },
      { title: 'Identifier les lacunes', description: 'Les suggestions contextuelles indiquent quelle dimension ameliorer en priorite (secteur, offres, KB, objectifs).' },
      { title: 'Enrichir le profil', description: 'Cliquez sur une suggestion pour acceder directement a la section concernee (Parametres, Base de Connaissances...).' },
      { title: 'Importer des documents', description: 'Uploadez vos supports commerciaux, tarifs et contrats dans la Base de Connaissances — chaque document augmente le score.' },
      { title: 'Activer le badge Brain', description: 'Des que le score depasse 50%, un badge vert apparait dans la sidebar — vos agents IA sont en mode expert.' },
    ],
  },
  {
    id: 'agents',
    icon: '🤖',
    title: 'Agents IA Specialises',
    href: '/agents',
    isPro: true,
    summary: 'Activez des agents IA dedies a chaque domaine de votre business : Finance, Commercial, Marketing, Strategie. Chaque agent exploite votre Business Brain pour des reponses 100% contextualisees.',
    keyPoints: [
      '8+ agents specialises : CFO, CRO, CMO, Coach, Stratege...',
      'Chaque agent lit votre wiki, vos donnees et votre profil — pas de reponses generiques',
      'Brain-aware : indicateur de qualite Brain (Actif / Puissant / Expert) affiche sur chaque agent',
      '2 slots d’activation simultanee en Solo Pro',
    ],
    steps: [
      { title: 'Explorer le catalogue', description: 'Cliquez sur « Agents » dans la sidebar pour voir tous les agents disponibles avec leurs domaines et capacites.' },
      { title: 'Activer un agent', description: 'Cliquez « Activer » sur la fiche d’un agent — il occupe un slot et devient accessible depuis son interface dediee.' },
      { title: 'Interagir avec l’agent', description: 'Ouvrez l’agent active pour acceder a son chat contextuel et ses questions suggerees, basees sur vos vraies donnees.' },
      { title: 'Enrichir le Brain', description: 'Plus votre Brain Power Score est eleve, plus les agents proposent des questions dynamiques personnalisees.' },
      { title: 'Gerer vos slots', description: 'Desactivez un agent pour liberer un slot et en activer un autre selon vos besoins du moment.' },
    ],
  },
  {
    id: 'icp-builder',
    icon: '🎯',
    title: 'ICP Builder — Profil Client Ideal',
    href: '/pipeline',
    isPro: true,
    summary: 'Generez en un clic votre profil de client ideal (ICP) et laissez l’IA scorer chaque prospect selon son adequation avec ce profil.',
    keyPoints: [
      'ICP genere automatiquement a partir de votre secteur, offres et donnees Brain',
      'Score de closing affiche sur chaque carte prospect du Kanban',
      'Priorisez vos efforts commerciaux sur les deals les plus susceptibles de closer',
      'L’ICP s’affine avec vos donnees reelles au fil du temps',
    ],
    steps: [
      { title: 'Generer votre ICP', description: 'Sur la page Pipeline, cliquez sur « Generer mon ICP » — l’IA analyse votre profil et vos deals pour definir votre client ideal.' },
      { title: 'Lire le profil genere', description: 'L’ICP decrit le secteur, la taille d’entreprise, les douleurs typiques et les signaux d’achat de votre client ideal.' },
      { title: 'Consulter les scores de closing', description: 'Chaque carte prospect affiche un score (%) indiquant l’adequation avec votre ICP.' },
      { title: 'Prioriser vos actions', description: 'Concentrez vos relances sur les prospects avec les scores les plus eleves — ils sont les plus proches de votre client ideal.' },
    ],
  },
  {
    id: 'cold-email',
    icon: '✉️',
    title: 'Sequence Cold Email',
    href: '/agents',
    isPro: true,
    summary: 'Generez une sequence de 3 a 5 emails de prospection froide personnalises a votre secteur et votre ICP, prets a copier-coller.',
    keyPoints: [
      'Sequence complete : email d’accroche, relance J+3, relance J+7, breakup email',
      'Ton et contenu adaptes a votre secteur d’activite et votre ICP',
      'Chaque email a un objet, un corps et un CTA clairs',
      'Accessible depuis l’agent CRO dans la section CROISSANCE de la sidebar',
    ],
    steps: [
      { title: 'Acceder a l’agent CRO', description: 'Dans la sidebar, section CROISSANCE, cliquez sur « Sequence Email » pour ouvrir l’agent CRO.' },
      { title: 'Generer la sequence', description: 'Cliquez « Generer une sequence email » — l’IA produit 3 a 5 emails adaptes a votre profil en quelques secondes.' },
      { title: 'Copier les emails', description: 'Copiez chaque email individuellement et collez-les dans votre outil d’envoi prefere (Gmail, Lemlist, La Growth Machine...).' },
      { title: 'Personaliser et envoyer', description: 'Ajoutez le nom du prospect et un detail personnel — la personnalisation augmente significativement le taux de reponse.' },
    ],
  },
  {
    id: 'cmo-linkedin',
    icon: '💼',
    title: 'LinkedIn CMO Outreach',
    href: '/agents',
    isPro: true,
    summary: 'Votre CMO IA genere des posts LinkedIn professionnels adaptes a votre audience et publie directement sur votre profil via votre token configure.',
    keyPoints: [
      'Post LinkedIn genere avec ton, format et hashtags adaptes a votre secteur',
      'Publication directe sur LinkedIn depuis Brainlo si le token est configure dans les Parametres',
      'Accessible depuis la section CROISSANCE de la sidebar',
      'Oriente acquisition client — different du Generateur LinkedIn standard',
    ],
    steps: [
      { title: 'Configurer votre token LinkedIn', description: 'Dans « Parametres → Integrations », collez votre token LinkedIn personnel (commence par AQV...) pour activer la publication directe.' },
      { title: 'Acceder au CMO', description: 'Dans la sidebar, section CROISSANCE, cliquez sur « LinkedIn CMO » pour ouvrir l’agent CMO.' },
      { title: 'Generer un post', description: 'Decrivez votre message cle ou laissez l’IA proposer un post base sur votre actualite business — contenu genere en 10 secondes.' },
      { title: 'Publier sur LinkedIn', description: 'Cliquez « Publier sur LinkedIn » — le post est envoye directement sur votre profil via l’API LinkedIn.' },
    ],
  },
  {
    id: 'upgrade',
    icon: '🚀',
    title: 'Passer a Solo Pro',
    href: '/settings',
    summary: 'Debloquez toutes les fonctionnalites IA avancees en passant a Solo Pro : Focus IA, Agents, Relances, ICP Builder, Cold Email, CMO LinkedIn.',
    keyPoints: [
      'Focus IA quotidien — 3 actions prioritaires personnalisees chaque matin',
      'Agents IA specialises — 2 slots actifs pour CFO, CRO, CMO et autres',
      'Relances IA, ICP Builder et Sequences Cold Email inclus',
      'Emails automatiques Daily Focus + rapport mensuel',
    ],
    steps: [
      { title: 'Lancer l’upgrade', description: 'Cliquez sur le bouton « Passer a Solo Pro » visible sur toutes les fonctionnalites bloquees ou dans Parametres.' },
      { title: 'Payer en securite', description: 'Vous etes redirige vers la page de paiement Stripe securisee — aucune donnee bancaire n’est stockee sur nos serveurs.' },
      { title: 'Acces immediat', description: 'Des que le paiement est confirme, toutes les fonctionnalites Pro sont debloquees instantanement — pas besoin de reconnexion.' },
      { title: 'Gerer l’abonnement', description: 'Dans Parametres → Abonnement, cliquez « Gerer mon abonnement » pour modifier ou annuler via le portail Stripe.' },
    ],
  },
]

export default function WikiPage() {
  const [search, setSearch] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    if (!q) return WIKI_SECTIONS
    return WIKI_SECTIONS.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.summary.toLowerCase().includes(q) ||
        s.keyPoints.some((k) => k.toLowerCase().includes(q))
    )
  }, [search])

  return (
    <div className="min-h-screen bg-[#0a0a14] text-white">
      <div className="max-w-4xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl">📖</span>
            <h1 className="text-3xl font-bold text-white">Wiki Brainlo</h1>
          </div>
          <p className="text-[#818cf8] text-base">
            Guide utilisateur complet — toutes les fonctionnalités expliquées pas à pas.
          </p>
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4b5563] text-lg">🔍</span>
            <input
              type="text"
              placeholder="Rechercher une fonctionnalité..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#1e1e30] border border-[#2a2a42] rounded-xl pl-10 pr-4 py-3 text-white placeholder-[#4b5563] focus:outline-none focus:border-[#4f46e5] transition-colors"
            />
          </div>
          {search && (
            <p className="mt-2 text-sm text-[#4b5563]">
              {filtered.length} résultat{filtered.length > 1 ? 's' : ''} pour &laquo;&nbsp;{search}&nbsp;&raquo;
            </p>
          )}
        </div>

        {/* Quick nav pills */}
        {!search && (
          <div className="flex flex-wrap gap-2 mb-10">
            {WIKI_SECTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  setOpenId(s.id)
                  document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[#1e1e30] border border-[#2a2a42] text-[#818cf8] hover:border-[#4f46e5] hover:text-white transition-all"
              >
                <span>{s.icon}</span>
                <span>{s.title}</span>
                {s.isPro && <span className="ml-1 px-1.5 py-0.5 bg-[#4f46e5]/20 text-[#818cf8] rounded text-[10px] font-bold">PRO</span>}
              </button>
            ))}
          </div>
        )}

        {/* Sections */}
        <div className="space-y-4">
          {filtered.length === 0 && (
            <div className="text-center py-16 text-[#4b5563]">
              <p className="text-4xl mb-3">🔍</p>
              <p>Aucun résultat pour &laquo;&nbsp;{search}&nbsp;&raquo;</p>
            </div>
          )}
          {filtered.map((section) => {
            const isOpen = openId === section.id
            return (
              <div
                key={section.id}
                id={section.id}
                className="bg-[#1e1e30] border border-[#2a2a42] rounded-2xl overflow-hidden transition-all"
              >
                {/* Section header — clickable accordion */}
                <button
                  onClick={() => setOpenId(isOpen ? null : section.id)}
                  className="w-full flex items-center gap-4 px-6 py-5 text-left hover:bg-[#252540] transition-colors"
                >
                  <span className="text-2xl flex-shrink-0">{section.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-white text-lg">{section.title}</span>
                      {section.isPro && (
                        <span className="px-2 py-0.5 bg-[#4f46e5]/30 border border-[#4f46e5]/50 text-[#818cf8] rounded-full text-xs font-bold">SOLO PRO</span>
                      )}
                    </div>
                    <p className="text-sm text-[#6b7280] mt-0.5 truncate">{section.summary}</p>
                  </div>
                  <span className={`flex-shrink-0 text-[#4f46e5] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </button>

                {/* Expanded content */}
                {isOpen && (
                  <div className="px-6 pb-6 border-t border-[#2a2a42]">

                    {/* Summary */}
                    <p className="text-[#9ca3af] mt-5 mb-6 leading-relaxed">{section.summary}</p>

                    {/* Key Points */}
                    <div className="mb-6">
                      <h3 className="text-sm font-semibold text-[#4f46e5] uppercase tracking-wider mb-3">Points clés</h3>
                      <ul className="space-y-2">
                        {section.keyPoints.map((point, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-[#d1d5db]">
                            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#4f46e5]/20 text-[#818cf8] flex items-center justify-center text-xs font-bold mt-0.5">✓</span>
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Steps */}
                    <div className="mb-6">
                      <h3 className="text-sm font-semibold text-[#4f46e5] uppercase tracking-wider mb-3">Comment utiliser</h3>
                      <ol className="space-y-3">
                        {section.steps.map((step, i) => (
                          <li key={i} className="flex gap-3">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#4f46e5] text-white flex items-center justify-center text-xs font-bold mt-0.5">{i + 1}</span>
                            <div>
                              <p className="text-sm font-medium text-white">{step.title}</p>
                              <p className="text-sm text-[#6b7280] mt-0.5 leading-relaxed">{step.description}</p>
                            </div>
                          </li>
                        ))}
                      </ol>
                    </div>

                    {/* CTA to module */}
                    {section.href && (
                      <Link
                        href={section.href}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#4f46e5]/20 hover:bg-[#4f46e5]/30 border border-[#4f46e5]/40 text-[#818cf8] hover:text-white rounded-lg text-sm font-medium transition-all"
                      >
                        <span>{section.icon}</span>
                        <span>Ouvrir {section.title}</span>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-[#2a2a42] text-center">
          <p className="text-sm text-[#4b5563]">
            Brainlo v2.0.0 — {WIKI_SECTIONS.length} fonctionnalités documentées
          </p>
        </div>
      </div>
    </div>
  )
}
