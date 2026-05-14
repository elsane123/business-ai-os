// Business Assessment — Scoring Engine
// 30 questions, 6 scored sections, ROI calculator

export interface Question {
  id: number
  category:
    | 'context'
    | 'roi_input'
    | 'founder_dependency'
    | 'knowledge_systems'
    | 'sales_delivery'
    | 'operations_workflow'
    | 'growth_capacity'
    | 'ai_foundation'
  type: 'choice' | 'slider'
  question: string
  subtitle?: string
  options?: { label: string; points: number }[]
  slider?: { min: number; max: number; default: number; unit: string; step?: number }
}

export interface SectionScores {
  founder_dependency: number
  knowledge_systems: number
  sales_delivery: number
  operations_workflow: number
  growth_capacity: number
  ai_foundation: number
  total: number
}

export interface ROIResult {
  totalHours: number
  timeValue: number
  revenueMissed: number
  totalMonthly: number
  annualImpact: number
}

export const SECTION_MAX: Record<string, number> = {
  founder_dependency: 12,
  knowledge_systems: 6,
  sales_delivery: 9,
  operations_workflow: 12,
  growth_capacity: 12,
  ai_foundation: 8,
}

export const SECTION_LABELS: Record<string, string> = {
  founder_dependency: 'Dependance fondateur',
  knowledge_systems: 'Systemes de connaissance',
  sales_delivery: 'Ventes et Delivery',
  operations_workflow: 'Operations et Workflow',
  growth_capacity: 'Capacite de croissance',
  ai_foundation: 'Fondation IA',
}

export const TOTAL_MAX = 59
export const LEADS_MAP = [3, 12, 35, 75]

export const QUESTIONS: Question[] = [
  {
    id: 1, category: 'context', type: 'choice',
    question: 'Quel est LE probleme qui coute le plus de temps dans votre business ?',
    subtitle: 'Choisissez celui qui vous pese le plus au quotidien.',
    options: [
      { label: 'Repondre aux memes questions clients encore et encore', points: 0 },
      { label: 'Faire des relances de prospects ou clients', points: 0 },
      { label: 'Gerer les emails et messages entrants', points: 0 },
      { label: 'Creer du contenu ou des propositions commerciales', points: 0 },
      { label: 'Coordonner des taches ou des prestataires', points: 0 },
      { label: 'Gerer la comptabilite et les finances', points: 0 },
      { label: 'Autre', points: 0 },
    ],
  },
  {
    id: 2, category: 'context', type: 'choice',
    question: 'Comment gerez-vous votre business au quotidien ?',
    options: [
      { label: 'Seul(e), tout dans ma tete', points: 0 },
      { label: 'Avec des outils epars (tableurs, notes...)', points: 0 },
      { label: 'Avec une petite equipe (1-3 personnes)', points: 0 },
      { label: 'Avec des processus bien definis', points: 0 },
    ],
  },
  {
    id: 3, category: 'context', type: 'choice',
    question: 'Quel type de business est le votre ?',
    options: [
      { label: 'Conseil / Coaching / Formation', points: 0 },
      { label: 'Agence / Freelance (services)', points: 0 },
      { label: 'SaaS / Produit digital', points: 0 },
      { label: 'E-commerce / Retail', points: 0 },
      { label: 'Commerce local / Artisanat', points: 0 },
      { label: 'Autre', points: 0 },
    ],
  },
  {
    id: 4, category: 'context', type: 'choice',
    question: 'Quel est le revenu moyen par personne dans votre equipe (ou vous seul) ?',
    options: [
      { label: 'Moins de 50 000 EUR par an', points: 0 },
      { label: '50 000 - 100 000 EUR par an', points: 0 },
      { label: '100 000 - 250 000 EUR par an', points: 0 },
      { label: '250 000 - 500 000 EUR par an', points: 0 },
      { label: 'Plus de 500 000 EUR par an', points: 0 },
    ],
  },
  {
    id: 5, category: 'context', type: 'choice',
    question: 'Combien de nouveaux leads ou prospects recevez-vous par mois ?',
    options: [
      { label: 'Moins de 5', points: 0 },
      { label: '5 - 20', points: 0 },
      { label: '20 - 50', points: 0 },
      { label: 'Plus de 50', points: 0 },
    ],
  },
  {
    id: 6, category: 'roi_input', type: 'slider',
    question: 'Quelle est la valeur moyenne d un client sur sa duree de vie ?',
    subtitle: 'Montant total facture a un client type (contrat, abonnement annuel, projet...)',
    slider: { min: 500, max: 50000, default: 5000, unit: 'EUR', step: 500 },
  },
  {
    id: 7, category: 'roi_input', type: 'slider',
    question: 'Quel est votre taux horaire (ou valeur de votre heure) ?',
    subtitle: 'Si non facture a l heure, estimez ce que vaut 1h de votre temps.',
    slider: { min: 50, max: 500, default: 150, unit: 'EUR/h', step: 10 },
  },
  {
    id: 8, category: 'roi_input', type: 'slider',
    question: 'Quel est votre taux de conversion leads vers clients ?',
    subtitle: 'Sur 100 personnes interessees, combien deviennent clients ?',
    slider: { min: 2, max: 80, default: 25, unit: '%', step: 1 },
  },
  {
    id: 9, category: 'founder_dependency', type: 'choice',
    question: 'Pouvez-vous vous deconnecter completement le week-end sans que ca coince ?',
    options: [
      { label: 'Oui, regulierement', points: 3 },
      { label: 'Parfois, avec un peu d anxiete', points: 2 },
      { label: 'Non, je reste toujours dispo', points: 1 },
    ],
  },
  {
    id: 10, category: 'founder_dependency', type: 'choice',
    question: 'Si vous etiez injoignable 2 semaines, que se passerait-il ?',
    options: [
      { label: 'Le business tourne normalement', points: 3 },
      { label: 'Quelques rates mais ca s en sort', points: 2 },
      { label: 'Tout s arrete ou presque', points: 0 },
    ],
  },
  {
    id: 11, category: 'founder_dependency', type: 'choice',
    question: 'Quel pourcentage des decisions importantes necessite votre validation directe ?',
    options: [
      { label: 'Moins de 30% mon equipe decide beaucoup', points: 3 },
      { label: '30-70% je valide les grosses decisions', points: 2 },
      { label: 'Plus de 70% tout passe par moi', points: 0 },
    ],
  },
  {
    id: 12, category: 'founder_dependency', type: 'choice',
    question: 'En cas d urgence client ou operationnelle, qui gere ?',
    options: [
      { label: 'Un process ou une personne designee', points: 3 },
      { label: 'Un collaborateur, mais sous ma supervision', points: 2 },
      { label: 'Toujours moi, quelle que soit l heure', points: 1 },
      { label: 'C est le flou total', points: 0 },
    ],
  },
  {
    id: 13, category: 'knowledge_systems', type: 'choice',
    question: 'Ou vit la connaissance critique de votre business ?',
    options: [
      { label: 'Dans des docs organises, accessibles a tous', points: 2 },
      { label: 'Dans des fichiers epars ou des emails', points: 1 },
      { label: 'Principalement dans ma tete', points: 0 },
    ],
  },
  {
    id: 14, category: 'knowledge_systems', type: 'choice',
    question: 'Si une personne cle partait demain, combien de temps pour recuperer ses connaissances ?',
    options: [
      { label: 'Quelques heures tout est documente', points: 2 },
      { label: 'Quelques jours beaucoup a reconstituer', points: 1 },
      { label: 'Des semaines ou jamais c est perdu', points: 0 },
    ],
  },
  {
    id: 15, category: 'knowledge_systems', type: 'choice',
    question: 'Comment tracez-vous les decisions importantes et leurs raisons ?',
    options: [
      { label: 'Elles sont documentees avec contexte', points: 2 },
      { label: 'Quelques notes mais c est incomplet', points: 1 },
      { label: 'Pas de trace systematique', points: 0 },
    ],
  },
  {
    id: 16, category: 'sales_delivery', type: 'choice',
    question: 'Combien de temps pour envoyer une proposition commerciale apres un premier contact ?',
    options: [
      { label: 'Moins de 24h j ai des templates rodes', points: 3 },
      { label: '2-5 jours je personnalise beaucoup', points: 2 },
      { label: 'Plus d une semaine', points: 1 },
    ],
  },
  {
    id: 17, category: 'sales_delivery', type: 'choice',
    question: 'Comment gerez-vous le suivi de vos prospects ?',
    options: [
      { label: 'CRM avec rappels automatiques', points: 3 },
      { label: 'Tableur ou notes, je relance manuellement', points: 2 },
      { label: 'De memoire, souvent j oublie', points: 0 },
    ],
  },
  {
    id: 18, category: 'sales_delivery', type: 'choice',
    question: 'Combien de propositions commerciales envoyez-vous par mois en moyenne ?',
    options: [
      { label: 'Moins de 3', points: 1 },
      { label: '3 - 8', points: 2 },
      { label: '8 - 15', points: 3 },
      { label: 'Plus de 15', points: 3 },
    ],
  },
  {
    id: 19, category: 'operations_workflow', type: 'choice',
    question: 'Combien heures par semaine sur des taches administratives pures (facturation, relances, reporting) ?',
    options: [
      { label: 'Moins de 2h', points: 3 },
      { label: '2 - 5h', points: 2 },
      { label: '5 - 10h', points: 1 },
      { label: 'Plus de 10h', points: 0 },
    ],
  },
  {
    id: 20, category: 'operations_workflow', type: 'choice',
    question: 'Combien heures par semaine consacrez-vous a la coordination (reunions, briefings, comptes-rendus) ?',
    options: [
      { label: 'Moins de 2h', points: 3 },
      { label: '2 - 5h', points: 2 },
      { label: '5 - 10h', points: 1 },
      { label: 'Plus de 10h', points: 0 },
    ],
  },
  {
    id: 21, category: 'operations_workflow', type: 'choice',
    question: 'Vos outils metier (CRM, facturation, agenda, email) sont-ils integres entre eux ?',
    options: [
      { label: 'Oui, tout est synchronise automatiquement', points: 3 },
      { label: 'Partiellement, quelques connexions', points: 2 },
      { label: 'Non, je ressaisis beaucoup manuellement', points: 1 },
      { label: 'Je n utilise pas vraiment d outils', points: 0 },
    ],
  },
  {
    id: 22, category: 'operations_workflow', type: 'choice',
    question: 'Comment tenez-vous vos clients informes de l avancement de leurs projets ?',
    options: [
      { label: 'Mises a jour automatiques ou tableau de bord client', points: 3 }
,
      { label: 'Mises a jour manuelles sur demande', points: 1 },
      { label: 'Pas de suivi systematique', points: 0 },
    ],
  },
  // Q23 - growth_capacity
  { id: 23, category: 'growth_capacity', type: 'choice',
    question: 'Si vous doubliez votre clientele demain, pourriez-vous livrer sans baisser la qualite ?',
    options: [
      { label: 'Oui, nos systemes sont scalables', points: 3 },
      { label: 'Probablement, avec quelques ajustements', points: 2 },
      { label: 'Non, on serait debordes', points: 0 },
    ] },
  { id: 24, category: 'growth_capacity', type: 'choice',
    question: 'Combien de temps prend l onboarding d un nouveau client de A a Z ?',
    options: [
      { label: 'Moins d une journee — processus automatise', points: 3 },
      { label: '1 a 3 jours — quelques etapes manuelles', points: 2 },
      { label: 'Plus d une semaine — c est du cas par cas', points: 1 },
    ] },
  { id: 25, category: 'growth_capacity', type: 'choice',
    question: 'Avez-vous un systeme actif pour generer des recommandations ou references clients ?',
    options: [
      { label: 'Oui, programme de reference structure', points: 3 },
      { label: 'Informellement — ca arrive mais rien de systematique', points: 2 },
      { label: 'Non, c est au hasard', points: 1 },
    ] },
  { id: 26, category: 'growth_capacity', type: 'choice',
    question: 'Avez-vous deja du refuser des clients ou projets faute de capacite ?',
    options: [
      { label: 'Non, j ai toujours de la marge', points: 3 },
      { label: 'Rarement, mais ca arrive', points: 2 },
      { label: 'Regulierement — je suis souvent a saturation', points: 0 },
    ] },
  // Q27 - ai_foundation
  { id: 27, category: 'ai_foundation', type: 'choice',
    question: 'Vos outils et donnees sont-ils accessibles depuis un point centralise ?',
    options: [
      { label: 'Oui, tout est dans un hub centralise', points: 3 },
      { label: 'Partiellement, plusieurs systemes separes', points: 2 },
      { label: 'Non, tout est fragmente', points: 0 },
    ] },
  { id: 28, category: 'ai_foundation', type: 'choice',
    question: 'Vos donnees clients et operationnelles sont-elles a jour et fiables ?',
    options: [
      { label: 'Oui, mises a jour en temps reel', points: 2 },
      { label: 'Globalement oui, avec quelques lacunes', points: 1 },
      { label: 'Non, elles sont souvent obsoletes ou incompletes', points: 0 },
    ] },
  { id: 29, category: 'ai_foundation', type: 'choice',
    question: 'Vos processus cles sont-ils documentes de facon a pouvoir etre compris par quelqu un d exterieur ?',
    options: [
      { label: 'Oui, tout est documente et a jour', points: 2 },
      { label: 'En partie, les principaux oui', points: 1 },
      { label: 'Non, c est dans les tetes', points: 0 },
    ] },
  { id: 30, category: 'ai_foundation', type: 'choice',
    question: 'Seriez-vous a l aise avec une IA qui gere le premier contact avec un nouveau lead ?',
    options: [
      { label: 'Oui, si c est bien parametre', points: 1 },
      { label: 'Peut-etre, selon l execution', points: 1 },
      { label: 'Non, je prefere garder ce contact humain', points: 0 },
    ] },
]

