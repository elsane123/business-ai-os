'use client'

import { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center rounded-xl border border-red-500/20 bg-red-500/5">
          <div className="text-3xl mb-3">⚠️</div>
          <p className="text-sm font-medium text-white mb-1">Erreur dans ce composant</p>
          <p className="text-xs text-[#818cf8] mb-4">
            {this.state.error?.message ?? 'Une erreur inattendue s\'est produite.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: undefined })}
            className="text-xs px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
          >
            Réessayer
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
