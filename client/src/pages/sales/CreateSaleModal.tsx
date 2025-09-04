import React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Plus, Trash2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { salesApi, inventoryApi } from '../../lib/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';


const createSaleSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  orderDate: z.string().min(1, 'Order date is required'),
  notes: z.string().optional(),
  saleLines: z.array(z.object({
    itemId: z.string().min(1, 'Item is required'),
    qty: z.number().positive('Quantity must be positive'),
    unitPrice: z.number().positive('Unit price must be positive'),
  })).min(1, 'At least one line item is required'),
});


type CreateSaleFormData = z.infer<typeof createSaleSchema>;

interface CreateSaleModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const CreateSaleModal = ({ onClose, onSuccess }: CreateSaleModalProps) => {
  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<CreateSaleFormData>({
    resolver: zodResolver(createSaleSchema),
    defaultValues: {
      orderDate: new Date().toISOString().split('T')[0],
      saleLines: [{ itemId: '', qty: 1, unitPrice: 0 }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'saleLines'
  });

  const { user } = useAuthStore();
  
  // Check if user can perform actions (CFO or GM only)
  const canPerformActions = user?.roles.includes('CFO') || user?.roles.includes('General Manager');

  const watchedLines = watch('saleLines');
  const watchedItemIds = watchedLines.map(line => line.itemId);
  const customerId = watch('customerId')

  const { data: customers } = useQuery({
    queryKey: ['customers-for-sale'],
    queryFn: () => salesApi.getCustomers({ limit: 100 })
  });

  const { data: items } = useQuery({
    queryKey: ['items-for-sale'],
    queryFn: () => inventoryApi.getItems({ limit: 100 })
  });

//  const autoPricedItems = React.useRef<Set<string>>(new Set());

// // Reset when modal closes or customer changes
// useEffect(() => {
//   return () => {
//     autoPricedItems.current.clear();
//   };
// }, [customerId, watchedItemIds ]);

// useEffect(() => {
//   autoPricedItems.current.clear();
// }, [customerId]);

// useEffect(() => {
//   watchedLines.forEach((line, index) => {
//     if (line.itemId && items?.items && !autoPricedItems.current.has(`${index}-${line.itemId}`)) {
//       const selectedItem = items.items.find((item: any) => item.id === line.itemId);
//       const selectedCustomer = customers?.customers?.find((customer: any) => customer.id === customerId);
//       console.log(selectedCustomer)
//       console.log(selectedItem)
//       if (selectedItem && selectedCustomer) {
//         const unitPrice = selectedCustomer.customerGroup === 'Bulk' 
//           ? selectedItem.sellingPriceBulk 
//           : selectedItem.sellingPriceOrdinary;
        
//         setValue(`saleLines.${index}.unitPrice`, unitPrice);
//         autoPricedItems.current.add(`${index}-${line.itemId}`);
//       }
//     }
//   });
// }, [watchedItemIds, items, setValue, watchedLines, customerId, customers?.customers]);


  useEffect(() => {
    watchedLines.forEach((line, index) => {
       if (line.itemId && items?.items && line.unitPrice === 0) {
      const selectedItem = items.items.find((item: any) => item.id === line.itemId);
        const selectedCustomer = customers?.customers?.find((customer: any)=> customer.id === customerId);
        if (selectedItem  && selectedCustomer) {
          const unitPrice = selectedCustomer.CustomerGroup ==='Bulk'
          ?selectedItem.sellingPriceBulk
          :selectedItem.sellingPriceOrdinary
          setValue(`saleLines.${index}.unitPrice`,unitPrice );
        }
      }
    });
  }, [watchedItemIds, items, customerId, setValue, watchedLines, customers?.customers]);

  const calculateTotal = () => {
    return watchedLines.reduce((sum, line) => {
      return sum + (line.qty || 0) * (line.unitPrice || 0);
    }, 0);
  };

  const onSubmit = async (data: CreateSaleFormData) => {
    console.log(data)
    try {
      await salesApi.createSale(data);
      toast.success('Sales order created successfully');
      onSuccess();
    } catch (error) {
      console.error('Create sale error:', error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Create Sales Order
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Header Information */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Customer *
                  </label>
                  <select
                    {...register('customerId')}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="">Select customer</option>
                    {customers?.customers?.map((customer: any) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.code} - {customer.name}
                      </option>
                    ))}
                  </select>
                  {errors.customerId && (
                    <p className="mt-1 text-sm text-red-600">{errors.customerId.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Order Date *
                  </label>
                  <input
                    {...register('orderDate')}
                    type="date"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                  {errors.orderDate && (
                    <p className="mt-1 text-sm text-red-600">{errors.orderDate.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Notes
                </label>
                <textarea
                  {...register('notes')}
                  rows={3}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Sales order notes"
                />
              </div>

              {/* Sale Lines */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-md font-medium text-gray-900">Items</h4>
                  <button
                    type="button"
                    onClick={() => append({ itemId: '', qty: 1, unitPrice: 0 })}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </button>
                </div>

                {errors.saleLines && (
                  <p className="mb-4 text-sm text-red-600">{errors.saleLines.message}</p>
                )}

                <div className="space-y-4">
                  {fields.map((field, index) => (
                    <div key={field.id} className="bg-gray-50 p-4 rounded-lg">
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-5">
                        <div className="sm:col-span-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Item *
                          </label>
                          <select
                            {...register(`saleLines.${index}.itemId`)}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          >
                            <option value="">Select item</option>
                            {items?.items?.map((item: any) => (
                              <option key={item.id} value={item.id}>
                                {item.sku} - {item.name}
                              </option>
                            ))}
                          </select>
                          {errors.saleLines?.[index]?.itemId && (
                            <p className="mt-1 text-sm text-red-600">
                              {errors.saleLines[index]?.itemId?.message}
                            </p>
                          )}
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Quantity *
                          </label>
                          <input
                            {...register(`saleLines.${index}.qty`, { valueAsNumber: true })}
                            type="number"
                            step="0.001"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="1.00"
                          />
                          {errors.saleLines?.[index]?.qty && (
                            <p className="mt-1 text-sm text-red-600">
                              {errors.saleLines[index]?.qty?.message}
                            </p>
                          )}
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Unit Price *
                          </label>
                          <input
                            {...register(`saleLines.${index}.unitPrice`, { valueAsNumber: true })}
                            type="number"
                            step="0.01"
                            disabled ={!canPerformActions}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="0.00"
                          />
                          {errors.saleLines?.[index]?.unitPrice && (
                            <p className="mt-1 text-sm text-red-600">
                              {errors.saleLines[index]?.unitPrice?.message}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex items-end">
                          <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700">
                              Line Total
                            </label>
                            <div className="mt-1 block w-full py-2 px-3 bg-gray-100 border border-gray-300 rounded-md text-sm text-gray-900">
                              ₦{((watchedLines[index]?.qty || 0) * (watchedLines[index]?.unitPrice || 0)).toLocaleString()}
                            </div>
                          </div>
                          {fields.length > 1 && (
                            <button
                              type="button"
                              onClick={() => remove(index)}
                              className="ml-2 inline-flex items-center px-3 py-2 border border-gray-300 bg-white text-gray-500 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="mt-4 bg-blue-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-medium text-gray-900">Total Amount:</span>
                    <span className="text-2xl font-bold text-blue-600">
                      ₦{calculateTotal().toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4 border-t">
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
                  {isSubmitting ? 'Creating...' : 'Create Sales Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateSaleModal;