import { Dialog } from '@headlessui/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { useQuery } from '@tanstack/react-query';
import { useCreateMemo } from '../../hooks/useMemo';
// import { memoSchema } from '../../../../server/src/types/memo';
import { z } from 'zod';
import { managementApi, salesApi } from '../../lib/api';
import { purchaseApi } from '../../lib/api'
import { X } from "lucide-react";
import { VendorSelect } from '../../components/VendorSelect';
import { CustomerSelect } from '../../components/CustomerSelect';
import { ChartAccountSelect } from '../../components/ChartAccountSelect';





const memoSchema = z.object({
  module: z.enum(["SALES", "PURCHASES"]),
  memoType: z.enum(["CREDIT", "DEBIT"]),
  accountId: z.string().min(1, "Account is required"), // GL account affected
  customerId: z.string().optional(), // required if module = SALES
  vendorId: z.string().optional(),   // required if module = PURCHASES
  amount: z.number().positive(),
  description: z.string().min(3).optional(),
});

 type FormValues = z.infer<typeof memoSchema>;

export const MemoModal = ({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const createMemo = useCreateMemo();

  // Fetch dropdown data
  const { data: customers } = useQuery({
    queryKey: ['customers-for-payment'],
    queryFn: () => salesApi.getCustomers({ limit: 100 }),
  });

  const { data: vendors } = useQuery({
    queryKey: ['vendors-for-payments'],
    queryFn: () => purchaseApi.getVendors({ limit: 100 }),
  });

  const { data: chartAccounts } = useQuery({
    queryKey: ['chart-accounts-for-transaction'],
    queryFn: () => managementApi.getChartOfAccounts(),
  });
// console.log('customers ', customers, 'vendors ', vendors, 'chartAccount', chartAccounts)
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
    getValues,
    setValue,
  } = useForm<FormValues>({
    resolver: zodResolver(memoSchema),
    defaultValues: {
      memoType: 'CREDIT',
      description: '',
      amount: 0,
    },
  });


  const selectedModule = watch('module');

  const onSubmit = async (data: FormValues) => {
   
    try {
      await createMemo.mutateAsync({
        memoType: data.memoType,
        customerId: data.customerId,
        vendorId: data.vendorId,
        accountId: data.accountId,
        amount: data.amount,
        description: data.description,
        module:data.module
    
      });
      toast.success('Memo created successfully');
      onSuccess();
    } catch (err) {
      toast.error('Failed to create memo');
    }
  };

  



return (
  <div className="fixed inset-0 z-50 overflow-y-auto">
    <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
      {/* Background overlay */}
      <div
        className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
        onClick={onClose}
      />

      {/* Modal panel */}
      <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
        <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              New Memo
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Module */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Module *
              </label>
              <select
                {...register("module")}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 
                           focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="SALES">Sales</option>
                <option value="PURCHASES">Purchases</option>
              </select>
              {errors.module && (
                <p className="mt-1 text-sm text-red-600">{errors.module.message}</p>
              )}
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Type *
              </label>
              <select
                {...register("memoType")}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 
                           focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="CREDIT">Credit</option>
                <option value="DEBIT">Debit</option>
              </select>
              {errors.memoType && (
                <p className="mt-1 text-sm text-red-600">{errors.memoType.message}</p>
              )}
            </div>

            {/* Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Reason *
              </label>
              <input
                {...register("description")}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 
                           focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Amount *
              </label>
              <input
                type="number"
                {...register("amount", { valueAsNumber: true })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 
                           focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              {errors.amount && (
                <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
              )}
            </div>

            {/* Customer (only when SALES) */}
                {selectedModule === "SALES" && (
                    <div>
                    <label className="block text-sm font-medium text-gray-700">
                    Customer *
             </label>
    <CustomerSelect
        customers={customers?.customers || []}
        value={watch("customerId")}
        onChange={(val) => reset({ ...getValues(), customerId: val })}
            error={errors.customerId?.message}
        />
    {errors.customerId && (
      <p className="mt-1 text-sm text-red-600">{errors.customerId.message}</p>
    )}
  </div>
)}

{/* Vendor (only when PURCHASES) */}
{selectedModule === "PURCHASES" && (
  <div>
    <label className="block text-sm font-medium text-gray-700">
      Vendor *
    </label>
    <VendorSelect
        vendors={vendors?.vendors || []}
        value={watch("vendorId")}
        onChange={(val) => setValue("vendorId", val, { shouldDirty: true })}
        error={errors.vendorId?.message}
        />
    {/* <select
      {...register("vendorId")}
      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 
                 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
    >
      <option value="">-- Select Vendor --</option>
      {vendors?.vendors?.map((v: any) => (
        <option key={v.id} value={v.id}>
          {v.name}
        </option>
      ))}
    </select> */}
    {errors.vendorId && (
      <p className="mt-1 text-sm text-red-600">{errors.vendorId.message}</p>
    )}
  </div>
)}


            {/* GL Account */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                GL Account *
              </label>
              <ChartAccountSelect
        accounts={chartAccounts?.accounts || []}
        value={watch("accountId")}
        onChange={(val) => setValue("accountId", val, { shouldDirty: true })}
        error={errors.accountId?.message}
        />
              {errors.accountId && (
                <p className="mt-1 text-sm text-red-600">{errors.accountId.message}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 
                           hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white
                  ${watch("memoType") === "CREDIT"
                    ? "bg-green-600 hover:bg-green-700 focus:ring-green-500"
                    : watch("memoType") === "DEBIT"
                    ? "bg-red-600 hover:bg-red-700 focus:ring-red-500"
                    : "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
                  }`}
              >
                {`Post ${watch("memoType") === "CREDIT" ? "Credit" : watch("memoType") === "DEBIT" ? "Debit" : ""}`}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
);

}


    
//   return (
//     <Dialog
//       open={true}
//       onClose={onClose}
//       className="fixed inset-0 flex items-center justify-center"
//     >
//       <div className="bg-white p-6 rounded shadow-lg w-full max-w-lg overflow-y-auto">
//         <Dialog.Title className="text-lg font-medium mb-4">New Memo</Dialog.Title>
//         <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
//             <div>
//   <label className="block text-sm">Module</label>
//   <select {...register('module')} className="border rounded w-full px-2 py-1">
//     <option value="SALES">Sales</option>
//     <option value="PURCHASES">Purchases</option>
//   </select>
//   {errors.module && <p className="text-red-600">{errors.module.message}</p>}
// </div>
//           {/* Type */}
//           <div>
//             <label className="block text-sm">Type</label>
//             <select
//               {...register('memoType')}
//               className="border rounded w-full px-2 py-1"
//             >
//               <option value="CREDIT">Credit</option>
//               <option value="DEBIT">Debit</option>
//             </select>
//             {errors.memoType && <p className="text-red-600">{errors.memoType.message}</p>}
//           </div>

//           {/* Reason */}
//           <div>
//             <label className="block text-sm">Reason</label>
//             <input
//               {...register('description')}
//               className="border rounded w-full px-2 py-1"
//             />
//             {errors.description && (
//               <p className="text-red-600">{errors.description.message}</p>
//             )}
//           </div>

//           {/* Amount */}
//           <div>
//             <label className="block text-sm">Amount</label>
//             <input
//               type="number"
//               {...register('amount', { valueAsNumber: true })}
//               className="border rounded w-full px-2 py-1"
//             />
//             {errors.amount && (
//               <p className="text-red-600">{errors.amount.message}</p>
//             )}
//           </div>

//           {/* Customer */}
//           <div>
//             <label className="block text-sm">Customer (optional)</label>
//             <select {...register('customerId')} className="border rounded w-full px-2 py-1">
//               <option value="">-- Select Customer --</option>
//               {customers?.customers?.map((c: any) => (
//                 <option key={c.id} value={c.id}>
//                   {c.name}
//                 </option>
//               ))}
//             </select>
//           </div>

//           {/* Vendor */}
//           <div>
//             <label className="block text-sm">Vendor (optional)</label>
//             <select {...register('vendorId')} className="border rounded w-full px-2 py-1">
//               <option value="">-- Select Vendor --</option>
//               {vendors?.vendors?.map((v: any) => (
//                 <option key={v.id} value={v.id}>
//                   {v.name}
//                 </option>
//               ))}
//             </select>
//           </div>

//           {/* Chart of Accounts */}
//           <div>
//             <label className="block text-sm">GL Account</label>
//             <select {...register('accountId')} className="border rounded w-full px-2 py-1">
//               <option value="">-- Select Account --</option>
//               {chartAccounts?.accounts?.map((acc: any) => (
//                 <option key={acc.id} value={acc.id}>
//                   {acc.code} - {acc.name}
//                 </option>
//               ))}
//             </select>
//             {errors.accountId && (
//               <p className="text-red-600">{errors.accountId.message}</p>
//             )}
//           </div>

//           {/* Actions */}
//           <div className="flex justify-end gap-2">
//             <button
//               type="button"
//               onClick={onClose}
//               className="px-4 py-2 border rounded"
//             >
//               Cancel
//             </button>
//             <button
//               type="submit" 
//               className="px-4 py-2 bg-blue-600 text-white rounded"
//             >
//               Post
//             </button>
//           </div>
//         </form>
//       </div>
//     </Dialog>
//   );
 //};