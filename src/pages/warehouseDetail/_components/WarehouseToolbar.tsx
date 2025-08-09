import { Button } from '@/components/ui/button';
import { useMultiWarehouseStore } from '@/store/multiWarehouseStore';
import { Save, Trash2, Type, Square, MousePointer } from 'lucide-react';
import useModal from '@/hooks/useModal';
import { ConfirmationModal } from '@/components/confirmationModal';

export const WarehouseToolbar = () => {
  const multiStore = useMultiWarehouseStore();
  const { toolMode, setToolMode, currentWarehouse, updateWarehouse, saveWarehouseToStorage } = multiStore;
  const { isShown: isShownSave, toggle: toggleSave } = useModal();
  const { isShown: isShownClear, toggle: toggleClear } = useModal();

  const handleSaveConfirm = () => {
    if (currentWarehouse) {
      saveWarehouseToStorage();
      
      // Show success feedback
      const toast = document.createElement('div');
      toast.className = 'fixed top-20 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50';
      toast.textContent = 'Layout saved successfully!';
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 2000);
    }
  };

  const handleClearConfirm = () => {
    if (currentWarehouse) {
      updateWarehouse(currentWarehouse.id, {
        storageUnits: [],
      });
    }
  };


  return (
    <>
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <div className="flex gap-1 bg-background border rounded-md p-1 mr-2">
          <Button 
            onClick={() => setToolMode('select')} 
            size="sm" 
            variant={toolMode === 'select' ? 'default' : 'ghost'}
            className="h-8 w-8 p-0"
            title="Select tool (V)"
          >
            <MousePointer className="h-4 w-4" />
          </Button>
          <Button 
            onClick={() => setToolMode('rectangle')} 
            size="sm" 
            variant={toolMode === 'rectangle' ? 'default' : 'ghost'}
            className="h-8 w-8 p-0"
            title="Rectangle tool (R)"
          >
            <Square className="h-4 w-4" />
          </Button>
          <Button 
            onClick={() => setToolMode('text')} 
            size="sm" 
            variant={toolMode === 'text' ? 'default' : 'ghost'}
            className="h-8 w-8 p-0"
            title="Text tool (T)"
          >
            <Type className="h-4 w-4" />
          </Button>
        </div>
        <Button onClick={() => toggleSave(true)} size="sm">
          <Save className="h-4 w-4 mr-2" />
          Save
        </Button>
        <Button onClick={() => toggleClear(true)} variant="destructive" size="sm">
          <Trash2 className="h-4 w-4 mr-2" />
          Clear
        </Button>
      </div>
      
      <ConfirmationModal
        isShown={isShownSave}
        toggle={toggleSave}
        title="Save Layout"
        description="Are you sure you want to save the current warehouse layout? This will overwrite the previous saved version."
        onConfirm={handleSaveConfirm}
        confirmText="Save"
        cancelText="Cancel"
        confirmVariant="default"
      />
      
      <ConfirmationModal
        isShown={isShownClear}
        toggle={toggleClear}
        title="Clear All Storage Units"
        description="Are you sure you want to clear all storage units? This action cannot be undone."
        onConfirm={handleClearConfirm}
        confirmText="Clear All"
        cancelText="Cancel"
        confirmVariant="destructive"
      />
    </>
  );
};