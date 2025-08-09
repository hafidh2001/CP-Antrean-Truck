import { lazy } from 'react';
import { LazyLoad } from '@/components/LazyLoad';

const WarehouseDetail = lazy(() => import('./WarehouseDetail'));

export default function WarehouseDetailLazy() {
  return (
    <LazyLoad>
      <WarehouseDetail />
    </LazyLoad>
  );
}