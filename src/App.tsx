import { BrowserRouter, Route, Routes } from 'react-router-dom';
// import HomePage from '@/pages/home';
import WarehouseDetailPage from '@/pages/admin/warehouseDetail';
import WarehouseViewPage from '@/pages/admin/warehouseView';
import DecryptPage from '@/pages/decrypt/DecryptPage';
import AntreanTruckPage from '@/pages/kerani/antreanTruck';
import ProductionCodePage from '@/pages/kerani/productionCode';
import ProductionCodeEntryPage from '@/pages/kerani/productionCodeEntry';
import { ROUTES } from '@/utils/routes';
import { AppWrapper } from '@/components/layout/AppWrapper';

function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppWrapper>
        <Routes>
        {/* <Route path={ROUTES.base} element={<HomePage />} /> */}
        <Route 
          path={ROUTES.warehouseDetail()} 
          element={<WarehouseDetailPage />} 
        />
        <Route 
          path={ROUTES.warehouseView(':warehouseId')} 
          element={<WarehouseViewPage />} 
        />
        <Route 
          path={ROUTES.decrypt} 
          element={<DecryptPage />} 
        />
        <Route 
          path={ROUTES.antreanTruck} 
          element={<AntreanTruckPage />} 
        />
        <Route 
          path={ROUTES.productionCode(':nopol')} 
          element={<ProductionCodePage />} 
        />
        <Route 
          path={ROUTES.productionCodeEntry(':nopol', ':id')} 
          element={<ProductionCodeEntryPage />} 
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