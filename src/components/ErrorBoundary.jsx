import { Component } from 'react';

// ErrorBoundary: captura erros de runtime e mostra uma tela de erro
// em vez de uma tela preta/branca sem explicação.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('FlixOn ErrorBoundary:', error, info);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.hash = '/';
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-flixon-bg text-center p-8">
          <div className="text-5xl mb-4">😵</div>
          <h1 className="text-xl font-bold mb-2">Ops! Algo deu errado</h1>
          <p className="text-flixon-muted text-sm mb-1 max-w-md">
            Ocorreu um erro inesperado nesta tela.
          </p>
          <p className="text-flixon-muted text-xs mb-6 max-w-md break-all">
            {String(this.state.error?.message || this.state.error || '')}
          </p>
          <button
            onClick={this.handleReload}
            className="px-5 py-2.5 rounded-lg bg-flixon-violet hover:bg-flixon-violet-light font-semibold transition-colors"
          >
            🔄 Recarregar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
