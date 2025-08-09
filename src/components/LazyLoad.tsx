import { Suspense, ComponentType, lazy } from 'react';
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
export function lazyLoad<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>
) {
  const LazyComponent = lazy(importFunc);

  return (props: React.ComponentProps<T> & LazyLoadProps) => {
    const { fallback = <DefaultFallback />, ...componentProps } = props;

    return (
      <Suspense fallback={fallback}>
        <LazyComponent {...componentProps as any} />
      </Suspense>
    );
  };
}

// Simple wrapper component for lazy loaded components
export const LazyLoad: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ children, fallback = <DefaultFallback /> }) => {
  return <Suspense fallback={fallback}>{children}</Suspense>;
};