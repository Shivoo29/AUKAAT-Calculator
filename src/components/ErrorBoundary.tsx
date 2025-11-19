import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });

    // Log to electron main process if available
    if (window.electronAPI) {
      // Could add error logging method to electronAPI
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      });
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full glass rounded-2xl p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white mb-1">Something went wrong</h1>
                <p className="text-dark-400">
                  An unexpected error occurred. Don't worry, your data is safe.
                </p>
              </div>
            </div>

            {this.state.error && (
              <div className="bg-dark-800 rounded-lg p-4 mb-6">
                <h3 className="text-sm font-bold text-red-400 mb-2">Error Details:</h3>
                <p className="text-sm text-dark-300 font-mono mb-2">
                  {this.state.error.message}
                </p>
                {process.env.NODE_ENV === 'development' && this.state.error.stack && (
                  <details className="mt-4">
                    <summary className="text-xs text-dark-500 cursor-pointer hover:text-dark-400">
                      Show stack trace
                    </summary>
                    <pre className="text-xs text-dark-500 mt-2 overflow-auto max-h-40">
                      {this.state.error.stack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 px-4 py-3 bg-dark-800 hover:bg-dark-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-5 h-5" />
                Try Again
              </button>
              <button
                onClick={this.handleReload}
                className="flex-1 px-4 py-3 gradient-primary text-white rounded-lg font-medium hover:shadow-lg hover:shadow-primary-500/50 transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-5 h-5" />
                Reload App
              </button>
            </div>

            <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-sm text-blue-200">
                <strong>Tip:</strong> If this error persists, try restarting the application or
                check the logs for more details.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
