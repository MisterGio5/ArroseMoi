import { Component } from 'react';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log l'erreur sans l'afficher à l'utilisateur
    console.error('[ArroseMoi] Erreur capturée:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false });
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center px-6">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">🌱</div>
            <h1 className="text-2xl font-bold text-ink mb-2">
              Une erreur est survenue
            </h1>
            <p className="text-ink/70 mb-6">
              Quelque chose s'est mal passé. Essayez de recharger la page.
            </p>
            <button
              onClick={this.handleReload}
              className="px-6 py-3 bg-forest text-white rounded-xl font-semibold hover:bg-moss transition-colors"
            >
              Recharger
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
