import { useState } from 'react';
import { useMemos } from '../../hooks/useMemo';
import CreateAdjustmentModal from './createAdjustmentModal';
import { adjustmentApi } from '../../lib/api';
import { useQuery } from '@tanstack/react-query';
// import { format } from 'date-fns';

export const Adjustments = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [query, setQuery] = useState<any>({
    page: 1,
    pageSize: 20,
    type: '',
    customerId: '',
    vendorId: '',
    status: '',
    date: '',
  });

  const { data, isLoading, refetch } = useMemos(query);

//   const adjustments = data ?? [];
  const pagination = data?.pagination ?? {
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 1,
  };
//  console.log(data)

const { data: adjustments } = useQuery({
    queryKey: ['adjustments'],
    queryFn: () => adjustmentApi.getStockAdjustment()
  });
  console.log(adjustments)

 
  return (
    <div>
      {/* Filters */}
      <div className="flex gap-4 mb-4">
        <select
          value={query.type}
          onChange={(e) => setQuery({ ...query, type: e.target.value })}
          className="block w-40 px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        >
          <option value="">All Types</option>
          <option value="CREDIT">FINISHED_GOODS</option>
          <option value="DEBIT">RAW MATERIAL</option>
        </select>

        {/* <select
  value={query.partyType}
  onChange={(e) => setQuery({ ...query, partyType: e.target.value })}
  className="block w-40 px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
>
  <option value="">All</option>
  <option value="CUSTOMER">Customer</option>
  <option value="VENDOR">Vendor</option>
</select> */}


        <input
          type="date"
          value={query.date}
          onChange={(e) => setQuery({ ...query, date: e.target.value })}
          className="block w-40 px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />

        <button
          onClick={() => setIsModalOpen(true)}
          className="ml-auto bg-blue-600 text-white px-4 py-2 rounded"
        >
          New Stock Adjustment
        </button>
      </div>

      {/* Table */}
      <table className="min-w-full border">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-3 py-2 border text-gray-600">Date</th>
            <th className="px-3 py-2 border  text-gray-600">Item</th>
            <th className="px-3 py-2 border  text-gray-600">Adjustment Type</th>
            <th className="px-3 py-2 border  text-gray-600">Quantity</th>
            <th className="px-3 py-2 border  text-gray-600">Warehouse</th>
            <th className="px-3 py-2 border  text-gray-600">Posted by</th>
            {/* <th className="px-3 py-2 border  text-gray-600">Amount</th>
            <th className="px-3 py-2 border  text-gray-600">Reason</th> */}
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan={7} className="text-center py-4">
                Loading...
              </td>
            </tr>
          ) : (             
adjustments.data?.map((adjustment: any) => (
    
    <tr key={adjustment.id} className="hover:bg-gray-50">
      <td className="px-3 py-2 border text-gray-500">
        {adjustment.date?new Date(adjustment.date).toISOString().split("T")[0]:'-'}
      </td>
      <td className="px-3 py-2 border text-gray-500">{adjustment.itemName}</td>
      <td className="px-3 py-2 border   text-gray-500">{adjustment.adjustmentType}</td>
      <td className="px-3 py-2 border text-gray-500">{adjustment.quantity || "-"}</td>
      <td className="px-3 py-2 border text-gray-500">{adjustment.warehouse || "-"}</td>
      {/* <td className="px-3 py-2 border text-gray-500">{Number(adjustme).toLocaleString()}</td> */}
      <td className="px-3 py-2 border text-gray-500">{adjustment.createdBy}</td>
      {/* <td className="px-3 py-2 border text-gray-500">{memo.user.name}</td> */}
    </tr>
  ))
        


          )}
        </tbody>
      </table>
          {/* Pagination */}
      <div className="flex justify-between items-center mt-4">
        <button
          disabled={query.page <= 1}
          onClick={() => setQuery({ ...query, page: query.page - 1 })}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          Previous
        </button>
        <span className="text-sm text-gray-600">
          Page {pagination.page} of {pagination.totalPages} (Total {pagination.total})
        </span>
        <button
          disabled={query.page >= pagination.totalPages}
          onClick={() => setQuery({ ...query, page: query.page + 1 })}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
      {/* Modal */}
      {isModalOpen && (
        <CreateAdjustmentModal
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            refetch();
          }}
        />
      )}
    </div>
  );
};
