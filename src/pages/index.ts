// Central export file for all pages with lazy loading
import { lazyLoad } from '@/components/LazyLoad';

// Export lazy-loaded pages
export const HomePage = lazyLoad(() => import('./home/HomePage'));
export const WarehouseDetailPage = lazyLoad(() => import('./warehouseDetail/WarehouseDetailPage'));
export const WarehouseViewPage = lazyLoad(() => import('./warehouseView/WarehouseViewPage'));
export const DecryptPage = lazyLoad(() => import('./decrypt/DecryptPage'));