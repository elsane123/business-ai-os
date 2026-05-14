import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

interface CompanyResult {
  nom_complet: string
  siren: string
  siret?: string
  siege?: {
    siret: string
    commune?: string
    code_postal?: string
    adresse?: string
  }
  activite_principale?: string
  categorie_entreprise?: string
  tranche_effectif_salarie?: string
  date_creation?: string
  nombre_etablissements?: number
}

const EMPLOYEE_LABELS: Record<string, string> = {
  'NN': 'Non renseigné',
  '00': '0 salarié',
  '01': '1–2 salariés',
  '02': '3–5 salariés',
  '03': '6–9 salariés',
  '11': '10–19 salariés',
  '12': '20–49 salariés',
  '21': '50–99 salariés',
  '22': '100–199 salariés',
  '31': '200–249 salariés',
  '32': '250–499 salariés',
  '41': '500–999 salariés',
  '42': '1 000–1 999 salariés',
  '51': '2 000–4 999 salariés',
  '52': '5 000–9 999 salariés',
  '53': '10 000+ salariés',
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')?.trim()

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] })
    }

    // Call the free French government API — no API key needed
    const url = `https://recherche-entreprises.api.gouv.fr/search?q=${encodeURIComponent(query)}&per_page=5&mtm_campaign=businessaios`
    
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(5000),
    })

    if (!res.ok) {
      return NextResponse.json({ results: [] })
    }

    const data = await res.json()
    const companies = (data.results as CompanyResult[]) ?? []

    const results = companies.map((c) => ({
      name: c.nom_complet ?? '',
      siren: c.siren ?? '',
      siret: c.siege?.siret ?? c.siret ?? '',
      city: c.siege?.commune ?? '',
      postalCode: c.siege?.code_postal ?? '',
      address: c.siege?.adresse ?? '',
      nafCode: c.activite_principale ?? '',
      employeeRange: EMPLOYEE_LABELS[c.categorie_entreprise ?? ''] ?? c.tranche_effectif_salarie ?? '',
      category: c.categorie_entreprise ?? '',
      createdAt: c.date_creation ?? '',
      linkedinSearchUrl: `https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(c.nom_complet ?? query)}`,
    }))

    return NextResponse.json({ results })
  } catch (error) {
    console.error('[pipeline/enrich]', error)
    return NextResponse.json({ results: [] })
  }
}
