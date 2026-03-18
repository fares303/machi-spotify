import React from 'react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }
  static getDerivedStateFromError(error) {
    return { error }
  }
  componentDidCatch(error, info) {
    console.error('App error:', error, info)
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', height: '100vh', gap: 16, padding: 32,
          background: '#050508', color: '#fff', fontFamily: 'monospace'
        }}>
          <div style={{ fontSize: 40 }}>⚠️</div>
          <h2 style={{ color: '#FF2D78', margin: 0 }}>Something went wrong</h2>
          <pre style={{
            background: '#0D0D14', padding: 16, borderRadius: 8,
            fontSize: 12, maxWidth: 600, overflow: 'auto', color: '#0DFFB0',
            border: '1px solid #161622'
          }}>
            {this.state.error?.message}
            {'\n\n'}
            {this.state.error?.stack?.split('\n').slice(0, 6).join('\n')}
          </pre>
          <button
            onClick={() => { this.setState({ error: null }); window.location.reload() }}
            style={{ background: '#0DFFB0', color: '#050508', border: 'none', padding: '10px 24px', borderRadius: 99, cursor: 'pointer', fontWeight: 700 }}
          >
            Reload App
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
