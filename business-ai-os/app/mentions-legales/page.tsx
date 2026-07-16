export const metadata = {
  title: 'Mentions Légales | Brainlo',
  description: 'Mentions légales de Brainlo, édité par Quotium Technologies.',
}

export default function MentionsLegalesPage() {
  return (
    <main style={{
      maxWidth: 800,
      margin: '0 auto',
      padding: '3rem 1.5rem 5rem',
      fontFamily: 'system-ui, sans-serif',
      color: '#1e293b',
      lineHeight: 1.7,
    }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
        Mentions Légales
      </h1>
      <p style={{ color: '#64748b', marginBottom: '2.5rem', fontSize: '0.9rem' }}>
        Dernière mise à jour : juillet 2026
      </p>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.75rem' }}>1. Éditeur du site</h2>
        <p>
          Le site <strong>brainlo.ai</strong> est édité par la société :
        </p>
        <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem', listStyle: 'none' }}>
          <li><strong>Raison sociale :</strong> Quotium Technologies</li>
          <li><strong>Adresse :</strong> 84/88 Boulevard de la Mission Marchand, 92400 Courbevoie</li>
          <li><strong>E-mail :</strong> <a href="mailto:contact@brainlo.ai" style={{ color: '#6366f1' }}>contact@brainlo.ai</a></li>
        </ul>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.75rem' }}>2. Directeur de la publication</h2>
        <p>
          Le directeur de la publication est le représentant légal de la société Quotium Technologies.
        </p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.75rem' }}>3. Hébergement</h2>
        <p>
          Le site brainlo.ai est hébergé par un prestataire de services cloud. Pour toute question relative
          à l&apos;hébergement, veuillez contacter : <a href="mailto:contact@brainlo.ai" style={{ color: '#6366f1' }}>contact@brainlo.ai</a>.
        </p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.75rem' }}>4. Propriété intellectuelle</h2>
        <p>
          L&apos;ensemble des contenus présents sur le site brainlo.ai (textes, graphismes, logotypes, icônes,
          images, éléments audio ou vidéo) est la propriété exclusive de Quotium Technologies ou de ses
          partenaires. Toute reproduction, distribution, modification ou utilisation de ces contenus,
          sans autorisation préalable écrite de Quotium Technologies, est strictement interdite.
        </p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.75rem' }}>5. Limitation de responsabilité</h2>
        <p>
          Quotium Technologies s&apos;efforce d&apos;assurer l&apos;exactitude et la mise à jour des informations
          diffusées sur ce site. Toutefois, elle ne peut garantir l&apos;exactitude, la précision ou l&apos;exhaustivité
          des informations mises à la disposition sur ce site. En conséquence, Quotium Technologies décline
          toute responsabilité pour toute imprécision, inexactitude ou omission portant sur des informations
          disponibles sur ce site.
        </p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.75rem' }}>6. Données personnelles</h2>
        <p>
          Pour toute information relative au traitement de vos données personnelles, veuillez consulter notre{' '}
          <a href="/confidentialite" style={{ color: '#6366f1' }}>Politique de Confidentialité</a>.
        </p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.75rem' }}>7. Droit applicable</h2>
        <p>
          Les présentes mentions légales sont soumises au droit français. En cas de litige, et à défaut de
          résolution amiable, les tribunaux français seront seuls compétents.
        </p>
      </section>

      <div style={{ marginTop: '3rem', borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem' }}>
        <a href="/" style={{ color: '#6366f1', textDecoration: 'none', fontSize: '0.9rem' }}>← Retour à l&apos;accueil</a>
        {' · '}
        <a href="/confidentialite" style={{ color: '#6366f1', textDecoration: 'none', fontSize: '0.9rem' }}>Politique de Confidentialité</a>
      </div>
    </main>
  )
}
