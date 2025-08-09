import React, { Suspense, ComponentType, lazy } from 'react';
import { Loader2 } from 'lucide-react';

interface LazyLoadProps {
  fallback?: React.ReactNode;
}

// Default loading component
const DefaultFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

// Higher-order component for lazy loading
export function lazyLoad(
  importFunc: () => Promise<{ default: ComponentType }>
): React.FC<LazyLoadProps> {
  const LazyComponent = lazy(importFunc);

  // Return a component that renders the lazy-loaded component
  const WrappedComponent: React.FC<LazyLoadProps> = ({ fallback = <DefaultFallback /> }) => {
    return (
      <Suspense fallback={fallback}>
        <LazyComponent />
      </Suspense>
    );
  };
  
  WrappedComponent.displayName = `LazyLoad(Component)`;
  
  return WrappedComponent;
}

// Simple wrapper component for lazy loaded components
export const LazyLoad: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ children, fallback = <DefaultFallback /> }) => {
  return <Suspense fallback={fallback}>{children}</Suspense>;
};