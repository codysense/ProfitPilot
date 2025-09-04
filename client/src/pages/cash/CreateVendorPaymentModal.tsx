import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { cashApi, purchaseApi } from '../../lib/api';
import StatusBadge from '../../components/StatusBadge';
import toast from 'react-hot-toast';

const createVendorPaymentSchema = z.object({
  vendorId: z.string().min(1, 'Vendor is required'),
  cashAccountId: z.string().min(1, 'Cash account is required'),
  amount: z.number().positive('Amount must be positive'),
  paymentDate: z.string().min(1, 'Payment date is required'),
  reference: z.string().optional(),
  notes: z.string().optional(),
  purchaseId: z.string().optional(),
});

type CreateVendorPaymentFormData = z.infer<typeof createVendorPaymentSchema>;

interface CreateVendorPaymentModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const CreateVendorPaymentModal = ({ onClose, onSuccess }: CreateVendorPaymentModalProps) => {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<CreateVendorPaymentFormData>({
    resolver: zodResolver(createVendorPaymentSchema),
    defaultValues: {
      paymentDate: new Date().toISOString().split('T')[0]
    }
  });

  const selectedVendorId = watch('vendorId');
  const selectedPurchaseId = watch('purchaseId');

  const { data: vendors } = useQuery({
    queryKey: ['vendors-for-payment'],
    queryFn: () => purchaseApi.getVendors({ limit: 100 })
  });

  const { data: cashAccounts } = useQuery({
    queryKey: ['cash-accounts-for-payment'],
    queryFn: () => cashApi.getCashAccounts()
  });

  const { data: vendorPurchases } = useQuery({
    queryKey: ['vendor-purchases', selectedVendorId],
    queryFn: () => selectedVendorId ? 
      purchaseApi.getPurchases({ vendorId: selectedVendorId, status: 'INVOICED', limit: 100 }) : null,
    enabled: !!selectedVendorId
  });

  // Auto-populate amount when purchase is selected
  React.useEffect(() => {
    if (selectedPurchaseId && vendorPurchases?.purchases) {
      const selectedPurchase = vendorPurchases.purchases.find((purchase: any) => purchase.id === selectedPurchaseId);
      if (selectedPurchase) {
        setValue('amount', selectedPurchase.totalAmount);
      }
    }
  }, [selectedPurchaseId, vendorPurchases, setValue]);

  const onSubmit = async (data: CreateVendorPaymentFormData) => {
    try {
      await cashApi.createVendorPayment(data);
      toast.success('Vendor payment recorded successfully');
      onSuccess();
    } catch (error) {
      console.error('Create vendor payment error:', error);
    }
  };

  const selectedVendor = vendors?.vendors?.find((vendor: any) => vendor.id === selectedVendorId);
  const selectedPurchase = vendorPurchases?.purchases?.find((purchase: any) => purchase.id === selectedPurchaseId);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Record Vendor Payment
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
                  Vendor *
                </label>
                <select
                  {...register('vendorId')}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">Select vendor</option>
                  {vendors?.vendors?.map((vendor: any) => (
                    <option key={vendor.id} value={vendor.id}>
                      {vendor.code} - {vendor.name}
                    </option>
                  ))}
                </select>
                {errors.vendorId && (
                  <p className="mt-1 text-sm text-red-600">{errors.vendorId.message}</p>
                )}
              </div>

              {selectedVendorId && vendorPurchases?.purchases && vendorPurchases.purchases.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Purchase Order (Optional)
                  </label>
                  <select
                    {...register('purchaseId')}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="">General payment (not against specific order)</option>
                    {vendorPurchases.purchases.map((purchase: any) => (
                      <option key={purchase.id} value={purchase.id}>
                        {purchase.orderNo} - ₦{purchase.totalAmount.toLocaleString()} ({purchase.status})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {selectedPurchase && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Order No:</span>
                      <div className="font-medium">{selectedPurchase.orderNo}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Invoice Amount:</span>
                      <div className="font-medium">₦{selectedPurchase.totalAmount.toLocaleString()}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Order Date:</span>
                      <div className="font-medium">{new Date(selectedPurchase.orderDate).toLocaleDateString()}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Status:</span>
                      <div><StatusBadge status={selectedPurchase.status} /></div>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Cash Account *
                  </label>
                  <select
                    {...register('cashAccountId')}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="">Select cash account</option>
                    {cashAccounts?.accounts?.map((account: any) => (
                      <option key={account.id} value={account.id}>
                        {account.code} - {account.name} (₦{Number(account.balance).toLocaleString()})
                      </option>
                    ))}
                  </select>
                  {errors.cashAccountId && (
                    <p className="mt-1 text-sm text-red-600">{errors.cashAccountId.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Payment Date *
                  </label>
                  <input
                    {...register('paymentDate')}
                    type="date"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                  {errors.paymentDate && (
                    <p className="mt-1 text-sm text-red-600">{errors.paymentDate.message}</p>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Amount Paid *
                  </label>
                  <input
                    {...register('amount', { valueAsNumber: true })}
                    type="number"
                    step="0.01"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="0.00"
                  />
                  {errors.amount && (
                    <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Reference
                  </label>
                  <input
                    {...register('reference')}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Check number, transfer ref, etc."
                  />
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
                  placeholder="Payment notes or additional details"
                />
              </div>

              <div className="bg-red-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-red-900 mb-2">Accounting Impact:</h4>
                <div className="text-sm text-red-800 space-y-1">
                  <div>• Trade Payables will be <strong>debited</strong> (decreased)</div>
                  <div>• Cash Account will be <strong>credited</strong> (decreased)</div>
                  <div>• Vendor balance will be reduced</div>
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
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Recording...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateVendorPaymentModal;