import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Truck, CheckCircle2, Circle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import type { IProductionCodeCard } from '@/types/productionCode';
import { sessionService } from '@/services/sessionService';
import { ROUTES } from '@/utils/routes';
import { productionCodeEntryApi } from '@/services/productionCodeEntryApi';

export function ProductionCodeEntryPage() {
  const navigate = useNavigate();
  const { antreanId, goodsId } = useParams<{ antreanId: string; goodsId: string }>();
  
  const [isValidating, setIsValidating] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [nopol, setNopol] = useState<string>('');
  const [productionCodeData, setProductionCodeData] = useState<IProductionCodeCard | null>(null);
  const [jebolan, setJebolan] = useState<Array<{ id: number; qty: number }>>([]);
  const [kodeProduksi, setKodeProduksi] = useState<Array<{ id: number; kode_produksi: string }>>([]);
  const [completedEntries, setCompletedEntries] = useState<number>(0);
  const [jebolainInput, setJebolainInput] = useState('');
  const [productionCodeInput, setProductionCodeInput] = useState('');
  const [isEditingJebolan, setIsEditingJebolan] = useState(false);
  const [editingJebolanId, setEditingJebolanId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const validateAndLoadData = async () => {
      console.log('ProductionCodeEntry - antreanId:', antreanId, 'goodsId:', goodsId);
      
      const session = await sessionService.getSession();
      console.log('ProductionCodeEntry - session:', session);
      
      const isValid = session?.user_token ? true : false;
      setHasAccess(isValid);
      setIsValidating(false);
      
      if (isValid && antreanId && goodsId && session?.user_token) {
        setIsLoading(true);
        console.log('ProductionCodeEntry - Starting to fetch data...');
        
        try {
          // Fetch production detail using antrean_id and goods_id
          const productionDetail = await productionCodeEntryApi.getProductionCodeDetail(antreanId, goodsId, session.user_token);
          
          // Set header data
          setNopol(productionDetail.nopol);
          
          // Then fetch jebolan and kode produksi
          const [jebolanData, kodeProduksiData] = await Promise.all([
            productionCodeEntryApi.getJebolan(antreanId, goodsId, session.user_token),
            productionCodeEntryApi.getKodeProduksi(antreanId, goodsId, session.user_token)
          ]);
          
          // Transform and set production code data
          const code = productionDetail.productionCode;
          const transformedCode: IProductionCodeCard = {
            id: code.id,
            goods_code: code.goods_code,
            goods_name: code.goods_name || '',
            quantities: code.quantities,
            total_entries: code.total_entries,
            completed_entries: kodeProduksiData.completed_entries,
            isCompleted: kodeProduksiData.completed_entries === code.total_entries,
            progress_percentage: Math.round((kodeProduksiData.completed_entries / code.total_entries) * 100)
          };
          
          setProductionCodeData(transformedCode);
          setJebolan(jebolanData);
          setKodeProduksi(kodeProduksiData.kode_produksi);
          setCompletedEntries(kodeProduksiData.completed_entries);
          
        } catch (error) {
          console.error('Failed to load data:', error);
          setError(error instanceof Error ? error.message : 'Failed to load data');
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    validateAndLoadData();
  }, [antreanId, goodsId]);

  const reloadData = async () => {
    const session = await sessionService.getSession();
    if (session?.user_token && antreanId && goodsId) {
      try {
        const [jebolanData, kodeProduksiData] = await Promise.all([
          productionCodeEntryApi.getJebolan(antreanId, goodsId, session.user_token),
          productionCodeEntryApi.getKodeProduksi(antreanId, goodsId, session.user_token)
        ]);
        
        setJebolan(jebolanData);
        setKodeProduksi(kodeProduksiData.kode_produksi);
        setCompletedEntries(kodeProduksiData.completed_entries);
        
        // Update production code data
        if (productionCodeData) {
          setProductionCodeData({
            ...productionCodeData,
            completed_entries: kodeProduksiData.completed_entries,
            isCompleted: kodeProduksiData.completed_entries === productionCodeData.total_entries,
            progress_percentage: Math.round((kodeProduksiData.completed_entries / productionCodeData.total_entries) * 100)
          });
        }
      } catch (error) {
        console.error('Failed to reload data:', error);
      }
    }
  };

  const handleJebolanSubmit = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      
      const quantity = parseInt(jebolainInput);
      if (isNaN(quantity) || quantity <= 0) return;
      
      const session = await sessionService.getSession();
      if (!session?.user_token || !antreanId || !goodsId) return;
      
      setIsSubmitting(true);
      
      try {
        const jebolanIdToEdit = editingJebolanId || (jebolan.length > 0 ? jebolan[0].id : undefined);
        
        await productionCodeEntryApi.saveJebolan(
          antreanId,
          goodsId,
          quantity,
          session.user_token,
          jebolanIdToEdit
        );
        
        setJebolainInput('');
        setIsEditingJebolan(false);
        setEditingJebolanId(null);
        (e.target as HTMLInputElement).blur();
        
        // Reload data
        await reloadData();
      } catch (error) {
        console.error('Failed to save jebolan:', error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleJebolanClick = () => {
    if (jebolan.length > 0) {
      setJebolainInput(jebolan[0].qty.toString());
      setIsEditingJebolan(true);
      setEditingJebolanId(jebolan[0].id);
    } else {
      setJebolainInput('');
      setIsEditingJebolan(true);
      setEditingJebolanId(null);
    }
  };

  const handleJebolanBlur = () => {
    if (!isEditingJebolan) return;
    
    // Reset input if user clicks away without saving
    setJebolainInput('');
    setIsEditingJebolan(false);
    setEditingJebolanId(null);
  };

  const handleAddProductionCode = async () => {
    if (!productionCodeInput.trim() || !productionCodeData) return;
    
    // Check if max entries reached
    if (completedEntries >= productionCodeData.total_entries) {
      alert('Maximum entries reached');
      return;
    }
    
    const session = await sessionService.getSession();
    if (!session?.user_token || !antreanId || !goodsId) return;
    
    setIsSubmitting(true);
    
    try {
      await productionCodeEntryApi.createKodeProduksi(
        antreanId,
        goodsId,
        productionCodeInput.trim(),
        session.user_token
      );
      
      setProductionCodeInput('');
      
      // Reload data
      await reloadData();
    } catch (error) {
      console.error('Failed to add production code:', error);
      if (error instanceof Error && error.message === 'Kode produksi already exists') {
        alert('Kode produksi sudah ada');
      }
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleDeleteProductionCode = async (codeId: number) => {
    const session = await sessionService.getSession();
    if (!session?.user_token) return;
    
    setIsSubmitting(true);
    
    try {
      await productionCodeEntryApi.deleteKodeProduksi(
        codeId,
        session.user_token
      );
      
      // Reload data
      await reloadData();
    } catch (error) {
      console.error('Failed to delete production code:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    const encryptedToken = sessionService.getEncryptedToken();
    if (encryptedToken && antreanId) {
      navigate(`${ROUTES.productionCode(antreanId)}?key=${encodeURIComponent(encryptedToken)}`);
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

  if (error) {
    return (
      <div className="h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">Error: {error}</div>
          <Button onClick={() => window.location.reload()}>Coba Lagi</Button>
        </div>
      </div>
    );
  }

  if (isLoading || !productionCodeData) {
    return (
      <div className="h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <div className="text-gray-500">Memuat data...</div>
        </div>
      </div>
    );
  }

  const isCompleted = completedEntries === productionCodeData.total_entries;
  const canAddProductionCode = completedEntries < productionCodeData.total_entries;

  return (
    <div className="h-screen bg-gray-100 flex items-center justify-center">
      <div className="max-w-md w-full h-screen bg-white flex flex-col">
        {/* Header - Fixed */}
        <div className="bg-white border-b border-gray-200 flex-shrink-0">
          {/* Back Button Row */}
          <div className="flex items-center pl-2 pb-2">
            <Button
              variant="ghost"
              onClick={handleBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back</span>
            </Button>
          </div>
          
          {/* Content Info */}
          <div className="px-6 pb-4">
            <div className="flex gap-4">
              {/* Left Column */}
              <div className="flex-1">
                <div className="text-xl font-bold text-gray-900 mb-1">{productionCodeData.goods_code}</div>
                <div className="text-sm text-gray-700 mb-1">{productionCodeData.goods_name}</div>
                <div className="text-sm text-gray-600">
                  {productionCodeData.quantities.map((q, index) => (
                    <span key={index}>
                      {q.amount} {q.unit}
                      {index < productionCodeData.quantities.length - 1 && ', '}
                    </span>
                  ))}
                </div>
              </div>
              
              {/* Right Column */}
              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 rounded-lg">
                  <Truck className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">{nopol}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  {isCompleted ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <Circle className="h-4 w-4 text-gray-400" />
                  )}
                  <span className={`text-sm font-medium ${
                    isCompleted ? 'text-green-600' : 'text-gray-600'
                  }`}>
                    {completedEntries}/{productionCodeData.total_entries} entri kode
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Jebolan Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Jebolan</h3>
            
            {/* Jebolan Input/Display */}
            {isEditingJebolan || jebolan.length === 0 ? (
              <Input
                type="number"
                placeholder="Jumlah jebolan (opsional)"
                value={jebolainInput}
                onChange={(e) => setJebolainInput(e.target.value)}
                onKeyDown={handleJebolanSubmit}
                onBlur={handleJebolanBlur}
                className="w-full"
                autoFocus={isEditingJebolan}
              />
            ) : (
              <Card 
                className="border-gray-300 cursor-pointer hover:bg-gray-50"
                onClick={handleJebolanClick}
              >
                <CardContent className="p-3">
                  <div className="text-sm text-gray-900">
                    {jebolan[0].qty}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Production Codes Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Kode Produksi</h3>
            
            {/* Production Code Form */}
            <div className="flex gap-2 mb-3">
              <Input
                type="number"
                placeholder="Kode produksi"
                value={productionCodeInput}
                onChange={(e) => setProductionCodeInput(e.target.value)}
                className="flex-1"
                disabled={!canAddProductionCode || isSubmitting}
              />
              <Button
                onClick={handleAddProductionCode}
                disabled={!canAddProductionCode || !productionCodeInput.trim() || isSubmitting}
                className="px-6"
              >
                {isSubmitting ? 'Adding...' : 'Add'}
              </Button>
            </div>
            
            {/* Production Codes List */}
            {kodeProduksi.length > 0 && (
              <div className="space-y-2">
                {kodeProduksi.map((code) => (
                  <Card key={code.id} className="border-gray-300">
                    <CardContent className="p-2">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-900">
                          {code.kode_produksi}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteProductionCode(code.id)}
                          disabled={isSubmitting}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 h-7 w-7 p-0"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductionCodeEntryPage;