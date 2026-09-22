import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  Phone, 
  User, 
  CreditCard, 
  Printer, 
  CheckCircle2, 
  RefreshCw, 
  AlertCircle,
  Sparkles,
  Receipt,
  Star,
  X
} from 'lucide-react';

export default function AdminPOS() {
  const [services, setServices] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Cart & Customer state
  const [cart, setCart] = useState({});
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [deliveryOption, setDeliveryOption] = useState('drop_off');
  const [paymentMethod, setPaymentMethod] = useState('mpesa');

  // Customer History State
  const [customerHistory, setCustomerHistory] = useState(null);
  const [isLookupLoading, setIsLookupLoading] = useState(false);
  
  // Checkout & STK Push state
  const [loading, setLoading] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null);
  const [stkState, setStkState] = useState('idle');
  const [checkoutRequestId, setCheckoutRequestId] = useState(null);
  const [paymentObj, setPaymentObj] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // POS Receipt modal state
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  useEffect(() => {
    fetch('/api/v1/services')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setServices(data.services || []);
        }
      })
      .catch((err) => console.error(err));
  }, []);

  // Auto-Lookup Customer History when phone number is typed
  useEffect(() => {
    const cleaned = customerPhone.replace(/[^0-9]/g, '');
    if (cleaned.length >= 9) {
      setIsLookupLoading(true);
      fetch(`/api/v1/customers/history?phone=${cleaned}`)
        .then((res) => res.json())
        .then((data) => {
          setIsLookupLoading(false);
          if (data.success && data.is_returning_customer) {
            setCustomerHistory(data);
            if (data.customer_name && !customerName) {
              setCustomerName(data.customer_name);
            }
          } else {
            setCustomerHistory(null);
          }
        })
        .catch(() => setIsLookupLoading(false));
    } else {
      setCustomerHistory(null);
    }
  }, [customerPhone]);

  // Poll STK Push status at counter
  useEffect(() => {
    let intervalId = null;
    if (stkState === 'awaiting_pin' && checkoutRequestId) {
      intervalId = setInterval(() => {
        fetch(`/api/v1/payments/status/${checkoutRequestId}`)
          .then((res) => res.json())
          .then((data) => {
            if (data.success && data.payment) {
              if (data.payment.status === 'PAID') {
                setStkState('success');
                setPaymentObj(data.payment);
                if (data.order) {
                  setCreatedOrder((prev) => ({
                    ...prev,
                    paid_amount: data.order.paid_amount,
                    balance_amount: data.order.balance_amount,
                    payment_status: data.order.payment_status,
                  }));
                }
                setShowReceiptModal(true);
                clearInterval(intervalId);
              } else if (data.payment.status === 'FAILED') {
                setStkState('failed');
                setErrorMsg(data.payment.result_description || 'Payment failed or was cancelled.');
                clearInterval(intervalId);
              }
            }
          })
          .catch((err) => console.error(err));
      }, 3000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [stkState, checkoutRequestId]);

  const updateQuantity = (serviceId, delta) => {
    setCart((prev) => {
      const current = prev[serviceId] || 0;
      const updated = Math.max(0, current + delta);
      if (updated === 0) {
        const copy = { ...prev };
        delete copy[serviceId];
        return copy;
      }
      return { ...prev, [serviceId]: updated };
    });
  };

  const calculateSubtotal = () => {
    return Object.entries(cart).reduce((sum, [serviceId, qty]) => {
      const service = services.find((s) => s.id === parseInt(serviceId));
      return sum + (service ? parseFloat(service.unit_price) * qty : 0);
    }, 0);
  };

  const subtotal = calculateSubtotal();

  const categories = ['ALL', ...new Set(services.map((s) => s.category))];

  const filteredServices = services.filter((s) => {
    const matchesCategory = categoryFilter === 'ALL' || s.category === categoryFilter;
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handlePOSCheckout = async () => {
    if (Object.keys(cart).length === 0) {
      setErrorMsg('Please select at least one service for the order.');
      return;
    }
    if (!customerPhone.trim()) {
      setErrorMsg('Please enter customer phone number.');
      return;
    }

    setErrorMsg('');
    setLoading(true);

    try {
      const itemsPayload = Object.entries(cart).map(([serviceId, qty]) => ({
        service_id: parseInt(serviceId),
        quantity: qty,
      }));

      const orderRes = await fetch('/api/v1/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_phone: customerPhone,
          customer_name: customerName || null,
          delivery_option: deliveryOption,
          items: itemsPayload,
          notes: 'In-Store POS Order',
        }),
      });

      const orderData = await orderRes.json();
      if (!orderData.success) {
        throw new Error(orderData.message || 'Failed to process POS order.');
      }

      const order = orderData.order;
      setCreatedOrder(order);

      if (paymentMethod === 'cash') {
        fetch('/api/v1/payments/mpesa/stk-push', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            order_id: order.id,
            phone_number: customerPhone,
            amount: subtotal,
          }),
        }).catch(() => null);

        setStkState('success');
        setLoading(false);
        setShowReceiptModal(true);
        return;
      }

      setStkState('initiating');
      const stkRes = await fetch('/api/v1/payments/mpesa/stk-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: order.id,
          phone_number: customerPhone,
          amount: subtotal,
        }),
      });

      const stkData = await stkRes.json();
      setLoading(false);

      if (stkData.success) {
        setCheckoutRequestId(stkData.checkout_request_id);
        setStkState('awaiting_pin');
        setPaymentObj(stkData.payment);
      } else {
        setStkState('failed');
        setErrorMsg(stkData.message || 'Failed to trigger M-Pesa prompt.');
      }
    } catch (err) {
      setLoading(false);
      setErrorMsg(err.message || 'Error processing POS order.');
    }
  };

  const handleSimulateSandboxPin = () => {
    if (!checkoutRequestId) return;
    setLoading(true);
    fetch(`/api/v1/payments/status/${checkoutRequestId}?simulate_success=true`)
      .then((res) => res.json())
      .then((data) => {
        setLoading(false);
        if (data.success && data.payment) {
          setStkState('success');
          setPaymentObj(data.payment);
          if (data.order) {
            setCreatedOrder((prev) => ({
              ...prev,
              paid_amount: data.order.paid_amount,
              balance_amount: data.order.balance_amount,
              payment_status: data.order.payment_status,
            }));
          }
          setShowReceiptModal(true);
        }
      });
  };

  const resetPOSForm = () => {
    setCart({});
    setCustomerPhone('');
    setCustomerName('');
    setCreatedOrder(null);
    setPaymentObj(null);
    setStkState('idle');
    setShowReceiptModal(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* POS COUNTER HEADER */}
      <div className="bg-[#062B73] text-white p-6 rounded-2xl flex items-center justify-between shadow-md">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-[#0B3FA8] text-white font-black flex items-center justify-center text-lg">
            POS
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">Nyota In-Store Register & Checkout</h1>
            <p className="text-xs text-[#EAF3FF] uppercase font-bold tracking-wider">
              Primary Client Identifier: Phone Number • Real-Time M-Pesa STK
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-xs font-bold">
          <a href="/admin" className="px-4 py-2 rounded-xl bg-white text-[#062B73] hover:bg-slate-100 transition-colors">
            Back to ERP
          </a>
        </div>
      </div>

      {/* ERROR ALERT */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* SPLIT SCREEN POS LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT 7 COLS: SERVICE CATALOG SEARCH & SELECTION */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3 shadow-sm">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search services e.g. Suit, Laundry Washing, Ironing..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-[#0B3FA8] text-xs font-semibold outline-none"
              />
            </div>

            <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider shrink-0 transition-colors ${
                    categoryFilter === cat
                      ? 'bg-[#0B3FA8] text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* SERVICES GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredServices.map((service) => {
              const qty = cart[service.id] || 0;
              return (
                <div
                  key={service.id}
                  onClick={() => updateQuantity(service.id, 1)}
                  className={`bg-white p-4 rounded-xl border text-left cursor-pointer transition-all ${
                    qty > 0 ? 'border-[#0B3FA8] ring-2 ring-[#0B3FA8]/10 bg-[#F4F8FF]' : 'border-slate-200 hover:border-[#0B3FA8]/40'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-[10px] font-bold text-[#0B3FA8] uppercase px-1.5 py-0.5 rounded bg-[#EAF3FF]">
                      {service.category}
                    </span>
                    <span className="font-black text-[#062B73] text-sm">
                      KSh {parseFloat(service.unit_price).toLocaleString()}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-800 text-sm">{service.name}</h3>
                  <span className="text-xs text-slate-400">/{service.unit_name}</span>

                  {qty > 0 && (
                    <div className="mt-2 text-xs font-extrabold text-[#0B3FA8] flex items-center justify-between">
                      <span>In Cart:</span>
                      <span className="px-2 py-0.5 rounded bg-[#0B3FA8] text-white">{qty}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT 5 COLS: REGISTER & CLIENT IDENTIFICATION */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-lg space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-[#062B73]">Current Order Register</h2>
            <span className="text-xs font-bold text-[#0B3FA8] px-2.5 py-1 rounded-full bg-[#EAF3FF]">
              {Object.keys(cart).length} Service(s)
            </span>
          </div>

          {/* ITEM LIST */}
          <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
            {Object.keys(cart).length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs">
                Click services on the left to add to order cart.
              </div>
            ) : (
              Object.entries(cart).map(([serviceId, qty]) => {
                const service = services.find((s) => s.id === parseInt(serviceId));
                if (!service) return null;
                const itemTotal = parseFloat(service.unit_price) * qty;

                return (
                  <div key={serviceId} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 text-xs border border-slate-100">
                    <div>
                      <div className="font-bold text-slate-800">{service.name}</div>
                      <div className="text-[11px] text-slate-500">KSh {parseFloat(service.unit_price).toLocaleString()} × {qty}</div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateQuantity(service.id, -1)}
                        className="w-6 h-6 rounded bg-slate-200 text-slate-700 font-bold flex items-center justify-center hover:bg-slate-300"
                      >
                        -
                      </button>
                      <span className="font-bold text-slate-800 w-4 text-center">{qty}</span>
                      <button
                        onClick={() => updateQuantity(service.id, 1)}
                        className="w-6 h-6 rounded bg-[#0B3FA8] text-white font-bold flex items-center justify-center hover:bg-[#062B73]"
                      >
                        +
                      </button>
                    </div>

                    <div className="font-black text-slate-900">
                      KSh {itemTotal.toLocaleString()}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* CLIENT IDENTIFICATION (PHONE NUMBER FIRST) */}
          <div className="space-y-3 pt-3 border-t border-slate-100 text-xs">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block font-extrabold text-[#062B73] uppercase tracking-wider">
                  Client Phone (07XX / 01XX) *
                </label>
                <span className="text-[10px] font-bold text-[#0B3FA8] bg-[#EAF3FF] px-1.5 py-0.5 rounded">
                  Primary ID
                </span>
              </div>
              <div className="relative">
                <Phone className="w-4 h-4 text-[#0B3FA8] absolute left-3 top-2.5" />
                <input
                  type="tel"
                  placeholder="07XXXXXXXX or 01XXXXXXXX"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border-2 border-[#0B3FA8]/30 focus:border-[#0B3FA8] outline-none font-bold text-sm"
                />
              </div>
            </div>

            {/* RETURNING OR NEW CUSTOMER BADGE */}
            {isLookupLoading && (
              <div className="text-xs text-[#0B3FA8] font-bold flex items-center space-x-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Searching customer history...</span>
              </div>
            )}

            {customerHistory && customerHistory.is_returning_customer && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-800 text-xs flex items-center space-x-1">
                    <Star className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
                    <span>Returning Client: {customerHistory.customer_name}</span>
                  </span>
                  <span className="text-[10px] font-black bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded">
                    {customerHistory.total_orders} Past Orders
                  </span>
                </div>
                <div className="text-[11px] text-emerald-700">
                  Total Spent: <strong>KSh {customerHistory.total_spent.toLocaleString()}</strong>
                </div>
              </div>
            )}

            {customerHistory && !customerHistory.is_returning_customer && customerPhone.length >= 9 && (
              <div className="p-2.5 rounded-xl bg-[#EAF3FF] border border-[#0B3FA8]/20 flex items-center space-x-2 text-xs text-[#062B73]">
                <Sparkles className="w-4 h-4 text-[#0B3FA8] shrink-0" />
                <div>
                  <span className="font-bold">New Client Profile</span>
                  <span className="block text-[11px]">Will be created automatically on checkout.</span>
                </div>
              </div>
            )}

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Client Name (Optional)
              </label>
              <input
                type="text"
                placeholder="Name (Optional)"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Payment Method
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('mpesa')}
                  className={`p-2.5 rounded-xl border font-bold text-xs flex items-center justify-center space-x-2 ${
                    paymentMethod === 'mpesa'
                      ? 'border-[#0B3FA8] bg-[#EAF3FF] text-[#0B3FA8] ring-2 ring-[#0B3FA8]/20'
                      : 'border-slate-200 text-slate-600'
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[9px] font-black">M</span>
                  <span>M-Pesa STK</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`p-2.5 rounded-xl border font-bold text-xs flex items-center justify-center space-x-2 ${
                    paymentMethod === 'cash'
                      ? 'border-[#0B3FA8] bg-[#EAF3FF] text-[#0B3FA8] ring-2 ring-[#0B3FA8]/20'
                      : 'border-slate-200 text-slate-600'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Cash Payment</span>
                </button>
              </div>
            </div>
          </div>

          {/* TOTAL & SUBMIT */}
          <div className="pt-3 border-t border-slate-100 space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600 font-bold">Subtotal Due:</span>
              <span className="text-2xl font-black text-[#0B3FA8]">
                KSh {subtotal.toLocaleString()}
              </span>
            </div>

            <button
              onClick={handlePOSCheckout}
              disabled={loading || subtotal === 0}
              className="w-full bg-[#0B3FA8] hover:bg-[#062B73] disabled:opacity-50 text-white py-3.5 rounded-xl font-extrabold text-sm flex items-center justify-center space-x-2 shadow-lg"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Receipt className="w-5 h-5" />
                  <span>{paymentMethod === 'mpesa' ? 'TRIGGER M-PESA STK PUSH' : 'COMPLETE CASH SALE'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* STK PUSH PROMPT MODAL */}
      {stkState === 'awaiting_pin' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center space-y-6 shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-[#EAF3FF] text-[#0B3FA8] flex items-center justify-center mx-auto animate-pulse">
              <Phone className="w-8 h-8 animate-bounce text-[#0B3FA8]" />
            </div>

            <div>
              <h3 className="text-xl font-black text-[#062B73]">M-Pesa STK Prompt Sent</h3>
              <p className="text-xs text-slate-600 font-medium mt-1">
                Prompt sent to client's phone <span className="font-bold text-slate-900">{customerPhone}</span>.
              </p>
            </div>

            <button
              onClick={handleSimulateSandboxPin}
              className="text-xs font-bold text-[#0B3FA8] bg-[#EAF3FF] hover:bg-[#0B3FA8] hover:text-white px-4 py-2 rounded-lg transition-colors w-full"
            >
              [Sandbox Test: Simulate M-Pesa PIN Entry]
            </button>
          </div>
        </div>
      )}

      {/* POS RECEIPT MODAL */}
      {showReceiptModal && createdOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                <span className="font-extrabold text-[#062B73] text-base">Sale Completed & Receipt</span>
              </div>
              <button onClick={resetPOSForm} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 font-mono text-xs space-y-3 text-slate-800">
              <div className="text-center pb-3 border-b border-dashed border-slate-300">
                <div className="font-black text-sm text-[#062B73]">NYOTA DRY CLEANERS</div>
                <div className="text-[10px] text-slate-500">Fresh. Clean. Perfect.</div>
                <div className="text-[10px] text-slate-500">Receipt #{createdOrder.order_number}</div>
                <div className="text-[10px] text-slate-400">{new Date().toLocaleString()}</div>
              </div>

              <div className="space-y-1 py-2 border-b border-dashed border-slate-300">
                <div>Client Phone: {createdOrder.customer_phone}</div>
                {createdOrder.customer_name && <div>Client Name: {createdOrder.customer_name}</div>}
                {paymentObj?.mpesa_receipt_number && (
                  <div className="font-bold text-emerald-700">M-Pesa Ref: {paymentObj.mpesa_receipt_number}</div>
                )}
              </div>

              <div className="space-y-1.5 py-2 border-b border-dashed border-slate-300">
                {createdOrder.items?.map((item) => (
                  <div key={item.id} className="flex justify-between">
                    <span>{item.quantity}× {item.service_name}</span>
                    <span>{parseFloat(item.subtotal).toLocaleString()}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2 space-y-1 font-bold">
                <div className="flex justify-between text-sm">
                  <span>TOTAL:</span>
                  <span>KSh {parseFloat(createdOrder.total_amount).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-between space-x-3">
              <button onClick={() => window.print()} className="flex-1 bg-slate-800 text-white py-2.5 rounded-xl font-bold text-xs flex items-center justify-center space-x-2">
                <Printer className="w-4 h-4" />
                <span>Print POS Receipt</span>
              </button>
              <button onClick={resetPOSForm} className="flex-1 bg-[#0B3FA8] text-white py-2.5 rounded-xl font-bold text-xs">
                New Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
