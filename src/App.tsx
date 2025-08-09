import { BrowserRouter, Route, Routes } from 'react-router-dom';
import HomePage from '@/pages/home';
import WarehouseDetailPage from '@/pages/warehouseDetail';
import WarehouseViewPage from '@/pages/warehouseView';
import { ROUTES } from '@/utils/routes';
import { AppWrapper } from '@/components/layout/AppWrapper';

function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppWrapper>
        <Routes>
        <Route path={ROUTES.base} element={<HomePage />} />
        <Route 
          path={ROUTES.warehouseDetail(':warehouseId')} 
          element={<WarehouseDetailPage />} 
        />
        <Route 
          path={ROUTES.warehouseView(':warehouseId')} 
          element={<WarehouseViewPage />} 
        />
        <Route 
          path="*" 
          element={
            <div className="flex items-center justify-center min-h-screen">
              <div className="text-center">
                <h1 className="text-4xl font-bold text-gray-800 mb-4">404</h1>
                <p className="text-gray-600">Page not found</p>
              </div>
            </div>
          } 
        />
        </Routes>
      </AppWrapper>
    </BrowserRouter>
  );
}

export default App;