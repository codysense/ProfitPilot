import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { cashApi, salesApi } from '../../lib/api';
import StatusBadge from '../../components/StatusBadge';
import toast from 'react-hot-toast';

const createCustomerPaymentSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  cashAccountId: z.string().min(1, 'Cash account is required'),
  amount: z.number().positive('Amount must be positive'),
  paymentDate: z.string().min(1, 'Payment date is required'),
  reference: z.string().optional(),
  notes: z.string().optional(),
  saleId: z.string().optional(),
});

type CreateCustomerPaymentFormData = z.infer<typeof createCustomerPaymentSchema>;

interface CreateCustomerPaymentModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const CreateCustomerPaymentModal = ({ onClose, onSuccess }: CreateCustomerPaymentModalProps) => {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<CreateCustomerPaymentFormData>({
    resolver: zodResolver(createCustomerPaymentSchema),
    defaultValues: {
      paymentDate: new Date().toISOString().split('T')[0]
    }
  });

  const selectedCustomerId = watch('customerId');
  const selectedSaleId = watch('saleId');

  const { data: customers } = useQuery({
    queryKey: ['customers-for-payment'],
    queryFn: () => salesApi.getCustomers({ limit: 100 })
  });

  const { data: cashAccounts } = useQuery({
    queryKey: ['cash-accounts-for-payment'],
    queryFn: () => cashApi.getCashAccounts()
  });

  const { data: customerSales } = useQuery({
    queryKey: ['customer-sales', selectedCustomerId],
    queryFn: () => selectedCustomerId ? 
      salesApi.getSales({ customerId: selectedCustomerId, status: 'INVOICED', limit: 100 }) : null,
    enabled: !!selectedCustomerId
  });

  // Auto-populate amount when sale is selected
  React.useEffect(() => {
    if (selectedSaleId && customerSales?.sales) {
      const selectedSale = customerSales.sales.find((sale: any) => sale.id === selectedSaleId);
      if (selectedSale) {
        setValue('amount', selectedSale.totalAmount);
      }
    }
  }, [selectedSaleId, customerSales, setValue]);

  const onSubmit = async (data: CreateCustomerPaymentFormData) => {
    try {
      await cashApi.createCustomerPayment(data);
      toast.success('Customer payment recorded successfully');
      onSuccess();
    } catch (error) {
      console.error('Create customer payment error:', error);
    }
  };

  const selectedCustomer = customers?.customers?.find((customer: any) => customer.id === selectedCustomerId);
  const selectedSale = customerSales?.sales?.find((sale: any) => sale.id === selectedSaleId);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Record Customer Payment
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

              {selectedCustomerId && customerSales?.sales && customerSales.sales.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Sales Order (Optional)
                  </label>
                  <select
                    {...register('saleId')}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="">General payment (not against specific order)</option>
                    {customerSales.sales.map((sale: any) => (
                      <option key={sale.id} value={sale.id}>
                        {sale.orderNo} - ₦{sale.totalAmount.toLocaleString()} ({sale.status})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {selectedSale && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Order No:</span>
                      <div className="font-medium">{selectedSale.orderNo}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Invoice Amount:</span>
                      <div className="font-medium">₦{selectedSale.totalAmount.toLocaleString()}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Order Date:</span>
                      <div className="font-medium">{new Date(selectedSale.orderDate).toLocaleDateString()}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Status:</span>
                      <div><StatusBadge status={selectedSale.status} /></div>
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
                    Amount Received *
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

              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-green-900 mb-2">Accounting Impact:</h4>
                <div className="text-sm text-green-800 space-y-1">
                  <div>• Cash Account will be <strong>debited</strong> (increased)</div>
                  <div>• Trade Receivables will be <strong>credited</strong> (decreased)</div>
                  <div>• Customer balance will be reduced</div>
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
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
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

export default CreateCustomerPaymentModal;