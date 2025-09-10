import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Eye, RotateCcw, Calendar, DollarSign } from 'lucide-react';
import { posApi } from '../../lib/api';
import { DataTable } from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';

const PosReturnsHistory = () => {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['pos-returns-history', { page }],
    queryFn: () => posApi.getSales({ page, limit: 20 }) // Will be updated to get returns
  });

  const columns = [
    {
      key: 'returnNo',
      header: 'Return No',
      width: 'w-32'
    },
    {
      key: 'originalSale.saleNo',
      header: 'Original Sale',
      width: 'w-32'
    },
    {
      key: 'customer.name',
      header: 'Customer',
      cell: (returnRecord: any) => returnRecord.customer?.name || 'Walk-in Customer',
      width: 'w-48'
    },
    {
      key: 'createdAt',
      header: 'Return Date',
      cell: (returnRecord: any) => new Date(returnRecord.createdAt).toLocaleDateString(),
      width: 'w-32'
    },
    {
      key: 'totalAmount',
      header: 'Return Amount',
      cell: (returnRecord: any) => `₦${returnRecord.totalAmount.toLocaleString()}`,
      width: 'w-32'
    },
    {
      key: 'reason',
      header: 'Reason',
      cell: (returnRecord: any) => <StatusBadge status={returnRecord.reason} variant="warning" />,
      width: 'w-32'
    },
    {
      key: 'user.name',
      header: 'Processed By',
      width: 'w-32'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">POS Returns History</h1>
          <p className="text-gray-600">View processed returns and refunds</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <RotateCcw className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Returns
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {data?.pagination?.total || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="h-6 w-6 text-red-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Refunds
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    ₦0 {/* Will be calculated from actual returns data */}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Today's Returns
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    0 {/* Will be calculated from actual returns data */}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Placeholder for returns table */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center py-8">
          <RotateCcw className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-sm text-gray-500">Returns history will be displayed here</p>
          <p className="text-xs text-gray-400 mt-1">Process returns from the POS terminal to see data</p>
        </div>
      </div>
    </div>
  );
};

export default PosReturnsHistory;