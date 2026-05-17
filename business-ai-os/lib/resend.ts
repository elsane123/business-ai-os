import { Resend } from 'resend'

export const resend = new Resend(process.env.RESEND_API_KEY)

const FROM = process.env.RESEND_FROM ?? 'noreply@brainlo.ai'

export async function sendWelcomeEmail(email: string, name: string) {
  return resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Bienvenue sur Brainlo 🚀',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto;">
        <h1 style="color: #4f46e5;">Bienvenue, ${name} !</h1>
        <p>Votre espace Brainlo est prêt. Votre cerveau business vous attend.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/focus"
           style="display:inline-block;background:#4f46e5;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;">
          Accéder à mon tableau de bord
        </a>
        <p style="color:#666;font-size:14px;margin-top:24px;">L'équipe Brainlo</p>
      </div>
    `,
  })
}

export async function sendAssessmentEmail(
  email: string,
  firstName: string,
  scores: { founder_dependency: number; knowledge_systems: number; sales_delivery: number; operations_workflow: number; growth_capacity: number; ai_foundation: number; total: number },
  roi: { totalHours: number; timeValue: number; revenueMissed: number; totalMonthly: number; annualImpact: number },
  synthesis: string
) {
  const pct = Math.round((scores.total / 59) * 100)
  const gaugeColor = pct >= 70 ? '#22c55e' : pct >= 40 ? '#f59e0b' : '#ef4444'

  const sectionRows = [
    { label: 'Dépendance fondateur', score: scores.founder_dependency, max: 12 },
    { label: 'Systèmes de connaissance', score: scores.knowledge_systems, max: 6 },
    { label: 'Ventes & Delivery', score: scores.sales_delivery, max: 9 },
    { label: 'Opérations & Workflow', score: scores.operations_workflow, max: 12 },
    { label: 'Capacité de croissance', score: scores.growth_capacity, max: 12 },
    { label: 'Fondation IA', score: scores.ai_foundation, max: 8 },
  ]
    .map((s) => {
      const p = Math.round((s.score / s.max) * 100)
      const c = p >= 70 ? '#22c55e' : p >= 40 ? '#f59e0b' : '#ef4444'
      const emoji = p >= 70 ? '🟢' : p >= 40 ? '🟡' : '🔴'
      return `<tr><td style="padding:8px 12px;font-size:14px;color:#374151;">${emoji} ${s.label}</td><td style="padding:8px 12px;font-size:14px;font-weight:700;color:${c};text-align:right;">${s.score}/${s.max}</td></tr>`
    })
    .join('')

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://brainlo.ai'

  const html = `
  <div style="font-family:Inter,system-ui,sans-serif;max-width:600px;margin:auto;background:#f8fafc;padding:32px 16px;">
    <div style="background:white;border-radius:16px;padding:32px;box-shadow:0 4px 24px rgba(0,0,0,0.07);">
      <div style="text-align:center;margin-bottom:32px;">
        <div style="display:inline-flex;align-items:center;gap:8px;background:#ede9fe;border-radius:99px;padding:6px 18px;font-size:13px;color:#7c3aed;font-weight:600;margin-bottom:16px;">🎯 Votre Diagnostic IA</div>
        <h1 style="font-size:24px;font-weight:800;color:#0f172a;margin:0 0 8px;">Bonjour ${firstName} !</h1>
        <p style="color:#64748b;font-size:15px;margin:0;">Voici les résultats de votre diagnostic Business IA</p>
      </div>

      <!-- Score global -->
      <div style="text-align:center;margin-bottom:32px;">
        <div style="display:inline-block;position:relative;width:120px;height:120px;">
          <svg viewBox="0 0 120 120" width="120" height="120">
            <circle cx="60" cy="60" r="54" fill="none" stroke="#e2e8f0" stroke-width="12"/>
            <circle cx="60" cy="60" r="54" fill="none" stroke="${gaugeColor}" stroke-width="12"
              stroke-dasharray="${Math.round(2 * 3.14159 * 54 * pct / 100)} ${Math.round(2 * 3.14159 * 54)}"
              stroke-dashoffset="${Math.round(2 * 3.14159 * 54 * 0.25)}"
              stroke-linecap="round" transform="rotate(-90 60 60)"/>
            <text x="60" y="55" text-anchor="middle" font-size="22" font-weight="800" fill="#0f172a">${scores.total}</text>
            <text x="60" y="72" text-anchor="middle" font-size="12" fill="#64748b">/59</text>
          </svg>
        </div>
        <p style="margin:12px 0 0;font-size:20px;font-weight:700;color:${gaugeColor};">${pct}% de maturité IA</p>
      </div>

      <!-- Sections -->
      <div style="margin-bottom:24px;">
        <h2 style="font-size:16px;font-weight:700;color:#0f172a;margin:0 0 12px;">📊 Score par domaine</h2>
        <table style="width:100%;border-collapse:collapse;background:#f8fafc;border-radius:10px;overflow:hidden;">
          ${sectionRows}
        </table>
      </div>

      <!-- ROI -->
      <div style="background:linear-gradient(135deg,#ede9fe,#ddd6fe);border-radius:12px;padding:20px;margin-bottom:24px;">
        <h2 style="font-size:16px;font-weight:700;color:#4f46e5;margin:0 0 16px;">💰 Votre ROI estimé</h2>
        <div style="display:grid;gap:12px;">
          <div style="display:flex;justify-content:space-between;"><span style="color:#6b7280;font-size:14px;">⏱ Heures récupérables/mois</span><strong style="color:#0f172a;">${roi.totalHours}h</strong></div>
          <div style="display:flex;justify-content:space-between;"><span style="color:#6b7280;font-size:14px;">💼 Valeur temps mensuelle</span><strong style="color:#0f172a;">${roi.timeValue.toLocaleString('fr-FR')} €</strong></div>
          <div style="display:flex;justify-content:space-between;"><span style="color:#6b7280;font-size:14px;">📈 CA manqué estimé/mois</span><strong style="color:#0f172a;">${roi.revenueMissed.toLocaleString('fr-FR')} €</strong></div>
          <div style="border-top:1px solid rgba(79,70,229,0.2);padding-top:12px;display:flex;justify-content:space-between;"><span style="color:#4f46e5;font-weight:700;">🎯 Impact annuel total</span><strong style="color:#4f46e5;font-size:18px;">${roi.annualImpact.toLocaleString('fr-FR')} €</strong></div>
        </div>
      </div>

      <!-- Synthèse IA -->
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px;margin-bottom:32px;">
        <h2 style="font-size:16px;font-weight:700;color:#166534;margin:0 0 12px;">🤖 Synthèse IA personnalisée</h2>
        <p style="color:#15803d;font-size:14px;line-height:1.7;margin:0;">${synthesis}</p>
      </div>

      <!-- CTA -->
      <div style="text-align:center;">
        <a href="${appUrl}/onboarding" style="display:inline-block;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:white;font-weight:700;font-size:15px;padding:14px 32px;border-radius:12px;text-decoration:none;box-shadow:0 4px 16px rgba(79,70,229,0.4);">🚀 Créer mon compte gratuit</a>
        <p style="color:#94a3b8;font-size:12px;margin-top:16px;">© 2026 Brainlo · <a href="${appUrl}" style="color:#94a3b8;">brainlo.ai</a></p>
      </div>
    </div>
  </div>`

  return resend.emails.send({
    from: FROM,
    to: email,
    subject: `🎯 Votre diagnostic IA : ${scores.total}/59 — ${pct}% de maturité IA`,
    html,
  })
}

export async function sendDailyFocusEmail(email: string, name: string, actions: string[]) {
  const actionsHtml = actions
    .map((a, i) => `<li style="margin:8px 0;"><strong>${i + 1}.</strong> ${a}</li>`)
    .join('')

  return resend.emails.send({
    from: FROM,
    to: email,
    subject: `🎯 Votre focus du jour — ${new Date().toLocaleDateString('fr-FR')}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto;">
        <h2 style="color: #4f46e5;">Bonjour ${name}, voici vos 3 actions du jour :</h2>
        <ul style="padding-left:20px;">${actionsHtml}</ul>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/focus"
           style="display:inline-block;background:#4f46e5;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;">
          Voir mon Focus complet
        </a>
      </div>
    `,
  })
}

// ─── Monthly Report Email ─────────────────────────────────────────────────────

interface MonthlyReportData {
  month: string
  business: { name?: string; goal?: number }
  finance: { ca: number; charges: number; net: number; goalProgress: number | null; topExpenses: { category: string; amount: number }[] }
  pipeline: { totalProspects: number; activeProspects: number; wonThisMonth: number; wonRevenue: number; pipelineValue: number; conversionRate: number }
  tasks: { completed: number; total: number; completionRate: number }
  focus: { activeDays: number; daysInMonth: number; engagementRate: number }
}

export async function sendMonthlyReportEmail(email: string, name: string, report: MonthlyReportData) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://brainlo.ai'
  const netColor = report.finance.net >= 0 ? '#22c55e' : '#ef4444'
  const netSign = report.finance.net >= 0 ? '+' : ''

  const topExpensesHtml = report.finance.topExpenses.length > 0
    ? report.finance.topExpenses
        .map(e => `<tr><td style="padding:6px 12px;color:#374151;font-size:13px;">${e.category}</td><td style="padding:6px 12px;text-align:right;font-weight:600;color:#374151;font-size:13px;">${e.amount.toLocaleString('fr-FR')} \u20ac</td></tr>`)
        .join('')
    : '<tr><td colspan="2" style="padding:8px 12px;color:#9ca3af;font-size:13px;">Aucune d\u00e9pense ce mois</td></tr>'

  const goalBar = report.finance.goalProgress !== null
    ? `<div style="margin-top:8px;"><div style="background:#e2e8f0;border-radius:99px;height:8px;"><div style="background:#4f46e5;border-radius:99px;height:8px;width:${Math.min(report.finance.goalProgress, 100)}%;"></div></div><p style="margin:4px 0 0;font-size:12px;color:#64748b;">${report.finance.goalProgress}% de l'objectif atteint</p></div>`
    : ''

  const html = `
  <div style="font-family:Inter,system-ui,sans-serif;max-width:620px;margin:auto;background:#f8fafc;padding:32px 16px;">
    <div style="background:white;border-radius:16px;padding:32px;box-shadow:0 4px 24px rgba(0,0,0,0.07);">
      <div style="text-align:center;margin-bottom:32px;">
        <div style="display:inline-flex;align-items:center;gap:8px;background:#ede9fe;border-radius:99px;padding:6px 18px;font-size:13px;color:#7c3aed;font-weight:600;margin-bottom:12px;">Rapport Mensuel</div>
        <h1 style="font-size:22px;font-weight:800;color:#0f172a;margin:0 0 4px;">Bilan ${report.month}</h1>
        <p style="color:#64748b;font-size:14px;margin:0;">Bonjour ${name} - voici le r\u00e9sum\u00e9 de ${report.business.name ?? 'votre activit\u00e9'}</p>
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:24px;">
        <div style="background:#f0fdf4;border-radius:12px;padding:16px;text-align:center;">
          <p style="margin:0;font-size:11px;color:#6b7280;text-transform:uppercase;">CA</p>
          <p style="margin:4px 0 0;font-size:20px;font-weight:800;color:#22c55e;">${report.finance.ca.toLocaleString('fr-FR')} \u20ac</p>
        </div>
        <div style="background:#fef2f2;border-radius:12px;padding:16px;text-align:center;">
          <p style="margin:0;font-size:11px;color:#6b7280;text-transform:uppercase;">Charges</p>
          <p style="margin:4px 0 0;font-size:20px;font-weight:800;color:#ef4444;">${report.finance.charges.toLocaleString('fr-FR')} \u20ac</p>
        </div>
        <div style="background:#f0f9ff;border-radius:12px;padding:16px;text-align:center;">
          <p style="margin:0;font-size:11px;color:#6b7280;text-transform:uppercase;">Net</p>
          <p style="margin:4px 0 0;font-size:20px;font-weight:800;color:${netColor};">${netSign}${report.finance.net.toLocaleString('fr-FR')} \u20ac</p>
        </div>
      </div>
      ${goalBar}
      <div style="margin-bottom:24px;">
        <h2 style="font-size:15px;font-weight:700;color:#0f172a;margin:0 0 10px;">Top d\u00e9penses</h2>
        <table style="width:100%;border-collapse:collapse;background:#f8fafc;border-radius:10px;">
          ${topExpensesHtml}
        </table>
      </div>
      <div style="background:linear-gradient(135deg,#ede9fe,#ddd6fe);border-radius:12px;padding:20px;margin-bottom:24px;">
        <h2 style="font-size:15px;font-weight:700;color:#4f46e5;margin:0 0 12px;">Pipeline commercial</h2>
        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;">
          <div><p style="margin:0;font-size:12px;color:#6b7280;">Prospects actifs</p><p style="margin:2px 0 0;font-size:16px;font-weight:700;">${report.pipeline.activeProspects}</p></div>
          <div><p style="margin:0;font-size:12px;color:#6b7280;">Deals gagn\u00e9s</p><p style="margin:2px 0 0;font-size:16px;font-weight:700;color:#22c55e;">${report.pipeline.wonThisMonth} (${report.pipeline.wonRevenue.toLocaleString('fr-FR')} \u20ac)</p></div>
          <div><p style="margin:0;font-size:12px;color:#6b7280;">Pipeline total</p><p style="margin:2px 0 0;font-size:16px;font-weight:700;color:#4f46e5;">${report.pipeline.pipelineValue.toLocaleString('fr-FR')} \u20ac</p></div>
          <div><p style="margin:0;font-size:12px;color:#6b7280;">Taux conversion</p><p style="margin:2px 0 0;font-size:16px;font-weight:700;">${report.pipeline.conversionRate}%</p></div>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:16px;margin-bottom:32px;">
        <div style="background:#f0fdf4;border-radius:12px;padding:16px;">
          <h3 style="margin:0 0 8px;font-size:14px;font-weight:700;color:#166534;">T\u00e2ches</h3>
          <p style="margin:0;font-size:24px;font-weight:800;color:#22c55e;">${report.tasks.completionRate}%</p>
          <p style="margin:2px 0 0;font-size:12px;color:#6b7280;">${report.tasks.completed}/${report.tasks.total} compl\u00e9t\u00e9es</p>
        </div>
        <div style="background:#eff6ff;border-radius:12px;padding:16px;">
          <h3 style="margin:0 0 8px;font-size:14px;font-weight:700;color:#1d4ed8;">Focus streak</h3>
          <p style="margin:0;font-size:24px;font-weight:800;color:#3b82f6;">${report.focus.engagementRate}%</p>
          <p style="margin:2px 0 0;font-size:12px;color:#6b7280;">${report.focus.activeDays}/${report.focus.daysInMonth} jours actifs</p>
        </div>
      </div>
      <div style="text-align:center;">
        <a href="${appUrl}/cash" style="display:inline-block;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:white;font-weight:700;font-size:14px;padding:12px 28px;border-radius:10px;text-decoration:none;">Voir mon tableau de bord</a>
        <p style="color:#94a3b8;font-size:12px;margin-top:16px;">Brainlo - brainlo.ai</p>
      </div>
    </div>
  </div>`

  return resend.emails.send({
    from: FROM,
    to: email,
    subject: `Votre bilan ${report.month} - ${report.business.name ?? 'Brainlo'}`,
    html,
  })
}
