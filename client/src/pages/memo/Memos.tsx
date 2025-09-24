import { useState } from 'react';
import { useMemos } from '../../hooks/useMemo';
import { MemoModal } from './CreateMemoModal';
// import { format } from 'date-fns';

export const Memos = () => {
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
// console.log(data)
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
          <option value="CREDIT">Credit</option>
          <option value="DEBIT">Debit</option>
        </select>

        <select
  value={query.partyType}
  onChange={(e) => setQuery({ ...query, partyType: e.target.value })}
  className="block w-40 px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
>
  <option value="">All</option>
  <option value="CUSTOMER">Customer</option>
  <option value="VENDOR">Vendor</option>
</select>


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
          New Memo
        </button>
      </div>

      {/* Table */}
      <table className="min-w-full border">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-3 py-2 border text-gray-600">Date</th>
            <th className="px-3 py-2 border  text-gray-600">Status</th>
            <th className="px-3 py-2 border  text-gray-600">Type</th>
            <th className="px-3 py-2 border  text-gray-600">Customer</th>
            <th className="px-3 py-2 border  text-gray-600">Vendor</th>
            <th className="px-3 py-2 border  text-gray-600">Amount</th>
            <th className="px-3 py-2 border  text-gray-600">Reason</th>
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
data
  ?.filter((memo: any) => {
    if (query.partyType === "CUSTOMER") {
      return memo.customer !== null;
    }
    if (query.partyType === "VENDOR") {
      return memo.vendor !== null;
    }
    return true; // All
  })
  .map((memo: any) => (
    
    <tr key={memo.id} className="hover:bg-gray-50">
      <td className="px-3 py-2 border text-gray-500">
        {memo.date?new Date(memo.date).toISOString().split("T")[0]:'-'}
      </td>
      <td className="px-3 py-2 border text-gray-500">{memo.module}</td>
      <td className="px-3 py-2 border   text-gray-500">{memo.memoType}</td>
      <td className="px-3 py-2 border text-gray-500">{memo.customer?.name || "-"}</td>
      <td className="px-3 py-2 border text-gray-500">{memo.vendor?.name || "-"}</td>
      <td className="px-3 py-2 border text-gray-500">{Number(memo.amount).toLocaleString()}</td>
      <td className="px-3 py-2 border text-gray-500">{memo.description}</td>
    </tr>
  ))
        


          )}
        </tbody>
      </table>

      {/* Modal */}
      {isModalOpen && (
        <MemoModal
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
