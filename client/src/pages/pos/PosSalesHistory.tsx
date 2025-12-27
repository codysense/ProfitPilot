import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Eye,
  Printer,
  RotateCcw,
  Calendar,
  DollarSign,
  ShoppingCart,
} from "lucide-react";
import { managementApi, posApi } from "../../lib/api";
import { DataTable } from "../../components/DataTable";
import StatusBadge from "../../components/StatusBadge";
import { PosSale } from "../../types/api";
// import { ReportExporter } from "../../utils/reportExport";
import toast from "react-hot-toast";

const PosSalesHistory = () => {
  const [page, setPage] = useState(1);
  const [dateFromFilter, setDateFromFilter] = useState("");
  const [dateToFilter, setDateToFilter] = useState("");
  const [customerFilter, setCustomerFilter] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
 const [cashiers, setCashiers] = useState<any[]>([]);
const [selectedCashier, setSelectedCashier] = useState<string>("");


  const { data, isLoading } = useQuery({
    queryKey: [
      "pos-sales-history",
      {
        page,
        dateFrom: dateFromFilter,
        dateTo: dateToFilter,
        customerId: customerFilter,
        paymentMethod,
        userId: selectedCashier,
        status: 'COMPLETED',
      },
    ],
    queryFn: () =>
      posApi.getSales({
        page,
        limit: 20,
        status: 'COMPLETED',
        ...(dateFromFilter && { dateFrom: dateFromFilter }),
        ...(dateToFilter && { dateTo: dateToFilter }),
        ...(selectedCashier && { userId: selectedCashier }),
        ...(paymentMethod && { paymentMethod: paymentMethod }),
        
      }),
  });

  const { data: companyInformations } = useQuery({
      queryKey: ["company-info-for-receipt"],
      queryFn: () => managementApi.getCompanySettings(),
    });
  

  useEffect(() => {
    if (data?.sales && cashiers.length === 0) {
      const unique = Object.values(
        data.sales.reduce((acc: any, sale: any) => {
          acc[sale.userId] = sale.user;
          return acc;
        }, {})
      );
      setCashiers(unique);
    }
  }, [data?.sales]);

  const columns = [
    {
      key: "saleNo",
      header: "Sale No",
      width: "w-32",
    },
    {
      key: "customer.name",
      header: "Customer",
      cell: (sale: PosSale) => sale.customer?.name || "Walk-in Customer",
      width: "w-48",
    },
    {
      key: "createdAt",
      header: "Date & Time",
      cell: (sale: PosSale) => new Date(sale.createdAt).toLocaleString(),
      width: "w-40",
    },
    {
      key: "totalAmount",
      header: "Total Amount",
      cell: (sale: PosSale) => `₦${sale.totalAmount.toLocaleString()}`,
      width: "w-32",
    },
    {
      key: "paymentMethod",
      header: "Payment",
      cell: (sale: PosSale) => (
        <StatusBadge status={sale.paymentMethod} variant="info" />
      ),
      width: "w-24",
    },
    {
      key: "status",
      header: "Status",
      cell: (sale: PosSale) => <StatusBadge status={sale.status} />,
      width: "w-24",
    },
    {
      key: "saleLines",
      header: "Items",
      cell: (sale: PosSale) => `${sale.saleLines.length} items`,
      width: "w-20",
    },
    {
      key: "user.name",
      header: "Cashier",
      width: "w-32",
    },
  ];

  // const handlePrintReceipt = async (sale: PosSale) => {
  //   try {
  //     const printData = await posApi.printReceipt(sale.id);

  //     // Create receipt content for printing
  //     const receiptContent = document.createElement("div");
  //     receiptContent.id = "pos-receipt-reprint";
  //     receiptContent.innerHTML = `
  //       <div style="padding: 20px; font-family: Arial, sans-serif; max-width: 300px; margin: 0 auto;">
  //         <div style="text-align: center; margin-bottom: 20px;">
  //           <h1 style="margin: 0; font-size: 18px;">SALES RECEIPT</h1>
  //           <h2 style="margin: 5px 0; font-size: 14px;">${sale.saleNo}</h2>
  //           <p style="margin: 0; font-size: 12px;">${new Date(
  //             sale.createdAt
  //           ).toLocaleString()}</p>
  //         </div>
          
  //         ${
  //           sale.customer
  //             ? `
  //           <div style="margin-bottom: 15px; font-size: 12px;">
  //             <strong>Customer:</strong> ${sale.customer.name}<br>
  //             <strong>Outstanding Balance:</strong> ₦${printData.outstandingBalance.toLocaleString()}
  //           </div>
  //         `
  //             : ""
  //         }
          
  //         <table style="width: 100%; font-size: 11px; margin-bottom: 15px;">
  //           <thead>
  //             <tr style="border-bottom: 1px solid #000;">
  //               <th style="text-align: left; padding: 2px;">Item</th>
  //               <th style="text-align: right; padding: 2px;">Qty</th>
  //               <th style="text-align: right; padding: 2px;">Price</th>
  //               <th style="text-align: right; padding: 2px;">Total</th>
  //             </tr>
  //           </thead>
  //           <tbody>
  //             ${sale.saleLines
  //               .map(
  //                 (line: any) => `
  //               <tr>
  //                 <td style="padding: 2px;">${line.item.name}</td>
  //                 <td style="text-align: right; padding: 2px;">${line.qty}</td>
  //                 <td style="text-align: right; padding: 2px;">₦${line.unitPrice.toLocaleString()}</td>
  //                 <td style="text-align: right; padding: 2px;">₦${line.lineTotal.toLocaleString()}</td>
  //               </tr>
  //             `
  //               )
  //               .join("")}
  //           </tbody>
  //         </table>
          
  //         <div style="border-top: 1px solid #000; padding-top: 10px; font-size: 12px;">
  //           <div style="display: flex; justify-content: space-between; font-weight: bold;">
  //             <span>Total:</span>
  //             <span>₦${sale.totalAmount.toLocaleString()}</span>
  //           </div>
  //           <div style="display: flex; justify-content: space-between;">
  //             <span>Paid (${sale.paymentMethod}):</span>
  //             <span>₦${sale.amountPaid.toLocaleString()}</span>
  //           </div>
  //           <div style="display: flex; justify-content: space-between;">
  //             <span>Change:</span>
  //             <span>₦${sale.changeAmount.toLocaleString()}</span>
  //           </div>
  //         </div>
          
  //         <div style="text-align: center; margin-top: 20px; font-size: 10px; color: #666;">
  //           Cashier: ${sale.user.name}<br>
  //           Thank you for your business!<br>
  //           ProfitPilot ERP System
  //         </div>
  //       </div>
  //     `;

  //     document.body.appendChild(receiptContent);

  //     await ReportExporter.exportToPDF(
  //       "pos-receipt-reprint",
  //       `receipt-${sale.saleNo}.pdf`,
  //       `Receipt - ${sale.saleNo}`
  //     );

  //     document.body.removeChild(receiptContent);
  //     toast.success("Receipt printed successfully");
  //   } catch (error) {
  //     console.error("Print receipt error:", error);
  //   }
  // };

const handlePrintReceipt = async (sale: PosSale) => {
    try {
      const printData = await posApi.printReceipt(sale.id);
      const printerWidth = localStorage.getItem("printerWidth") || "80"; // default to 80mm
      const paperWidth = `${printerWidth}mm`;

      const printWindow = window.open("", "_blank", "width=400,height=600");
      if (!printWindow) throw new Error("Unable to open print window");

      const receiptHTML = `
      <html>
        <head>
          <title>Receipt - ${printData.printData.documentNo}</title>
          <style>
            @page {
              size: ${paperWidth} auto;
              margin: 0;
            }

            body {
              font-family: Arial, sans-serif;
              width: ${paperWidth};
              padding: 5mm;
              margin: 0;
            }

            h1, h2 {
              margin: 5px 0;
              font-size: 14px;
              text-align: center;
            }

            table {
              width: 100%;
              font-size: 11px;
              border-collapse: collapse;
              margin-bottom: 10px;
            }

            th, td {
              padding: 2px;
            }

            th {
              border-bottom: 1px solid #000;
              text-align: left;
            }

            td {
              text-align: right;
            }

            td:first-child {
              text-align: left;
            }

            .totals {
              border-top: 1px solid #000;
              padding-top: 5px;
              font-size: 12px;
            }

            .footer {
              text-align: center;
              margin-top: 20px;
              font-size: 10px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div>
            <h1>${companyInformations.name} </h1>
            <h2>${companyInformations.address}</h2>
            <h2>${companyInformations.phone}</h2>
          </div>
          <div style="text-align: center; margin-bottom: 15px;">
            <h1>SALES RECEIPT</h1>
            <h2>${printData.printData.documentNo}</h2>
            <p>${new Date(printData.printData.date).toLocaleString()}</p>
          </div>

          ${
            printData.printData.customer
              ? `
            <div style="margin-bottom: 10px; font-size: 12px;">
              <strong>Customer:</strong> ${
                printData.printData.customer.name
              }<br>
              <strong>Outstanding Balance:</strong> ₦${printData.outstandingBalance.toLocaleString()}
            </div>
          `
              : ""
          }

          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${printData.printData.lines
                .map(
                  (line: any) => `
                <tr>
                  <td>${line.item.name}</td>
                  <td>${line.qty}</td>
                  <td>₦${line.unitPrice.toLocaleString()}</td>
                  <td>₦${line.lineTotal.toLocaleString()}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>

          <div class="totals">
            <div style="display: flex; justify-content: space-between;">
              <span>Subtotal:</span> <span>₦${printData.printData.subtotal.toLocaleString()}</span>
            </div>
            ${
              printData.printData.discountAmount > 0
                ? `
              <div style="display: flex; justify-content: space-between;">
                <span>Discount:</span> <span>-₦${printData.printData.discountAmount.toLocaleString()}</span>
              </div>
            `
                : ""
            }
            <div style="display: flex; justify-content: space-between; font-weight: bold;">
              <span>Total:</span> <span>₦${printData.printData.total.toLocaleString()}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>Paid (${printData.printData.paymentMethod}):</span>
              <span>₦${printData.printData.amountPaid.toLocaleString()}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>Change:</span>
              <span>₦${printData.printData.changeAmount.toLocaleString()}</span>
            </div>
          </div>

          <div class="footer">
            Cashier: ${printData.printData.cashier}<br>
            Thank you for your business!<br>
            ProfitPilot ERP System
          </div>

          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() { window.close(); };
            }
          </script>
        </body>
      </html>
    `;

      printWindow.document.open();
      printWindow.document.write(receiptHTML);
      printWindow.document.close();
    } catch (error) {
      console.error("Print receipt error:", error);
    }
  };

  const actions = (sale: PosSale) => (
    <div className="flex space-x-2">
      { sale.status === "COMPLETED" &&(
        <button
          onClick={() => handlePrintReceipt(sale)}
          className="text-blue-600 hover:text-blue-900"
          title="Print Receipt"
      >
        <Printer className="h-4 w-4" />
      </button>
      )}
      {/* {sale.status === "COMPLETED" && (
        <button
          onClick={() => {
            // TODO: Implement return from history
            console.log("Process return for sale:", sale.id);
          }}
          className="text-orange-600 hover:text-orange-900"
          title="Process Return"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      )} */}
    </div>
  );

  // Calculate summary stats
  const totalSales = data?.sales?.length || 0;
  const totalRevenue =
    data?.sales?.reduce(
      (sum: number, sale: PosSale) => sum + Number(sale.totalAmount),
      0
    ) || 0;
  const cashSales =
    data?.sales?.filter((sale: PosSale) => sale.paymentMethod === "CASH")
      .length || 0;
  const cardSales =
    data?.sales?.filter((sale: PosSale) => sale.paymentMethod === "CARD")
      .length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            POS Sales History
          </h1>
          <p className="text-gray-600">
            View and manage point of sales transactions
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Method
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">All</option>
              <option value="CASH">Cash</option>
              <option value="CARD">Card</option>
              <option value="TRANSFER">Transfer</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cashier
            </label>

            <select
              className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={selectedCashier}
              onChange={(e) => setSelectedCashier(e.target.value)}
            >
              <option value="">All</option>

              {cashiers.map((cashier: any) => (
                <option key={cashier.id} value={cashier.id}>
                  {cashier.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ShoppingCart className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Sales
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {totalSales}
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
                    Total Revenue
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    ₦{Number(totalRevenue).toLocaleString()}
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
                <DollarSign className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Cash Sales
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {cashSales}
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
                <Calendar className="h-6 w-6 text-purple-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Card Sales
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {cardSales}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        data={data?.sales || []}
        columns={columns}
        loading={isLoading}
        pagination={data?.pagination}
        onPageChange={setPage}
        actions={actions}
      />
    </div>
  );
};

export default PosSalesHistory;
