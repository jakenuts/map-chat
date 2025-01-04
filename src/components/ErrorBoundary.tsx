import React from 'react';
import { logMessage } from '../lib/utils/logging';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorDisplayProps {
  error: Error | null;
  onReset?: () => void;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error, onReset }) => (
  <div className="flex flex-col items-center justify-center h-full p-8 bg-red-50">
    <div className="max-w-lg text-center space-y-4">
      <h2 className="text-2xl font-bold text-red-700">
        Something went wrong
      </h2>
      <div className="text-red-600">
        {error?.message || 'An unknown error occurred'}
      </div>
      {onReset && (
        <button
          onClick={onReset}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Try Again
        </button>
      )}
    </div>
  </div>
);

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    logMessage('error', {
      type: 'component_error',
      error: error.message,
      componentStack: info.componentStack
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null
    });
  };

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <ErrorDisplay
          error={this.state.error}
          onReset={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}

// HOC for wrapping components with error boundary
export const withErrorBoundary = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  fallback?: React.ReactNode
) => {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  };
};
