import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, ArrowRight, Package, Building } from 'lucide-react';
import { inventoryApi } from '../../lib/api';
import { DataTable } from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import { useAuthStore } from '../../store/authStore';
import CreateTransferModal from './CreateTransferModal';

interface InventoryTransfer {
  id: string;
  transferDate: string;
  qty: number;
  item: {
    sku: string;
    name: string;
    uom: string;
  };
  fromWarehouse: {
    code: string;
    name: string;
  };
  toWarehouse: {
    code: string;
    name: string;
  };
  user?: {
    name: string;
  };
}

const InventoryTransfer = () => {
  const [page, setPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { user } = useAuthStore();
  
  // Check if user can create transfers (CFO or GM only)
  const canCreateTransfer = user?.roles.includes('CFO') || user?.roles.includes('General Manager');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['inventory-transfers', { page }],
    queryFn: () => inventoryApi.getInventoryTransfers({ 
      page, 
      limit: 10,
    })})
    
    console.log(data)
 



// console.log(data)

  // console.log('Loading:', isLoading);

  const columns = [
    {
      key: 'transferDate',
      header: 'Date',
      cell: (transfer: InventoryTransfer) => new Date(transfer.transferDate).toLocaleDateString(),
      width: 'w-24'
    },
    {
      key: 'item.sku',
      header: 'Item SKU',
      width: 'w-32'
    },
    {
      key: 'item.name',
      header: 'Item Name',
      width: 'w-48'
    },
    {
      key: 'qty',
      header: 'Quantity',
      cell: (transfer: InventoryTransfer) => `${transfer.qty.toLocaleString()} ${transfer.item.uom}`,
      width: 'w-24'
    },
    {
      key: 'fromWarehouse',
      header: 'From Warehouse',
      cell: (transfer: InventoryTransfer) => (
        <div className="flex items-center">
          <Building className="h-4 w-4 text-gray-400 mr-2" />
          <span>{transfer.fromWarehouse.code} - {transfer.fromWarehouse.name}</span>
        </div>
      ),
      width: 'w-48'
    },
    {
      key: 'toWarehouse',
      header: 'To Warehouse',
      cell: (transfer: InventoryTransfer) => (
        <div className="flex items-center">
          <ArrowRight className="h-4 w-4 text-blue-500 mr-2" />
          <Building className="h-4 w-4 text-gray-400 mr-2" />
          <span>{transfer.toWarehouse.code} - {transfer.toWarehouse.name}</span>
        </div>
      ),
      width: 'w-48'
    },
    {
      key: 'user',
      header: 'Transferred By',
      cell: (transfer: InventoryTransfer) => (
        <span className="text-sm">{transfer.user?.name || 'System'}</span>
      ),
      width: 'w-32'
    }
  ];

  const handleCreateTransfer = () => {
    refetch();
    setShowCreateModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Transfers</h1>
          <p className="text-gray-600">Transfer items between warehouses</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Transfer
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Package className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Transfers
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
                <Package className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Today's Transfers
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {data?.transfers?.filter((t: InventoryTransfer) => 
                      new Date(t.transferDate).toDateString() === new Date().toDateString()
                    ).length || 0}
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
                <Package className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Items Moved
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {data?.transfers?.reduce((sum: number, t: InventoryTransfer) => sum + t.qty, 0).toLocaleString() || '0'}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        data={data?.transfers || []}
        columns={columns}
        loading={isLoading}
        pagination={data?.pagination}
        onPageChange={setPage}
      />

      {/* Create Modal */}
      {showCreateModal && (
        <CreateTransferModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateTransfer}
        />
      )}

      {/* Access Denied for Transfer Creation */}
      {showCreateModal && !canCreateTransfer && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowCreateModal(false)} />
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="text-center">
                  <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Access Restricted</h3>
                  <p className="text-gray-600 mb-4">Only CFO and General Manager can create inventory transfers.</p>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryTransfer;