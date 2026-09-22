import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  CreditCard, 
  Receipt, 
  Tag, 
  Settings, 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  DollarSign, 
  TrendingUp, 
  Sparkles, 
  RefreshCw, 
  Save, 
  X, 
  Store, 
  ExternalLink,
  ChevronRight,
  Menu,
  Phone,
  Mail,
  MapPin,
  CheckSquare,
  ShieldCheck,
  Users,
  Eye,
  Star
} from 'lucide-react';

export default function AdminERP() {
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'customers' | 'orders' | 'transactions' | 'reconciliation' | 'services' | 'settings'
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Data States
  const [stats, setStats] = useState({
    todays_revenue: 0,
    mpesa_revenue: 0,
    cash_revenue: 0,
    pending_payments: 0,
    failed_payments: 0,
    outstanding_balances: 0,
    total_orders: 0,
  });

  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [reconciliationList, setReconciliationList] = useState([]);
  const [adminServices, setAdminServices] = useState([]);

  // Customer Management States
  const [customersList, setCustomersList] = useState([]);
  const [customerSummary, setCustomerSummary] = useState({ total_customers: 0, returning_customers: 0, total_spend: 0 });
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomerModal, setSelectedCustomerModal] = useState(null);
  const [editingCustomerModal, setEditingCustomerModal] = useState(null);
  const [customerEditForm, setCustomerEditForm] = useState({ name: '', phone: '', email: '', address: '' });

  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('');

  // Service Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [serviceForm, setServiceForm] = useState({
    name: '',
    description: '',
    category: 'Core Laundry',
    unit_price: '',
    unit_name: 'item',
    is_active: true,
  });

  // System Settings State
  const [systemSettings, setSystemSettings] = useState({
    payment_mode_required: 'FULL_PAYMENT',
    deposit_percentage: 30,
    business_name: 'Nyota Dry Cleaners',
    business_slogan: 'Fresh. Clean. Perfect.',
    business_phone: '+254708374149',
    business_email: 'support@nyotacleaners.co.ke',
    business_address: 'Nyanchwa / Nairobi Center, Kenya',
    operating_hours: 'Mon - Sat: 7:00 AM - 8:00 PM | Sun: 9:00 AM - 5:00 PM',
    express_service_enabled: true,
    express_surcharge: 500,
    mpesa_environment: 'sandbox',
    mpesa_shortcode: '174379',
  });

  const [alertMsg, setAlertMsg] = useState({ type: '', text: '' });

  // Initial Data Fetching
  useEffect(() => {
    fetchStats();
    fetchOrders();
    fetchPayments();
    fetchReconciliation();
    fetchAdminServices();
    fetchCustomers();
  }, []);

  const fetchCustomers = (query = customerSearch) => {
    let url = '/api/v1/admin/customers';
    if (query) url += `?search=${encodeURIComponent(query)}`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setCustomersList(data.customers || []);
          if (data.summary) setCustomerSummary(data.summary);
        }
      })
      .catch((err) => console.error(err));
  };

  const handleOpenCustomerDetail = (customerId) => {
    fetch(`/api/v1/admin/customers/${customerId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.customer) {
          setSelectedCustomerModal(data.customer);
        }
      })
      .catch((err) => console.error(err));
  };

  const handleOpenEditCustomer = (customer) => {
    setEditingCustomerModal(customer);
    setCustomerEditForm({
      name: customer.name || '',
      phone: customer.phone || '',
      email: customer.email || '',
      address: customer.address || '',
    });
  };

  const handleSaveCustomer = (e) => {
    e.preventDefault();
    if (!editingCustomerModal) return;

    fetch(`/api/v1/admin/customers/${editingCustomerModal.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(customerEditForm),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setAlertMsg({ type: 'success', text: 'Customer profile updated successfully!' });
          setEditingCustomerModal(null);
          fetchCustomers();
        }
      })
      .catch((err) => console.error(err));
  };

  const handleDeleteCustomer = (customerId) => {
    if (!confirm('Are you sure you want to remove this customer record?')) return;
    fetch(`/api/v1/admin/customers/${customerId}`, { method: 'DELETE' })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setAlertMsg({ type: 'success', text: 'Customer record deleted.' });
          fetchCustomers();
        }
      })
      .catch((err) => console.error(err));
  };

  const fetchStats = () => {
    fetch('/api/v1/admin/dashboard-stats')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.stats) {
          setStats(data.stats);
          if (data.settings) {
            setSystemSettings((prev) => ({ ...prev, ...data.settings }));
          }
        }
      })
      .catch((err) => console.error(err));
  };

  const fetchOrders = (querySearch = search, status = orderStatusFilter) => {
    setLoading(true);
    let url = '/api/v1/admin/orders?';
    if (querySearch) url += `search=${encodeURIComponent(querySearch)}&`;
    if (status) url += `order_status=${encodeURIComponent(status)}&`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        setLoading(false);
        if (data.success && data.orders) {
          setOrders(data.orders.data || []);
        }
      })
      .catch((err) => {
        setLoading(false);
        console.error(err);
      });
  };

  const fetchPayments = (querySearch = search, status = statusFilter) => {
    setLoading(true);
    let url = '/api/v1/admin/payments?';
    if (querySearch) url += `search=${encodeURIComponent(querySearch)}&`;
    if (status) url += `status=${encodeURIComponent(status)}&`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        setLoading(false);
        if (data.success && data.payments) {
          setPayments(data.payments.data || []);
        }
      })
      .catch((err) => {
        setLoading(false);
        console.error(err);
      });
  };

  const fetchReconciliation = () => {
    fetch('/api/v1/admin/reconciliation')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.reconciliation) {
          setReconciliationList(data.reconciliation || []);
        }
      })
      .catch((err) => console.error(err));
  };

  const fetchAdminServices = () => {
    fetch('/api/v1/admin/services')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.services) {
          setAdminServices(data.services || []);
        }
      })
      .catch((err) => console.error(err));
  };

  // ORDER STATUS CHANGE
  const handleOrderStatusUpdate = (orderId, newStatus) => {
    fetch(`/api/v1/admin/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_status: newStatus }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setAlertMsg({ type: 'success', text: `Order #${data.order.order_number} status updated to ${newStatus}` });
          fetchOrders();
          fetchStats();
        }
      })
      .catch((err) => console.error(err));
  };

  // SERVICE MANAGEMENT HANDLERS
  const openCreateModal = () => {
    setEditingService(null);
    setServiceForm({
      name: '',
      description: '',
      category: 'Core Laundry',
      unit_price: '',
      unit_name: 'item',
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (service) => {
    setEditingService(service);
    setServiceForm({
      name: service.name,
      description: service.description || '',
      category: service.category,
      unit_price: service.unit_price,
      unit_name: service.unit_name,
      is_active: service.is_active,
    });
    setIsModalOpen(true);
  };

  const handleSaveService = (e) => {
    e.preventDefault();
    setLoading(true);
    setAlertMsg({ type: '', text: '' });

    const url = editingService 
      ? `/api/v1/admin/services/${editingService.id}`
      : '/api/v1/admin/services';

    const method = editingService ? 'PUT' : 'POST';

    fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(serviceForm),
    })
      .then((res) => res.json())
      .then((data) => {
        setLoading(false);
        if (data.success) {
          setAlertMsg({
            type: 'success',
            text: editingService ? 'Service & price updated!' : 'New service created!',
          });
          setIsModalOpen(false);
          fetchAdminServices();
        }
      })
      .catch((err) => {
        setLoading(false);
        setAlertMsg({ type: 'error', text: err.message });
      });
  };

  const handleToggleServiceStatus = (id) => {
    fetch(`/api/v1/admin/services/${id}/toggle-status`, { method: 'PATCH' })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          fetchAdminServices();
        }
      });
  };

  const handleDeleteService = (id) => {
    if (!confirm('Are you sure you want to delete this service?')) return;
    fetch(`/api/v1/admin/services/${id}`, { method: 'DELETE' })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          fetchAdminServices();
        }
      });
  };

  // SYSTEM SETTINGS SAVE
  const handleSaveSystemSettings = (e) => {
    e.preventDefault();
    setLoading(true);
    setAlertMsg({ type: '', text: '' });

    fetch('/api/v1/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(systemSettings),
    })
      .then((res) => res.json())
      .then((data) => {
        setLoading(false);
        if (data.success) {
          setAlertMsg({ type: 'success', text: 'All system configuration settings saved successfully!' });
          fetchStats();
        }
      })
      .catch((err) => {
        setLoading(false);
        setAlertMsg({ type: 'error', text: err.message });
      });
  };

  return (
    <div className="min-h-screen bg-[#F4F8FF] flex">
      {/* 1. SIDEBAR NAVIGATION */}
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-[#062B73] text-white transition-all duration-300 flex flex-col justify-between shrink-0 shadow-xl border-r border-[#0B3FA8]/30 sticky top-0 h-screen z-40`}>
        <div>
          {/* LOGO & BRAND BRANDING */}
          <div className="p-5 flex items-center justify-between border-b border-[#0B3FA8]/30">
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className="w-10 h-10 rounded-xl bg-[#0B3FA8] text-white flex items-center justify-center font-black text-xl shrink-0 shadow-md">
                N
              </div>
              {isSidebarOpen && (
                <div>
                  <span className="font-black text-base tracking-tight block leading-tight">NYOTA ERP</span>
                  <span className="text-[10px] text-[#EAF3FF] font-bold uppercase tracking-wider block">"Fresh. Clean. Perfect."</span>
                </div>
              )}
            </div>

            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="text-slate-300 hover:text-white p-1 rounded-lg hover:bg-white/10"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>

          {/* NAVIGATION MENU ITEMS */}
          <nav className="p-3 space-y-1 text-xs font-bold">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center space-x-3 px-3.5 py-3 rounded-xl transition-all ${
                activeTab === 'dashboard' ? 'bg-[#0B3FA8] text-white shadow-lg' : 'text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-5 h-5 shrink-0" />
              {isSidebarOpen && <span>Dashboard Overview</span>}
            </button>

            <button
              onClick={() => setActiveTab('customers')}
              className={`w-full flex items-center space-x-3 px-3.5 py-3 rounded-xl transition-all ${
                activeTab === 'customers' ? 'bg-[#0B3FA8] text-white shadow-lg' : 'text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Users className="w-5 h-5 shrink-0" />
              {isSidebarOpen && <span>Customers Manager</span>}
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`w-full flex items-center space-x-3 px-3.5 py-3 rounded-xl transition-all ${
                activeTab === 'orders' ? 'bg-[#0B3FA8] text-white shadow-lg' : 'text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <ShoppingBag className="w-5 h-5 shrink-0" />
              {isSidebarOpen && <span>Orders Management</span>}
            </button>

            <button
              onClick={() => setActiveTab('transactions')}
              className={`w-full flex items-center space-x-3 px-3.5 py-3 rounded-xl transition-all ${
                activeTab === 'transactions' ? 'bg-[#0B3FA8] text-white shadow-lg' : 'text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Receipt className="w-5 h-5 shrink-0" />
              {isSidebarOpen && <span>M-Pesa Transactions</span>}
            </button>

            <button
              onClick={() => setActiveTab('reconciliation')}
              className={`w-full flex items-center space-x-3 px-3.5 py-3 rounded-xl transition-all ${
                activeTab === 'reconciliation' ? 'bg-[#0B3FA8] text-white shadow-lg' : 'text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <CreditCard className="w-5 h-5 shrink-0" />
              {isSidebarOpen && <span>Reconciliation Matrix</span>}
            </button>

            <button
              onClick={() => setActiveTab('services')}
              className={`w-full flex items-center space-x-3 px-3.5 py-3 rounded-xl transition-all ${
                activeTab === 'services' ? 'bg-[#0B3FA8] text-white shadow-lg' : 'text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Tag className="w-5 h-5 shrink-0" />
              {isSidebarOpen && <span>Services & Pricing</span>}
            </button>

            <a
              href="/admin/pos"
              className="w-full flex items-center space-x-3 px-3.5 py-3 rounded-xl text-emerald-300 hover:bg-emerald-600/20 transition-all border border-emerald-500/20"
            >
              <Store className="w-5 h-5 shrink-0" />
              {isSidebarOpen && <span>In-Store Counter POS</span>}
            </a>

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center space-x-3 px-3.5 py-3 rounded-xl transition-all ${
                activeTab === 'settings' ? 'bg-[#0B3FA8] text-white shadow-lg' : 'text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Settings className="w-5 h-5 shrink-0" />
              {isSidebarOpen && <span>System Settings</span>}
            </button>
          </nav>
        </div>

        {/* SIDEBAR FOOTER */}
        <div className="p-4 border-t border-[#0B3FA8]/30">
          <a
            href="/"
            target="_blank"
            className="flex items-center space-x-2 text-xs font-bold text-[#EAF3FF] hover:text-white"
          >
            <ExternalLink className="w-4 h-4 shrink-0" />
            {isSidebarOpen && <span>View Customer Site</span>}
          </a>
        </div>
      </aside>

      {/* 2. MAIN CONTENT AREA */}
      <main className="flex-1 p-6 md:p-8 space-y-6 overflow-x-hidden">

        {/* TOP BAR HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#0B3FA8]/15 shadow-sm">
          <div>
            <div className="text-xs font-extrabold text-[#0B3FA8] uppercase tracking-wider flex items-center space-x-1">
              <span>Admin ERP</span>
              <ChevronRight className="w-3.5 h-3.5" />
              <span>{activeTab.toUpperCase()}</span>
            </div>
            <h1 className="text-2xl font-black text-[#062B73]">
              {activeTab === 'dashboard' && 'Dashboard Overview'}
              {activeTab === 'customers' && 'Customer Profiles & History'}
              {activeTab === 'orders' && 'Orders Management'}
              {activeTab === 'transactions' && 'M-Pesa Activity Log'}
              {activeTab === 'reconciliation' && 'Payment Reconciliation'}
              {activeTab === 'services' && 'Services & Pricing Catalog'}
              {activeTab === 'settings' && 'System Configuration Settings'}
            </h1>
          </div>

          <div className="flex items-center space-x-3">
            <a
              href="/admin/pos"
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 shadow-md"
            >
              <Store className="w-4 h-4" />
              <span>Launch In-Store POS</span>
            </a>
          </div>
        </div>

        {/* ALERT BANNER */}
        {alertMsg.text && (
          <div className={`p-4 rounded-xl border text-xs font-bold flex items-center justify-between ${
            alertMsg.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>{alertMsg.text}</span>
            </div>
            <button onClick={() => setAlertMsg({ type: '', text: '' })}>
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* TAB: CUSTOMERS MANAGER */}
        {activeTab === 'customers' && (
          <div className="space-y-6">
            {/* SUMMARY CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#0B3FA8]">Total Registered Clients</span>
                <div className="text-2xl font-black text-[#062B73]">{customerSummary.total_customers}</div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Returning Clients (&gt;1 Order)</span>
                <div className="text-2xl font-black text-emerald-700">{customerSummary.returning_customers}</div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">Total Customer Revenue</span>
                <div className="text-2xl font-black text-slate-900">KSh {customerSummary.total_spend.toLocaleString()}</div>
              </div>
            </div>

            {/* CUSTOMER TABLE & SEARCH */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-[#062B73]">Customer Profiles & Order History</h2>
                  <p className="text-xs text-slate-500">Clients are auto-tracked by primary Kenyan mobile numbers (07XX / 01XX).</p>
                </div>

                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="Search by Phone (07... / 01...), Name..."
                    value={customerSearch}
                    onChange={(e) => {
                      setCustomerSearch(e.target.value);
                      fetchCustomers(e.target.value);
                    }}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs font-medium outline-none"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#F4F8FF] text-[11px] font-bold text-[#062B73] uppercase tracking-wider border-b border-slate-200">
                      <th className="p-4">Phone Number (Primary ID)</th>
                      <th className="p-4">Customer Name</th>
                      <th className="p-4">Total Orders</th>
                      <th className="p-4">Total Spent</th>
                      <th className="p-4">Last Order Date</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {customersList.map((cust) => (
                      <tr key={cust.id} className="hover:bg-slate-50">
                        <td className="p-4 font-mono font-bold text-[#0B3FA8]">
                          <span className="px-2.5 py-1 rounded-lg bg-[#EAF3FF] text-[#062B73] inline-block">
                            {cust.phone}
                          </span>
                        </td>
                        <td className="p-4 font-bold text-slate-900">{cust.name || 'Client ' + cust.phone.slice(-4)}</td>
                        <td className="p-4">
                          <div className="flex items-center space-x-1.5">
                            <span className="font-extrabold text-slate-800">{cust.total_orders}</span>
                            {cust.total_orders > 1 && (
                              <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full flex items-center space-x-1">
                                <Star className="w-3 h-3 text-emerald-600 fill-emerald-600" />
                                <span>Returning</span>
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-4 font-black text-slate-900">KSh {parseFloat(cust.total_spent || 0).toLocaleString()}</td>
                        <td className="p-4 text-slate-500">
                          {cust.last_order_at ? new Date(cust.last_order_at).toLocaleDateString() : 'No orders yet'}
                        </td>
                        <td className="p-4 text-right space-x-2">
                          <button
                            onClick={() => handleOpenCustomerDetail(cust.id)}
                            className="px-3 py-1.5 rounded-lg bg-[#0B3FA8] text-white font-bold text-xs inline-flex items-center space-x-1 hover:bg-[#062B73]"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View History</span>
                          </button>
                          <button
                            onClick={() => handleOpenEditCustomer(cust)}
                            className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 inline-block"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCustomer(cust.id)}
                            className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 inline-block"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 1: DASHBOARD OVERVIEW */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* STAT CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Today's Revenue</span>
                <div className="text-xl font-black text-[#062B73]">KSh {stats.todays_revenue.toLocaleString()}</div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">M-Pesa Revenue</span>
                <div className="text-xl font-black text-emerald-700">KSh {stats.mpesa_revenue.toLocaleString()}</div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Cash Revenue</span>
                <div className="text-xl font-black text-slate-800">KSh {stats.cash_revenue.toLocaleString()}</div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600">Pending Payments</span>
                <div className="text-xl font-black text-amber-600">{stats.pending_payments}</div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-red-600">Failed Payments</span>
                <div className="text-xl font-black text-red-600">{stats.failed_payments}</div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#0B3FA8]">Outstanding Balances</span>
                <div className="text-xl font-black text-[#0B3FA8]">KSh {stats.outstanding_balances.toLocaleString()}</div>
              </div>
            </div>

            {/* RECENT ORDERS OVERVIEW TABLE */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-[#062B73]">Recent Orders Activity</h2>
                <button
                  onClick={() => setActiveTab('orders')}
                  className="text-xs font-bold text-[#0B3FA8] hover:underline"
                >
                  View All Orders &rarr;
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#F4F8FF] text-[11px] font-bold text-[#062B73] uppercase tracking-wider border-b border-slate-200">
                      <th className="p-3">Order Number</th>
                      <th className="p-3">Customer</th>
                      <th className="p-3">Phone</th>
                      <th className="p-3">Total Amount</th>
                      <th className="p-3">Payment Status</th>
                      <th className="p-3">Order Status</th>
                      <th className="p-3">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {orders.slice(0, 6).map((order) => (
                      <tr key={order.id} className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-slate-900">{order.order_number}</td>
                        <td className="p-3 font-semibold text-slate-800">{order.customer_name}</td>
                        <td className="p-3 font-mono text-slate-600">{order.customer_phone}</td>
                        <td className="p-3 font-extrabold text-slate-900">KSh {parseFloat(order.total_amount).toLocaleString()}</td>
                        <td className="p-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            order.payment_status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {order.payment_status}
                          </span>
                        </td>
                        <td className="p-3 font-bold text-[#062B73]">{order.order_status}</td>
                        <td className="p-3 text-slate-500">{new Date(order.created_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ORDERS MANAGEMENT */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h2 className="text-lg font-bold text-[#062B73]">Customer Laundry Orders Manager</h2>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Search Order # or Customer..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      fetchOrders(e.target.value, orderStatusFilter);
                    }}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs outline-none"
                  />
                </div>

                <select
                  value={orderStatusFilter}
                  onChange={(e) => {
                    setOrderStatusFilter(e.target.value);
                    fetchOrders(search, e.target.value);
                  }}
                  className="w-full sm:w-44 px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium outline-none bg-white"
                >
                  <option value="">All Order Statuses</option>
                  <option value="PENDING">PENDING</option>
                  <option value="PROCESSING">PROCESSING</option>
                  <option value="CLEANING">CLEANING</option>
                  <option value="READY">READY</option>
                  <option value="DELIVERED">DELIVERED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F4F8FF] text-[11px] font-bold text-[#062B73] uppercase tracking-wider border-b border-slate-200">
                    <th className="p-4">Order Number</th>
                    <th className="p-4">Customer Details</th>
                    <th className="p-4">Delivery Type</th>
                    <th className="p-4">Total</th>
                    <th className="p-4">Paid / Balance</th>
                    <th className="p-4">Payment Status</th>
                    <th className="p-4">Update Order Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-50">
                      <td className="p-4 font-bold text-slate-900">{ord.order_number}</td>
                      <td className="p-4">
                        <div className="font-bold text-slate-900">{ord.customer_name}</div>
                        <div className="text-slate-500 font-mono text-[11px]">{ord.customer_phone}</div>
                      </td>
                      <td className="p-4">
                        <span className="uppercase text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {ord.delivery_option}
                        </span>
                      </td>
                      <td className="p-4 font-black text-slate-900">KSh {parseFloat(ord.total_amount).toLocaleString()}</td>
                      <td className="p-4">
                        <div className="text-emerald-700 font-bold">Paid: KSh {parseFloat(ord.paid_amount || 0).toLocaleString()}</div>
                        <div className="text-[#0B3FA8] font-bold">Bal: KSh {parseFloat(ord.balance_amount || 0).toLocaleString()}</div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                          ord.payment_status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {ord.payment_status}
                        </span>
                      </td>
                      <td className="p-4">
                        <select
                          value={ord.order_status}
                          onChange={(e) => handleOrderStatusUpdate(ord.id, e.target.value)}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-[#062B73] outline-none bg-white"
                        >
                          <option value="PENDING">PENDING</option>
                          <option value="PROCESSING">PROCESSING</option>
                          <option value="CLEANING">CLEANING</option>
                          <option value="READY">READY</option>
                          <option value="DELIVERED">DELIVERED</option>
                          <option value="CANCELLED">CANCELLED</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: M-PESA TRANSACTIONS */}
        {activeTab === 'transactions' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-[#062B73]">M-Pesa Payment Activity Log</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F4F8FF] text-[11px] font-bold text-[#062B73] uppercase tracking-wider border-b border-slate-200">
                    <th className="p-4">Order #</th>
                    <th className="p-4">Customer</th>
                    <th className="p-4">Phone Number</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">M-Pesa Receipt</th>
                    <th className="p-4">Method</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="p-4 font-bold text-slate-900">{p.order?.order_number || p.reference || '-'}</td>
                      <td className="p-4 font-semibold text-slate-800">{p.order?.customer_name || 'Guest'}</td>
                      <td className="p-4 font-mono text-slate-600">{p.phone_number || '-'}</td>
                      <td className="p-4 font-extrabold text-slate-900">KSh {parseFloat(p.amount).toLocaleString()}</td>
                      <td className="p-4 font-mono font-bold text-[#0B3FA8]">{p.mpesa_receipt_number || '-'}</td>
                      <td className="p-4 uppercase text-[10px] font-bold">{p.payment_method}</td>
                      <td className="p-4 font-bold text-emerald-600">{p.status}</td>
                      <td className="p-4 text-slate-500">{new Date(p.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: RECONCILIATION */}
        {activeTab === 'reconciliation' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#062B73]">Payment Reconciliation Matrix</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F4F8FF] text-[11px] font-bold text-[#062B73] uppercase tracking-wider border-b border-slate-200">
                    <th className="p-4">Order Number</th>
                    <th className="p-4">Customer</th>
                    <th className="p-4">Order Total</th>
                    <th className="p-4">Paid Amount</th>
                    <th className="p-4">M-Pesa Receipt</th>
                    <th className="p-4">Outstanding Balance</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reconciliationList.map((rec) => (
                    <tr key={rec.order_id} className="hover:bg-slate-50">
                      <td className="p-4 font-bold text-slate-900">{rec.order_number}</td>
                      <td className="p-4 font-semibold text-slate-800">{rec.customer_name}</td>
                      <td className="p-4 font-bold text-slate-900">KSh {rec.total_amount.toLocaleString()}</td>
                      <td className="p-4 font-bold text-emerald-600">KSh {rec.paid_amount.toLocaleString()}</td>
                      <td className="p-4 font-mono text-[#0B3FA8]">{rec.mpesa_receipt}</td>
                      <td className="p-4 font-bold text-[#0B3FA8]">KSh {rec.balance_amount.toLocaleString()}</td>
                      <td className="p-4 font-bold">{rec.payment_status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: SERVICES & PRICING CATALOG */}
        {activeTab === 'services' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-[#062B73]">Services & Pricing Catalog</h2>
              <button
                onClick={openCreateModal}
                className="bg-[#0B3FA8] text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Service</span>
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F4F8FF] text-[11px] font-bold text-[#062B73] uppercase tracking-wider border-b border-slate-200">
                    <th className="p-4">Service Name</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Unit Price</th>
                    <th className="p-4">Unit Measure</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {adminServices.map((svc) => (
                    <tr key={svc.id} className="hover:bg-slate-50">
                      <td className="p-4 font-bold text-slate-900">{svc.name}</td>
                      <td className="p-4 font-bold text-[#0B3FA8]">{svc.category}</td>
                      <td className="p-4 font-black text-slate-900">KSh {parseFloat(svc.unit_price).toLocaleString()}</td>
                      <td className="p-4 text-slate-600">/{svc.unit_name}</td>
                      <td className="p-4 font-bold">{svc.is_active ? 'Active' : 'Inactive'}</td>
                      <td className="p-4 text-right">
                        <button onClick={() => openEditModal(svc)} className="p-2 text-[#0B3FA8]">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteService(svc.id)} className="p-2 text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 6: COMPREHENSIVE SYSTEM SETTINGS */}
        {activeTab === 'settings' && (
          <form onSubmit={handleSaveSystemSettings} className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm space-y-8 max-w-3xl mx-auto">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xl font-black text-[#062B73]">System & Business Configuration</h2>
              <p className="text-xs text-slate-500 mt-1">Manage business information, slogan, contact channels, payment rules, and express service options.</p>
            </div>

            {/* SECTION: BUSINESS PROFILE */}
            <div className="space-y-4">
              <h3 className="text-xs font-extrabold text-[#0B3FA8] uppercase tracking-wider border-b pb-2">Business Profile & Branding</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Business Name *</label>
                  <input
                    type="text"
                    required
                    value={systemSettings.business_name}
                    onChange={(e) => setSystemSettings({ ...systemSettings, business_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Official Slogan *</label>
                  <input
                    type="text"
                    required
                    value={systemSettings.business_slogan}
                    onChange={(e) => setSystemSettings({ ...systemSettings, business_slogan: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-[#0B3FA8] outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Customer Support Phone *</label>
                  <input
                    type="text"
                    required
                    value={systemSettings.business_phone}
                    onChange={(e) => setSystemSettings({ ...systemSettings, business_phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Support Email *</label>
                  <input
                    type="email"
                    required
                    value={systemSettings.business_email}
                    onChange={(e) => setSystemSettings({ ...systemSettings, business_email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold outline-none"
                  />
                </div>
              </div>
            </div>

            {/* SECTION: PAYMENT & M-PESA RULES */}
            <div className="space-y-4">
              <h3 className="text-xs font-extrabold text-[#0B3FA8] uppercase tracking-wider border-b pb-2">M-Pesa & Payment Checkout Rules</h3>
              
              <div className="space-y-3 text-xs">
                <label className="block font-bold text-slate-700 uppercase tracking-wider">Required Payment Checkout Mode</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setSystemSettings({ ...systemSettings, payment_mode_required: 'FULL_PAYMENT' })}
                    className={`p-3.5 rounded-xl border text-left font-bold transition-all ${
                      systemSettings.payment_mode_required === 'FULL_PAYMENT' ? 'border-[#0B3FA8] bg-[#EAF3FF] text-[#062B73]' : 'border-slate-200'
                    }`}
                  >
                    FULL PAYMENT (100%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSystemSettings({ ...systemSettings, payment_mode_required: 'DEPOSIT' })}
                    className={`p-3.5 rounded-xl border text-left font-bold transition-all ${
                      systemSettings.payment_mode_required === 'DEPOSIT' ? 'border-[#0B3FA8] bg-[#EAF3FF] text-[#062B73]' : 'border-slate-200'
                    }`}
                  >
                    REQUIRED DEPOSIT (%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSystemSettings({ ...systemSettings, payment_mode_required: 'PAY_AFTER_SERVICE' })}
                    className={`p-3.5 rounded-xl border text-left font-bold transition-all ${
                      systemSettings.payment_mode_required === 'PAY_AFTER_SERVICE' ? 'border-[#0B3FA8] bg-[#EAF3FF] text-[#062B73]' : 'border-slate-200'
                    }`}
                  >
                    PAY AFTER SERVICE
                  </button>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-700">M-Pesa Environment:</span>
                  <span className="font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 uppercase">{systemSettings.mpesa_environment}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-700">Active PayBill Shortcode:</span>
                  <span className="font-mono font-bold text-[#0B3FA8]">{systemSettings.mpesa_shortcode}</span>
                </div>
              </div>
            </div>

            {/* SAVE BUTTON */}
            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="bg-[#0B3FA8] hover:bg-[#062B73] text-white px-8 py-3 rounded-xl font-extrabold text-sm flex items-center space-x-2 shadow-lg"
              >
                <Save className="w-5 h-5" />
                <span>SAVE ALL SYSTEM SETTINGS</span>
              </button>
            </div>
          </form>
        )}

      </main>

      {/* SERVICE EDIT/CREATE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-bold text-base text-[#062B73]">{editingService ? 'Edit Service & Price' : 'Add New Service'}</h3>
              <button onClick={() => setIsModalOpen(false)}><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSaveService} className="space-y-3 text-xs">
              <input
                type="text"
                required
                placeholder="Service Name"
                value={serviceForm.name}
                onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                className="w-full p-2.5 rounded-xl border"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Category"
                  value={serviceForm.category}
                  onChange={(e) => setServiceForm({ ...serviceForm, category: e.target.value })}
                  className="p-2.5 rounded-xl border"
                />
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="Price (KSh)"
                  value={serviceForm.unit_price}
                  onChange={(e) => setServiceForm({ ...serviceForm, unit_price: e.target.value })}
                  className="p-2.5 rounded-xl border font-bold text-[#0B3FA8]"
                />
              </div>
              <input
                type="text"
                required
                placeholder="Unit Measure e.g. item, 5kg load, suit"
                value={serviceForm.unit_name}
                onChange={(e) => setServiceForm({ ...serviceForm, unit_name: e.target.value })}
                className="w-full p-2.5 rounded-xl border"
              />
              <textarea
                placeholder="Description"
                value={serviceForm.description}
                onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                className="w-full p-2.5 rounded-xl border"
              ></textarea>
              <button type="submit" className="w-full bg-[#0B3FA8] text-white py-2.5 rounded-xl font-bold">
                Save Service & Price
              </button>
            </form>
          </div>
        </div>
      )}

      {/* VIEW CUSTOMER DETAIL & HISTORY MODAL */}
      {selectedCustomerModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="font-black text-lg text-[#062B73] flex items-center space-x-2">
                  <span>Customer Profile: {selectedCustomerModal.name}</span>
                </h3>
                <span className="text-xs font-mono font-bold text-[#0B3FA8]">Phone: {selectedCustomerModal.phone}</span>
              </div>
              <button onClick={() => setSelectedCustomerModal(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 bg-[#F4F8FF] p-4 rounded-xl border border-[#0B3FA8]/15 text-xs">
              <div>
                <span className="text-slate-500 font-bold block">Total Orders:</span>
                <span className="text-lg font-black text-[#062B73]">{selectedCustomerModal.total_orders}</span>
              </div>
              <div>
                <span className="text-slate-500 font-bold block">Total Lifetime Spend:</span>
                <span className="text-lg font-black text-emerald-700">KSh {parseFloat(selectedCustomerModal.total_spent || 0).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-slate-500 font-bold block">Registered Since:</span>
                <span className="text-xs font-bold text-slate-700">{new Date(selectedCustomerModal.created_at).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-extrabold text-[#062B73] uppercase tracking-wider">Customer Order History</h4>
              {selectedCustomerModal.orders && selectedCustomerModal.orders.length > 0 ? (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1 text-xs">
                  {selectedCustomerModal.orders.map((ord) => (
                    <div key={ord.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-[#062B73]">{ord.order_number}</div>
                        <div className="text-[11px] text-slate-500">{new Date(ord.created_at).toLocaleString()}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-black text-slate-900">KSh {parseFloat(ord.total_amount).toLocaleString()}</div>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                          {ord.order_status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-slate-400 text-xs">No orders recorded yet for this customer profile.</div>
              )}
            </div>

            <div className="pt-3 border-t flex justify-end">
              <button
                onClick={() => setSelectedCustomerModal(null)}
                className="bg-slate-800 text-white px-6 py-2 rounded-xl text-xs font-bold"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT CUSTOMER PROFILE MODAL */}
      {editingCustomerModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-bold text-base text-[#062B73]">Edit Customer Profile</h3>
              <button onClick={() => setEditingCustomerModal(null)}><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSaveCustomer} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Customer Phone (Primary Key)</label>
                <input
                  type="text"
                  value={customerEditForm.phone}
                  onChange={(e) => setCustomerEditForm({ ...customerEditForm, phone: e.target.value })}
                  className="w-full p-2.5 rounded-xl border font-bold text-[#0B3FA8]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Customer Name</label>
                <input
                  type="text"
                  placeholder="Client Name"
                  value={customerEditForm.name}
                  onChange={(e) => setCustomerEditForm({ ...customerEditForm, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="Email Address"
                  value={customerEditForm.email}
                  onChange={(e) => setCustomerEditForm({ ...customerEditForm, email: e.target.value })}
                  className="w-full p-2.5 rounded-xl border"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Physical Address</label>
                <textarea
                  placeholder="Delivery Address"
                  value={customerEditForm.address}
                  onChange={(e) => setCustomerEditForm({ ...customerEditForm, address: e.target.value })}
                  className="w-full p-2.5 rounded-xl border"
                ></textarea>
              </div>

              <button type="submit" className="w-full bg-[#0B3FA8] text-white py-2.5 rounded-xl font-bold shadow">
                Save Customer Changes
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
