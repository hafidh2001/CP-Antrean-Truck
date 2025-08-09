import { ReactNode } from 'react';
import { WAREHOUSE_CONSTANTS } from '@/constants/warehouse';

interface AppWrapperProps {
  children: ReactNode;
}

export const AppWrapper = ({ children }: AppWrapperProps) => {
  return (
    <div className="min-h-screen bg-gray-950">
      <div 
        className="mx-auto bg-background min-h-screen shadow-2xl"
        style={{ maxWidth: `${WAREHOUSE_CONSTANTS.WIDTH}px` }}
      >
        {children}
      </div>
    </div>
  );
};