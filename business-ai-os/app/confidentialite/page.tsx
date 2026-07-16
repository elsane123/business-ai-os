export const metadata = {
  title: 'Politique de Confidentialité | Brainlo',
  description: 'Politique de confidentialité et protection des données personnelles de Brainlo par Quotium Technologies.',
}

export default function ConfidentialitePage() {
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
        Politique de Confidentialité
      </h1>
      <p style={{ color: '#64748b', marginBottom: '2.5rem', fontSize: '0.9rem' }}>
        Dernière mise à jour : juillet 2026
      </p>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.75rem' }}>1. Responsable du traitement</h2>
        <p>
          Le responsable du traitement est la société <strong>Quotium Technologies</strong>,
          dont le siège social est situé au 84/88 Boulevard de la Mission Marchand, 92400 Courbevoie.
          Pour toute question relative à vos données personnelles, vous pouvez nous contacter à :{' '}
          <a href="mailto:contact@brainlo.ai" style={{ color: '#6366f1' }}>contact@brainlo.ai</a>.
        </p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.75rem' }}>2. Données collectées</h2>
        <p>Dans le cadre de l&apos;utilisation de la plateforme Brainlo, nous collectons les données suivantes :</p>
        <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
          <li>Données d&apos;identification : prénom, nom, adresse e-mail professionnelle</li>
          <li>Données de profil : nom de l&apos;entreprise, secteur d&apos;activité, objectifs financiers</li>
          <li>Données d&apos;utilisation : interactions avec la plateforme, résultats du diagnostic IA</li>
          <li>Données de facturation : informations légales (SIRET, forme juridique, adresse)</li>
        </ul>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.75rem' }}>3. Finalités du traitement</h2>
        <p>Vos données sont traitées pour les finalités suivantes :</p>
        <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
          <li>Fourniture et personnalisation des services Brainlo</li>
          <li>Gestion de votre compte et de votre abonnement</li>
          <li>Génération de rapports et analyses IA personnalisés</li>
          <li>Communication relative à votre compte (notifications, alertes)</li>
          <li>Amélioration de nos services et assistance client</li>
        </ul>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.75rem' }}>4. Base légale</h2>
        <p>
          Le traitement de vos données est fondé sur l&apos;exécution du contrat (CGU acceptées lors de l&apos;inscription)
          et, le cas échéant, sur votre consentement explicite pour les communications marketing.
        </p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.75rem' }}>5. Destinataires des données</h2>
        <p>
          Vos données sont traitées par Quotium Technologies et ses sous-traitants techniques (hébergement cloud,
          services d&apos;envoi d&apos;e-mails, traitement des paiements via Stripe). Elles ne sont jamais vendues à des tiers.
        </p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.75rem' }}>6. Durée de conservation</h2>
        <p>
          Vos données sont conservées pendant toute la durée de votre abonnement actif, puis pendant 3 ans
          à compter de la fin du contrat, conformément aux obligations légales comptables et fiscales.
        </p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.75rem' }}>7. Vos droits</h2>
        <p>Conformément au RGPD (Règlement UE 2016/679), vous disposez des droits suivants :</p>
        <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
          <li><strong>Droit d&apos;accès</strong> : obtenir une copie de vos données personnelles</li>
          <li><strong>Droit de rectification</strong> : corriger des données inexactes</li>
          <li><strong>Droit à l&apos;effacement</strong> : demander la suppression de vos données</li>
          <li><strong>Droit à la portabilité</strong> : recevoir vos données dans un format structuré</li>
          <li><strong>Droit d&apos;opposition</strong> : vous opposer à certains traitements</li>
        </ul>
        <p style={{ marginTop: '0.75rem' }}>
          Pour exercer ces droits, contactez-nous à :{' '}
          <a href="mailto:contact@brainlo.ai" style={{ color: '#6366f1' }}>contact@brainlo.ai</a>.
          Vous pouvez également introduire une réclamation auprès de la CNIL (<a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" style={{ color: '#6366f1' }}>www.cnil.fr</a>).
        </p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.75rem' }}>8. Cookies</h2>
        <p>
          Brainlo utilise des cookies strictement nécessaires au fonctionnement de l&apos;authentification
          (cookie de session httpOnly). Aucun cookie publicitaire ou de tracking tiers n&apos;est déposé sans votre consentement.
        </p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.75rem' }}>9. Sécurité</h2>
        <p>
          Quotium Technologies met en œuvre des mesures techniques et organisationnelles appropriées pour
          protéger vos données contre tout accès non autorisé, perte ou altération (chiffrement, accès restreint,
          journalisation des accès).
        </p>
      </section>

      <section>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.75rem' }}>10. Modifications</h2>
        <p>
          Nous nous réservons le droit de modifier cette politique à tout moment. Toute modification substantielle
          vous sera notifiée par e-mail ou via la plateforme.
        </p>
      </section>

      <div style={{ marginTop: '3rem', borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem' }}>
        <a href="/" style={{ color: '#6366f1', textDecoration: 'none', fontSize: '0.9rem' }}>← Retour à l&apos;accueil</a>
        {' · '}
        <a href="/mentions-legales" style={{ color: '#6366f1', textDecoration: 'none', fontSize: '0.9rem' }}>Mentions légales</a>
      </div>
    </main>
  )
}
