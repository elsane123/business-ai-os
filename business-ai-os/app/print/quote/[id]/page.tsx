'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

interface QuoteLine {
  title: string
  description?: string
  qty: number
  unitPrice: number
  vatRate: number
  unit?: string
}

interface ClientInfo {
  name?: string
  address?: string
  zipCode?: string
  city?: string
  siret?: string
  email?: string
}

interface Quote {
  id: string
  number: string
  status: string
  lines: string
  subtotalHT: number
  totalVAT: number
  totalTTC: number
  validUntil?: string
  notes?: string
  clientInfo?: string
  createdAt: string
  prospect?: { name: string; company?: string }
  user?: {
    name?: string
    businessName?: string
    legalName?: string
    address?: string
    zipCode?: string
    city?: string
    siret?: string
    vatNumber?: string
    legalForm?: string
    email: string
  }
}

const fmt = (n: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n)
const fmtDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })

export default function PrintQuotePage() {
  const params = useParams()
  const id = params.id as string
  const [quote, setQuote] = useState<Quote | null>(null)
  const [user, setUser] = useState<Quote['user'] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      fetch(`/api/quotes?id=${id}`).then(r => r.ok ? r.json() : null),
      fetch('/api/auth/profile').then(r => r.ok ? r.json() : null)
    ]).then(([q, u]) => {
      if (!q) { setError('Devis introuvable ou accès refusé.'); setLoading(false); return }
      setQuote(q)
      setUser(u?.user ?? u)
      setLoading(false)
    })
  }, [id])

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', fontFamily:'sans-serif' }}>
      Chargement...
    </div>
  )

  if (error || !quote) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', fontFamily:'sans-serif', color:'red' }}>
      {error || 'Devis introuvable.'}
    </div>
  )

  const lines: QuoteLine[] = JSON.parse(quote.lines || '[]')
  const ci: ClientInfo = quote.clientInfo ? JSON.parse(quote.clientInfo) : {}
  const clientName = ci.name || quote.prospect?.name || ''

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1a1a2e; background: #fff; }
        .page { max-width: 210mm; margin: 0 auto; padding: 20mm; }
        .no-print { margin-bottom: 20px; display: flex; gap: 12px; }
        @media print {
          .no-print { display: none !important; }
          .page { padding: 15mm; }
          body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
        }
        table { width: 100%; border-collapse: collapse; }
        th { background: #4f46e5; color: #fff; padding: 8px 12px; text-align: left; font-size: 12px; }
        td { padding: 8px 12px; font-size: 13px; border-bottom: 1px solid #e5e7eb; }
        tr:last-child td { border-bottom: none; }
        .total-row td { font-weight: 600; background: #f9fafb; }
        .grand-total td { font-weight: 700; font-size: 15px; color: #4f46e5; background: #eef2ff; }
      `}</style>

      <div className="page">
        {/* Boutons impression (masqués à l'impression) */}
        <div className="no-print">
          <button onClick={() => window.print()} style={{ padding:'10px 24px', background:'#4f46e5', color:'#fff', border:'none', borderRadius:'8px', cursor:'pointer', fontSize:'14px', fontWeight:600 }}>
            🖨️ Imprimer / Sauvegarder en PDF
          </button>
          <button onClick={() => window.close()} style={{ padding:'10px 24px', background:'#f3f4f6', color:'#374151', border:'none', borderRadius:'8px', cursor:'pointer', fontSize:'14px' }}>
            ← Retour
          </button>
        </div>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'32px' }}>
          <div>
            <h1 style={{ fontSize:'28px', fontWeight:800, color:'#4f46e5', marginBottom:'4px' }}>
              {user?.businessName || user?.legalName || user?.name || 'Mon Entreprise'}
            </h1>
            {user?.legalForm && <p style={{ fontSize:'12px', color:'#6b7280' }}>{user.legalForm}</p>}
            {user?.address && <p style={{ fontSize:'12px', color:'#374151', marginTop:'4px' }}>{user.address}</p>}
            {(user?.zipCode || user?.city) && <p style={{ fontSize:'12px', color:'#374151' }}>{[user?.zipCode, user?.city].filter(Boolean).join(' ')}</p>}
            {user?.siret && <p style={{ fontSize:'12px', color:'#6b7280', marginTop:'4px' }}>SIRET : {user.siret}</p>}
            {user?.vatNumber && <p style={{ fontSize:'12px', color:'#6b7280' }}>TVA : {user.vatNumber}</p>}
            {user?.email && <p style={{ fontSize:'12px', color:'#6b7280' }}>{user.email}</p>}
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ background:'#4f46e5', color:'#fff', padding:'12px 20px', borderRadius:'12px', marginBottom:'8px' }}>
              <p style={{ fontSize:'11px', textTransform:'uppercase', letterSpacing:'1px', opacity:0.8 }}>Devis</p>
              <p style={{ fontSize:'20px', fontWeight:700 }}>{quote.number}</p>
            </div>
            <p style={{ fontSize:'12px', color:'#6b7280' }}>Émis le {fmtDate(quote.createdAt)}</p>
            {quote.validUntil && <p style={{ fontSize:'12px', color:'#6b7280' }}>Valide jusqu'au {fmtDate(quote.validUntil)}</p>}
          </div>
        </div>

        {/* Émetteur / Client */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'24px', marginBottom:'32px' }}>
          <div style={{ background:'#f9fafb', borderRadius:'8px', padding:'16px' }}>
            <p style={{ fontSize:'11px', color:'#6b7280', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'8px' }}>Émetteur</p>
            <p style={{ fontWeight:600, color:'#1a1a2e' }}>{user?.businessName || user?.legalName || user?.name}</p>
            {user?.address && <p style={{ fontSize:'13px', color:'#374151' }}>{user.address}</p>}
            {(user?.zipCode || user?.city) && <p style={{ fontSize:'13px', color:'#374151' }}>{[user?.zipCode, user?.city].filter(Boolean).join(' ')}</p>}
          </div>
          <div style={{ background:'#eef2ff', borderRadius:'8px', padding:'16px', borderLeft:'3px solid #4f46e5' }}>
            <p style={{ fontSize:'11px', color:'#6b7280', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'8px' }}>Client</p>
            {clientName && <p style={{ fontWeight:600, color:'#1a1a2e' }}>{clientName}</p>}
            {ci.address && <p style={{ fontSize:'13px', color:'#374151' }}>{ci.address}</p>}
            {(ci.zipCode || ci.city) && <p style={{ fontSize:'13px', color:'#374151' }}>{[ci.zipCode, ci.city].filter(Boolean).join(' ')}</p>}
            {ci.siret && <p style={{ fontSize:'12px', color:'#6b7280' }}>SIRET : {ci.siret}</p>}
            {ci.email && <p style={{ fontSize:'12px', color:'#6b7280' }}>{ci.email}</p>}
          </div>
        </div>

        {/* Tableau des prestations */}
        <table style={{ marginBottom:'24px' }}>
          <thead>
            <tr>
              <th style={{ width:'40%' }}>Désignation</th>
              <th style={{ textAlign:'center' }}>Qté</th>
              <th style={{ textAlign:'right' }}>P.U. HT</th>
              <th style={{ textAlign:'center' }}>TVA</th>
              <th style={{ textAlign:'right' }}>Total HT</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line, i) => (
              <tr key={i}>
                <td>
                  <p style={{ fontWeight:600 }}>{line.title}</p>
                  {line.description && <p style={{ fontSize:'12px', color:'#6b7280', marginTop:'2px' }}>{line.description}</p>}
                </td>
                <td style={{ textAlign:'center' }}>{line.qty}{line.unit ? ` ${line.unit}` : ''}</td>
                <td style={{ textAlign:'right' }}>{fmt(line.unitPrice)}</td>
                <td style={{ textAlign:'center' }}>{line.vatRate}%</td>
                <td style={{ textAlign:'right', fontWeight:600 }}>{fmt(line.qty * line.unitPrice)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="total-row"><td colSpan={4} style={{ textAlign:'right' }}>Total HT</td><td style={{ textAlign:'right' }}>{fmt(quote.subtotalHT)}</td></tr>
            <tr className="total-row"><td colSpan={4} style={{ textAlign:'right' }}>TVA</td><td style={{ textAlign:'right' }}>{fmt(quote.totalVAT)}</td></tr>
            <tr className="grand-total"><td colSpan={4} style={{ textAlign:'right' }}>Total TTC</td><td style={{ textAlign:'right' }}>{fmt(quote.totalTTC)}</td></tr>
          </tfoot>
        </table>

        {/* Notes */}
        {quote.notes && (
          <div style={{ background:'#f9fafb', borderRadius:'8px', padding:'16px', marginBottom:'24px' }}>
            <p style={{ fontSize:'11px', color:'#6b7280', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'8px' }}>Notes</p>
            <p style={{ fontSize:'13px', color:'#374151' }}>{quote.notes}</p>
          </div>
        )}

        {/* Mentions légales */}
        <div style={{ marginTop:'32px', paddingTop:'16px', borderTop:'1px solid #e5e7eb' }}>
          <p style={{ fontSize:'10px', color:'#9ca3af', lineHeight:'1.6' }}>
            En cas de retard de paiement, des pénalités de retard seront appliquées au taux légal en vigueur.
            Une indemnité forfaitaire de recouvrement de 40€ sera exigible (art. L.441-10 du Code de commerce).
            {' '}Pas d&apos;escompte pour paiement anticipé.
          </p>
        </div>
      </div>
    </>
  )
}