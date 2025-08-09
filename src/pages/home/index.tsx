import { lazy } from 'react';
import { LazyLoad } from '@/components/LazyLoad';

const HomePage = lazy(() => import('./HomePage'));

export default function HomePageLazy() {
  return (
    <LazyLoad>
      <HomePage />
    </LazyLoad>
  );
}