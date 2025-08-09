// Central export file for all pages with lazy loading
import { lazyLoad } from '@/components/LazyLoad';

// Export lazy-loaded pages
export const HomePage = lazyLoad(() => import('./home/HomePage'));
export const WarehousePage = lazyLoad(() => import('./warehouse/WarehousePage'));

// You can also export with custom loading states
export const HomePageCustom = lazyLoad(() => import('./home/HomePage'));

// For pages that need props typing
export type { HomePageProps } from './home/HomePage';
export type { WarehousePageProps } from './warehouse/WarehousePage';