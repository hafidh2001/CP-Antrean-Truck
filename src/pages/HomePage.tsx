import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Warehouse, Plus, Trash2 } from 'lucide-react';
import { useMultiWarehouseStore } from '@/store/multiWarehouseStore';
import { NewWarehouseDialog } from '@/components/warehouse/NewWarehouseDialog';
import { DeleteWarehouseDialog } from '@/components/warehouse/DeleteWarehouseDialog';
import { Warehouse as WarehouseType } from '@/types/warehouse';

export function HomePage() {
  const navigate = useNavigate();
  const { warehouses, loadWarehouses, addWarehouse, deleteWarehouse } = useMultiWarehouseStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [warehouseToDelete, setWarehouseToDelete] = useState<WarehouseType | null>(null);

  useEffect(() => {
    loadWarehouses();
  }, [loadWarehouses]);

  const handleCreateWarehouse = (name: string, description: string) => {
    addWarehouse(name, description);
    // Navigate to the new warehouse after a short delay to ensure state update
    setTimeout(() => {
      const latestWarehouses = useMultiWarehouseStore.getState().warehouses;
      const newWarehouse = latestWarehouses[latestWarehouses.length - 1];
      if (newWarehouse) {
        navigate(`/warehouse/${newWarehouse.id}`);
      }
    }, 100);
  };

  const handleDeleteClick = (e: React.MouseEvent, warehouse: WarehouseType) => {
    e.preventDefault(); // Prevent navigation
    e.stopPropagation(); // Stop event bubbling
    
    // Prevent deleting if it's the last warehouse
    if (warehouses.length <= 1) {
      alert('Tidak dapat menghapus gudang terakhir. Minimal harus ada 1 gudang.');
      return;
    }
    
    setWarehouseToDelete(warehouse);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (warehouseToDelete) {
      deleteWarehouse(warehouseToDelete.id);
      setWarehouseToDelete(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4">CP Antrean Truck</h1>
          <p className="text-xl text-muted-foreground">
            Sistem Manajemen Gudang dan Antrian Truk
          </p>
        </header>

        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-semibold mb-6">Pilih Gudang</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {warehouses.map((warehouse) => (
              <div key={warehouse.id} className="relative group">
                <Link
                  to={`/warehouse/${warehouse.id}`}
                  className="block"
                >
                  <div className="border rounded-lg p-6 bg-card hover:bg-accent hover:border-primary transition-all cursor-pointer h-full">
                    <div className="flex items-center justify-between mb-4">
                      <Warehouse className="h-8 w-8 text-primary" />
                      <span className="text-xs text-muted-foreground">
                        {warehouse.layout.storageUnits.length} units
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{warehouse.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {warehouse.description || 'No description'}
                    </p>
                  </div>
                </Link>
                <button
                  onClick={(e) => handleDeleteClick(e, warehouse)}
                  className="absolute top-2 right-2 p-2 bg-background border rounded-md opacity-0 group-hover:opacity-100 transition-all shadow-sm hover:bg-destructive hover:text-destructive-foreground hover:border-destructive"
                  title="Hapus gudang"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            
            {/* Add new warehouse card */}
            <button
              onClick={() => setDialogOpen(true)}
              className="border-2 border-dashed rounded-lg p-6 bg-card/50 hover:bg-card hover:border-primary transition-all cursor-pointer h-full flex items-center justify-center"
            >
              <div className="text-center">
                <Plus className="h-8 w-8 text-muted-foreground hover:text-primary mx-auto mb-2" />
                <p className="text-sm text-muted-foreground hover:text-foreground">Tambah Gudang Baru</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      <NewWarehouseDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreateWarehouse={handleCreateWarehouse}
      />

      <DeleteWarehouseDialog
        warehouse={warehouseToDelete}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}