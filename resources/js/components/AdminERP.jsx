import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  CreditCard, 
  Clock, 
  AlertCircle, 
  Search, 
  Filter, 
  CheckCircle2, 
  Sparkles, 
  Settings, 
  Layers, 
  TrendingUp, 
  Receipt,
  FileSpreadsheet,
  Save,
  RefreshCw,
  Plus,
  Edit3,
  Trash2,
  ToggleLeft,
  ToggleRight,
  X,
  Tag
} from 'lucide-react';

export default function AdminERP() {
  const [activeTab, setActiveTab] = useState('transactions'); // 'transactions' | 'reconciliation' | 'services' | 'settings'
  const [stats, setStats] = useState({
    todays_revenue: 0,
    mpesa_revenue: 0,
    cash_revenue: 0,
    pending_payments: 0,
    failed_payments: 0,
    outstanding_balances: 0,
  });
  
  const [payments, setPayments] = useState([]);
  const [reconciliationList, setReconciliationList] = useState([]);
  const [adminServices, setAdminServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

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
  const [alertMsg, setAlertMsg] = useState({ type: '', text: '' });

  // Settings State
  const [settings, setSettings] = useState({
    payment_mode_required: 'FULL_PAYMENT',
    deposit_percentage: 30,
  });

  // Fetch Dashboard Stats & Transactions on mount
  useEffect(() => {
    fetchStats();
    fetchPayments();
    fetchReconciliation();
    fetchAdminServices();
  }, []);

  const fetchStats = () => {
    fetch('/api/v1/admin/dashboard-stats')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.stats) {
          setStats(data.stats);
          if (data.payment_mode_required) {
            setSettings((prev) => ({ ...prev, payment_mode_required: data.payment_mode_required }));
          }
        }
      })
      .catch((err) => console.error(err));
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

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    fetchPayments(val, statusFilter);
  };

  const handleStatusFilterChange = (e) => {
    const val = e.target.value;
    setStatusFilter(val);
    fetchPayments(search, val);
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
            text: editingService ? 'Service and price updated successfully!' : 'New service created successfully!',
          });
          setIsModalOpen(false);
          fetchAdminServices();
        } else {
          setAlertMsg({ type: 'error', text: data.message || 'Error saving service' });
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
      })
      .catch((err) => console.error(err));
  };

  const handleDeleteService = (id) => {
    if (!confirm('Are you sure you want to delete this service?')) return;
    fetch(`/api/v1/admin/services/${id}`, { method: 'DELETE' })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          fetchAdminServices();
        }
      })
      .catch((err) => console.error(err));
  };

  // SETTINGS HANDLER
  const handleSaveSettings = () => {
    setLoading(true);
    setAlertMsg({ type: '', text: '' });
    fetch('/api/v1/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    })
      .then((res) => res.json())
      .then((data) => {
        setLoading(false);
        if (data.success) {
          setAlertMsg({ type: 'success', text: 'Payment configuration settings updated successfully!' });
          fetchStats();
        }
      })
      .catch((err) => {
        setLoading(false);
        console.error(err);
      });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* BRAND HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#0B3FA8]/15 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-xl bg-[#0B3FA8] text-white flex items-center justify-center shadow-lg">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-[#062B73]">Nyota Dry Cleaners ERP</h1>
            <p className="text-xs font-bold text-[#0B3FA8] uppercase tracking-wider">
              Payment Dashboard, Services & Pricing Management
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center space-x-2 bg-[#F4F8FF] p-1.5 rounded-xl border border-[#0B3FA8]/10 text-xs font-bold">
          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'transactions' ? 'bg-[#0B3FA8] text-white shadow' : 'text-slate-600 hover:text-[#0B3FA8]'
            }`}
          >
            M-Pesa Transactions
          </button>
          <button
            onClick={() => setActiveTab('reconciliation')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'reconciliation' ? 'bg-[#0B3FA8] text-white shadow' : 'text-slate-600 hover:text-[#0B3FA8]'
            }`}
          >
            Reconciliation
          </button>
          <button
            onClick={() => setActiveTab('services')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'services' ? 'bg-[#0B3FA8] text-white shadow' : 'text-slate-600 hover:text-[#0B3FA8]'
            }`}
          >
            Services & Pricing
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'settings' ? 'bg-[#0B3FA8] text-white shadow' : 'text-slate-600 hover:text-[#0B3FA8]'
            }`}
          >
            Settings
          </button>
        </div>
      </div>

      {/* ALERT NOTIFICATION */}
      {alertMsg.text && (
        <div className={`p-4 rounded-xl border text-xs font-bold flex items-center space-x-2 ${
          alertMsg.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{alertMsg.text}</span>
        </div>
      )}

      {/* STAT CARDS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        {/* TODAY'S REVENUE */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Today's Revenue</span>
            <DollarSign className="w-5 h-5 text-[#0B3FA8]" />
          </div>
          <div className="text-xl font-black text-[#062B73]">
            KSh {stats.todays_revenue.toLocaleString()}
          </div>
        </div>

        {/* M-PESA REVENUE */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">M-Pesa Revenue</span>
            <Receipt className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-xl font-black text-emerald-700">
            KSh {stats.mpesa_revenue.toLocaleString()}
          </div>
        </div>

        {/* CASH REVENUE */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Cash Revenue</span>
            <CreditCard className="w-5 h-5 text-slate-600" />
          </div>
          <div className="text-xl font-black text-slate-800">
            KSh {stats.cash_revenue.toLocaleString()}
          </div>
        </div>

        {/* PENDING PAYMENTS */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600">Pending</span>
            <Clock className="w-5 h-5 text-amber-500" />
          </div>
          <div className="text-xl font-black text-amber-600">
            {stats.pending_payments}
          </div>
        </div>

        {/* FAILED PAYMENTS */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider text-red-600">Failed</span>
            <AlertCircle className="w-5 h-5 text-red-500" />
          </div>
          <div className="text-xl font-black text-red-600">
            {stats.failed_payments}
          </div>
        </div>

        {/* OUTSTANDING BALANCES */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0B3FA8]">Outstanding</span>
            <TrendingUp className="w-5 h-5 text-[#0B3FA8]" />
          </div>
          <div className="text-xl font-black text-[#0B3FA8]">
            KSh {stats.outstanding_balances.toLocaleString()}
          </div>
        </div>
      </div>

      {/* TAB 1: TRANSACTIONS LIST */}
      {activeTab === 'transactions' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-[#062B73]">Payment Transaction Activity Log</h2>

            {/* SEARCH & FILTERS */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Receipt / Order / Customer..."
                  value={search}
                  onChange={handleSearchChange}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 focus:border-[#0B3FA8] text-xs outline-none"
                />
              </div>

              <select
                value={statusFilter}
                onChange={handleStatusFilterChange}
                className="w-full sm:w-40 px-3 py-2 rounded-xl border border-slate-300 focus:border-[#0B3FA8] text-xs outline-none font-medium bg-white"
              >
                <option value="">All Statuses</option>
                <option value="PAID">PAID</option>
                <option value="PROCESSING">PROCESSING</option>
                <option value="PENDING">PENDING</option>
                <option value="FAILED">FAILED</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
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
              <tbody className="divide-y divide-slate-100 text-xs">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="p-8 text-center text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#0B3FA8]" />
                      Loading transactions...
                    </td>
                  </tr>
                ) : payments.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="p-8 text-center text-slate-400">
                      No payment records found.
                    </td>
                  </tr>
                ) : (
                  payments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 font-bold text-slate-900">{p.order?.order_number || p.reference || '-'}</td>
                      <td className="p-4 font-semibold text-slate-800">{p.order?.customer_name || 'Guest'}</td>
                      <td className="p-4 font-mono text-slate-600">{p.phone_number || '-'}</td>
                      <td className="p-4 font-extrabold text-slate-900">KSh {parseFloat(p.amount).toLocaleString()}</td>
                      <td className="p-4 font-mono font-bold text-[#0B3FA8]">{p.mpesa_receipt_number || '-'}</td>
                      <td className="p-4">
                        <span className="uppercase text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {p.payment_method}
                        </span>
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                            p.status === 'PAID'
                              ? 'bg-emerald-100 text-emerald-800'
                              : p.status === 'FAILED'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="p-4 text-slate-500">{new Date(p.created_at).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: RECONCILIATION REPORT */}
      {activeTab === 'reconciliation' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#062B73]">Payment Reconciliation Matrix</h2>
            <button
              onClick={fetchReconciliation}
              className="text-xs font-bold text-[#0B3FA8] hover:underline flex items-center space-x-1"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh Report</span>
            </button>
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
                  <th className="p-4">Reconciliation Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reconciliationList.map((rec) => (
                  <tr key={rec.order_id} className="hover:bg-slate-50">
                    <td className="p-4 font-bold text-slate-900">{rec.order_number}</td>
                    <td className="p-4 text-slate-800">{rec.customer_name}</td>
                    <td className="p-4 font-bold text-slate-900">KSh {rec.total_amount.toLocaleString()}</td>
                    <td className="p-4 font-bold text-emerald-600">KSh {rec.paid_amount.toLocaleString()}</td>
                    <td className="p-4 font-mono text-[#0B3FA8]">{rec.mpesa_receipt}</td>
                    <td className="p-4 font-bold text-[#0B3FA8]">KSh {rec.balance_amount.toLocaleString()}</td>
                    <td className="p-4">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                          rec.payment_status === 'PAID'
                            ? 'bg-emerald-100 text-emerald-800'
                            : rec.payment_status === 'PARTIALLY_PAID'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {rec.payment_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: SERVICES & PRICING MANAGEMENT */}
      {activeTab === 'services' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-[#062B73]">Services & Pricing Catalog</h2>
              <p className="text-xs text-slate-500">Manage service offerings, edit prices in real-time, and toggle active catalog items.</p>
            </div>

            <button
              onClick={openCreateModal}
              className="bg-[#0B3FA8] hover:bg-[#062B73] text-white px-5 py-2.5 rounded-xl font-bold text-xs flex items-center space-x-2 shadow"
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
                  <th className="p-4">Unit Description</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {adminServices.map((svc) => (
                  <tr key={svc.id} className="hover:bg-slate-50">
                    <td className="p-4">
                      <div className="font-bold text-slate-900 text-sm">{svc.name}</div>
                      <div className="text-slate-500 text-[11px] line-clamp-1">{svc.description}</div>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded bg-[#EAF3FF] text-[#0B3FA8] font-bold text-[10px] uppercase">
                        {svc.category}
                      </span>
                    </td>
                    <td className="p-4 font-black text-slate-900 text-sm">
                      KSh {parseFloat(svc.unit_price).toLocaleString()}
                    </td>
                    <td className="p-4 font-medium text-slate-600">/{svc.unit_name}</td>
                    <td className="p-4">
                      <button
                        onClick={() => handleToggleServiceStatus(svc.id)}
                        className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[10px] font-bold transition-all ${
                          svc.is_active
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-slate-100 text-slate-600 border border-slate-300'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${svc.is_active ? 'bg-emerald-600' : 'bg-slate-400'}`}></span>
                        <span>{svc.is_active ? 'Active' : 'Inactive'}</span>
                      </button>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => openEditModal(svc)}
                          className="p-2 rounded-lg bg-[#EAF3FF] text-[#0B3FA8] hover:bg-[#0B3FA8] hover:text-white transition-colors"
                          title="Edit Service & Price"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteService(svc.id)}
                          className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-colors"
                          title="Delete Service"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: BUSINESS PAYMENT CONFIGURATION SETTINGS */}
      {activeTab === 'settings' && (
        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm max-w-2xl mx-auto space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-xl font-bold text-[#062B73]">Business Payment Rules</h2>
            <p className="text-xs text-slate-500 mt-1">
              Configure whether customer orders require full payment, a percentage deposit, or pay after service.
            </p>
          </div>

          <div className="space-y-4">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Required Payment Mode
            </label>

            <div className="space-y-3">
              <label className="flex items-center space-x-3 p-4 rounded-xl border border-slate-200 hover:border-[#0B3FA8] cursor-pointer">
                <input
                  type="radio"
                  name="paymentMode"
                  value="FULL_PAYMENT"
                  checked={settings.payment_mode_required === 'FULL_PAYMENT'}
                  onChange={(e) => setSettings({ ...settings, payment_mode_required: e.target.value })}
                  className="accent-[#0B3FA8]"
                />
                <div>
                  <div className="font-bold text-sm text-slate-800">FULL PAYMENT</div>
                  <div className="text-xs text-slate-500">Customers must pay 100% of order total during checkout.</div>
                </div>
              </label>

              <label className="flex items-center space-x-3 p-4 rounded-xl border border-slate-200 hover:border-[#0B3FA8] cursor-pointer">
                <input
                  type="radio"
                  name="paymentMode"
                  value="DEPOSIT"
                  checked={settings.payment_mode_required === 'DEPOSIT'}
                  onChange={(e) => setSettings({ ...settings, payment_mode_required: e.target.value })}
                  className="accent-[#0B3FA8]"
                />
                <div>
                  <div className="font-bold text-sm text-slate-800">REQUIRED DEPOSIT</div>
                  <div className="text-xs text-slate-500">Customers can pay a minimum percentage deposit to confirm booking.</div>
                </div>
              </label>

              {settings.payment_mode_required === 'DEPOSIT' && (
                <div className="ml-8 p-4 rounded-xl bg-[#F4F8FF] border border-[#0B3FA8]/20">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Deposit Percentage (%)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="90"
                    value={settings.deposit_percentage}
                    onChange={(e) => setSettings({ ...settings, deposit_percentage: parseFloat(e.target.value) || 30 })}
                    className="w-32 px-3 py-2 rounded-lg border border-slate-300 font-bold text-sm outline-none"
                  />
                </div>
              )}

              <label className="flex items-center space-x-3 p-4 rounded-xl border border-slate-200 hover:border-[#0B3FA8] cursor-pointer">
                <input
                  type="radio"
                  name="paymentMode"
                  value="PAY_AFTER_SERVICE"
                  checked={settings.payment_mode_required === 'PAY_AFTER_SERVICE'}
                  onChange={(e) => setSettings({ ...settings, payment_mode_required: e.target.value })}
                  className="accent-[#0B3FA8]"
                />
                <div>
                  <div className="font-bold text-sm text-slate-800">PAY AFTER SERVICE / ON DELIVERY</div>
                  <div className="text-xs text-slate-500">No immediate online payment forced; customer pays upon delivery.</div>
                </div>
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              onClick={handleSaveSettings}
              disabled={loading}
              className="bg-[#0B3FA8] hover:bg-[#062B73] text-white px-6 py-2.5 rounded-xl font-bold text-sm flex items-center space-x-2 shadow"
            >
              <Save className="w-4 h-4" />
              <span>Save Payment Rules</span>
            </button>
          </div>
        </div>
      )}

      {/* SERVICE EDIT/CREATE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-[#062B73]">
                {editingService ? 'Edit Service & Price' : 'Add New Service'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveService} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Service Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Executive Suit Dry Cleaning"
                  value={serviceForm.name}
                  onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-[#0B3FA8] text-sm font-semibold outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Category *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Specialty Care"
                    value={serviceForm.category}
                    onChange={(e) => setServiceForm({ ...serviceForm, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-[#0B3FA8] text-sm outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Unit Price (KSh) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="800.00"
                    value={serviceForm.unit_price}
                    onChange={(e) => setServiceForm({ ...serviceForm, unit_price: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-[#0B3FA8] text-sm font-bold text-[#0B3FA8] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Unit Name / Billing Measure *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 5kg load, suit, pair, item"
                  value={serviceForm.unit_name}
                  onChange={(e) => setServiceForm({ ...serviceForm, unit_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-[#0B3FA8] text-sm outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Service Description
                </label>
                <textarea
                  rows="3"
                  placeholder="Describe service highlights, fabric care instructions..."
                  value={serviceForm.description}
                  onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-[#0B3FA8] text-sm outline-none"
                ></textarea>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="is_active_check"
                  checked={serviceForm.is_active}
                  onChange={(e) => setServiceForm({ ...serviceForm, is_active: e.target.checked })}
                  className="w-4 h-4 accent-[#0B3FA8]"
                />
                <label htmlFor="is_active_check" className="font-bold text-slate-700 cursor-pointer">
                  Service Active in Catalog & Customer Booking App
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-[#0B3FA8] hover:bg-[#062B73] text-white px-6 py-2.5 rounded-xl font-bold flex items-center space-x-2 shadow"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingService ? 'Save Price & Details' : 'Create Service'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
