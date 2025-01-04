import React from 'react';

interface LoadingStateProps {
  message?: string;
  fullScreen?: boolean;
  overlay?: boolean;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading...',
  fullScreen = false,
  overlay = false
}) => {
  const baseClasses = 'flex flex-col items-center justify-center space-y-4';
  const containerClasses = fullScreen
    ? `${baseClasses} h-screen w-screen`
    : overlay
    ? `${baseClasses} absolute inset-0 bg-white/80 backdrop-blur-sm z-50`
    : baseClasses;

  return (
    <div className={containerClasses}>
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
      </div>
      {message && (
        <div className="text-gray-600 text-sm font-medium">{message}</div>
      )}
    </div>
  );
};

interface WithLoadingProps {
  isLoading: boolean;
  loadingMessage?: string;
  children: React.ReactNode;
}

export const WithLoading: React.FC<WithLoadingProps> = ({
  isLoading,
  loadingMessage,
  children
}) => {
  if (isLoading) {
    return <LoadingState message={loadingMessage} overlay />;
  }
  return <>{children}</>;
};

// HOC for adding loading state to components
export const withLoading = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  loadingPropName: keyof P = 'isLoading' as keyof P,
  messagePropName: keyof P = 'loadingMessage' as keyof P
) => {
  return function WithLoadingComponent(props: P) {
    const isLoading = props[loadingPropName] as boolean;
    const message = props[messagePropName] as string | undefined;

    return (
      <WithLoading isLoading={isLoading} loadingMessage={message}>
        <WrappedComponent {...props} />
      </WithLoading>
    );
  };
};
