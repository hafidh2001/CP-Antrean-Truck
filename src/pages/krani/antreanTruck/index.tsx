import { lazy } from 'react';
import { LazyLoad } from '@/components/LazyLoad';

const AntreanTruckPage = lazy(() => import('./AntreanTruckPage'));

export default function AntreanTruckPageLazy() {
  return (
    <LazyLoad>
      <AntreanTruckPage />
    </LazyLoad>
  );
}