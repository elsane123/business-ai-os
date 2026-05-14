import { Resend } from 'resend'

export const resend = new Resend(process.env.RESEND_API_KEY)

const FROM = process.env.RESEND_FROM ?? 'noreply@businessaios.com'

export async function sendWelcomeEmail(email: string, name: string) {
  return resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Bienvenue sur Business AI OS 🚀',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto;">
        <h1 style="color: #4f46e5;">Bienvenue, ${name} !</h1>
        <p>Votre espace Business AI OS est prêt. Votre cerveau business vous attend.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/focus"
           style="display:inline-block;background:#4f46e5;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;">
          Accéder à mon tableau de bord
        </a>
        <p style="color:#666;font-size:14px;margin-top:24px;">L'équipe Business AI OS</p>
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

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://businessaios.com'

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
        <p style="color:#94a3b8;font-size:12px;margin-top:16px;">© 2026 Business AI OS · <a href="${appUrl}" style="color:#94a3b8;">businessaios.com</a></p>
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
