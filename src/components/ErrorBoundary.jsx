import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('App crash:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', background: '#f4f6f9', fontFamily: 'DM Sans, sans-serif', padding: 20 }}>
          <div style={{ textAlign: 'center', maxWidth: 400 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
            <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "'Outfit', sans-serif", marginBottom: 8 }}>Quelque chose s'est mal passé</div>
            <div style={{ fontSize: 14, color: '#5a6480', lineHeight: 1.6, marginBottom: 20 }}>
              L'application a rencontré une erreur inattendue. Essayez de rafraîchir la page.
            </div>
            <div style={{ fontSize: 12, color: '#6b7280', background: '#f0f2f6', padding: '8px 12px', borderRadius: 8, marginBottom: 20, textAlign: 'left', wordBreak: 'break-word' }}>
              {this.state.error?.message || 'Erreur inconnue'}
            </div>
            <button onClick={() => window.location.reload()} style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: '#0ea888', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              Rafraîchir la page
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
