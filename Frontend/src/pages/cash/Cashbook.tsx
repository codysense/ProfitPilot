import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Download, Filter, X, DollarSign, TrendingUp, TrendingDown, Calendar, Upload } from 'lucide-react';
import { cashApi, managementApi } from '../../lib/api';
import { DataTable } from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import CreateCashTransactionModal from './CreateCashTransactionModal';
import BankReconciliationModal from './BankReconciliationModal';
import ImportBankStatementModal from './ImportBankStatementModal';
import toast from 'react-hot-toast';

interface CashTransaction {
  id: string;
  transactionNo: string;
  transactionType: 'RECEIPT' | 'PAYMENT';
  amount: number;
  description: string;
  reference?: string;
  transactionDate: string;
  runningBalance: number;
  cashAccount: {
    code: string;
    name: string;
    accountType: string;
  };
  glAccount: {
    code: string;
    name: string;
  };
  contraAccount?: {
    code: string;
    name: string;
  };
  user: {
    name: string;
  };
}

const Cashbook = () => {
  const [page, setPage] = useState(1);
  const [cashAccountFilter, setCashAccountFilter] = useState('');
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showReconciliationModal, setShowReconciliationModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  const { data: cashbookData, isLoading, refetch } = useQuery({
    queryKey: ['cashbook', { 
      page, 
      cashAccountId: cashAccountFilter,
      dateFrom: dateFromFilter,
      dateTo: dateToFilter
    }],
    queryFn: () => cashApi.getCashbook({ 
      page, 
      limit: 20,
      ...(cashAccountFilter && { cashAccountId: cashAccountFilter }),
      ...(dateFromFilter && { dateFrom: dateFromFilter }),
      ...(dateToFilter && { dateTo: dateToFilter })
    })
  });

  const { data: cashAccounts } = useQuery({
    queryKey: ['cash-accounts-for-filter'],
    queryFn: () => cashApi.getCashAccounts()
  });

  const columns = [
    {
      key: 'transactionDate',
      header: 'Date',
      cell: (transaction: CashTransaction) => new Date(transaction.transactionDate).toLocaleDateString(),
      width: 'w-24'
    },
    {
      key: 'transactionNo',
      header: 'Transaction No',
      width: 'w-32'
    },
    {
      key: 'description',
      header: 'Description',
      width: 'w-64'
    },
    {
      key: 'reference',
      header: 'Reference',
      cell: (transaction: CashTransaction) => transaction.reference || '-',
      width: 'w-32'
    },
    {
      key: 'glAccount',
      header: 'GL Account',
      cell: (transaction: CashTransaction) => (
        <div>
          <div className="font-medium">{transaction.glAccount.code}</div>
          <div className="text-xs text-gray-500">{transaction.glAccount.name}</div>
        </div>
      ),
      width: 'w-48'
    },
    {
      key: 'contraAccount',
      header: 'Contra Account',
      cell: (transaction: CashTransaction) => 
        transaction.contraAccount ? (
          <div>
            <div className="font-medium">{transaction.contraAccount.code}</div>
            <div className="text-xs text-gray-500">{transaction.contraAccount.name}</div>
          </div>
        ) : '-',
      width: 'w-48'
    },
    {
      key: 'amount',
      header: 'Amount',
      cell: (transaction: CashTransaction) => (
        <span className={transaction.transactionType === 'RECEIPT' ? 'text-green-600' : 'text-red-600'}>
          {transaction.transactionType === 'RECEIPT' ? '+' : '-'}₦{transaction.amount.toLocaleString()}
        </span>
      ),
      width: 'w-32'
    },
    {
      key: 'runningBalance',
      header: 'Running Balance',
      cell: (transaction: CashTransaction) => (
        <span className={`font-medium ${transaction.runningBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          ₦{transaction.runningBalance.toLocaleString()}
        </span>
      ),
      width: 'w-32'
    },
    {
      key: 'user.name',
      header: 'User',
      width: 'w-32'
    }
  ];

  const clearAllFilters = () => {
    setCashAccountFilter('');
    setDateFromFilter('');
    setDateToFilter('');
  };

  const hasActiveFilters = cashAccountFilter || dateFromFilter || dateToFilter;

  const handleExport = async () => {
    try {
      const filters = {
        ...(cashAccountFilter && { cashAccountId: cashAccountFilter }),
        ...(dateFromFilter && { dateFrom: dateFromFilter }),
        ...(dateToFilter && { dateTo: dateToFilter })
      };

      await cashApi.exportCashbook(filters);
      toast.success('Cashbook exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export cashbook');
    }
  };

  const handleCreateTransaction = () => {
    refetch();
    setShowCreateModal(false);
  };

  const handleReconciliation = () => {
    refetch();
    setShowReconciliationModal(false);
  };

  const handleImport = () => {
    refetch();
    setShowImportModal(false);
  };

  // Calculate summary statistics
  const totalReceipts = cashbookData?.transactions
    ?.filter((t: CashTransaction) => t.transactionType === 'RECEIPT')
    .reduce((sum: number, t: CashTransaction) => sum + Number(t.amount), 0) || 0;

  const totalPayments = cashbookData?.transactions
    ?.filter((t: CashTransaction) => t.transactionType === 'PAYMENT')
    .reduce((sum: number, t: CashTransaction) => sum + Number(t.amount), 0) || 0;

  const netCashFlow = totalReceipts - totalPayments;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cashbook</h1>
          <p className="text-gray-600">Comprehensive cash and bank management</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              showFilters 
                ? 'border-blue-500 text-blue-700 bg-blue-50' 
                : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
            }`}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {hasActiveFilters && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Active
              </span>
            )}
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Upload className="h-4 w-4 mr-2" />
            Import Statement
          </button>
          <button
            onClick={() => setShowReconciliationModal(true)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Reconcile
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Transaction
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Filter Options</h3>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <X className="h-4 w-4 mr-2" />
                Clear All
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cash Account
              </label>
              <select
                value={cashAccountFilter}
                onChange={(e) => setCashAccountFilter(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">All Accounts</option>
                {cashAccounts?.accounts?.map((account: any) => (
                  <option key={account.id} value={account.id}>
                    {account.code} - {account.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date From
              </label>
              <input
                type="date"
                value={dateFromFilter}
                onChange={(e) => setDateFromFilter(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date To
              </label>
              <input
                type="date"
                value={dateToFilter}
                onChange={(e) => setDateToFilter(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>

          {/* Export Options */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <h4 className="text-md font-medium text-gray-900">Export Options</h4>
              <div className="flex space-x-2">
                <button
                  onClick={handleExport}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Receipts
                  </dt>
                  <dd className="text-2xl font-semibold text-green-600">
                    ₦{totalReceipts.toLocaleString()}
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
                <TrendingDown className="h-6 w-6 text-red-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Payments
                  </dt>
                  <dd className="text-2xl font-semibold text-red-600">
                    ₦{totalPayments.toLocaleString()}
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
                <DollarSign className={`h-6 w-6 ${netCashFlow >= 0 ? 'text-green-400' : 'text-red-400'}`} />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Net Cash Flow
                  </dt>
                  <dd className={`text-2xl font-semibold ${netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ₦{netCashFlow.toLocaleString()}
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
                    Total Transactions
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {cashbookData?.pagination?.total || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cash Account Balances */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Cash Account Balances
          </h3>
        </div>
        <div className="px-4 py-4 sm:px-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cashAccounts?.accounts?.map((account: any) => (
              <div key={account.id} className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">{account.name}</div>
                    <div className="text-sm text-gray-500">{account.code}</div>
                    <div className="text-xs text-gray-400">{account.accountType}</div>
                    {account.bankName && (
                      <div className="text-xs text-gray-400">{account.bankName}</div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-semibold ${
                      account.balance >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      ₦{Number(account.balance).toLocaleString()}
                    </div>
                    <StatusBadge status={account.isActive ? 'Active' : 'Inactive'} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        data={cashbookData?.transactions || []}
        columns={columns}
        loading={isLoading}
        pagination={cashbookData?.pagination}
        onPageChange={setPage}
      />

      {/* Modals */}
      {showCreateModal && (
        <CreateCashTransactionModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateTransaction}
        />
      )}

      {showReconciliationModal && (
        <BankReconciliationModal
          onClose={() => setShowReconciliationModal(false)}
          onSuccess={handleReconciliation}
        />
      )}

      {showImportModal && (
        <ImportBankStatementModal
          onClose={() => setShowImportModal(false)}
          onSuccess={handleImport}
        />
      )}
    </div>
  );
};

export default Cashbook;