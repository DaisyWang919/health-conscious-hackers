import React, { Suspense } from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { Loader2 } from 'lucide-react';

interface AsyncBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
}

const DefaultLoadingFallback = () => (
  <div className="min-h-[200px] flex items-center justify-center">
    <Loader2 size={32} className="text-blue-500 animate-spin" />
  </div>
);

export const AsyncBoundary: React.FC<AsyncBoundaryProps> = ({
  children,
  fallback = <DefaultLoadingFallback />,
  errorFallback
}) => {
  return (
    <ErrorBoundary fallback={errorFallback}>
      <Suspense fallback={fallback}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
};