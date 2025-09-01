import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useProductionCodeStore } from '@/store/productionCodeStore';
import { ProductionCodeCard } from './_components/ProductionCodeCard';
import { ArrowLeft, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ROUTES } from '@/utils/routes';
import type { IProductionCodeCard } from '@/types/productionCode';

export function ProductionCodePage() {
  const navigate = useNavigate();
  const { nopol } = useParams<{ nopol: string }>();
  const { 
    productionCodes, 
    goodsCount,
    isLoading, 
    loadProductionCodes,
    selectedGate1,
    selectedGate2,
    setSelectedGate1,
    setSelectedGate2,
    reset
  } = useProductionCodeStore();

  useEffect(() => {
    if (nopol) {
      loadProductionCodes(nopol);
    }
    
    return () => {
      reset();
    };
  }, [nopol, loadProductionCodes, reset]);

  const handleCardClick = (code: IProductionCodeCard) => {
    // TODO: Navigate to detail entry page
    console.log('Selected production code:', code);
  };

  const handleBack = () => {
    navigate(ROUTES.antreanTruck);
  };

  return (
    <div className="h-screen bg-gray-100 flex items-center justify-center">
      <div className="max-w-md w-full h-screen bg-white flex flex-col">
        {/* Header - Fixed */}
        <div className="bg-white border-b border-gray-200 flex-shrink-0">
          {/* Back Button and Title */}
          <div className="flex items-center p-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="mr-3"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            
            <div className="flex-1 flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Truck className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{nopol}</div>
                <div className="text-base text-gray-600">{goodsCount} jenis barang</div>
              </div>
            </div>
          </div>
          
          {/* Gate Filters */}
          <div className="px-6 pb-4 flex gap-3">
            <Select value={selectedGate1 || undefined} onValueChange={setSelectedGate1}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Pilih Gate 1" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gate-a">Gate A</SelectItem>
                <SelectItem value="gate-b">Gate B</SelectItem>
                <SelectItem value="gate-c">Gate C</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={selectedGate2 || undefined} onValueChange={setSelectedGate2}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Pilih Gate 2" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gate-d">Gate D</SelectItem>
                <SelectItem value="gate-e">Gate E</SelectItem>
                <SelectItem value="gate-f">Gate F</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Scrollable Content - Takes remaining height */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="text-gray-500">Memuat data kode produksi...</div>
            </div>
          ) : productionCodes.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-500">Tidak ada kode produksi</div>
            </div>
          ) : (
            <div className="space-y-3">
              {productionCodes.map((code) => (
                <ProductionCodeCard
                  key={code.id}
                  code={code}
                  onClick={handleCardClick}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProductionCodePage;