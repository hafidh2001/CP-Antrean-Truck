import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ProductionCodeCard } from './_components/ProductionCodeCard';
import { ArrowLeft, Truck, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ROUTES } from '@/utils/routes';
import type { IProductionCodeCard, IGateOption } from '@/types/productionCode';
import { sessionService } from '@/services/sessionService';
import { productionCodeApi } from '@/services/productionCodeApi';
import { gateApi } from '@/services/gateApi';
import { showToast } from '@/utils/toast';

export function ProductionCodePage() {
  const navigate = useNavigate();
  const { antreanId } = useParams<{ antreanId: string }>();
  const [isValidating, setIsValidating] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [nopol, setNopol] = useState<string>('');
  const [jenisBarang, setJenisBarang] = useState<number>(0);
  const [productionCodes, setProductionCodes] = useState<IProductionCodeCard[]>([]);
  const [selectedGate1, setSelectedGate1] = useState<string>("");
  const [selectedGate2, setSelectedGate2] = useState<string>("");
  const [gateOptions, setGateOptions] = useState<IGateOption[]>([]);
  const [isUpdatingGate, setIsUpdatingGate] = useState(false);

  useEffect(() => {
    const validateAndLoadData = async () => {
      const session = await sessionService.getSession();
      const isValid = session?.user_token ? true : false;
      setHasAccess(isValid);
      setIsValidating(false);
      
      if (isValid && antreanId && session?.user_token) {
        setIsLoading(true);
        
        try {
          // Fetch production codes first (critical data)
          const productionData = await productionCodeApi.getProductionCodes(antreanId, session.user_token);
          
          // Set production code data
          setNopol(productionData.nopol);
          setJenisBarang(productionData.jenis_barang);
          
          // Transform API data to match frontend interface
          const transformedCodes: IProductionCodeCard[] = productionData.productionCodes.map(code => ({
            ...code,
            isCompleted: code.completed_entries === code.total_entries,
            progress_percentage: Math.round((code.completed_entries / code.total_entries) * 100)
          }));
          
          setProductionCodes(transformedCodes);
          
          // Load current antrean gates and gate options
          try {
            const [gates, antreanGates] = await Promise.all([
              gateApi.getGateOptions(session.user_token),
              productionCodeApi.getAntreanGates(antreanId, session.user_token)
            ]);
            
            setGateOptions(gates);
            
            // Set current gate selections based on array position
            // If response is null, undefined, or empty array, gates remain empty
            if (antreanGates.gates && Array.isArray(antreanGates.gates) && antreanGates.gates.length > 0) {
              // First item in array = Gate 1
              const gate1Value = antreanGates.gates[0].gate_id.toString();
              setSelectedGate1(gate1Value);
              
              // Second item in array = Gate 2 (if exists)
              if (antreanGates.gates.length >= 2) {
                const gate2Value = antreanGates.gates[1].gate_id.toString();
                setSelectedGate2(gate2Value);
              }
            }
            // Else: gates remain empty (default state)
          } catch (gateError) {
            // Continue without gate options
          }
        } catch (error) {
          // Failed to load production codes
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    validateAndLoadData();
  }, [antreanId]);

  const handleCardClick = (code: IProductionCodeCard) => {
    if (antreanId) {
      navigate(ROUTES.productionCodeEntry(antreanId, code.id.toString()));
    }
  };

  const handleGateChange = async (gateId: string | null, position: 1 | 2) => {
    if (isUpdatingGate || !antreanId) return;
    
    const session = await sessionService.getSession();
    if (!session?.user_token) return;
    
    setIsUpdatingGate(true);
    
    try {
      if (gateId === 'empty' && position === 2) {
        // Delete gate 2 only
        setSelectedGate2("");
        await productionCodeApi.deleteAntreanGate(antreanId, session.user_token);
        showToast('Gate 2 berhasil dihapus', 'success');
      } else if (gateId && gateId !== 'empty') {
        // Set gate
        await productionCodeApi.setAntreanGate(antreanId, parseInt(gateId), position, session.user_token);
        showToast(`Gate ${position} berhasil diatur`, 'success');
      }
    } catch (error) {
      showToast(`Gagal mengatur gate ${position}`, 'error');
      
      // Revert selection
      if (position === 1) {
        setSelectedGate1(selectedGate1);
      } else {
        setSelectedGate2(selectedGate2);
      }
    } finally {
      setIsUpdatingGate(false);
    }
  };

  const handleBack = () => {
    const encryptedToken = sessionService.getEncryptedToken();
    if (encryptedToken) {
      navigate(`${ROUTES.antreanTruck}?key=${encodeURIComponent(encryptedToken)}`);
    } else {
      navigate(ROUTES.base);
    }
  };

  if (isValidating) {
    return (
      <div className="h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <div className="text-gray-500">Memvalidasi sesi...</div>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">Tidak memiliki akses untuk mengakses halaman ini</div>
          <Button onClick={() => navigate(ROUTES.base)}>Kembali ke Beranda</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-100 flex items-center justify-center">
      <div className="max-w-md w-full h-screen bg-white flex flex-col">
        {/* Header - Fixed */}
        <div className="bg-white border-b border-gray-200 flex-shrink-0">
          {/* Top Row with Back and Logout */}
          <div className="flex items-center justify-between p-2">
            <Button
              variant="ghost"
              onClick={handleBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm">Back</span>
            </Button>
            <Button
              onClick={() => window.location.href = 'https://hachi.kamz-kun.id/cp_fifo/index.php?r=site/logout'}
              variant="destructive"
              size="sm"
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <LogOut className="h-4 w-4 mr-1" />
              <span className="text-sm">Logout</span>
            </Button>
          </div>
          
          {/* Title and Info */}
          <div className="px-6 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Truck className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{nopol}</div>
                <div className="text-base text-gray-600">{jenisBarang} jenis barang</div>
              </div>
            </div>
          </div>
          
          {/* Gate Filters */}
          <div className="px-6 pb-4 flex gap-3">
            <Select 
              value={selectedGate1} 
              onValueChange={(value) => {
                setSelectedGate1(value);
                handleGateChange(value, 1);
                // If gate 1 changes and it's the same as gate 2, clear gate 2
                if (value === selectedGate2) {
                  setSelectedGate2("");
                }
              }}
              disabled={isUpdatingGate}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Pilih Gate 1" />
              </SelectTrigger>
              <SelectContent>
                {gateOptions.map((gate) => (
                  <SelectItem key={gate.id} value={gate.id.toString()}>
                    {gate.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select 
              key={`gate2-${selectedGate1}`} // Force re-render when gate1 changes
              value={selectedGate2} 
              onValueChange={(value) => {
                if (value === 'empty') {
                  setSelectedGate2("");
                  handleGateChange('empty', 2);
                } else {
                  setSelectedGate2(value);
                  handleGateChange(value, 2);
                }
              }}
              disabled={isUpdatingGate || !selectedGate1}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Pilih Gate 2" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="empty">Kosongkan Gate 2</SelectItem>
                {gateOptions
                  .filter(gate => {
                    if (!selectedGate1) return true;
                    return gate.id.toString() !== selectedGate1;
                  })
                  .map((gate) => (
                    <SelectItem key={`gate2-option-${gate.id}`} value={gate.id.toString()}>
                      {gate.code}
                    </SelectItem>
                  ))}
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