export function computeScores(answers: (number | null)[]): SectionScores {
  const totals: Record<string, number> = {
    founder_dependency: 0, knowledge_systems: 0, sales_delivery: 0,
    operations_workflow: 0, growth_capacity: 0, ai_foundation: 0,
  }
  QUESTIONS.forEach((q, idx) => {
    if (q.category === 'context' || q.category === 'roi_input') return
    const answer = answers[idx]
    if (answer === null || answer === undefined) return
    if (q.type === 'choice' && q.options) {
      const option = q.options[answer as number]
      if (option) totals[q.category] += option.points
    }
  })
  const total = Object.values(totals).reduce((a, b) => a + b, 0)
  return { ...totals, total } as SectionScores
}

export function computeROI(
  roiInputs: { avgClientValue: number; hourlyRate: number; conversionRate: number; leadsPerMonth: number },
  scores: SectionScores
): ROIResult {
  const founderLostHours = Math.round(((12 - scores.founder_dependency) / 12) * 140)
  const adminLostHours = Math.round(((12 - scores.operations_workflow) / 12) * 80)
  const salesLostHours = Math.round(((9 - scores.sales_delivery) / 9) * 40)
  const growthLostHours = Math.round(((12 - scores.growth_capacity) / 12) * 60)
  const totalHours = founderLostHours + adminLostHours + salesLostHours + growthLostHours
  const timeValue = totalHours * roiInputs.hourlyRate
  const leadsLost = Math.max(1, Math.round(roiInputs.leadsPerMonth * 0.3))
  const revenueMissed = Math.round(leadsLost * roiInputs.avgClientValue * (roiInputs.conversionRate / 100) * 3)
  return { totalHours, timeValue, revenueMissed, totalMonthly: timeValue + revenueMissed, annualImpact: (timeValue + revenueMissed) * 12 }
}

export function getWeakestSection(scores: SectionScores): string {
  const sections = Object.entries(SECTION_MAX) as [string, number][]
  let weakest = sections[0][0]
  let worstRatio = (scores[weakest as keyof SectionScores] as number) / sections[0][1]
  for (const [key, max] of sections) {
    const ratio = (scores[key as keyof SectionScores] as number) / max
    if (ratio < worstRatio) { worstRatio = ratio; weakest = key }
  }
  return weakest
}
