import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Eye, DollarSign, Users, Calendar, Printer, Edit, Trash2, Package } from 'lucide-react';
import { cashApi, salesApi } from '../../lib/api';
import { DataTable } from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import CreateCustomerPaymentModal from './CreateCustomerPaymentModal';
// import { ReportExporter } from '../../lib/reportExporter';
import { toast } from 'react-hot-toast';
import { CustomerSelect } from '../../components/CustomerSelect';
import { useAuthStore } from '../../store/authStore';
import EditCustomerPaymentModal from './EditCustomerPaymentModal';
import ViewCustomerPaymentModal from './ViewCustomerPaymenModal';

interface CustomerPayment {
  id: string;
  receiptNo: string;
  customerId: string;
  totalAmount: number;
  createdAt: string;
  reference?: string;
  notes?: string;
  paidAt:string;
  status:string;
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
  const [customerId, setCustomerID] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCustomerPayment, setselectedCustomerPayment] = useState<CustomerPayment | null>(null);
  const { user } = useAuthStore();

    const canPerformActions = user?.roles.includes('Accountant') || user?.roles.includes('General Manager');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['customer-payments', { page, customerId: customerId }],
    queryFn: () => cashApi.getCustomerPayments({ 
      page, 
      limit: 10,
      //transactionType: 'RECEIPT',
       ...(customerId && { customerId: customerId })
    })
  });

  console.log(data)
  // const { data:trn } = useQuery({
  //   queryKey: ['customer-payments', { page, customerId: customerFilter }],
  //   queryFn: () => cashApi.getCashTransactions({ 
  //     page, 
  //     limit: 10,
  //     transactionType: 'RECEIPT',
  //   ...(customerFilter && { customerId: customerFilter })
  //   })
  // });

  // console.log(trn)
  

  // const { data: customers } = useQuery({
  //   queryKey: ['customers-for-payments'],
  //   queryFn: () => salesApi.getCustomers({ limit: 100 })
  // });

  const handlePrintPayment = async (payment: CustomerPayment) => {
    try {
      // Create payment receipt content
      const receiptContent = document.createElement('div');
      receiptContent.id = 'customer-payment-print';
      receiptContent.innerHTML = `
        <div style="padding: 20px; font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1f2937; margin-bottom: 10px;">PAYMENT RECEIPT</h1>
            <h2 style="color: #6b7280;">${payment.receiptNo}</h2>
          </div>
          
          <div style="margin-bottom: 20px;">
            <h3 style="color: #374151; border-bottom: 2px solid #e5e7eb; padding-bottom: 5px;">Customer Details:</h3>
            <p><strong>Name:</strong> ${payment.customer.name}</p>
            <p><strong>Code:</strong> ${payment.customer.code}</p>
          </div>
          
          <div style="margin-bottom: 20px;">
            <h3 style="color: #374151; border-bottom: 2px solid #e5e7eb; padding-bottom: 5px;">Payment Details:</h3>
            <p><strong>Amount Received:</strong> ₦${payment.totalAmount.toLocaleString()}</p>
            <p><strong>Payment Date:</strong> ${new Date(payment.createdAt).toLocaleDateString()}</p>
            <p><strong>Cash Account:</strong> ${payment.cashAccount.name}</p>
            ${payment.reference ? `<p><strong>Reference:</strong> ${payment.reference}</p>` : ''}
          </div>
          
          <div style="margin-top: 40px; text-align: center; color: #6b7280; font-size: 12px;">
            Received by: ${payment.user.name}<br>
            Generated on ${new Date().toLocaleString()}<br>
            ProfitPilot ERP System
          </div>
        </div>
      `;
      
      document.body.appendChild(receiptContent);
      
      await ReportExporter.exportToPDF(
        'customer-payment-print',
        `customer-payment-${payment.receiptNo}.pdf`,
        `Customer Payment Receipt - ${payment.receiptNo}`
      );
      
      document.body.removeChild(receiptContent);
      toast.success('Payment receipt printed successfully');
    } catch (error) {
      console.error('Print payment receipt error:', error);
    }
  };

  const columns = [
    {
      key: 'paymentNo',
      header: 'Receipt No',
      width: 'w-32'
    },
    {
      key: 'customer.name',
      header: 'Customer',
      // cell:(payment: CustomerPayment) => payment.customer.name,
      width: 'w-48'
    },
    {
      key: 'totalAmount',
      header: 'Amount Received',
      cell: (payment: CustomerPayment) => `₦${Number(payment.totalAmount).toLocaleString()}`,
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
      key: 'paidAt',
      header: 'Payment Date',
      cell: (payment: CustomerPayment) => new Date(payment.paidAt).toLocaleDateString(),
      width: 'w-32'
    },
    {
      key: 'preparer.name',
      header: 'Prepapred By',
      width: 'w-32'
    },
    {
      key: 'approver.name',
      header: 'Approved By',
      width: 'w-32'
    },
    {
      key: 'authorizer.name',
      header: 'Authorized By',
      width: 'w-32'
    },
    {
      key: 'payer.name',
      header: 'Paid By',
      width: 'w-32'
    },
   
    // {
    //   key: 'actions',
    //   header: 'Actions',
    //   cell: (payment: CustomerPayment) => (
    //     <button
    //       onClick={() => handlePrintPayment(payment)}
    //       className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
    //       title="Print Payment Receipt"
    //     >
    //       <Printer className="h-4 w-4" />
    //     </button>
    //   ),
    //   width: 'w-24'
    // }
  ];


  

  const handleCreatePayment = () => {
    refetch();
    setShowCreateModal(false);
  };

  const handleEditCustomerPayment = () => {
    refetch();
    setShowEditModal(false);
    setselectedCustomerPayment(null);
  };
