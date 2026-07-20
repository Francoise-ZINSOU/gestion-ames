import { S } from '../lib/ui'

export default function CGUPage() {
  return (
    <div style={S.card}>
      <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "'Outfit', sans-serif", marginBottom: 12 }}>Conditions d'utilisation</div>
      <div style={{ fontSize: 14, color: '#5a6480', lineHeight: 1.8 }}>
        <p style={{ marginBottom: 12 }}><strong>Données personnelles</strong><br />
        Cette application traite des données personnelles (noms, coordonnées, présences) dans le cadre du suivi pastoral. Ces données sont stockées de manière sécurisée sur Supabase (hébergement européen). Elles ne sont ni vendues ni partagées avec des tiers.</p>

        <p style={{ marginBottom: 12 }}><strong>Responsable du traitement</strong><br />
        Le responsable du traitement est l'administrateur de l'église qui a créé le compte. Il est responsable de la conformité RGPD au sein de son organisation.</p>

        <p style={{ marginBottom: 12 }}><strong>Droits des personnes</strong><br />
        Toute personne dont les données sont enregistrées peut demander l'accès, la rectification ou la suppression de ses données en contactant l'administrateur de son église.</p>

        <p style={{ marginBottom: 12 }}><strong>Données sensibles</strong><br />
        Les données de présence au culte constituent des données relatives aux convictions religieuses (article 9 du RGPD). Leur traitement est fondé sur le consentement implicite des membres de l'église et l'intérêt légitime de l'organisation religieuse.</p>

        <p style={{ marginBottom: 12 }}><strong>Durée de conservation</strong><br />
        Les données sont conservées tant que le membre est actif. Les données des membres archivés sont conservées 3 ans puis supprimées.</p>

        <p style={{ fontSize: 12, color: '#6b7280', fontStyle: 'italic' }}>
        Ce document est un modèle indicatif. Il doit être adapté par un professionnel du droit pour votre contexte spécifique.
        </p>
      </div>
    </div>
  )
}
