import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Truck, CheckCircle2, Circle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import type { IProductionCodeCard } from '@/types/productionCode';
import type { IProductionCodeEntryData, IJebolan, IProductionCodeEntry } from '@/types/productionCodeEntry';

export function ProductionCodeEntryPage() {
  const navigate = useNavigate();
  const { nopol, id } = useParams<{ nopol: string; id: string }>();
  
  const [productionCodeData, setProductionCodeData] = useState<IProductionCodeCard | null>(null);
  const [entryData, setEntryData] = useState<IProductionCodeEntryData | null>(null);
  const [jebolainInput, setJebolainInput] = useState('');
  const [productionCodeInput, setProductionCodeInput] = useState('');
  const [isEditingJebolan, setIsEditingJebolan] = useState(false);

  useEffect(() => {
    // Load production code data and entry data from localStorage
    if (nopol && id) {
      const storageKey = `production-code-entry-${nopol}-${id}`;
      const savedEntry = localStorage.getItem(storageKey);
      
      // Get production code data from localStorage
      const productionDataKey = `production-codes-${nopol}`;
      const productionData = localStorage.getItem(productionDataKey);
      
      let productionCodeCard: IProductionCodeCard | null = null;
      
      if (productionData) {
        const parsed = JSON.parse(productionData);
        const productionCode = parsed.productionCodes.find((code: any) => code.id === parseInt(id));
        
        if (productionCode) {
          productionCodeCard = {
            ...productionCode,
            isCompleted: productionCode.completed_entries === productionCode.total_entries,
            progress_percentage: Math.round((productionCode.completed_entries / productionCode.total_entries) * 100)
          };
          
          setProductionCodeData(productionCodeCard);
        }
      }
      
      if (savedEntry) {
        const parsed = JSON.parse(savedEntry);
        setEntryData(parsed);
        // Clear jebolan input when loading
        setJebolainInput('');
      } else if (productionCodeCard) {
        setEntryData({
          productionCodeId: parseInt(id),
          goods_code: productionCodeCard.goods_code,
          goods_name: productionCodeCard.goods_name || '',
          do_no: productionCodeCard.do_no,
          quantities: productionCodeCard.quantities,
          total_entries: productionCodeCard.total_entries,
          completed_entries: 0,
          jebolan: null,
          productionCodes: []
        });
        setJebolainInput('');
      }
    }
  }, [nopol, id]);

  const saveToStorage = (data: IProductionCodeEntryData) => {
    if (nopol && id) {
      const storageKey = `production-code-entry-${nopol}-${id}`;
      localStorage.setItem(storageKey, JSON.stringify(data));
    }
  };

  const handleJebolanSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && entryData) {
      e.preventDefault();
      
      // Allow empty jebolan (remove it)
      if (!jebolainInput.trim()) {
        const updatedData = {
          ...entryData,
          jebolan: null
        };
        
        setEntryData(updatedData);
        saveToStorage(updatedData);
        setJebolainInput('');
        setIsEditingJebolan(false);
        (e.target as HTMLInputElement).blur();
        return;
      }
      
      const quantity = parseInt(jebolainInput);
      if (isNaN(quantity) || quantity <= 0) return;
      
      const newJebolan: IJebolan = {
        id: Date.now().toString(),
        quantity,
        timestamp: new Date().toISOString()
      };
      
      const updatedData = {
        ...entryData,
        jebolan: newJebolan
      };
      
      setEntryData(updatedData);
      saveToStorage(updatedData);
      setJebolainInput('');
      setIsEditingJebolan(false);
      
      // Remove focus from input
      (e.target as HTMLInputElement).blur();
    }
  };

  const handleJebolanClick = () => {
    setJebolainInput(entryData?.jebolan?.quantity.toString() || '');
    setIsEditingJebolan(true);
  };

  const handleJebolanBlur = () => {
    if (!isEditingJebolan) return;
    
    // Reset input if user clicks away without saving
    setJebolainInput('');
    setIsEditingJebolan(false);
  };

  const handleAddProductionCode = () => {
    if (!productionCodeInput.trim() || !entryData) return;
    
    const newCode: IProductionCodeEntry = {
      id: Date.now().toString(),
      code: productionCodeInput.trim(),
      timestamp: new Date().toISOString()
    };
    
    const updatedData = {
      ...entryData,
      productionCodes: [...entryData.productionCodes, newCode],
      completed_entries: entryData.productionCodes.length + 1
    };
    
    setEntryData(updatedData);
    saveToStorage(updatedData);
    setProductionCodeInput('');
  };


  const handleDeleteProductionCode = (codeId: string) => {
    if (!entryData) return;
    
    const updatedData = {
      ...entryData,
      productionCodes: entryData.productionCodes.filter(code => code.id !== codeId),
      completed_entries: entryData.productionCodes.length - 1
    };
    
    setEntryData(updatedData);
    saveToStorage(updatedData);
  };

  const handleBack = () => {
    navigate(`/production-code/${nopol}`);
  };

  if (!productionCodeData || !entryData) {
    return (
      <div className="h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-500">Memuat data...</div>
      </div>
    );
  }

  const isCompleted = entryData.completed_entries === entryData.total_entries;
  const canAddProductionCode = entryData.productionCodes.length < entryData.total_entries;

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
                <div className="text-xl font-bold text-gray-900 mb-1">{entryData.goods_code}</div>
                <div className="text-sm text-gray-700 mb-1">{entryData.do_no}</div>
                <div className="text-sm text-gray-600">
                  {entryData.quantities.map((q, index) => (
                    <span key={index}>
                      {q.quantity} {q.uom}
                      {index < entryData.quantities.length - 1 && ', '}
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
                    {entryData.completed_entries}/{entryData.total_entries} entri kode
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
            {!entryData.jebolan || isEditingJebolan ? (
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
                    {entryData.jebolan.quantity}
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
                disabled={!canAddProductionCode}
              />
              <Button
                onClick={handleAddProductionCode}
                disabled={!canAddProductionCode || !productionCodeInput.trim()}
                className="px-6"
              >
                Add
              </Button>
            </div>
            
            {/* Production Codes List */}
            {entryData.productionCodes.length > 0 && (
              <div className="space-y-2">
                {entryData.productionCodes.map((code) => (
                  <Card key={code.id} className="border-gray-300">
                    <CardContent className="p-2">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-900">
                          {code.code}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteProductionCode(code.id)}
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