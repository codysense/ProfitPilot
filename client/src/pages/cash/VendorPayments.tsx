import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Eye, DollarSign, Building, Calendar } from 'lucide-react';
import { cashApi, purchaseApi } from '../../lib/api';
import { DataTable } from '../../components/DataTable';
// import StatusBadge from '../../components/StatusBadge';
import CreateVendorPaymentModal from './CreateVendorPaymentModal';

interface VendorPayment {
  id: string;
  paymentNo: string;
  vendorId: string;
  amountPaid: number;
  paymentDate: string;
  reference?: string;
  notes?: string;
  vendor: {
    code: string;
    name: string;
  };
  cashAccount: {
    code: string;
    name: string;
    accountType: string;
  };
  purchase?: {
    orderNo: string;
    totalAmount: number;
  };
  user: {
    name: string;
  };
}

const VendorPayments = () => {
  const [page, setPage] = useState(1);
  const [vendorFilter, setVendorFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['vendor-payments', { page, vendorId: vendorFilter }],
    queryFn: () => cashApi.getCashTransactions({ 
      page, 
      limit: 10,
      transactionType: 'PAYMENT',
      ...(vendorFilter && { vendorId: vendorFilter })
    })
  });

  const { data: vendors } = useQuery({
    queryKey: ['vendors-for-payments'],
    queryFn: () => purchaseApi.getVendors({ limit: 100 })
  });

  console.log(data)

  const columns = [
    {
      key: 'transactionNo',
      header: 'Payment No',
      width: 'w-32'
    },
    {
      key: 'vendor.name',
      header: 'Vendor',
      width: 'w-48'
    },
    {
      key: 'amount',
      header: 'Amount Paid',
      // cell: (payment: VendorPayment) => `₦${Number(payment.amountPaid).toLocaleString()}`   ,
      width: 'w-32'
    },
    {
      key: 'cashAccount.name',
      header: 'Cash Account',
      cell: (payment: VendorPayment) => (
        <div>
          <div className="font-medium">{payment.cashAccount.name}</div>
          <div className="text-xs text-gray-500">{payment.cashAccount.accountType}</div>
        </div>
      ),
      width: 'w-48'
    },
    {
      key: 'reference',
      header: 'Reference',
      cell: (payment: VendorPayment) => payment.reference || '-',
      width: 'w-32'
    },
    {
      key: 'transactionDate',
      header: 'Payment Date',
      cell: (payment: VendorPayment) => new Date(payment.transactionDate).toLocaleDateString(),
      width: 'w-32'
    },
    {
      key: 'user.name',
      header: 'Paid By',
      width: 'w-32'
    }
  ];

  
  const handleCreatePayment = () => {
    refetch();
    setShowCreateModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vendor Payments</h1>
          <p className="text-gray-600">Record vendor payments and disbursements</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Record Payment
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vendor
            </label>
            <select
              value={vendorFilter}
              onChange={(e) => setVendorFilter(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">All Vendors</option>
              {vendors?.vendors?.map((vendor: any) => (
                <option key={vendor.id} value={vendor.id}>
                  {vendor.code} - {vendor.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Building className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Payments
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
                    Total Amount
                  </dt>
                  <dd className="text-2xl font-semibold text-red-600">
                    ₦{data?.transactions?.reduce((sum: number, p: any) => sum + Number(p.amount), 0).toLocaleString() || '0'}
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
                    Today's Payments
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {data?.transactions?.filter((p: any) => 
                      new Date(p.transactionDate).toDateString() === new Date().toDateString()
                    ).length || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        data={data?.transactions || []}
        columns={columns}
        loading={isLoading}
        pagination={data?.pagination}
        onPageChange={setPage}
      />

      {/* Create Modal */}
      {showCreateModal && (
        <CreateVendorPaymentModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreatePayment}
        />
      )}
    </div>
  );
};

export default VendorPayments;