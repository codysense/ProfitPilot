




import React, { ReactNode, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Building2,
  Package,
  Factory,
  ShoppingCart,
  TrendingUp,
  Users,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  DollarSign,
  Building
} from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null); // NEW

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  const navigation = [
    {
      name: 'Dashboard',
      href: '/',
      icon: Building2,
      permission: null
    },
    {
      name: 'Inventory',
      href: '/inventory',
      icon: Package,
      permission: 'inventory.item.read',
      children: [
        { name: 'Items', href: '/inventory/items' },
        { name: 'BOMs', href: '/inventory/boms' },
        { name: 'Locations', href: '/inventory/locations' },
        { name: 'Warehouses', href: '/inventory/warehouses' },
        { name: 'Transfers', href: '/inventory/transfers' },
        { name: 'Ledger', href: '/inventory/ledger' },
        { name: 'Valuation', href: '/inventory/valuation' }
      ]
    },
    {
      name: 'Production',
      href: '/production',
      icon: Factory,
      permission: 'production.order.read',
      children: [
        { name: 'Orders', href: '/production/orders' },
        { name: 'WIP Summary', href: '/production/wip' }
      ]
    },
    {
      name: 'Purchases',
      href: '/purchases',
      icon: ShoppingCart,
      permission: 'purchase.order.read',
      children: [
        { name: 'Orders', href: '/purchases/orders' },
        { name: 'Vendors', href: '/purchases/vendors' }
      ]
    },
    {
      name: 'Sales',
      href: '/sales',
      icon: TrendingUp,
      permission: 'sales.order.read',
      children: [
        { name: 'Orders', href: '/sales/orders' },
        { name: 'Customers', href: '/sales/customers' }
      ]
    },
    // {
    //   name: 'Assets',
    //   href: '/assets',
    //   icon: Building,
    //   permission: 'inventory.item.read',
    //   children: [
    //     { name: 'Dashboard', href: '/assets' },
    //     { name: 'Asset Register', href: '/assets/register' },
    //     { name: 'Categories', href: '/assets/categories' }
    //   ]
    // },
    {
      name: 'Cash Management',
      href: '/cash',
      icon: DollarSign,
      permission: 'inventory.item.read',
      children: [
        { name: 'Cashbook', href: '/cash/cashbook' },
        { name: 'Customer Payments', href: '/cash/customer-payments' },
        { name: 'Vendor Payments', href: '/cash/vendor-payments' }
      ]
    },
    {
      name: 'Management',
      href: '/management',
      icon: Settings,
      permission: null,
      requiresRole: ['CFO', 'General Manager'],
      children: [
        { name: 'Company Settings', href: '/management/company' },
        { name: 'System Settings', href: '/management/settings' },
        { name: 'Fiscal Calendar', href: '/management/fiscal' },
        { name: 'Chart of Accounts', href: '/management/chart-of-accounts' },
        { name: 'Cash Accounts', href: '/management/cash-accounts' },
        { name: 'Approval Flows', href: '/management/approvals' },
        // { name: 'Role Management', href: '/management/roles' },
        { name: 'User Management', href: '/management/users' }
      ]
    },
    {
      name: 'Reports',
      href: '/reports',
      icon: FileText,
      permission: null
    },
    // {
    //   name: 'Users',
    //   href: '/users',
    //   icon: Users,
    //   permission: null,
    //   requiresRole: ['CFO', 'General Manager']
    // }
  ];

  const filteredNavigation = navigation.filter(item => 
    (!item.permission || user?.permissions.includes(item.permission)) &&
    (!item.requiresRole || item.requiresRole.some(role => user?.roles.includes(role)))
  );

  const NavigationItem = ({ item, mobile = false }: { item: any; mobile?: boolean }) => {
    const isActive = location.pathname === item.href || 
      (item.children && item.children.some((child: any) => location.pathname === child.href));

    if (item.children) {
      const isOpen = openGroup === item.name;

      return (
        <div className="space-y-1">
          <button
            onClick={() => setOpenGroup(isOpen ? null : item.name)}
            className={`flex w-full items-center px-2 py-2 text-sm font-medium rounded-md ${
              isActive ? 'bg-blue-100 text-blue-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <item.icon className="mr-3 h-5 w-5" />
            {item.name}
          </button>

          {isOpen && (
            <div className="ml-8 space-y-1">
              {item.children.map((child: any) => (
                <Link
                  key={child.href}
                  to={child.href}
                  className={`block px-2 py-2 text-sm rounded-md ${
                    location.pathname === child.href
                      ? 'bg-blue-100 text-blue-900 font-medium'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                  onClick={() => mobile && setSidebarOpen(false)}
                >
                  {child.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        to={item.href}
        className={`flex items-center px-2 py-2 text-sm font-medium rounded-md ${
          isActive ? 'bg-blue-100 text-blue-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        }`}
        onClick={() => mobile && setSidebarOpen(false)}
      >
        <item.icon className="mr-3 h-5 w-5" />
        {item.name}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden ">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75 " onClick={() => setSidebarOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg overflow-y-auto">
            <div className="flex items-center justify-between h-16 px-6 border-b">
              <h1 className="text-xl font-semibold text-gray-900">ProfitPilot ERP System</h1>
              <button onClick={() => setSidebarOpen(false)}>
                <X className="h-6 w-6 text-gray-400" />
              </button>
            </div>
            <nav className="mt-6 px-6 space-y-1">
              {filteredNavigation.map((item) => (
                <NavigationItem key={item.name} item={item} mobile={true} />
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <div className="flex flex-col flex-grow bg-white border-r overflow-y-auto">
          <div className="flex items-center h-16 px-6 border-b">
            <Building2 className="h-8 w-8 text-blue-600 mr-3" />
            <h1 className="text-xl font-semibold text-gray-900 text-center">ProfitPilot ERP System</h1>
          </div>
          <nav className="mt-6 px-6 pb-4 space-y-1 flex-1">
            {filteredNavigation.map((item) => (
              <NavigationItem key={item.name} item={item} />
            ))}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col flex-1">
        {/* Top navigation */}
        <div className="sticky top-0 z-10 bg-white shadow-sm border-b">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <button
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-6 w-6 text-gray-400" />
            </button>
            
            <div className="flex items-center space-x-4 ml-auto">
              <div className="flex items-center space-x-2">
                <div className="text-sm">
                  <div className="font-medium text-gray-900">{user?.name}</div>
                  <div className="text-gray-500">{user?.roles.join(', ')}</div>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-400 hover:text-gray-500"
                  title="Logout"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
