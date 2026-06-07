'use client'
import { useState } from 'react'

interface Answers {
  whatYouSell: string
  whoYouSellTo: string
  mainProblem: string
  priceRange: string
  geography: string
}

interface EnrichmentPreview {
  offerType: string
  offerDescription: string
  priceRange: string
  typicalDuration: string
  targetClient: string
  clientPainPoint: string
  valueProposition: string
  competitors: string
  differentiator: string
  targetGeography: string
  workLanguages: string
  briefContent: string
}

const OFFER_TYPE_LABELS: Record<string, string> = {
  mission: 'Mission / Projet',
  retainer: 'Forfait mensuel',
  product: 'Produit / SaaS',
  formation: 'Formation',
  mixed: 'Mixte',
}

const PRICE_RANGE_LABELS: Record<string, string> = {
  '<1k': '< 1 000€',
  '1k-5k': '1 000 – 5 000€',
  '5k-15k': '5 000 – 15 000€',
  '15k+': '15 000€ +',
}

const DURATION_LABELS: Record<string, string> = {
  day: '1 journée',
  week: '1 semaine',
  month: '1 mois',
  months: '3 mois +',
}

const GEO_LABELS: Record<string, string> = {
  local: 'Local / Région',
  national: 'France entière',
  europe: 'Europe',
  international: 'International',
}

const LANG_LABELS: Record<string, string> = {
  fr: 'Français',
  en: 'Anglais',
  'fr+en': 'Bilingue FR/EN',
  other: 'Autre',
}