const handleViewCustomerPayment = () => {
    refetch();
    setShowDetailsModal(false);
    setselectedCustomerPayment(null);
}    

const handleApproveTransaction = async (customerPayment: CustomerPayment) => {
      try {
        await cashApi.approveCustomerPayment(customerPayment.id);
        toast.success('Customer Payment approved successfully');
        refetch();
      } catch (error) {
        console.error('Customer Payment approval:', error);
      }
    };
  const handleAuthorizeTransaction = async (customerPayment: CustomerPayment) => {
      try {
        await cashApi.authorizeCustomerPayment(customerPayment.id);
        toast.success('Customer Payment authorized successfully');
        refetch();
      } catch (error) {
        console.error('Customer Payment authorize:', error);
      }
    };
  const handlePayTransaction = async (customerPayment: CustomerPayment) => {
      try {
        await cashApi.payCustomerPayment(customerPayment.id);
        toast.success('Customer Payment paid successfully');
        refetch();
      } catch (error) {
        console.error('Customer Payment pay:', error);
      }
    };
  const handleDeleteCustomerPayment = async (customerPayment: CustomerPayment) => {
      try {
        await cashApi.deleteCustomerPayment(customerPayment.id);
        toast.success('Customer Payment deleted successfully');
        refetch();
      } catch (error) {
        console.error('Customer Payment Delete:', error);
      }
    };  
    
    
    const actions = (customerPayment: CustomerPayment) => (
        <div className="flex space-x-2">
          <button
            onClick={() => {
              setselectedCustomerPayment(customerPayment);
              setShowDetailsModal(true);
            }}
            className="text-blue-600 hover:text-blue-900"
            title="View Details"
          >
            <Eye className="h-4 w-4" />
          </button>
          {['PREPARED', 'AUTHORIZED', 'APPROVED'].includes(customerPayment.status) && canPerformActions && (
            <button
              onClick={() => {
               setselectedCustomerPayment(customerPayment);
              setShowEditModal(true);
              }}
              className="text-blue-600 hover:text-blue-900"
              title="Edit customerPayment"
            >
              <Edit className="h-4 w-4" />
            </button>
          )}
          {['PREPARED'].includes(customerPayment.status) && canPerformActions && (
            <button
              onClick={() => handleDeleteCustomerPayment(customerPayment)}
              className="text-red-600 hover:text-red-900"
              title="Delete customerPayment"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
          {[ 'PAID'].includes(customerPayment.status) && (
            <button
              onClick={() => handlePrintInvoice(customerPayment)}
              className="text-purple-600 hover:text-purple-900"
              title="Print Invoice"
            >
              <Printer className="h-4 w-4" />
            </button>
          )}
          {customerPayment.status === 'PREPARED' && canPerformActions && (
            <button
              onClick={() => {
               handleApproveTransaction(customerPayment)
              }}
              className="text-green-600 hover:text-green-900"
              title="Approve"
            >
              <DollarSign className="h-4 w-4" />
            </button>
          )}
          {customerPayment.status === 'APPROVED' && canPerformActions && (
            <button
              onClick={() => handleAuthorizeTransaction(customerPayment)}
              className="text-purple-600 hover:text-purple-900"
              title="Authorize"
            >
              <DollarSign className="h-4 w-4" />
            </button>
          )}
          {customerPayment.status === 'AUTHORIZED' && canPerformActions && (
            <button
              onClick={() => handlePayTransaction(customerPayment)}
              className="text-purple-600 hover:text-purple-900"
              title="Pay"
            >
              <DollarSign className="h-4 w-4" />
            </button>
          )}
        </div>
      );

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
            <CustomerSelect
                value={customerId}
                onChange={setCustomerID}
                typeFilter="retail"
                error=""
            />
          
          </div>
        </div>
      </div>

      {/* Stats */}
      {/* <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
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
                    ₦{data?.totalAmount?.reduce((sum: number, p: any) => sum + Number(p.totalAmount), 0).toLocaleString() || '0'}
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
                    {data?.receipts?.filter((p: any) => 
                      new Date(p.receiptDate).toDateString() === new Date().toDateString()
                    ).length || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div> */}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-4">
              {['PREPARED',  'APPROVED','AUTHORIZED', 'PAID'].map(status => {
                const count = data?.data.filter((p: data) => p.status === status).length || 0;
                const total = data?.data.filter((p: data) => p.status === status)
                  .reduce((sum: number, p: CustomerPayment) => sum + Number(p.totalAmount), 0) || 0;
      
                return (
                  <div key={status} className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <Package className="h-6 w-6 text-gray-400" />
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">
                              {status}
                            </dt>
                            <dd className="text-lg font-semibold text-gray-900">
                              {count} payments
                            </dd>
                            <dd className="text-sm text-gray-500">
                              ₦{total.toLocaleString()}
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

      {/* Data Table */}
      <DataTable
        data={data?.data || []}
        columns={columns}
        loading={isLoading}
        actions={actions}
        pagination={data?.pagination}
        onPageChange={setPage}
      />

      {showCreateModal && (
        <CreateCustomerPaymentModal
          onSuccess={handleCreatePayment}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {showEditModal && (
        <EditCustomerPaymentModal
          payment={selectedCustomerPayment}
          onClose={() => setShowEditModal(false)}
          onSuccess={handleEditCustomerPayment}
        />
      )}
      {showDetailsModal && (
        <ViewCustomerPaymentModal
          payment={selectedCustomerPayment}
          onClose={() => setShowDetailsModal(false)}
          onSuccess={handleViewCustomerPayment}
        />
      )}
    </div>
  );
}
;

export default CustomerPayments;