import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  ShoppingBag, 
  Truck, 
  CreditCard, 
  Phone, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ShieldCheck, 
  ArrowRight, 
  ArrowLeft,
  RefreshCw,
  User,
  History,
  Star
} from 'lucide-react';

export default function BookingApp() {
  const [step, setStep] = useState(1);
  const [services, setServices] = useState([]);
  const [config, setConfig] = useState({
    payment_mode_required: 'FULL_PAYMENT',
    deposit_percentage: 30,
    business_name: 'Nyota Dry Cleaners',
    business_slogan: 'Fresh. Clean. Perfect.',
  });
  const [cart, setCart] = useState({});
  const [customer, setCustomer] = useState({
    customer_phone: '',
    customer_name: '',
    delivery_option: 'drop_off',
    pickup_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    notes: '',
  });

  // Returning Customer History State
  const [customerHistory, setCustomerHistory] = useState(null);
  const [isLookupLoading, setIsLookupLoading] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState('mpesa');
  const [payAmountType, setPayAmountType] = useState('full');
  const [createdOrder, setCreatedOrder] = useState(null);
  const [paymentObj, setPaymentObj] = useState(null);
  
  // Loading & STK status states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [stkState, setStkState] = useState('idle');
  const [stkMessage, setStkMessage] = useState('');
  const [checkoutRequestId, setCheckoutRequestId] = useState(null);

  useEffect(() => {
    fetch('/api/v1/services')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setServices(data.services || []);
          if (data.config) {
            setConfig(data.config);
          }
        }
      })
      .catch((err) => console.error(err));
  }, []);

  // Auto-Lookup Customer History when phone number reaches 9+ digits
  useEffect(() => {
    const cleaned = customer.customer_phone.replace(/[^0-9]/g, '');
    if (cleaned.length >= 9) {
      setIsLookupLoading(true);
      fetch(`/api/v1/customers/history?phone=${cleaned}`)
        .then((res) => res.json())
        .then((data) => {
          setIsLookupLoading(false);
          if (data.success && data.is_returning_customer) {
            setCustomerHistory(data);
            if (data.customer_name && !customer.customer_name) {
              setCustomer((prev) => ({ ...prev, customer_name: data.customer_name }));
            }
          } else {
            setCustomerHistory(null);
          }
        })
        .catch(() => setIsLookupLoading(false));
    } else {
      setCustomerHistory(null);
    }
  }, [customer.customer_phone]);

  // STK Status Poll
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
                clearInterval(intervalId);
              } else if (data.payment.status === 'FAILED') {
                setStkState('failed');
                setStkMessage(data.payment.result_description || 'Payment was cancelled or failed.');
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
  const requiredDeposit = Math.round((subtotal * (config.deposit_percentage || 30)) / 100);

  const getChargeAmount = () => {
    if (config.payment_mode_required === 'DEPOSIT' && payAmountType === 'deposit') {
      return requiredDeposit;
    }
    return subtotal;
  };

  const handleProceedToPayment = () => {
    if (!customer.customer_phone.trim()) {
      setErrorMsg('Please enter customer phone number.');
      return;
    }
    setErrorMsg('');
    setStep(3);
  };

  const handleCreateOrderAndPay = async () => {
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
          customer_phone: customer.customer_phone,
          customer_name: customer.customer_name || null,
          delivery_option: customer.delivery_option,
          pickup_date: customer.pickup_date || null,
          notes: customer.notes || null,
          items: itemsPayload,
        }),
      });

      const orderData = await orderRes.json();
      if (!orderData.success) {
        throw new Error(orderData.message || 'Failed to create order');
      }

      const order = orderData.order;
      setCreatedOrder(order);

      if (paymentMethod === 'cash' || config.payment_mode_required === 'PAY_AFTER_SERVICE') {
        fetch('/api/v1/payments/mpesa/stk-push', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            order_id: order.id,
            phone_number: customer.customer_phone,
            amount: 0,
          }),
        }).catch(() => null);

        setStep(5);
        setLoading(false);
        return;
      }

      setStkState('initiating');
      const amountToCharge = getChargeAmount();

      const stkRes = await fetch('/api/v1/payments/mpesa/stk-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: order.id,
          phone_number: customer.customer_phone,
          amount: amountToCharge,
        }),
      });

      const stkData = await stkRes.json();
      setLoading(false);

      if (stkData.success) {
        setCheckoutRequestId(stkData.checkout_request_id);
        setStkState('awaiting_pin');
        setStkMessage('Check your phone for the M-Pesa payment prompt.');
        setPaymentObj(stkData.payment);
        setStep(4);
      } else {
        setStkState('failed');
        setErrorMsg(stkData.message || 'Failed to trigger M-Pesa prompt.');
      }
    } catch (err) {
      setLoading(false);
      setStkState('failed');
      setErrorMsg(err.message || 'An error occurred.');
    }
  };

  const handleSimulateSandboxSuccess = () => {
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
        }
      });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* BRAND HEADER */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center space-x-3 mb-2">
          <div className="w-12 h-12 rounded-xl bg-[#0B3FA8] text-white flex items-center justify-center shadow-lg shadow-[#0B3FA8]/20">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-[#062B73] tracking-tight">
            {config.business_name}
          </h1>
        </div>
        <p className="text-sm font-semibold text-[#0B3FA8] uppercase tracking-wider">
          "{config.business_slogan}"
        </p>
      </div>

      {/* STEP PROGRESS BAR */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#0B3FA8]/10 mb-8">
        <div className="flex items-center justify-between max-w-2xl mx-auto text-xs font-medium text-slate-500">
          <div className={`flex items-center space-x-2 ${step >= 1 ? 'text-[#0B3FA8] font-bold' : ''}`}>
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${step >= 1 ? 'bg-[#0B3FA8] text-white' : 'bg-slate-100'}`}>1</span>
            <span className="hidden sm:inline">Select Services</span>
          </div>
          <div className="h-0.5 flex-1 bg-slate-200 mx-3">
            <div className="h-full bg-[#0B3FA8] transition-all" style={{ width: step >= 2 ? '100%' : '0%' }}></div>
          </div>
          <div className={`flex items-center space-x-2 ${step >= 2 ? 'text-[#0B3FA8] font-bold' : ''}`}>
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${step >= 2 ? 'bg-[#0B3FA8] text-white' : 'bg-slate-100'}`}>2</span>
            <span className="hidden sm:inline">Phone & Details</span>
          </div>
          <div className="h-0.5 flex-1 bg-slate-200 mx-3">
            <div className="h-full bg-[#0B3FA8] transition-all" style={{ width: step >= 3 ? '100%' : '0%' }}></div>
          </div>
          <div className={`flex items-center space-x-2 ${step >= 3 ? 'text-[#0B3FA8] font-bold' : ''}`}>
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${step >= 3 ? 'bg-[#0B3FA8] text-white' : 'bg-slate-100'}`}>3</span>
            <span className="hidden sm:inline">Payment</span>
          </div>
        </div>
      </div>

      {/* ERROR ALERT */}
      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* STEP 1: SELECT SERVICES */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#062B73]">Choose Dry Cleaning & Laundry Services</h2>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#EAF3FF] text-[#0B3FA8]">
              {Object.keys(cart).length} Item(s) Selected
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {services.map((service) => {
              const qty = cart[service.id] || 0;
              return (
                <div
                  key={service.id}
                  className={`bg-white rounded-2xl p-5 border transition-all ${
                    qty > 0 ? 'border-[#0B3FA8] ring-2 ring-[#0B3FA8]/10 shadow-md' : 'border-slate-200 hover:border-[#0B3FA8]/30'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="inline-block text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#EAF3FF] text-[#0B3FA8] mb-1">
                        {service.category}
                      </span>
                      <h3 className="font-bold text-slate-800 text-base">{service.name}</h3>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-extrabold text-[#0B3FA8]">
                        KSh {parseFloat(service.unit_price).toLocaleString()}
                      </span>
                      <span className="block text-xs text-slate-400">/{service.unit_name}</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mb-4 line-clamp-2">{service.description}</p>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <span className="text-xs font-medium text-slate-600">Quantity</span>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => updateQuantity(service.id, -1)}
                        disabled={qty === 0}
                        className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-30 font-bold text-lg flex items-center justify-center"
                      >
                        -
                      </button>
                      <span className="w-6 text-center font-bold text-slate-800">{qty}</span>
                      <button
                        onClick={() => updateQuantity(service.id, 1)}
                        className="w-8 h-8 rounded-lg bg-[#0B3FA8] text-white hover:bg-[#062B73] font-bold text-lg flex items-center justify-center shadow-sm"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {subtotal > 0 && (
            <div className="sticky bottom-4 bg-white/95 backdrop-blur-md border border-[#0B3FA8]/20 p-5 rounded-2xl shadow-xl flex items-center justify-between mt-8">
              <div>
                <span className="text-xs text-slate-500 font-medium">Total Estimate</span>
                <div className="text-2xl font-black text-[#0B3FA8]">
                  KSh {subtotal.toLocaleString()}
                </div>
              </div>
              <button
                onClick={() => setStep(2)}
                className="bg-[#0B3FA8] hover:bg-[#062B73] text-white px-6 py-3 rounded-xl font-bold flex items-center space-x-2 transition-colors shadow-lg shadow-[#0B3FA8]/25"
              >
                <span>Continue to Details</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* STEP 2: PHONE NUMBER PRIMARY CLIENT IDENTIFIER */}
      {step === 2 && (
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-xl font-bold text-[#062B73]">Client Phone Number</h2>
              <p className="text-xs text-slate-500">Phone number is your primary account identifier and tracks your cleaning history.</p>
            </div>
            <button
              onClick={() => setStep(1)}
              className="text-xs font-semibold text-[#0B3FA8] hover:underline flex items-center space-x-1"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Services</span>
            </button>
          </div>

          <div className="space-y-6">
            {/* PRIMARY FIELD: PHONE NUMBER */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-extrabold text-[#062B73] uppercase tracking-wider">
                  Phone Number (Kenyan Market: 07XX or 01XX) *
                </label>
                <span className="text-[10px] font-bold text-[#0B3FA8] bg-[#EAF3FF] px-2 py-0.5 rounded">
                  Primary Customer ID
                </span>
              </div>
              <div className="relative">
                <Phone className="w-5 h-5 text-[#0B3FA8] absolute left-3.5 top-3.5" />
                <input
                  type="tel"
                  placeholder="07XXXXXXXX or 01XXXXXXXX"
                  value={customer.customer_phone}
                  onChange={(e) => setCustomer({ ...customer, customer_phone: e.target.value })}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-[#0B3FA8]/30 focus:border-[#0B3FA8] outline-none text-base font-bold text-[#062B73]"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Enter your mobile number (07... or 01...). New numbers will automatically create a new customer profile.
              </p>
            </div>

            {/* RETURNING OR NEW CUSTOMER BADGE */}
            {isLookupLoading && (
              <div className="text-xs text-[#0B3FA8] font-bold flex items-center space-x-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Checking customer history...</span>
              </div>
            )}

            {customerHistory && customerHistory.is_returning_customer && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-emerald-800 font-bold text-xs">
                    <Star className="w-4 h-4 text-emerald-600 fill-emerald-600" />
                    <span>Welcome Back! Returning Customer: {customerHistory.customer_name}</span>
                  </div>
                  <span className="text-[10px] font-black bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded">
                    {customerHistory.total_orders} Previous Orders
                  </span>
                </div>
                <div className="text-xs text-emerald-700">
                  Total Spent: <strong>KSh {customerHistory.total_spent.toLocaleString()}</strong>
                </div>
              </div>
            )}

            {customerHistory && !customerHistory.is_returning_customer && customer.customer_phone.length >= 9 && (
              <div className="p-3.5 rounded-xl bg-[#EAF3FF] border border-[#0B3FA8]/20 flex items-center space-x-3 text-xs text-[#062B73]">
                <Sparkles className="w-4 h-4 text-[#0B3FA8] shrink-0" />
                <div>
                  <span className="font-bold block">New Customer Profile</span>
                  <span>This phone number is new. A new customer record will be created automatically upon checkout.</span>
                </div>
              </div>
            )}

            {/* OPTIONAL FIELD: NAME */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Client Name (Optional)
              </label>
              <div className="relative">
                <User className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="e.g. Jane (Optional)"
                  value={customer.customer_name}
                  onChange={(e) => setCustomer({ ...customer, customer_name: e.target.value })}
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-[#0B3FA8] outline-none text-sm"
                />
              </div>
            </div>

            {/* FULFILLMENT OPTION */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Fulfillment Type
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setCustomer({ ...customer, delivery_option: 'drop_off' })}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    customer.delivery_option === 'drop_off'
                      ? 'border-[#0B3FA8] bg-[#EAF3FF] ring-2 ring-[#0B3FA8]/20'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <ShoppingBag className="w-5 h-5 text-[#0B3FA8] mb-1" />
                  <div className="font-bold text-sm text-[#062B73]">Store Drop-off & Collection</div>
                  <div className="text-xs text-slate-500">Drop off and collect garments at store.</div>
                </button>

                <button
                  type="button"
                  onClick={() => setCustomer({ ...customer, delivery_option: 'pickup_delivery' })}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    customer.delivery_option === 'pickup_delivery'
                      ? 'border-[#0B3FA8] bg-[#EAF3FF] ring-2 ring-[#0B3FA8]/20'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <Truck className="w-5 h-5 text-[#0B3FA8] mb-1" />
                  <div className="font-bold text-sm text-[#062B73]">Home Pickup & Delivery</div>
                  <div className="text-xs text-slate-500">Valet collects and returns garments.</div>
                </button>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              onClick={handleProceedToPayment}
              className="bg-[#0B3FA8] hover:bg-[#062B73] text-white px-8 py-3 rounded-xl font-bold flex items-center space-x-2 transition-colors shadow-lg shadow-[#0B3FA8]/25"
            >
              <span>Proceed to Payment</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: PAYMENT SELECTION */}
      {step === 3 && (
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="text-xl font-bold text-[#062B73]">Select Payment Method</h2>
            <button
              onClick={() => setStep(2)}
              className="text-xs font-semibold text-[#0B3FA8] hover:underline flex items-center space-x-1"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Phone & Details</span>
            </button>
          </div>

          <div className="bg-[#F4F8FF] rounded-xl p-5 border border-[#0B3FA8]/15 space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600 font-medium">Order Total:</span>
              <span className="font-extrabold text-[#062B73] text-lg">KSh {subtotal.toLocaleString()}</span>
            </div>
            <div className="text-xs text-slate-500 font-medium">
              Client Phone: <strong className="text-slate-800">{customer.customer_phone}</strong>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setPaymentMethod('mpesa')}
                className={`p-5 rounded-2xl border text-left transition-all flex items-start space-x-4 ${
                  paymentMethod === 'mpesa'
                    ? 'border-[#0B3FA8] bg-[#EAF3FF] ring-2 ring-[#0B3FA8]/20 shadow-md'
                    : 'border-slate-200'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-black flex items-center justify-center shrink-0">
                  M
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-base">M-Pesa STK Push</div>
                  <div className="text-xs text-slate-500">Pay directly from phone prompt. Instant receipt.</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`p-5 rounded-2xl border text-left transition-all flex items-start space-x-4 ${
                  paymentMethod === 'cash'
                    ? 'border-[#0B3FA8] bg-[#EAF3FF] ring-2 ring-[#0B3FA8]/20 shadow-md'
                    : 'border-slate-200'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-slate-700 text-white font-black flex items-center justify-center shrink-0">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-base">Cash on Collection</div>
                  <div className="text-xs text-slate-500">Pay cash upon delivery/collection.</div>
                </div>
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
            <div className="text-[#0B3FA8] font-bold text-lg">
              Amount to Pay: KSh {subtotal.toLocaleString()}
            </div>

            <button
              onClick={handleCreateOrderAndPay}
              disabled={loading}
              className="bg-[#0B3FA8] hover:bg-[#062B73] disabled:opacity-50 text-white px-8 py-3.5 rounded-xl font-bold flex items-center space-x-2 shadow-lg"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5" />
                  <span>{paymentMethod === 'mpesa' ? 'PAY WITH M-PESA' : 'CONFIRM ORDER'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: STK PUSH PROMPT POLLING */}
      {step === 4 && (
        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-xl text-center space-y-6 max-w-lg mx-auto">
          {stkState === 'awaiting_pin' && (
            <div className="space-y-6 py-4">
              <div className="w-20 h-20 rounded-full bg-[#EAF3FF] text-[#0B3FA8] flex items-center justify-center mx-auto animate-pulse">
                <Phone className="w-10 h-10 animate-bounce text-[#0B3FA8]" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-[#062B73] mb-2">Check Your Phone</h3>
                <p className="text-sm font-semibold text-slate-700">{stkMessage}</p>
                <p className="text-xs text-slate-500 mt-2">
                  Enter your M-Pesa PIN on phone number <span className="font-bold text-slate-800">{customer.customer_phone}</span>.
                </p>
              </div>

              <div className="flex items-center justify-center space-x-2 text-xs text-slate-400">
                <RefreshCw className="w-4 h-4 animate-spin text-[#0B3FA8]" />
                <span>Waiting for M-Pesa PIN confirmation...</span>
              </div>

              <button
                onClick={handleSimulateSandboxSuccess}
                className="text-xs font-bold text-[#0B3FA8] bg-[#EAF3FF] hover:bg-[#0B3FA8] hover:text-white px-4 py-2 rounded-lg transition-colors"
              >
                [Sandbox Test: Simulate PIN Entry]
              </button>
            </div>
          )}

          {stkState === 'success' && (
            <div className="space-y-6 py-4">
              <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <h3 className="text-2xl font-black text-slate-900">Payment Confirmed!</h3>
              <p className="text-sm text-slate-600">
                M-Pesa Receipt: <span className="font-bold text-slate-900">{paymentObj?.mpesa_receipt_number || 'Confirmed'}</span>
              </p>
              <button onClick={() => setStep(5)} className="bg-[#0B3FA8] text-white px-8 py-3 rounded-xl font-bold shadow-lg">
                View Receipt
              </button>
            </div>
          )}

          {stkState === 'failed' && (
            <div className="space-y-6 py-4">
              <div className="w-20 h-20 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                <AlertCircle className="w-12 h-12" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Payment Unsuccessful</h3>
              <p className="text-xs text-red-600">{errorMsg}</p>
              <button onClick={() => setStep(3)} className="bg-[#0B3FA8] text-white px-6 py-2.5 rounded-xl font-bold">
                Try Again
              </button>
            </div>
          )}
        </div>
      )}

      {/* STEP 5: FINAL ORDER RECEIPT */}
      {step === 5 && createdOrder && (
        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-lg space-y-6 max-w-xl mx-auto">
          <div className="text-center pb-4 border-b border-slate-100">
            <div className="w-14 h-14 rounded-full bg-[#EAF3FF] text-[#0B3FA8] flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-[#062B73]">Order Confirmed!</h2>
            <p className="text-xs font-bold text-[#0B3FA8] uppercase tracking-wider mt-1">
              Order #{createdOrder.order_number}
            </p>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Client Phone:</span>
              <span className="font-bold text-slate-800">{createdOrder.customer_phone}</span>
            </div>
            {createdOrder.customer_name && (
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Client Name:</span>
                <span className="font-bold text-slate-800">{createdOrder.customer_name}</span>
              </div>
            )}
            {paymentObj?.mpesa_receipt_number && (
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">M-Pesa Receipt:</span>
                <span className="font-bold text-emerald-600">{paymentObj.mpesa_receipt_number}</span>
              </div>
            )}
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Total Order Amount:</span>
              <span className="font-bold text-slate-800">KSh {parseFloat(createdOrder.total_amount).toLocaleString()}</span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-between">
            <button onClick={() => window.print()} className="text-xs font-bold text-slate-600 border border-slate-300 px-4 py-2.5 rounded-xl">
              Print Receipt
            </button>
            <button
              onClick={() => {
                setStep(1);
                setCart({});
                setCreatedOrder(null);
              }}
              className="bg-[#0B3FA8] text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow"
            >
              New Order
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
