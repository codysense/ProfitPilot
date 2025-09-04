import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, Building } from 'lucide-react';
import { purchaseApi } from '../../lib/api';
import { DataTable } from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import { Vendor } from '../../types/api';
import CreateVendorModal from './CreateVendorModal';

const Vendors = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['vendors', { page, search }],
    queryFn: () => purchaseApi.getVendors({ 
      page, 
      limit: 10, 
      ...(search && { search })
    })
  });

  const columns = [
    {
      key: 'code',
      header: 'Code',
      width: 'w-24'
    },
    {
      key: 'name',
      header: 'Name',
      width: 'w-48'
    },
    {
      key: 'address',
      header: 'Address',
      cell: (vendor: Vendor) => vendor.address || '-',
      width: 'w-64'
    },
    {
      key: 'phone',
      header: 'Phone',
      cell: (vendor: Vendor) => vendor.phone || '-',
      width: 'w-32'
    },
    {
      key: 'email',
      header: 'Email',
      cell: (vendor: Vendor) => vendor.email || '-',
      width: 'w-48'
    },
    {
      key: 'paymentTerms',
      header: 'Payment Terms',
      cell: (vendor: Vendor) => vendor.paymentTerms || '-',
      width: 'w-32'
    },
    {
      key: 'isActive',
      header: 'Status',
      cell: (vendor: Vendor) => <StatusBadge status={vendor.isActive ? 'Active' : 'Inactive'} />,
      width: 'w-24'
    }
  ];

  const handleCreateVendor = () => {
    refetch();
    setShowCreateModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vendors</h1>
          <p className="text-gray-600">Manage your supplier information</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Vendor
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search vendors..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Building className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Vendors
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
                <Building className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Active Vendors
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {data?.vendors?.filter((v: Vendor) => v.isActive).length || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        data={data?.vendors || []}
        columns={columns}
        loading={isLoading}
        pagination={data?.pagination}
        onPageChange={setPage}
      />

      {/* Create Modal */}
      {showCreateModal && (
        <CreateVendorModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateVendor}
        />
      )}
    </div>
  );
};

export default Vendors;