import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { computeScores, computeROI, getWeakestSection, QUESTIONS, LEADS_MAP, SECTION_LABELS } from '@/lib/assessment'
import { chatCompletion } from '@/lib/openrouter'
import { sendAssessmentEmail } from '@/lib/resend'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { firstName, lastName, email, answers, roiInputs } = body

    if (!firstName || !lastName || !email || !answers) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // 1. Compute scores
    const scores = computeScores(answers)

    // 2. Extract ROI inputs from answers or use provided values
    const q6Ans = answers[5] // slider value for avg client value
    const q7Ans = answers[6] // slider value for hourly rate
    const q8Ans = answers[7] // slider value for conversion rate
    const q5Idx = answers[4] // index for leads per month question

    const finalROIInputs = roiInputs ?? {
      avgClientValue: typeof q6Ans === 'number' ? q6Ans : 5000,
      hourlyRate: typeof q7Ans === 'number' ? q7Ans : 150,
      conversionRate: typeof q8Ans === 'number' ? q8Ans : 25,
      leadsPerMonth: typeof q5Idx === 'number' ? (LEADS_MAP[q5Idx] ?? 12) : 12,
    }

    const roi = computeROI(finalROIInputs, scores)

    // 3. Get context for AI synthesis
    const weakestSection = getWeakestSection(scores)
    const weakestLabel = SECTION_LABELS[weakestSection] ?? weakestSection
    const q1Answer = QUESTIONS[0]?.options?.[answers[0] as number]?.label ?? 'Non précisé'

    // 4. Generate AI synthesis
    let synthesis = ''
    try {
      synthesis = await chatCompletion(
        [
          {
            role: 'system',
            content:
              'Tu es un expert en transformation IA pour PME. Sois direct, concis, business. Pas de jargon. Maximum 3 phrases.',
          },
          {
            role: 'user',
            content: `Diagnostic business:\n- Score total: ${scores.total}/59\n- Section la plus faible: ${weakestLabel} (${(scores[weakestSection as keyof typeof scores] as number)}/${{
              founder_dependency: 12,
              knowledge_systems: 6,
              sales_delivery: 9,
              operations_workflow: 12,
              growth_capacity: 12,
              ai_foundation: 8,
            }[weakestSection]})\n- CA moyen/client: ${finalROIInputs.avgClientValue}€\n- Taux horaire: ${finalROIInputs.hourlyRate}€/h\n- Problème prioritaire déclaré: ${q1Answer}\n\nÉcris une synthèse personnalisée de 3 phrases maximum. Focus sur le principal frein identifié et la première action concrète à prendre. Langue: français.`,
          },
        ],
        { max_tokens: 400, temperature: 0.7 }
      )
    } catch (e) {
      // Fallback template synthesis
      synthesis = `Votre score de ${scores.total}/59 révèle que votre principal frein se situe dans la section "${weakestLabel}". En automatisant cette zone, vous pourriez récupérer jusqu'à ${roi.totalHours} heures par mois, soit ${roi.timeValue.toLocaleString('fr-FR')}€ de valeur temps. La première action : documenter vos processus clés et les connecter à un outil IA pour déléguer les tâches répétitives.`
    }

    // 5. Save to DB
    const lead = await prisma.assessmentLead.create({
      data: {
        firstName,
        lastName,
        email,
        answers: JSON.stringify(answers),
        scores: JSON.stringify(scores),
        totalScore: scores.total,
        roiData: JSON.stringify(finalROIInputs),
        synthesis,
      },
    })

    // 6. Send email (non-blocking)
    sendAssessmentEmail(email, firstName, scores, roi, synthesis).catch(console.error)

    return NextResponse.json({
      success: true,
      id: lead.id,
      scores,
      roi,
      synthesis,
    })
  } catch (error) {
    console.error('Assessment API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
