import { useState } from "react";
import CreateJournalModal from "./createJournalModal";
import { useQuery } from "@tanstack/react-query";
import { journalApi } from "../../lib/api";

export const Journals = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [query, setQuery] = useState<any>({
    page: 1,
    pageSize: 20,
    date: "",
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["journals", query],
    queryFn: () => journalApi.getJournal(query),
    // keepPreviousData: true, // helps smooth pagination
  });

  const journals = data?.data ?? [];
  const pagination = data?.pagination ?? {
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 1,
  };

  return (
    <div>
      {/* Filters */}
      <div className="flex gap-4 mb-4">
        <input
          type="date"
          value={query.date}
          onChange={(e) => setQuery({ ...query, page: 1, date: e.target.value })}
          className="block w-40 px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />

        <button
          onClick={() => setIsModalOpen(true)}
          className="ml-auto bg-blue-600 text-white px-4 py-2 rounded"
        >
          New Journal
        </button>
      </div>

      {/* Table */}
      <table className="min-w-full border">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-3 py-2 border text-gray-600">Date</th>
            <th className="px-3 py-2 border text-gray-600">Account</th>
            <th className="px-3 py-2 border text-gray-600">Debit Amount</th>
            <th className="px-3 py-2 border text-gray-600">Credit Amount</th>
            <th className="px-3 py-2 border text-gray-600">Reason</th>
            <th className="px-3 py-2 border text-gray-600">Posted By</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan={7} className="text-center py-4">
                Loading...
              </td>
            </tr>
          ) : journals.length === 0 ? (
            <tr>
              <td colSpan={7} className="text-center py-4">
                No records found
              </td>
            </tr>
          ) : (
            journals.map((journal: any) => (
              <tr key={journal.id} className="hover:bg-gray-50">
                <td className="px-3 py-2 border text-gray-500">
                  {journal.date
                    ? new Date(journal.date).toISOString().split("T")[0]
                    : "-"}
                </td>
                <td className="px-3 py-2 border text-gray-500">
                  {journal.accountName || "-"}
                </td>
                <td className="px-3 py-2 border text-gray-500">
                  {Number(journal.debit).toLocaleString()}
                </td>
                <td className="px-3 py-2 border text-gray-500">
                  {Number(journal.credit).toLocaleString()}
                </td>
                <td className="px-3 py-2 border text-gray-500">
                  {journal.memo || journal.note || "-"}
                </td>
                <td className="px-3 py-2 border text-gray-500">
                  {journal.postedBy || "-"}
                </td>
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
        <CreateJournalModal
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



// import { useState } from "react";
// import CreateJournalModal from "./createJournalModal";
// import { useQuery } from "@tanstack/react-query";
// import { journalApi } from "../../lib/api";

// export const Journals = () => {
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [query, setQuery] = useState<any>({
//     page: 1,
//     pageSize: 20,
//     date: "",
//   });

//   const { data, isLoading, refetch } = useQuery({
//     queryKey: ["journals", query],
//     queryFn: () => journalApi.getJournal(query),
//   });
//  console.log(data)
//   return (
//     <div>
//       {/* Filters */}
//       <div className="flex gap-4 mb-4">
//         <input
//           type="date"
//           value={query.date}
//           onChange={(e) => setQuery({ ...query, date: e.target.value })}
//           className="block w-40 px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
//         />

//         <button
//           onClick={() => setIsModalOpen(true)}
//           className="ml-auto bg-blue-600 text-white px-4 py-2 rounded"
//         >
//           New Journal
//         </button>
//       </div>

//       {/* Table */}
//       <table className="min-w-full border">
//         <thead className="bg-gray-100">
//           <tr>
//             <th className="px-3 py-2 border text-gray-600">Date</th>
//             <th className="px-3 py-2 border text-gray-600">Account</th>
//             <th className="px-3 py-2 border text-gray-600">Debit Amount</th>
//             <th className="px-3 py-2 border text-gray-600">Credit Amount</th>
//             <th className="px-3 py-2 border text-gray-600">Reason</th>
//             <th className="px-3 py-2 border text-gray-600">Posted By</th>
//           </tr>
//         </thead>
//         <tbody>
//           {isLoading ? (
//             <tr>
//               <td colSpan={7} className="text-center py-4">
//                 Loading...
//               </td>
//             </tr>
//           ) : (
//             data?.map((journal: any) => (
//               <tr key={journal.id} className="hover:bg-gray-50">
//                 <td className="px-3 py-2 border text-gray-500">
//                   {journal.date
//                     ? new Date(journal.date).toISOString().split("T")[0]
//                     : "-"}
//                 </td>
//                 <td className="px-3 py-2 border text-gray-500">
//                   {journal.accountName || "-"}
//                 </td>
//                 <td className="px-3 py-2 border text-gray-500">
//                   {Number(journal.debit).toLocaleString()}
//                 </td>
//                 <td className="px-3 py-2 border text-gray-500">
//                   {Number(journal.credit).toLocaleString()}
//                 </td>
//                 <td className="px-3 py-2 border text-gray-500">
//                   {journal.memo || journal.note || "-"}
//                 </td>
//                 <td className="px-3 py-2 border text-gray-500">
//                   {journal.memo || journal.postedBy || "-"}
//                 </td>
//               </tr>
//             ))
//           )}
//         </tbody>
//       </table>

//       {/* Modal */}
//       {isModalOpen && (
//         <CreateJournalModal
//           onClose={() => setIsModalOpen(false)}
//           onSuccess={() => {
//             setIsModalOpen(false);
//             refetch();
//           }}
//         />
//       )}
//     </div>
//   );
// };
