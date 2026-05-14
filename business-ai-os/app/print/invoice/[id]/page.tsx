'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

interface InvoiceLine { title: string; description?: string; qty: number; unitPrice: number; vatRate: number }
interface Invoice {
  id: string; number: string; status: string
  lines: string; notes?: string
  subtotalHT: number; totalVAT: number; totalTTC: number
  dueDate?: string; paidAt?: string; sentAt?: string
  createdAt: string
  prospect?: { name: string; company?: string; email?: string }
}
interface User {
  name?: string; email?: string; businessName?: string; legalName?: string
  address?: string; zipCode?: string; city?: string
  siret?: string; legalForm?: string; vatNumber?: string
  paymentTerms?: number; invoiceFooter?: string
}

const fmt = (n: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n)
const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  DRAFT:     { label: 'Brouillon',   color: '#6b7280' },
  SENT:      { label: 'Envoyée',     color: '#3b82f6' },
  PAID:      { label: 'Payée ✓',     color: '#10b981' },
  OVERDUE:   { label: 'En retard',   color: '#ef4444' },
  CANCELLED: { label: 'Annulée',     color: '#9ca3af' },
}

export default function PrintInvoicePage() {
  const params = useParams()
  const id = params.id as string
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      fetch(`/api/invoices?id=${id}`).then(r => r.ok ? r.json() : null),
      fetch('/api/auth/profile').then(r => r.ok ? r.json() : null)
    ]).then(([inv, u]) => {
      if (!inv) { setError('Facture introuvable ou accès refusé.'); setLoading(false); return }
      setInvoice(inv)
      setUser(u?.user ?? u)
      setLoading(false)
    })
  }, [id])

  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', fontFamily:'sans-serif' }}>Chargement...</div>
  if (error || !invoice) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', fontFamily:'sans-serif', color:'red' }}>{error || 'Facture introuvable'}</div>

  const lines: InvoiceLine[] = (() => { try { return JSON.parse(invoice.lines) } catch { return [] } })()
  const status = STATUS_LABELS[invoice.status] ?? { label: invoice.status, color: '#6b7280' }
  const isAutoEntrepreneur = !user?.vatNumber && (user?.legalForm === 'Auto-entrepreneur' || !user?.legalForm)

  return (
    <div style={{ fontFamily: 'Georgia, serif', background: '#f9fafb', minHeight: '100vh', padding: '20px' }}>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          div[style*='box-shadow'] { box-shadow: none !important; }
        }
        @page { margin: 15mm; size: A4; }
      `}</style>

      {/* Bouton imprimer */}
      <div className="no-print" style={{ display:'flex', justifyContent:'center', marginBottom:'20px', gap:'12px' }}>
        <button onClick={() => window.print()} style={{ padding:'10px 24px', background:'#4f46e5', color:'white', border:'none', borderRadius:'8px', cursor:'pointer', fontFamily:'sans-serif', fontSize:'14px', fontWeight:600 }}>🖨️ Imprimer / Sauvegarder en PDF</button>
        <button onClick={() => window.close()} style={{ padding:'10px 24px', background:'#6b7280', color:'white', border:'none', borderRadius:'8px', cursor:'pointer', fontFamily:'sans-serif', fontSize:'14px' }}>✕ Fermer</button>
      </div>

      {/* Document */}
      <div style={{ maxWidth:'800px', margin:'0 auto', background:'white', padding:'48px', boxShadow:'0 4px 24px rgba(0,0,0,0.08)', borderRadius:'8px' }}>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'40px' }}>
          {/* Émetteur */}
          <div style={{ flex:1 }}>
            <h2 style={{ margin:0, fontSize:'20px', fontWeight:700, color:'#1a1a2e' }}>
              {user?.legalName || user?.businessName || user?.name || 'Mon Entreprise'}
            </h2>
            {user?.legalForm && <p style={{ fontSize:'12px', color:'#6b7280', margin:'2px 0' }}>{user.legalForm}</p>}
            {user?.address && <p style={{ fontSize:'12px', color:'#374151', marginTop:'6px' }}>{user.address}</p>}
            {(user?.zipCode || user?.city) && <p style={{ fontSize:'12px', color:'#374151' }}>{[user?.zipCode, user?.city].filter(Boolean).join(' ')}</p>}
            {user?.siret && <p style={{ fontSize:'12px', color:'#6b7280', marginTop:'4px' }}>SIRET : {user.siret}</p>}
            {user?.vatNumber && <p style={{ fontSize:'12px', color:'#6b7280' }}>N° TVA : {user.vatNumber}</p>}
            {user?.email && <p style={{ fontSize:'12px', color:'#6b7280' }}>{user.email}</p>}
          </div>

          {/* Badge FACTURE */}
          <div style={{ textAlign:'right' }}>
            <div style={{ background:'#1a1a2e', color:'white', padding:'12px 24px', borderRadius:'6px', display:'inline-block' }}>
              <p style={{ margin:0, fontSize:'11px', textTransform:'uppercase', letterSpacing:'2px', opacity:0.7 }}>Facture</p>
              <p style={{ margin:'4px 0 0', fontSize:'22px', fontWeight:700 }}>{invoice.number}</p>
            </div>
            <div style={{ marginTop:'12px', fontSize:'13px', color:'#374151' }}>
              <p style={{ margin:0 }}>Date : {fmtDate(invoice.createdAt)}</p>
              {invoice.dueDate && <p style={{ margin:'4px 0 0' }}>Échéance : <strong>{fmtDate(invoice.dueDate)}</strong></p>}
              <span style={{ display:'inline-block', marginTop:'6px', padding:'3px 10px', borderRadius:'12px', fontSize:'12px', background: status.color + '20', color: status.color, fontFamily:'sans-serif', fontWeight:600 }}>{status.label}</span>
            </div>
          </div>
        </div>

        {/* Facturé à */}
        <div style={{ background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:'8px', padding:'16px', marginBottom:'32px' }}>
          <p style={{ margin:'0 0 8px', fontSize:'11px', fontWeight:600, color:'#6b7280', textTransform:'uppercase', letterSpacing:'1px', fontFamily:'sans-serif' }}>Facturé à</p>
          {invoice.prospect ? (
            <>
              <p style={{ margin:0, fontWeight:600, color:'#1a1a2e', fontSize:'15px' }}>{invoice.prospect.name}</p>
              {invoice.prospect.company && <p style={{ margin:'2px 0 0', fontSize:'13px', color:'#374151' }}>{invoice.prospect.company}</p>}
              {invoice.prospect.email && <p style={{ margin:'4px 0 0', fontSize:'13px', color:'#6b7280' }}>{invoice.prospect.email}</p>}
            </>
          ) : (
            <p style={{ margin:0, color:'#9ca3af', fontSize:'13px' }}>Client non renseigné</p>
          )}
        </div>

        {/* Tableau des lignes */}
        <table style={{ width:'100%', borderCollapse:'collapse', marginBottom:'24px', fontFamily:'sans-serif', fontSize:'13px' }}>
          <thead>
            <tr style={{ background:'#1a1a2e', color:'white' }}>
              <th style={{ padding:'10px 12px', textAlign:'left', fontWeight:600 }}>Désignation</th>
              <th style={{ padding:'10px 12px', textAlign:'center', fontWeight:600 }}>Qté</th>
              <th style={{ padding:'10px 12px', textAlign:'right', fontWeight:600 }}>P.U. HT</th>
              {!isAutoEntrepreneur && <th style={{ padding:'10px 12px', textAlign:'center', fontWeight:600 }}>TVA</th>}
              <th style={{ padding:'10px 12px', textAlign:'right', fontWeight:600 }}>Total HT</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l, i) => (
              <tr key={i} style={{ borderBottom:'1px solid #e5e7eb', background: i%2===0 ? 'white' : '#f9fafb' }}>
                <td style={{ padding:'10px 12px', color:'#1a1a2e' }}>
                  <div style={{ fontWeight:500 }}>{l.title}</div>
                  {l.description && <div style={{ fontSize:'12px', color:'#6b7280', marginTop:'2px' }}>{l.description}</div>}
                </td>
                <td style={{ padding:'10px 12px', textAlign:'center', color:'#374151' }}>{l.qty}</td>
                <td style={{ padding:'10px 12px', textAlign:'right', color:'#374151' }}>{fmt(l.unitPrice)}</td>
                {!isAutoEntrepreneur && <td style={{ padding:'10px 12px', textAlign:'center', color:'#374151' }}>{l.vatRate}%</td>}
                <td style={{ padding:'10px 12px', textAlign:'right', fontWeight:500, color:'#1a1a2e' }}>{fmt(l.qty * l.unitPrice)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totaux */}
        <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:'32px' }}>
          <div style={{ width:'260px', fontFamily:'sans-serif' }}>
            <div style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', fontSize:'13px', color:'#374151' }}>
              <span>Total HT</span><span>{fmt(invoice.subtotalHT)}</span>
            </div>
            {!isAutoEntrepreneur && (
              <div style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', fontSize:'13px', color:'#374151' }}>
                <span>TVA</span><span>{fmt(invoice.totalVAT)}</span>
              </div>
            )}
            <div style={{ display:'flex', justifyContent:'space-between', padding:'10px 12px', fontSize:'16px', fontWeight:700, background:'#1a1a2e', color:'white', borderRadius:'6px', marginTop:'8px' }}>
              <span>Total TTC</span><span>{fmt(invoice.totalTTC)}</span>
            </div>
            {invoice.paidAt && (
              <div style={{ marginTop:'8px', padding:'6px 12px', background:'#d1fae5', borderRadius:'6px', fontSize:'12px', color:'#065f46', textAlign:'center', fontWeight:600 }}>
                ✓ Payée le {fmtDate(invoice.paidAt)}
              </div>
            )}
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div style={{ marginBottom:'24px', padding:'12px 16px', background:'#f8fafc', borderLeft:'3px solid #4f46e5', borderRadius:'4px', fontFamily:'sans-serif' }}>
            <p style={{ margin:'0 0 4px', fontSize:'11px', fontWeight:600, color:'#6b7280', textTransform:'uppercase' }}>Notes</p>
            <p style={{ margin:0, fontSize:'13px', color:'#374151', whiteSpace:'pre-wrap' }}>{invoice.notes}</p>
          </div>
        )}

        {/* RIB / Pied de page personnalisé */}
        {user?.invoiceFooter && (
          <div style={{ marginBottom:'24px', padding:'12px 16px', background:'#eff6ff', borderRadius:'6px', fontFamily:'sans-serif', fontSize:'13px', color:'#1e40af', whiteSpace:'pre-wrap' }}>
            {user.invoiceFooter}
          </div>
        )}

        {/* Mentions légales obligatoires */}
        <div style={{ borderTop:'1px solid #e5e7eb', paddingTop:'16px', fontFamily:'sans-serif', fontSize:'11px', color:'#9ca3af', lineHeight:'1.6' }}>
          {isAutoEntrepreneur && (
            <p style={{ marginBottom:'6px' }}>TVA non applicable, article 293B du CGI</p>
          )}
          <p style={{ marginBottom:'4px' }}>En cas de retard de paiement, des pénalités de retard seront appliquées au taux légal en vigueur.</p>
          <p style={{ marginBottom:'4px' }}>Indemnité forfaitaire pour frais de recouvrement : 40€ (art. L441-10 du Code de commerce).</p>
          <p>Escompte pour règlement anticipé : aucun.</p>
        </div>

      </div>
    </div>
  )
}