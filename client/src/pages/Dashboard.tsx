import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Package,
  Factory,
  ShoppingCart,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  Calendar,
  RotateCcw,
} from "lucide-react";
import {
  inventoryApi,
  productionApi,
  purchaseApi,
  salesApi,
  cashApi,
  posApi,
} from "../lib/api";
import { useAuthStore } from "../store/authStore";

type PeriodFilter = "today" | "this_week" | "this_month" | "this_year";

const getPeriodDates = (period: PeriodFilter) => {
  const now = new Date();
  let start: Date;
  const end = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
    999,
  );

  switch (period) {
    case "today": {
      start = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        0,
        0,
        0,
        0,
      );
      break;
    }
    case "this_week": {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday start
      start = new Date(now.getFullYear(), now.getMonth(), diff, 0, 0, 0, 0);
      break;
    }
    case "this_month": {
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      break;
    }
    case "this_year": {
      start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      break;
    }
  }

  return {
    dateFrom: start.toISOString(),
    dateTo: end.toISOString(),
  };
};

const periodLabels: Record<PeriodFilter, string> = {
  today: "Today",
  this_week: "This Week",
  this_month: "This Month",
  this_year: "This Year",
};

const Dashboard = () => {
  const [period, setPeriod] = useState<PeriodFilter>("this_month");
  const { dateFrom, dateTo } = getPeriodDates(period);

  const { data: inventory } = useQuery({
    queryKey: ["inventory-valuation"],
    queryFn: () => inventoryApi.getInventoryValuation(),
  });

  const { user } = useAuthStore();
  const canviewall =
    user?.roles.includes("Senior Accountant") ||
    user?.roles.includes("General Manager") ||
    user?.roles.includes("Manager");

  const { data: productionOrders } = useQuery({
    queryKey: ["production-orders", { limit: 10 }],
    queryFn: () => productionApi.getProductionOrders({ limit: 10 }),
  });

  const { data: purchases } = useQuery({
    queryKey: ["purchases-dashboard", period, dateFrom, dateTo],
    queryFn: () =>
      purchaseApi.getPurchases({
        dateFrom,
        dateTo,
        limit: 1000,
      }),
  });

  const { data: purchaseReturns } = useQuery({
    queryKey: ["purchase-returns-dashboard", period, dateFrom, dateTo],
    queryFn: () =>
      purchaseApi.getPurchaseReturns({
        status: "CONFIRMED",
        dateFrom,
        dateTo,
        limit: 1000,
      }),
  });

  const { data: sales } = useQuery({
    queryKey: ["sales-dashboard", period, dateFrom, dateTo],
    queryFn: () => salesApi.getSalesforDashboard({ dateFrom, dateTo }),
  });

  const { data: posSales } = useQuery({
    queryKey: ["pos-sales-dashboard", period, dateFrom, dateTo],
    queryFn: () =>
      posApi.getSalesForDashboard({
        status: "COMPLETED",
        dateFrom,
        dateTo,
      }),
  });

  const { data: salesReturns } = useQuery({
    queryKey: ["sales-returns-dashboard", period, dateFrom, dateTo],
    queryFn: () =>
      salesApi.getSalesReturns({
        status: "CONFIRMED",
        dateFrom,
        dateTo,
        limit: 1000,
      }),
  });

  const { data: posReturns } = useQuery({
    queryKey: ["pos-returns-dashboard", period, dateFrom, dateTo],
    queryFn: () =>
      posApi.getReturns({
        dateFrom,
        dateTo,
        limit: 1000,
      }),
  });

  const { data: cashAccounts } = useQuery({
    queryKey: ["cash-accounts"],
    queryFn: () => cashApi.getCashAccounts(),
  });

  // Filter Sales Orders based on permissions
  let filteredSales = sales?.sales || [];
  if (!canviewall) {
    filteredSales = filteredSales.filter(
      (sale: any) => sale.preparer?.name === user?.name,
    );
  }

  // Filter POS Sales based on permissions
  let filteredPosSales = posSales?.sales || [];
  if (!canviewall) {
    filteredPosSales = filteredPosSales.filter(
      (sale: any) => sale.user?.name === user?.name,
    );
  }

  // Filter Sales Returns based on permissions
  let filteredSalesReturns = salesReturns?.salesReturns || [];
  if (!canviewall) {
    filteredSalesReturns = filteredSalesReturns.filter(
      (ret: any) => ret.preparer?.name === user?.name,
    );
  }

  // Filter POS Returns based on permissions
  let filteredPosReturns = posReturns?.returns || [];
  if (!canviewall) {
    filteredPosReturns = filteredPosReturns.filter(
      (ret: any) => ret.user?.name === user?.name,
    );
  }

  // Gross Sales calculation
  const totalSalesAmount = filteredSales.reduce(
    (sum: number, sale: any) => sum + Number(sale.totalAmount || 0),
    0,
  );

  const totalPosSalesAmount = filteredPosSales.reduce(
    (sum: number, sale: any) => sum + Number(sale.totalAmount || 0),
    0,
  );

  const totalGrossSales = totalSalesAmount + totalPosSalesAmount;

  // Sales Returns calculation
  const totalSalesReturnsAmount = filteredSalesReturns.reduce(
    (sum: number, ret: any) => sum + Number(ret.totalAmount || 0),
    0,
  );

  const totalPosReturnsAmount = filteredPosReturns.reduce(
    (sum: number, ret: any) =>
      sum + Number(ret.totalAmount || ret.refundAmount || 0),
    0,
  );

  const totalSalesReturns = totalSalesReturnsAmount + totalPosReturnsAmount;

  // Net Sales (Gross - Returns)
  const netSalesAmount = totalGrossSales - totalSalesReturns;

  // Purchases & Purchase Returns calculation
  const totalPurchasesAmount = (purchases?.purchases || []).reduce(
    (sum: number, p: any) => sum + Number(p.totalAmount || 0),
    0,
  );

  const totalPurchaseReturnsAmount = (
    purchaseReturns?.purchaseReturns || []
  ).reduce((sum: number, pr: any) => sum + Number(pr.totalAmount || 0), 0);

  const netPurchasesAmount = totalPurchasesAmount - totalPurchaseReturnsAmount;

  const stats = [
    {
      name: "Inventory Value",
      value: inventory
        ? `₦${
            inventory.totalValue?.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }) || "0"
          }`
        : "₦0",
      icon: Package,
    },
    {
      name: "Active Production Orders",
      value:
        productionOrders?.orders?.filter(
          (po: any) => po.status === "IN_PROGRESS",
        ).length || 0,
      icon: Factory,
    },
    {
      name: "Pending Purchases",
      value:
        purchases?.purchases?.filter((p: any) => p.status === "ORDERED")
          .length || 0,
      icon: ShoppingCart,
    },
    {
      name: `Net Sales (${periodLabels[period]})`,
      value: `₦${
        netSalesAmount.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }) || "0"
      }`,
      subtitle: `Gross: ₦${totalGrossSales.toLocaleString(undefined, { maximumFractionDigits: 0 })} | Returns: -₦${totalSalesReturns.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      icon: TrendingUp,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header with Period Filter Dropdown */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome to ProfitPilot ERP System</p>
        </div>

        {/* Period Filter Dropdown */}
        <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm self-start sm:self-auto">
          <Calendar className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium text-gray-700">Period:</span>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as PeriodFilter)}
            className="text-sm font-semibold text-gray-900 bg-transparent border-none focus:outline-none focus:ring-0 cursor-pointer pr-2"
          >
            <option value="today">Today</option>
            <option value="this_week">This Week</option>
            <option value="this_month">This Month</option>
            <option value="this_year">This Year</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="bg-white overflow-hidden shadow rounded-lg"
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <stat.icon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {stat.name}
                    </dt>
                    <dd className="mt-1">
                      <div className="text-xl font-semibold text-gray-900">
                        {stat.value}
                      </div>
                      {stat.subtitle && (
                        <p className="text-xs text-gray-500 mt-1 truncate">
                          {stat.subtitle}
                        </p>
                      )}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Sales & Purchases Return Summary */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {/* Sales & Returns Breakdown */}
        <div className="bg-white shadow rounded-lg p-5">
          <div className="flex items-center justify-between border-b pb-3 mb-3">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center">
              <TrendingUp className="h-4 w-4 mr-2 text-green-600" />
              Sales & Returns Summary ({periodLabels[period]})
            </h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Gross Sales (SO + POS):</span>
              <span className="font-medium text-gray-900">
                ₦{totalGrossSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between text-red-600">
              <span className="flex items-center">
                <RotateCcw className="h-3.5 w-3.5 mr-1 text-red-500" />
                Sales Returns (SO + POS):
              </span>
              <span className="font-medium">
                -₦{totalSalesReturns.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between border-t pt-2 font-semibold text-gray-900">
              <span>Net Sales:</span>
              <span className={netSalesAmount >= 0 ? "text-green-600" : "text-red-600"}>
                ₦{netSalesAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Purchases & Returns Breakdown */}
        <div className="bg-white shadow rounded-lg p-5">
          <div className="flex items-center justify-between border-b pb-3 mb-3">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center">
              <ShoppingCart className="h-4 w-4 mr-2 text-blue-600" />
              Purchases & Returns Summary ({periodLabels[period]})
            </h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Gross Purchases:</span>
              <span className="font-medium text-gray-900">
                ₦{totalPurchasesAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between text-green-600">
              <span className="flex items-center">
                <RotateCcw className="h-3.5 w-3.5 mr-1 text-green-500" />
                Purchase Returns:
              </span>
              <span className="font-medium">
                -₦{totalPurchaseReturnsAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between border-t pt-2 font-semibold text-gray-900">
              <span>Net Purchases:</span>
              <span className="text-blue-600">
                ₦{netPurchasesAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Cash Account Balances */}
      {canviewall && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Cash Account Balances
            </h3>
          </div>
          <div className="px-4 py-4 sm:px-6">
            {cashAccounts?.accounts.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {cashAccounts?.accounts.map((account: any) => (
                  <div key={account.id} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className=" text-xs font-medium text-gray-900">
                          {account.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {account.code}
                        </div>
                        <div className="text-xs text-gray-400 flex items-center mt-1">
                          <DollarSign className="h-3 w-3 mr-1" />
                          {account.accountType}
                          {account.bankName && ` - ${account.bankName}`}
                        </div>
                      </div>
                      <div className="text-right">
                        <div
                          className={`text-sm font-semibold ${
                            account.balance >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {Number(account.balance).toLocaleString("en-NG", {
                            style: "currency",
                            currency: "NGN",
                            minimumFractionDigits: 4,
                            maximumFractionDigits: 4,
                          })}
                        </div>
                        <div
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            account.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {account.isActive ? "Active" : "Inactive"}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-sm text-gray-500">No cash accounts found</p>
                <p className="text-xs text-gray-400 mt-1">
                  Cash accounts will appear here once created
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recent Activity Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Production Orders */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Recent Production Orders
            </h3>
          </div>
          <div className="px-4 py-4 sm:px-6">
            {productionOrders?.orders?.slice(0, 5).map((order: any) => (
              <div
                key={order.id}
                className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {order.orderNo}
                  </p>
                  <p className="text-sm text-gray-500">{order.item.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">
                    {order.qtyTarget} {order.item.type}
                  </p>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      order.status === "FINISHED"
                        ? "bg-green-100 text-green-800"
                        : order.status === "IN_PROGRESS"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {order.status}
                  </span>
                </div>
              </div>
            )) || (
              <p className="text-sm text-gray-500 py-4">
                No production orders found
              </p>
            )}
          </div>
        </div>

        {/* Inventory Alerts */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Inventory Alerts
            </h3>
          </div>
          <div className="px-4 py-4 sm:px-6">
            {inventory?.valuation
              ?.filter((item: any) => item.qty < item.minimumStockLevel)
              .slice(0, 5)
              .map((item: any) => (
                <div
                  key={item.itemId}
                  className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex items-center">
                    <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {item.sku}
                      </p>
                      <p className="text-sm text-gray-500">{item.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-red-600">
                      {item.qty} remaining
                    </p>
                    <p className="text-xs text-gray-500">Low stock</p>
                  </div>
                </div>
              )) || (
              <p className="text-sm text-gray-500 py-4">No inventory alerts</p>
            )}
          </div>
        </div>

        {/* Pending Purchases */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Pending Purchase Orders
            </h3>
          </div>
          <div className="px-4 py-4 sm:px-6">
            {purchases?.purchases
              ?.filter((p: any) => p.status === "ORDERED")
              .slice(0, 5)
              .map((purchase: any) => (
                <div
                  key={purchase.id}
                  className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {purchase.orderNo}
                    </p>
                    <p className="text-sm text-gray-500">
                      {purchase.vendor?.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      ₦{Number(purchase.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(purchase.orderDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )) || (
              <p className="text-sm text-gray-500 py-4">No pending purchases</p>
            )}
          </div>
        </div>

        {/* Recent Sales */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Recent Sales Orders
            </h3>
          </div>
          <div className="px-4 py-4 sm:px-6">
            {filteredSales.slice(0, 5).map((sale: any) => (
              <div
                key={sale.id}
                className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {sale.orderNo}
                  </p>
                  <p className="text-sm text-gray-500">{sale.customer?.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">
                    ₦
                    {Number(sale.totalAmount).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      sale.status === "PAID"
                        ? "bg-green-100 text-green-800"
                        : sale.status === "INVOICED"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {sale.status}
                  </span>
                </div>
              </div>
            )) || (
              <p className="text-sm text-gray-500 py-4">
                No sales orders found
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
