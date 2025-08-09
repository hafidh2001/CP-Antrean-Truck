import { lazy } from 'react';
import { LazyLoad } from '@/components/LazyLoad';

const WarehousePage = lazy(() => import('./WarehousePage'));

export default function WarehousePageLazy() {
  return (
    <LazyLoad>
      <WarehousePage />
    </LazyLoad>
  );
}