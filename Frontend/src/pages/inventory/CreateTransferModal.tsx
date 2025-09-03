import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, ArrowRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { inventoryApi } from '../../lib/api';
import toast from 'react-hot-toast';

const createTransferSchema = z.object({
  itemId: z.string().min(1, 'Item is required'),
  fromWarehouseId: z.string().min(1, 'Source warehouse is required'),
  toWarehouseId: z.string().min(1, 'Destination warehouse is required'),
  qty: z.number().positive('Quantity must be positive'),
}).refine((data) => data.fromWarehouseId !== data.toWarehouseId, {
  message: "Source and destination warehouses must be different",
  path: ["toWarehouseId"],
});

type CreateTransferFormData = z.infer<typeof createTransferSchema>;

interface CreateTransferModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const CreateTransferModal = ({ onClose, onSuccess }: CreateTransferModalProps) => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<CreateTransferFormData>({
    resolver: zodResolver(createTransferSchema)
  });

  const selectedItemId = watch('itemId');
  const selectedFromWarehouse = watch('fromWarehouseId');

  const { data: items } = useQuery({
    queryKey: ['items-for-transfer'],
    queryFn: () => inventoryApi.getItems({ limit: 100, includeStock: true })
  });

  const { data: warehouses } = useQuery({
    queryKey: ['warehouses-for-transfer'],
    queryFn: () => inventoryApi.getWarehouses()
  });

  // Get stock information for selected item and warehouse
  const { data: stockInfo } = useQuery({
    queryKey: ['item-stock', selectedItemId, selectedFromWarehouse],
    queryFn: () => selectedItemId && selectedFromWarehouse ? 
      inventoryApi.getItemStock(selectedItemId, selectedFromWarehouse) : null,
    enabled: !!(selectedItemId && selectedFromWarehouse)
  });

  const onSubmit = async (data: CreateTransferFormData) => {
    try {
      await inventoryApi.transferInventory(data);
      toast.success('Inventory transfer completed successfully');
      onSuccess();
    } catch (error) {
      console.error('Create transfer error:', error);
    }
  };

  const selectedItem = items?.items?.find((item: any) => item.id === selectedItemId);
  const availableStock = stockInfo?.qty || 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Create Inventory Transfer
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Item *
                </label>
                <select
                  {...register('itemId')}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">Select item to transfer</option>
                  {items?.items?.map((item: any) => (
                    <option key={item.id} value={item.id}>
                      {item.sku} - {item.name} (Stock: {item.stockQty || 0})
                    </option>
                  ))}
                </select>
                {errors.itemId && (
                  <p className="mt-1 text-sm text-red-600">{errors.itemId.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    From Warehouse *
                  </label>
                  <select
                    {...register('fromWarehouseId')}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="">Select source warehouse</option>
                    {warehouses?.warehouses?.map((warehouse: any) => (
                      <option key={warehouse.id} value={warehouse.id}>
                        {warehouse.code} - {warehouse.name}
                      </option>
                    ))}
                  </select>
                  {errors.fromWarehouseId && (
                    <p className="mt-1 text-sm text-red-600">{errors.fromWarehouseId.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    To Warehouse *
                  </label>
                  <select
                    {...register('toWarehouseId')}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="">Select destination warehouse</option>
                    {warehouses?.warehouses?.filter((w: any) => w.id !== selectedFromWarehouse).map((warehouse: any) => (
                      <option key={warehouse.id} value={warehouse.id}>
                        {warehouse.code} - {warehouse.name}
                      </option>
                    ))}
                  </select>
                  {errors.toWarehouseId && (
                    <p className="mt-1 text-sm text-red-600">{errors.toWarehouseId.message}</p>
                  )}
                </div>
              </div>

              {selectedItem && selectedFromWarehouse && (
                <div className="bg-blue-50 p-4 rounded-md">
                  <div className="flex items-center">
                    <ArrowRight className="h-5 w-5 text-blue-500 mr-2" />
                    <div className="text-sm text-blue-800">
                      <strong>Available Stock:</strong> {availableStock} {selectedItem.uom} in selected warehouse
                    </div>
                  </div>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Quantity to Transfer *
                </label>
                <input
                  {...register('qty', { valueAsNumber: true })}
                  type="number"
                  step="0.001"
                  max={availableStock}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Enter quantity"
                />
                {errors.qty && (
                  <p className="mt-1 text-sm text-red-600">{errors.qty.message}</p>
                )}
                {selectedItem && (
                  <p className="mt-1 text-sm text-gray-500">
                    Unit: {selectedItem.uom}
                  </p>
                )}
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Transferring...' : 'Transfer Items'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateTransferModal;