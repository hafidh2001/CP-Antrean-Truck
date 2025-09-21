import { lazy } from 'react';
import { LazyLoad } from '@/components/LazyLoad';

const GateMonitorPage = lazy(() => import('./GateMonitorPage'));

export default function GateMonitorPageLazy() {
  return (
    <LazyLoad>
      <GateMonitorPage />
    </LazyLoad>
  );
}