export function BrainWizard({ onComplete }: { onComplete: (score: number) => void }) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<'questions' | 'loading' | 'preview' | 'saving' | 'done'>('questions')
  const [answers, setAnswers] = useState<Answers>({
    whatYouSell: '',
    whoYouSellTo: '',
    mainProblem: '',
    priceRange: '',
    geography: '',
  })
  const [preview, setPreview] = useState<EnrichmentPreview | null>(null)
  const [error, setError] = useState<string | null>(null)

  function canSubmit() {
    return answers.whatYouSell.trim().length > 10 &&
      answers.whoYouSellTo.trim().length > 5 &&
      answers.mainProblem.trim().length > 10 &&
      answers.priceRange !== '' &&
      answers.geography !== ''
  }

  async function handleGenerate() {
    setStep('loading')
    setError(null)
    try {
      const res = await fetch('/api/user/brain-wizard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setPreview(data.enrichment)
      setStep('preview')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inattendue')
      setStep('questions')
    }
  }

  async function handleSave() {
    if (!preview) return
    setStep('saving')
    try {
      const res = await fetch('/api/user/enrichment', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preview),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setStep('done')
      onComplete(data.score ?? 0)
      setTimeout(() => {
        setOpen(false)
        setStep('questions')
      }, 2000)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors de la sauvegarde')
      setStep('preview')
    }
  }

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
      >
        <span>🤖</span>
        <span>Définir mon business avec l&apos;IA</span>
      </button>

      {/* Modal overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#0f0f1f] border border-[#2a2a42] rounded-2xl w-full max-w-xl max-h-[90vh] shadow-2xl">

            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-[#2a2a42]">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  🧠 Business Brain Wizard
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {step === 'questions' && '5 questions • 2 minutes • Profil généré par IA'}
                  {step === 'loading' && "L'IA analyse votre business..."}
                  {step === 'preview' && 'Vérifiez et validez les champs générés'}
                  {step === 'saving' && 'Enregistrement en cours...'}
                  {step === 'done' && '✅ Business Brain mis à jour !'}
                </p>
              </div>
              <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-white transition-colors text-xl leading-none">
                ×
              </button>
            </div>

            <div className="p-6">

              {/* Step 1 — Questions */}
              {step === 'questions' && (
                <div className="flex flex-col gap-5">
                  {error && (
                    <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                      ❌ {error}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
                      1. Que vendez-vous ? <span className="text-red-400">*</span>
                    </label>
                    <textarea
                      rows={2}
                      value={answers.whatYouSell}
                      onChange={e => setAnswers(p => ({ ...p, whatYouSell: e.target.value }))}
                      placeholder="Ex: Des forfaits d'infogérance IT pour les PME, de la création graphique, du coaching commercial..."
                      className="w-full bg-[#151524] border border-[#2a2a42] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/60 resize-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
                      2. À qui vendez-vous ? <span className="text-red-400">*</span>
                    </label>
                    <textarea
                      rows={2}
                      value={answers.whoYouSellTo}
                      onChange={e => setAnswers(p => ({ ...p, whoYouSellTo: e.target.value }))}
                      placeholder="Ex: PME de 10 à 50 salariés en Île-de-France, directeurs marketing de startups SaaS..."
                      className="w-full bg-[#151524] border border-[#2a2a42] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/60 resize-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
                      3. Quel problème principal résolvez-vous ? <span className="text-red-400">*</span>
                    </label>
                    <textarea
                      rows={2}
                      value={answers.mainProblem}
                      onChange={e => setAnswers(p => ({ ...p, mainProblem: e.target.value }))}
                      placeholder="Ex: Ils n'ont pas de DSI interne et perdent du temps sur des pannes informatiques..."
                      className="w-full bg-[#151524] border border-[#2a2a42] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/60 resize-none transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
                        4. Panier moyen <span className="text-red-400">*</span>
                      </label>
                      <select
                        value={answers.priceRange}
                        onChange={e => setAnswers(p => ({ ...p, priceRange: e.target.value }))}
                        className="w-full bg-[#151524] border border-[#2a2a42] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/60 transition-colors"
                      >
                        <option value="">Sélectionner...</option>
                        <option value="&lt;1k">&lt; 1 000€</option>
                        <option value="1k-5k">1 000 – 5 000€</option>
                        <option value="5k-15k">5 000 – 15 000€</option>
                        <option value="15k+">15 000€ +</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
                        5. Zone géographique <span className="text-red-400">*</span>
                      </label>
                      <select
                        value={answers.geography}
                        onChange={e => setAnswers(p => ({ ...p, geography: e.target.value }))}
                        className="w-full bg-[#151524] border border-[#2a2a42] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/60 transition-colors"
                      >
                        <option value="">Sélectionner...</option>
                        <option value="local">Local / Région</option>
                        <option value="national">France entière</option>
                        <option value="europe">Europe</option>
                        <option value="international">International</option>
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={handleGenerate}
                    disabled={!canSubmit()}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <span>✨</span> Générer mon profil business
                  </button>
                </div>
              )}

              {/* Step 2 — Loading */}
              {step === 'loading' && (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                  <div className="w-12 h-12 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin" />
                  <p className="text-gray-300 text-sm">L&apos;IA analyse votre business et génère votre profil...</p>
                  <p className="text-gray-500 text-xs">~10 secondes</p>
                </div>
              )}

              {/* Step 3 — Preview */}
              {step === 'preview' && preview && (
                <div className="flex flex-col gap-4">
                  {error && (
                    <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                      ❌ {error}
                    </div>
                  )}
                  <p className="text-sm text-gray-400">Vérifiez les champs générés. Vous pourrez les modifier depuis la page profil.</p>

                  <div className="grid grid-cols-2 gap-3">
                    <PreviewField label="Type d'offre" value={OFFER_TYPE_LABELS[preview.offerType] ?? preview.offerType} />
                    <PreviewField label="Panier moyen" value={PRICE_RANGE_LABELS[preview.priceRange] ?? preview.priceRange} />
                    <PreviewField label="Durée typique" value={DURATION_LABELS[preview.typicalDuration] ?? preview.typicalDuration} />
                    <PreviewField label="Langue" value={LANG_LABELS[preview.workLanguages] ?? preview.workLanguages} />
                    <PreviewField label="Zone" value={GEO_LABELS[preview.targetGeography] ?? preview.targetGeography} />
                  </div>

                  <PreviewField label="Description offre" value={preview.offerDescription} />
                  <PreviewField label="Client idéal (ICP)" value={preview.targetClient} />
                  <PreviewField label="Problème résolu" value={preview.clientPainPoint} />
                  <PreviewField label="Proposition de valeur" value={preview.valueProposition} />
                  <div className="grid grid-cols-2 gap-3">
                    <PreviewField label="Concurrents" value={preview.competitors} />
                    <PreviewField label="Différenciateur" value={preview.differentiator} />
                  </div>

                  <div className="bg-[#151524] border border-[#2a2a42] rounded-lg p-3">
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Brief commercial</p>
                    <p className="text-xs text-gray-300 whitespace-pre-line line-clamp-6">{preview.briefContent}</p>
                  </div>

                  <div className="flex gap-3 mt-2">
                    <button
                      onClick={() => setStep('questions')}
                      className="flex-1 py-2 border border-[#2a2a42] text-gray-300 hover:text-white text-sm rounded-lg transition-colors"
                    >
                      ← Modifier les réponses
                    </button>
                    <button
                      onClick={handleSave}
                      className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <span>💾</span> Enregistrer dans mon Brain
                    </button>
                  </div>
                </div>
              )}

              {/* Step 4 — Saving */}
              {step === 'saving' && (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                  <div className="w-12 h-12 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin" />
                  <p className="text-gray-300 text-sm">Enregistrement dans votre Business Brain...</p>
                </div>
              )}

              {/* Step 5 — Done */}
              {step === 'done' && (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                  <div className="text-5xl">🧠</div>
                  <p className="text-white font-semibold text-lg">Business Brain mis à jour !</p>
                  <p className="text-gray-400 text-sm text-center">Votre profil a été enrichi. Les agents IA sont maintenant calibrés sur votre business.</p>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </>
  )
}

function PreviewField({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#151524] border border-[#2a2a42] rounded-lg p-3">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-sm text-white">{value || <span className="text-gray-600 italic">Non défini</span>}</p>
    </div>
  )
}
