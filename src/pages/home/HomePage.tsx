import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Warehouse, Plus, Trash2, Monitor, Tablet } from 'lucide-react';
import { useHomeStore } from '@/store/homeStore';
import { WarehouseDialog } from './_components/WarehouseDialog';
import { DeleteWarehouseDialog } from './_components/DeleteWarehouseDialog';
import type { IWarehouse } from '@/types/home';
import { ROUTES } from '@/utils/routes';

export default function HomePage() {
  const navigate = useNavigate();
  const { warehouses, loadWarehouses, addWarehouse, deleteWarehouse } = useHomeStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [warehouseToDelete, setWarehouseToDelete] = useState<IWarehouse | null>(null);

  useEffect(() => {
    loadWarehouses();
  }, [loadWarehouses]);

  const handleAddWarehouse = (name: string, description: string) => {
    addWarehouse(name, description);
    setDialogOpen(false);
  };

  const handleDeleteClick = (warehouse: IWarehouse) => {
    setWarehouseToDelete(warehouse);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (warehouseToDelete) {
      deleteWarehouse(warehouseToDelete.id);
      setDeleteDialogOpen(false);
      setWarehouseToDelete(null);
    }
  };

  const navigateToWarehouse = (warehouse: IWarehouse, mode: 'desktop' | 'tablet') => {
    navigate(`${ROUTES.warehouseView(String(warehouse.id))}?mode=${mode}`);
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Warehouse Management</h1>
        <p className="text-gray-600">Select a warehouse to view its layout</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Add New Warehouse Card */}
        <button
          onClick={() => setDialogOpen(true)}
          className="group relative overflow-hidden rounded-lg border-2 border-dashed border-gray-300 p-6 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
        >
          <div className="flex flex-col items-center justify-center h-40">
            <Plus className="h-12 w-12 text-gray-400 group-hover:text-gray-600 transition-colors" />
            <span className="mt-2 text-sm font-medium text-gray-600">Add New Warehouse</span>
          </div>
        </button>

        {/* Warehouse Cards */}
        {warehouses.map((warehouse) => (
          <div
            key={warehouse.id}
            className="relative overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow duration-200"
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <Warehouse className="h-8 w-8 text-blue-600 mr-3" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{warehouse.name}</h3>
                    {warehouse.description && (
                      <p className="text-sm text-gray-600 mt-1">{warehouse.description}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteClick(warehouse)}
                  className="p-1 rounded hover:bg-gray-100 transition-colors"
                  aria-label="Delete warehouse"
                >
                  <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500" />
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => navigateToWarehouse(warehouse, 'desktop')}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Monitor className="h-4 w-4" />
                  <span className="text-sm font-medium">Desktop View</span>
                </button>
                <button
                  onClick={() => navigateToWarehouse(warehouse, 'tablet')}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                >
                  <Tablet className="h-4 w-4" />
                  <span className="text-sm font-medium">Tablet View</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <WarehouseDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleAddWarehouse}
      />

      <DeleteWarehouseDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        warehouse={warehouseToDelete}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}