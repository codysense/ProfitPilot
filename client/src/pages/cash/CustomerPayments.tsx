import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Eye, DollarSign, Users, Calendar } from 'lucide-react';
import { cashApi, salesApi } from '../../lib/api';
import { DataTable } from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import CreateCustomerPaymentModal from './CreateCustomerPaymentModal';

interface CustomerPayment {
  id: string;
  receiptNo: string;
  customerId: string;
  amount: number;
  createdAt: string;
  reference?: string;
  notes?: string;
  customer: {
    code: string;
    name: string;
  };
  cashAccount: {
    code: string;
    name: string;
    accountType: string;
  };
  sale?: {
    orderNo: string;
    totalAmount: number;
  };
  user: {
    name: string;
  };
}

const CustomerPayments = () => {
  const [page, setPage] = useState(1);
  const [customerFilter, setCustomerFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['customer-payments', { page, customerId: customerFilter }],
    queryFn: () => cashApi.getCashTransactions({ 
      page, 
      limit: 10,
      transactionType: 'RECEIPT',
      ...(customerFilter && { customerId: customerFilter })
    })
  });

  

  const { data: customers } = useQuery({
    queryKey: ['customers-for-payments'],
    queryFn: () => salesApi.getCustomers({ limit: 100 })
  });

  

  const columns = [
    {
      key: 'transactionNo',
      header: 'Receipt No',
      width: 'w-32'
    },
    {
      key: 'customers.name',
      header: 'Customer',
      // cell:(payment: CustomerPayment) => payment.customer.name,
      width: 'w-48'
    },
    {
      key: 'amount',
      header: 'Amount Received',
      cell: (payment: CustomerPayment) => `₦${Number(payment.amount).toLocaleString()}`,
      width: 'w-32'
    },
    {
      key: 'cashAccount.name',
      header: 'Cash Account',
      cell: (payment: CustomerPayment) => (
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
      cell: (payment: CustomerPayment) => payment.reference || '-',
      width: 'w-32'
    },
    {
      key: 'createdAt',
      header: 'Receipt Date',
      cell: (payment: CustomerPayment) => new Date(payment.createdAt).toLocaleDateString(),
      width: 'w-32'
    },
    {
      key: 'user.name',
      header: 'Received By',
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
          <h1 className="text-2xl font-bold text-gray-900">Customer Payments</h1>
          <p className="text-gray-600">Record customer payments and receipts</p>
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
              Customer
            </label>
            <select
              value={customerFilter}
              onChange={(e) => setCustomerFilter(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">All Customers</option>
              {customers?.customers?.map((customer: any) => (
                <option key={customer.id} value={customer.id}>
                  {customer.code} - {customer.name}
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
                <Users className="h-6 w-6 text-gray-400" />
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
                <DollarSign className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Amount
                  </dt>
                  <dd className="text-2xl font-semibold text-green-600">
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
        <CreateCustomerPaymentModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreatePayment}
        />
      )}
    </div>
    
  );
};

export default CustomerPayments;