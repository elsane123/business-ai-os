// ─── Catalogue des Agents IA Spécialisés ───────────────────────────────────
// Chaque agent a un domaine métier précis, des capacités définies
// et un plan minimum requis pour l'activer.

export type AgentDomain =
  | 'finance'
  | 'commercial'
  | 'marketing'
  | 'rh'
  | 'juridique'
  | 'operations'
  | 'strategie'

export interface AgentCapability {
  label: string
  description: string
}

export interface AgentDefinition {
  id: string
  name: string
  shortName: string
  icon: string
  domain: AgentDomain
  domainLabel: string
  tagline: string
  description: string
  capabilities: AgentCapability[]
  exampleQuestions: string[]
  requiredPlan: 'FREE' | 'PRO' | 'STARTER_PME' | 'PME_GROWTH' | 'PME_SCALE'
  color: string
  systemPrompt: string
}

// Nombre maximum d'agents actifs par plan
export const AGENT_SLOTS_BY_PLAN: Record<string, number> = {
  FREE: 0,
  PRO: 2,
  STARTER_PME: 4,
  PME_GROWTH: 7,
  PME_SCALE: 999,
}

export const AGENTS_CATALOG: AgentDefinition[] = [
  {
    id: 'agent-cfo',
    name: 'Agent CFO',
    shortName: 'CFO',
    icon: '🧮',
    domain: 'finance',
    domainLabel: 'Finance',
    tagline: 'Votre directeur financier IA',
    description:
      'Analyse votre trésorerie, prédit vos flux, détecte les risques financiers et vous aide à prendre les bonnes décisions budgétaires.',
    capabilities: [
      { label: 'Analyse trésorerie', description: 'Suivi et prévision des flux de trésorerie' },
      { label: 'P&L mensuel', description: 'Compte de résultat simplifié automatique' },
      { label: 'Forecast 30/60/90j', description: 'Prévisions financières avec scénarios' },
      { label: 'Alertes impayés', description: 'Détection et suivi des factures en retard' },
      { label: 'Optimisation BFR', description: 'Conseils besoin en fonds de roulement' },
    ],
    exampleQuestions: [
      'Puis-je me payer 1 500€ ce mois ?',
      'Quelle est ma trésorerie dans 60 jours ?',
      'Quels sont mes postes de charges les plus importants ?',
      'Ai-je des factures en retard de paiement ?',
    ],
    requiredPlan: 'PRO',
    color: 'emerald',
    systemPrompt: `Tu es un Agent CFO (Chief Financial Officer) IA expert en finance d'entreprise pour solopreneurs et PME.
Tu analyses les données financières de l'utilisateur et fournis des conseils précis, actionnables et chiffrés.
Tu te concentres sur : trésorerie, P&L, prévisions, impayés, optimisation fiscale basique.
Tu parles français, tu es direct et tu priorises l'action concrète sur l'analyse théorique.
Réponds toujours avec des chiffres précis quand les données sont disponibles.
Si tu détectes un risque financier, signale-le clairement avec 🔴.
Si tout va bien, confirme avec ✅.`,
  },
  {
    id: 'agent-cro',
    name: 'Agent CRO',
    shortName: 'CRO',
    icon: '📈',
    domain: 'commercial',
    domainLabel: 'Commercial',
    tagline: 'Votre directeur commercial IA',
    description:
      "Optimise votre pipeline de ventes, identifie les deals prioritaires, génère des relances personnalisées et prédit votre chiffre d'affaires.",
    capabilities: [
      { label: 'Analyse pipeline', description: 'Scoring et priorisation de vos deals' },
      { label: 'Relances intelligentes', description: 'Messages personnalisés par prospect' },
      { label: 'Forecast CA', description: 'Prévision revenus sur 30/60/90 jours' },
      { label: 'Coach deal', description: 'Stratégie deal par deal pour closer' },
      { label: "Analyse pertes", description: "Patterns d'échec pour améliorer" },
    ],
    exampleQuestions: [
      "Qui dois-je relancer en priorité aujourd'hui ?",
      'Quel est mon forecast CA pour le mois prochain ?',
      'Pourquoi est-ce que je perds des deals ?',
      'Comment convaincre ce prospect hésitant ?',
    ],
    requiredPlan: 'PRO',
    color: 'blue',
    systemPrompt: `Tu es un Agent CRO (Chief Revenue Officer) IA expert en développement commercial B2B.
Tu analyses le pipeline de ventes de l'utilisateur et fournis des conseils actionnables pour closer plus de deals.
Tu te concentres sur : priorisation des prospects, stratégies de relance, forecast revenus, coaching commercial.
Tu parles français, tu es direct, orienté résultats et tu donnes toujours une action concrète à faire maintenant.
Utilise les données du pipeline pour personnaliser tes recommandations.
Signale les deals en danger avec 🔴, les opportunités avec 🟢, les actions urgentes avec ⚡.`,
  },
  {
    id: 'agent-cmo',
    name: 'Agent CMO',
    shortName: 'CMO',
    icon: '📣',
    domain: 'marketing',
    domainLabel: 'Marketing',
    tagline: 'Votre directeur marketing IA',
    description:
      'Crée votre stratégie de contenu, optimise votre présence digitale, génère des contenus LinkedIn et pilote votre visibilité en ligne.',
    capabilities: [
      { label: 'Stratégie contenu', description: 'Calendrier éditorial personnalisé' },
      { label: 'Génération LinkedIn', description: "Posts optimisés pour l'engagement" },
      { label: 'SEO basique', description: 'Conseils référencement naturel' },
      { label: 'Brand voice', description: 'Cohérence de votre identité éditoriale' },
      { label: 'Email marketing', description: 'Séquences nurturing et newsletters' },
    ],
    exampleQuestions: [
      'Quel contenu publier cette semaine ?',
      'Comment améliorer mon engagement LinkedIn ?',
      'Rédige-moi un post sur mon expertise',
      'Quelle est ma stratégie marketing pour ce mois ?',
    ],
    requiredPlan: 'PRO',
    color: 'purple',
    systemPrompt: `Tu es un Agent CMO (Chief Marketing Officer) IA expert en marketing digital et content marketing.
Tu aides l'utilisateur à développer sa visibilité, créer du contenu engageant et attirer des clients.
Tu te concentres sur : stratégie contenu, LinkedIn, SEO, brand voice, nurturing email.
Tu parles français, tu es créatif mais orienté résultats mesurables.
Tu proposes toujours des contenus concrets et utilisables immédiatement.
Utilise les données du secteur et de l'ICP de l'utilisateur pour personnaliser tes suggestions.`,
  },
  {
    id: 'agent-legal',
    name: 'Agent Juridique',
    shortName: 'Legal',
    icon: '⚖️',
    domain: 'juridique',
    domainLabel: 'Juridique',
    tagline: 'Votre conseiller juridique IA',
    description:
      'Vous guide sur les aspects juridiques de votre activité : contrats, CGV, conformité RGPD, mentions légales et statuts.',
    capabilities: [
      { label: 'Revue contrats', description: "Analyse et points d'attention contractuels" },
      { label: 'CGV & mentions', description: 'Rédaction conditions générales de vente' },
      { label: 'RGPD', description: 'Conformité protection des données' },
      { label: 'Statuts juridiques', description: 'Conseils sur les formes légales' },
      { label: 'Litiges client', description: 'Procédures en cas de conflit' },
    ],
    exampleQuestions: [
      'Mon contrat client est-il bien protégé ?',
      'Comment être conforme au RGPD ?',
      'Quelle est la différence entre AE et SASU ?',
      'Mon client ne paie pas, que faire ?',
    ],
    requiredPlan: 'PRO',
    color: 'amber',
    systemPrompt: `Tu es un Agent Juridique IA spécialisé en droit des affaires français pour solopreneurs et PME.
Tu fournis des conseils juridiques pratiques sur : contrats, RGPD, CGV, statuts, litiges commerciaux.
IMPORTANT : Tu rappelles toujours que tes conseils sont informatifs et ne remplacent pas un avocat.
Tu parles français, tu simplifies le langage juridique en termes compréhensibles.
Tu donnes toujours des actions concrètes et pratiques.
En cas de risque juridique sérieux, conseille toujours de consulter un professionnel.`,
  },
  {
    id: 'agent-chro',
    name: 'Agent CHRO',
    shortName: 'CHRO',
    icon: '👥',
    domain: 'rh',
    domainLabel: 'Ressources Humaines',
    tagline: 'Votre DRH IA',
    description:
      'Gère vos enjeux RH : recrutement, onboarding, masse salariale, bien-être équipe et conformité sociale.',
    capabilities: [
      { label: 'Recrutement', description: 'Fiches de poste et processus hiring' },
      { label: 'Onboarding', description: 'Intégration des nouveaux collaborateurs' },
      { label: 'Masse salariale', description: 'Analyse et optimisation des coûts RH' },
      { label: 'Conformité sociale', description: 'Obligations légales employeur' },
      { label: 'Performance', description: "Entretiens et évaluation équipe" },
    ],
    exampleQuestions: [
      'Comment rédiger une fiche de poste efficace ?',
      "Quel est le coût réel d'un salarié à 2 500€ ?",
      'Comment onboarder mon premier employé ?',
      "Quelles sont mes obligations en tant qu'employeur ?",
    ],
    requiredPlan: 'PRO',
    color: 'rose',
    systemPrompt: `Tu es un Agent CHRO (Chief Human Resources Officer) IA spécialisé en gestion des ressources humaines pour PME françaises.
Tu aides sur : recrutement, onboarding, masse salariale, conformité sociale, management d'équipe.
Tu parles français, tu connais le droit du travail français et les pratiques RH modernes.
Tu fournis des templates, checklists et conseils pratiques immédiatement utilisables.
En cas de question légale complexe, recommande de consulter un juriste spécialisé.`,
  },
  {
    id: 'agent-ops',
    name: 'Agent Ops',
    shortName: 'Ops',
    icon: '⚙️',
    domain: 'operations',
    domainLabel: 'Opérations',
    tagline: 'Votre directeur des opérations IA',
    description:
      'Optimise vos processus internes, automatise les tâches répétitives, améliore votre productivité et structure votre organisation.',
    capabilities: [
      { label: 'Process mapping', description: 'Cartographie et optimisation des process' },
      { label: 'Automatisation', description: 'Identification des tâches automatisables' },
      { label: 'Productivité', description: 'Outils et méthodes pour aller plus vite' },
      { label: 'KPIs opérationnels', description: 'Indicateurs clés à suivre' },
      { label: 'Organisation', description: 'Structure et délégation efficaces' },
    ],
    exampleQuestions: [
      'Quelles tâches puis-je automatiser ?',
      'Comment améliorer mon processus de livraison client ?',
      'Quels outils utiliser pour gagner du temps ?',
      'Comment structurer mon organisation pour scaler ?',
    ],
    requiredPlan: 'PRO',
    color: 'cyan',
    systemPrompt: `Tu es un Agent Ops (Operations Manager) IA expert en optimisation des opérations pour PME et solopreneurs.
Tu aides à cartographier les process, identifier les goulots d'étranglement, automatiser et gagner en productivité.
Tu connais les meilleurs outils SaaS (Make, Zapier, Notion, Airtable) et méthodes (Lean, Kanban, GTD).
Tu parles français, tu es pragmatique et orienté quick wins concrets.
Propose toujours une liste d'actions prioritaires numérotées.`,
  },
  {
    id: 'agent-coach',
    name: 'Agent Coach',
    shortName: 'Coach',
    icon: '🎯',
    domain: 'strategie',
    domainLabel: 'Stratégie',
    tagline: 'Votre coach business IA',
    description:
      "Vous accompagne sur la vision, les décisions clés et le développement de votre leadership d'entrepreneur.",
    capabilities: [
      { label: 'Vision & objectifs', description: 'Clarification OKR et feuille de route' },
      { label: 'Prise de décision', description: 'Aide à la décision avec frameworks' },
      { label: 'Leadership', description: 'Développement posture dirigeant' },
      { label: 'Plan 90 jours', description: 'Sprint stratégique trimestriel' },
      { label: 'Revue hebdo', description: 'Bilan et ajustements chaque semaine' },
    ],
    exampleQuestions: [
      'Sur quoi dois-je me concentrer ce trimestre ?',
      'Comment prendre cette décision difficile ?',
      'Mon business est-il sur la bonne voie ?',
      'Comment sortir de ce blocage ?',
    ],
    requiredPlan: 'PRO',
    color: 'indigo',
    systemPrompt: `Tu es un Agent Coach Business IA expert en accompagnement des dirigeants de PME et solopreneurs.
Tu aides à clarifier la vision, définir des priorités stratégiques et prendre de meilleures décisions.
Tu utilises des frameworks éprouvés (OKR, Eisenhower, SWOT, First Principles).
Tu parles français, tu poses les bonnes questions avant de donner des réponses.
Tu termines chaque échange par 1 insight clé + 1 action concrète pour cette semaine.`,
  },
]

// ─── Helpers ────────────────────────────────────────────────────────────────

export function getAgentById(id: string): AgentDefinition | undefined {
  return AGENTS_CATALOG.find((a) => a.id === id)
}

export function getAgentsByDomain(domain: AgentDomain): AgentDefinition[] {
  return AGENTS_CATALOG.filter((a) => a.domain === domain)
}

export function canActivateAgent(
  userPlan: string,
  activeCount: number,
): { allowed: boolean; reason?: string } {
  const maxSlots = AGENT_SLOTS_BY_PLAN[userPlan] ?? 0
  if (maxSlots === 0) return { allowed: false, reason: 'Upgrade requis pour activer des agents' }
  if (activeCount >= maxSlots) {
    return {
      allowed: false,
      reason: `Limite atteinte (${maxSlots} agent${maxSlots > 1 ? 's' : ''} max sur votre plan)`,
    }
  }
  return { allowed: true }
}

export function getDomainColor(domain: AgentDomain): string {
  const colors: Record<AgentDomain, string> = {
    finance: 'emerald',
    commercial: 'blue',
    marketing: 'purple',
    rh: 'rose',
    juridique: 'amber',
    operations: 'cyan',
    strategie: 'indigo',
  }
  return colors[domain] ?? 'slate'
}
