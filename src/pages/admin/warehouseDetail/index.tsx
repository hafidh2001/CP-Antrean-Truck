import { lazy } from 'react';
import { LazyLoad } from '@/components/LazyLoad';

const WarehouseDetailPage = lazy(() => import('./WarehouseDetailPage'));

export default function WarehouseDetailPageLazy() {
  return (
    <LazyLoad>
      <WarehouseDetailPage />
    </LazyLoad>
  );
}