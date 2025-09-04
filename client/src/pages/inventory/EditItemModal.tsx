import React, { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Plus, Trash2, Save } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { inventoryApi } from '../../lib/api';
import { Item } from '../../types/api';
import toast from 'react-hot-toast';

// const editItemSchema = z.object({
//   sku: z.string().min(1, 'SKU is required'),
//   name: z.string().min(1, 'Name is required'),
//   description: z.string().optional(),
//   type: z.enum(['RAW_MATERIAL', 'WORK_IN_PROGRESS', 'FINISHED_GOODS', 'CONSUMABLE']),
//   uom: z.string().default('QTY'),
//   costingMethod: z.enum(['GLOBAL', 'FIFO', 'WEIGHTED_AVG']).default('GLOBAL'),
//   standardCost: z.number().default(0),
//   sellingPriceOrdinary: z.number().optional(),
//   sellingPriceBulk: z.number().optional(),
//   sellingPriceWIC: z.number().optional()
// });


const toNumberOrNull = (val: unknown) => {
  if (val === "" || val === null || val === undefined) return null;
  return Number(val);
};

const editItemSchema = z.object({
  sku: z.string().min(1, 'SKU is required'),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  type: z.enum(['RAW_MATERIAL', 'WORK_IN_PROGRESS', 'FINISHED_GOODS', 'CONSUMABLE']),
  uom: z.string().default('QTY'),
  costingMethod: z.enum(['GLOBAL', 'FIFO', 'WEIGHTED_AVG']).default('GLOBAL'),
  standardCost: z.preprocess(toNumberOrNull, z.number().nullable()),
  sellingPriceOrdinary: z.preprocess(toNumberOrNull, z.number().nullable()),
  sellingPriceBulk: z.preprocess(toNumberOrNull, z.number().nullable()),
  sellingPriceWIC: z.preprocess(toNumberOrNull, z.number().nullable()),
});



type EditItemFormData = z.infer<typeof editItemSchema>;

interface EditItemModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface EditItemModalProps {
  item: Item;
  onClose: () => void;
  onSuccess: () => void;
}

const EditItemModal = ({ item, onClose, onSuccess }: EditItemModalProps)=>{
     const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting }
      } = useForm<EditItemFormData>({
        resolver: zodResolver(editItemSchema),
        defaultValues: {
          sku: item.sku,
          type: item.type,
          name:item.name,
          description:item.description,
          uom:item.uom,
          costingMethod:item.costingMethod,
          standardCost:item.standardCost,
          sellingPriceOrdinary:item.sellingPriceOrdinary,
          sellingPriceWIC:item.sellingPriceWIC,
          sellingPriceBulk: item.sellingPriceBulk

        }
      });

     // Reset form when item changes
        useEffect(() => reset({
            sku: item.sku,
            type: item.type,
            name: item.name,
            description: item.description,
            uom: item.uom,
            costingMethod: item.costingMethod,
            standardCost: item.standardCost,
            sellingPriceOrdinary: item.sellingPriceOrdinary,
            sellingPriceWIC: item.sellingPriceWIC,
            sellingPriceBulk: item.sellingPriceBulk
        }), [item, reset]);

    const onSubmit = async (data: EditItemFormData) => {
    try {
        console.log("Submitting form data:", data);

      //  updated item data
      await inventoryApi.createItem({
         sku: data.sku,
          type: data.type,
          name:data.name,
          description:data.description,
          uom:data.uom,
          costingMethod:data.costingMethod,
          standardCost:data.standardCost,
          sellingPriceOrdinary: data.sellingPriceOrdinary,
          sellingPriceWIC: data.sellingPriceWIC,
          sellingPriceBulk: data.sellingPriceBulk,
      });
      toast.success('Item updated successfully');
      onSuccess();
    } catch (error) {
        console.log(data)
      console.error('Edit Item  error:', error);
    }
  };

  return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
          
          <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Edit Item
                </h3>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      SKU *
                    </label>
                    <input
                      {...register('sku')}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="e.g., RM-001"
                    />
                    {errors.sku && (
                      <p className="mt-1 text-sm text-red-600">{errors.sku.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Type *
                    </label>
                    <select
                      {...register('type')}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="RAW_MATERIAL">Raw Material</option>
                      <option value="WORK_IN_PROGRESS">Work in Progress</option>
                      <option value="FINISHED_GOODS">Finished Goods</option>
                      <option value="CONSUMABLE">Consumable</option>
                    </select>
                    {errors.type && (
                      <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Name *
                  </label>
                  <input
                    {...register('name')}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Item name"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    {...register('description')}
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Item description"
                  />
                </div>
                
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Cost Price
                    </label>
                    <input
                      {...register('standardCost', { valueAsNumber: true })}
                      type="number"
                      step="0.01"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="0.00"
                    />
                  </div>
                   <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Bulk Price
                    </label>
                    <input
                      {...register('sellingPriceBulk', { valueAsNumber: true })}
                       type="number"
                      step="0.01"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Retail Price
                    </label>
                    <input
                      {...register('sellingPriceOrdinary', { valueAsNumber: true })}
                      type="number"
                      step="0.01"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="0.00"
                    />
                  </div>
                
                  <div>
                  <label className="block text-sm font-medium text-gray-700">
                    WIC Price
                  </label>
                  <input
                    {...register('sellingPriceWIC',{valueAsNumber:true})}                    
                     type="number"
                      step="0.01"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="0.00"
                  />
                </div>
                </div>
                
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Costing Method
                    </label>
                    <select
                      {...register('costingMethod')}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="GLOBAL">Use Global Setting</option>
                      <option value="FIFO">FIFO</option>
                      <option value="WEIGHTED_AVG">Weighted Average</option>
                    </select>
                  </div>
  
                   <div>
                    <label className="block text-sm font-medium text-gray-700">
                      UOM
                    </label>
                    <input
                      {...register('uom')}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="QTY"
                    />
                  </div>
                  
                  
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
                    {isSubmitting ? 'Editing...' : 'Edit Item'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    );


}
export default EditItemModal