import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, RotateCcw, Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { posApi } from '../../lib/api';
import { PosSession, PosSale } from '../../types/api';
import toast from 'react-hot-toast';

const posReturnSchema = z.object({
  originalSaleId: z.string().min(1, 'Original sale is required'),
  reason: z.string().min(1, 'Return reason is required'),
  returnLines: z.array(z.object({
    originalLineId: z.string().min(1, 'Original line is required'),
    itemId: z.string().min(1, 'Item is required'),
    qtyReturned: z.number().positive('Return quantity must be positive'),
    unitPrice: z.number().positive('Unit price must be positive'),
  })).min(1, 'At least one item must be returned'),
});

type PosReturnFormData = z.infer<typeof posReturnSchema>;

interface PosReturnsModalProps {
  session: PosSession;
  onClose: () => void;
  onReturnComplete: () => void;
}

const PosReturnsModal = ({ session, onClose, onReturnComplete }: PosReturnsModalProps) => {
  const [selectedSale, setSelectedSale] = useState<PosSale | null>(null);
  const [saleSearch, setSaleSearch] = useState('');
  
  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<PosReturnFormData>({
    resolver: zodResolver(posReturnSchema)
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'returnLines'
  });

  const { data: recentSales } = useQuery({
    queryKey: ['recent-pos-sales'],
    queryFn: () => posApi.getSales({ 
      limit: 50,
      dateFrom: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Last 7 days
    })
  });

  const handleSaleSelect = (sale: PosSale) => {
    setSelectedSale(sale);
    reset({
      originalSaleId: sale.id,
      reason: '',
      returnLines: sale.saleLines.map(line => ({
        originalLineId: line.id,
        itemId: line.itemId,
        qtyReturned: 0,
        unitPrice: line.unitPrice
      }))
    });
  };

  const onSubmit = async (data: PosReturnFormData) => {
    try {
      // Filter out lines with zero quantity
      const validReturnLines = data.returnLines.filter(line => line.qtyReturned > 0);
      
      if (validReturnLines.length === 0) {
        toast.error('Please specify quantities to return');
        return;
      }

      await posApi.createReturn({
        ...data,
        sessionId: session.id,
        returnLines: validReturnLines
      });
      
      toast.success('Return processed successfully');
      onReturnComplete();
    } catch (error) {
      console.error('Process return error:', error);
    }
  };

  const filteredSales = recentSales?.sales?.filter((sale: PosSale) => 
    sale.status === 'COMPLETED' && 
    (sale.saleNo.toLowerCase().includes(saleSearch.toLowerCase()) ||
     sale.customer?.name.toLowerCase().includes(saleSearch.toLowerCase()))
  ) || [];

  const calculateReturnTotal = () => {
    return watch('returnLines')?.reduce((sum, line) => {
      return sum + (line.qtyReturned || 0) * (line.unitPrice || 0);
    }, 0) || 0;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Process Return - {session.sessionNo}
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            {!selectedSale ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search Recent Sales
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search by sale number or customer name..."
                      value={saleSearch}
                      onChange={(e) => setSaleSearch(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div className="max-h-96 overflow-y-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sale No</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredSales.map((sale: PosSale) => (
                        <tr key={sale.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {sale.saleNo}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {sale.customer?.name || 'Walk-in Customer'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(sale.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ₦{sale.totalAmount.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => handleSaleSelect(sale)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Select for Return
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Selected Sale Info */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-blue-900">
                        Return for Sale: {selectedSale.saleNo}
                      </h4>
                      <p className="text-sm text-blue-700">
                        Customer: {selectedSale.customer?.name || 'Walk-in'} | 
                        Date: {new Date(selectedSale.createdAt).toLocaleDateString()} |
                        Total: ₦{selectedSale.totalAmount.toLocaleString()}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedSale(null)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Change Sale
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Return Reason *
                  </label>
                  <select
                    {...register('reason')}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="">Select reason</option>
                    <option value="DEFECTIVE">Defective Product</option>
                    <option value="WRONG_ITEM">Wrong Item</option>
                    <option value="CUSTOMER_CHANGE_MIND">Customer Changed Mind</option>
                    <option value="DAMAGED">Damaged in Transit</option>
                    <option value="OTHER">Other</option>
                  </select>
                  {errors.reason && (
                    <p className="mt-1 text-sm text-red-600">{errors.reason.message}</p>
                  )}
                </div>

                {/* Return Lines */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4">Items to Return</h4>
                  <div className="space-y-4">
                    {fields.map((field, index) => {
                      const originalLine = selectedSale.saleLines[index];
                      if (!originalLine) return null;

                      return (
                        <div key={field.id} className="bg-gray-50 p-4 rounded-lg">
                          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                            <div className="sm:col-span-2">
                              <label className="block text-sm font-medium text-gray-700">
                                Item
                              </label>
                              <div className="mt-1 p-2 bg-white border border-gray-300 rounded-md text-sm">
                                <div className="font-medium">{originalLine.item.sku}</div>
                                <div className="text-gray-500">{originalLine.item.name}</div>
                                <div className="text-xs text-gray-400">
                                  Original: {originalLine.qty} @ ₦{originalLine.unitPrice.toLocaleString()}
                                </div>
                              </div>
                              <input type="hidden" {...register(`returnLines.${index}.originalLineId`)} />
                              <input type="hidden" {...register(`returnLines.${index}.itemId`)} />
                              <input type="hidden" {...register(`returnLines.${index}.unitPrice`)} />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Qty to Return
                              </label>
                              <input
                                {...register(`returnLines.${index}.qtyReturned`, { valueAsNumber: true })}
                                type="number"
                                step="0.001"
                                min="0"
                                max={originalLine.qty}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder="0"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Return Value
                              </label>
                              <div className="mt-1 block w-full py-2 px-3 bg-gray-100 border border-gray-300 rounded-md text-sm text-gray-900">
                                ₦{((watch(`returnLines.${index}.qtyReturned`) || 0) * originalLine.unitPrice).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Return Total */}
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-medium text-gray-900">Total Refund:</span>
                    <span className="text-2xl font-bold text-red-600">
                      ₦{calculateReturnTotal().toLocaleString()}
                    </span>
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
                    disabled={isSubmitting || calculateReturnTotal() === 0}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    {isSubmitting ? 'Processing...' : 'Process Return'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PosReturnsModal;