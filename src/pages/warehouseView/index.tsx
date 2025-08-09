import { lazy } from 'react';
import { LazyLoad } from '@/components/LazyLoad';

const WarehouseViewPage = lazy(() => import('./WarehouseViewPage'));

export default function WarehouseViewPageLazy() {
  return (
    <LazyLoad>
      <WarehouseViewPage />
    </LazyLoad>
  );
}