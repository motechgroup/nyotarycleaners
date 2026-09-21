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
  MapPin,
  Calendar,
  User,
  Mail,
  FileText
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
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    delivery_option: 'pickup_delivery',
    delivery_address: '',
    pickup_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    notes: '',
  });

  const [paymentMethod, setPaymentMethod] = useState('mpesa');
  const [payAmountType, setPayAmountType] = useState('full'); // 'full' or 'deposit'
  const [mpesaPhone, setMpesaPhone] = useState('');
  const [createdOrder, setCreatedOrder] = useState(null);
  const [paymentObj, setPaymentObj] = useState(null);
  
  // Loading & STK status states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [stkState, setStkState] = useState('idle'); // 'idle' | 'initiating' | 'awaiting_pin' | 'success' | 'failed'
  const [stkMessage, setStkMessage] = useState('');
  const [checkoutRequestId, setCheckoutRequestId] = useState(null);

  // Fetch Services & Config on load
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
      .catch((err) => console.error('Error fetching services:', err));
  }, []);

  // Poll payment status if awaiting STK prompt
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
          .catch((err) => console.error('Status poll error:', err));
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

  // Step 2 Validation
  const handleProceedToPayment = () => {
    if (!customer.customer_name.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (!customer.customer_phone.trim()) {
      setErrorMsg('Please enter your phone number.');
      return;
    }
    setErrorMsg('');
    setMpesaPhone(customer.customer_phone);
    setStep(3);
  };

  // Submit Order Creation
  const handleCreateOrderAndPay = async () => {
    setErrorMsg('');
    setLoading(true);

    try {
      // 1. Create order
      const itemsPayload = Object.entries(cart).map(([serviceId, qty]) => ({
        service_id: parseInt(serviceId),
        quantity: qty,
      }));

      const orderRes = await fetch('/api/v1/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: customer.customer_name,
          customer_email: customer.customer_email || null,
          customer_phone: customer.customer_phone,
          delivery_option: customer.delivery_option,
          delivery_address: customer.delivery_address || null,
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

      // If Cash or Pay After Service
      if (paymentMethod === 'cash' || config.payment_mode_required === 'PAY_AFTER_SERVICE') {
        const cashRes = await fetch('/api/v1/payments/mpesa/stk-push', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            order_id: order.id,
            phone_number: mpesaPhone,
            amount: 0,
          }),
        }).catch(() => null);

        setStep(5);
        setLoading(false);
        return;
      }

      // 2. Initiate M-Pesa STK Push
      setStkState('initiating');
      const amountToCharge = getChargeAmount();

      const stkRes = await fetch('/api/v1/payments/mpesa/stk-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: order.id,
          phone_number: mpesaPhone,
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
        setErrorMsg(stkData.message || 'Failed to trigger M-Pesa payment prompt.');
      }
    } catch (err) {
      setLoading(false);
      setStkState('failed');
      setErrorMsg(err.message || 'An unexpected error occurred.');
    }
  };

  // Sandbox simulation helper
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
      })
      .catch((err) => {
        setLoading(false);
        console.error(err);
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
            <span className="hidden sm:inline">Details</span>
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
                        className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed font-bold text-lg flex items-center justify-center"
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

          {/* CART SUMMARY BAR */}
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

      {/* STEP 2: CUSTOMER & DELIVERY DETAILS */}
      {step === 2 && (
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="text-xl font-bold text-[#062B73]">Pickup & Customer Details</h2>
            <button
              onClick={() => setStep(1)}
              className="text-xs font-semibold text-[#0B3FA8] hover:underline flex items-center space-x-1"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Services</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Full Name *
              </label>
              <div className="relative">
                <User className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="e.g. Jane Doe"
                  value={customer.customer_name}
                  onChange={(e) => setCustomer({ ...customer, customer_name: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-[#0B3FA8] focus:ring-2 focus:ring-[#0B3FA8]/20 outline-none text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Phone Number (for M-Pesa STK Push) *
              </label>
              <div className="relative">
                <Phone className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="tel"
                  placeholder="07XXXXXXXX or 2547XXXXXXXX"
                  value={customer.customer_phone}
                  onChange={(e) => setCustomer({ ...customer, customer_phone: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-[#0B3FA8] focus:ring-2 focus:ring-[#0B3FA8]/20 outline-none text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Email Address (Optional)
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  placeholder="jane@example.com"
                  value={customer.customer_email}
                  onChange={(e) => setCustomer({ ...customer, customer_email: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-[#0B3FA8] focus:ring-2 focus:ring-[#0B3FA8]/20 outline-none text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Preferred Pickup Date
              </label>
              <div className="relative">
                <Calendar className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="date"
                  value={customer.pickup_date}
                  onChange={(e) => setCustomer({ ...customer, pickup_date: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-[#0B3FA8] focus:ring-2 focus:ring-[#0B3FA8]/20 outline-none text-sm"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Service Delivery Option
              </label>
              <div className="grid grid-cols-2 gap-4">
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
                  <div className="font-bold text-sm text-[#062B73]">Home Doorstep Pickup & Delivery</div>
                  <div className="text-xs text-slate-500">We pick up and return your clean clothes.</div>
                </button>

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
                  <div className="font-bold text-sm text-[#062B73]">Store Drop-Off</div>
                  <div className="text-xs text-slate-500">You drop off and collect at our store.</div>
                </button>
              </div>
            </div>

            {customer.delivery_option === 'pickup_delivery' && (
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Pickup & Delivery Physical Address
                </label>
                <div className="relative">
                  <MapPin className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
                  <textarea
                    rows="2"
                    placeholder="Estate, House/Apartment No., Street / Landmark in Nairobi"
                    value={customer.delivery_address}
                    onChange={(e) => setCustomer({ ...customer, delivery_address: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-[#0B3FA8] focus:ring-2 focus:ring-[#0B3FA8]/20 outline-none text-sm"
                  ></textarea>
                </div>
              </div>
            )}
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
              <span>Back to Details</span>
            </button>
          </div>

          {/* ORDER SUMMARY PREVIEW */}
          <div className="bg-[#F4F8FF] rounded-xl p-5 border border-[#0B3FA8]/15 space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600 font-medium">Order Total:</span>
              <span className="font-extrabold text-[#062B73] text-lg">KSh {subtotal.toLocaleString()}</span>
            </div>

            {config.payment_mode_required === 'DEPOSIT' && (
              <div className="pt-2 border-t border-[#0B3FA8]/10 flex justify-between items-center text-xs">
                <span className="text-slate-600 font-medium">Required Deposit ({config.deposit_percentage}%):</span>
                <span className="font-bold text-[#0B3FA8] text-sm">KSh {requiredDeposit.toLocaleString()}</span>
              </div>
            )}
          </div>

          {/* PAYMENT OPTION CHOICES */}
          <div className="space-y-4">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Payment Gateway
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setPaymentMethod('mpesa')}
                className={`p-5 rounded-2xl border text-left transition-all flex items-start space-x-4 ${
                  paymentMethod === 'mpesa'
                    ? 'border-[#0B3FA8] bg-[#EAF3FF] ring-2 ring-[#0B3FA8]/20 shadow-md'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-black flex items-center justify-center shrink-0">
                  M
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-base">M-Pesa STK Push</div>
                  <div className="text-xs text-slate-500">Pay directly from your phone prompt. Instant receipt.</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`p-5 rounded-2xl border text-left transition-all flex items-start space-x-4 ${
                  paymentMethod === 'cash'
                    ? 'border-[#0B3FA8] bg-[#EAF3FF] ring-2 ring-[#0B3FA8]/20 shadow-md'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-slate-700 text-white font-black flex items-center justify-center shrink-0">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-base">Cash on Pickup / Delivery</div>
                  <div className="text-xs text-slate-500">Pay cash directly when our rider arrives.</div>
                </div>
              </button>
            </div>

            {/* M-PESA SPECIFIC PHONE FORM */}
            {paymentMethod === 'mpesa' && (
              <div className="mt-6 p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    M-Pesa Phone Number
                  </label>
                  <input
                    type="tel"
                    value={mpesaPhone}
                    onChange={(e) => setMpesaPhone(e.target.value)}
                    placeholder="07XXXXXXXX"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-[#0B3FA8] outline-none text-base font-bold tracking-wide"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    An M-Pesa STK payment prompt will be sent immediately to this number.
                  </p>
                </div>

                {config.payment_mode_required === 'DEPOSIT' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Payment Amount Choice
                    </label>
                    <div className="flex space-x-4">
                      <label className="flex items-center space-x-2 text-xs font-bold cursor-pointer">
                        <input
                          type="radio"
                          name="payAmount"
                          checked={payAmountType === 'full'}
                          onChange={() => setPayAmountType('full')}
                          className="accent-[#0B3FA8]"
                        />
                        <span>Pay Full Order (KSh {subtotal.toLocaleString()})</span>
                      </label>
                      <label className="flex items-center space-x-2 text-xs font-bold cursor-pointer">
                        <input
                          type="radio"
                          name="payAmount"
                          checked={payAmountType === 'deposit'}
                          onChange={() => setPayAmountType('deposit')}
                          className="accent-[#0B3FA8]"
                        />
                        <span>Pay Required Deposit (KSh {requiredDeposit.toLocaleString()})</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
            <div className="text-[#0B3FA8] font-bold text-lg">
              Amount to Pay: KSh {paymentMethod === 'mpesa' ? getChargeAmount().toLocaleString() : subtotal.toLocaleString()}
            </div>

            <button
              onClick={handleCreateOrderAndPay}
              disabled={loading}
              className="bg-[#0B3FA8] hover:bg-[#062B73] disabled:opacity-50 text-white px-8 py-3.5 rounded-xl font-bold flex items-center space-x-2 shadow-lg shadow-[#0B3FA8]/25"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Processing Order...</span>
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

      {/* STEP 4: STK PUSH PROMPT POLLING MODAL */}
      {step === 4 && (
        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-xl text-center space-y-6 max-w-lg mx-auto">
          {stkState === 'awaiting_pin' && (
            <div className="space-y-6 py-4">
              <div className="w-20 h-20 rounded-full bg-[#EAF3FF] text-[#0B3FA8] flex items-center justify-center mx-auto animate-pulse-glow">
                <Phone className="w-10 h-10 animate-bounce text-[#0B3FA8]" />
              </div>

              <div>
                <h3 className="text-2xl font-black text-[#062B73] mb-2">Check Your Phone</h3>
                <p className="text-sm font-semibold text-slate-700">
                  {stkMessage || 'Check your phone for the M-Pesa payment prompt.'}
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  Enter your M-Pesa PIN on handset number <span className="font-bold text-slate-800">{mpesaPhone}</span> to complete payment.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
                <span>Amount Requested:</span>
                <span className="font-black text-[#0B3FA8] text-sm">KSh {getChargeAmount().toLocaleString()}</span>
              </div>

              <div className="flex items-center justify-center space-x-2 text-xs text-slate-400">
                <RefreshCw className="w-4 h-4 animate-spin text-[#0B3FA8]" />
                <span>Waiting for Safaricom confirmation callback...</span>
              </div>

              {/* SANDBOX DEV QUICK TEST BUTTON */}
              <div className="pt-4 border-t border-slate-100">
                <button
                  onClick={handleSimulateSandboxSuccess}
                  className="text-xs font-bold text-[#0B3FA8] bg-[#EAF3FF] hover:bg-[#0B3FA8] hover:text-white px-4 py-2 rounded-lg transition-colors"
                >
                  [Sandbox Development Test: Simulate M-Pesa PIN Entry]
                </button>
              </div>
            </div>
          )}

          {stkState === 'success' && (
            <div className="space-y-6 py-4">
              <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <h3 className="text-2xl font-black text-slate-900">Payment Confirmed!</h3>
              <p className="text-sm text-slate-600">
                M-Pesa Receipt Number:{' '}
                <span className="font-bold text-slate-900">{paymentObj?.mpesa_receipt_number || 'Confirmed'}</span>
              </p>
              <button
                onClick={() => setStep(5)}
                className="bg-[#0B3FA8] text-white px-8 py-3 rounded-xl font-bold shadow-lg"
              >
                View Order Receipt
              </button>
            </div>
          )}

          {stkState === 'failed' && (
            <div className="space-y-6 py-4">
              <div className="w-20 h-20 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                <AlertCircle className="w-12 h-12" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Payment Unsuccessful</h3>
              <p className="text-xs text-red-600">{errorMsg || stkMessage}</p>
              <button
                onClick={() => setStep(3)}
                className="bg-[#0B3FA8] text-white px-6 py-2.5 rounded-xl font-bold"
              >
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
            <h2 className="text-2xl font-black text-[#062B73]">Order Received!</h2>
            <p className="text-xs font-bold text-[#0B3FA8] uppercase tracking-wider mt-1">
              Order #{createdOrder.order_number}
            </p>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Customer:</span>
              <span className="font-bold text-slate-800">{createdOrder.customer_name}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Phone:</span>
              <span className="font-bold text-slate-800">{createdOrder.customer_phone}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Delivery Method:</span>
              <span className="font-bold text-slate-800 uppercase text-xs px-2 py-0.5 rounded bg-slate-100">
                {createdOrder.delivery_option}
              </span>
            </div>
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
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Amount Paid:</span>
              <span className="font-bold text-emerald-600">KSh {parseFloat(createdOrder.paid_amount || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Outstanding Balance:</span>
              <span className="font-extrabold text-[#0B3FA8]">KSh {parseFloat(createdOrder.balance_amount || 0).toLocaleString()}</span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-between">
            <button
              onClick={() => window.print()}
              className="text-xs font-bold text-slate-600 border border-slate-300 px-4 py-2.5 rounded-xl hover:bg-slate-50"
            >
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
              Book Another Service
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
