<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Nyota Dry Cleaners — Fresh. Clean. Perfect.</title>

    <!-- Meta & SEO -->
    <meta name="description" content="Nyota Dry Cleaners - Kenya's premier dry cleaning & laundry service. M-Pesa instant payment, doorstep pickup & delivery in Nairobi. Fresh. Clean. Perfect.">

    @vite(['resources/css/app.css', 'resources/js/app.jsx'])
</head>
<body class="bg-[#F4F8FF] text-slate-800 antialiased selection:bg-[#0B3FA8] selection:text-white min-h-screen flex flex-col justify-between">

    <!-- TOP ANNOUNCEMENT BAR -->
    <div class="bg-[#062B73] text-white text-xs font-semibold py-2 px-4 text-center border-b border-[#0B3FA8]/30 flex items-center justify-center space-x-2">
        <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span>Open Today in Nairobi • Same-Day Express Service Available • M-Pesa STK Push Instant Checkout</span>
    </div>

    <!-- STYLISH GLASS NAVIGATION HEADER -->
    <header class="glass-header sticky top-0 z-50 transition-all">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
            <div class="flex items-center space-x-3">
                <div class="w-11 h-11 rounded-2xl bg-[#0B3FA8] text-white flex items-center justify-center font-black text-xl shadow-lg shadow-[#0B3FA8]/25">
                    N
                </div>
                <div>
                    <span class="text-xl font-black text-[#062B73] tracking-tight block leading-tight">
                        NYOTA <span class="text-[#0B3FA8]">DRY CLEANERS</span>
                    </span>
                    <span class="text-[10px] font-extrabold text-[#0B3FA8] uppercase tracking-widest block">
                        Fresh. Clean. Perfect.
                    </span>
                </div>
            </div>

            <nav class="flex items-center space-x-4">
                <a href="#services-booking" class="text-xs font-bold text-slate-700 hover:text-[#0B3FA8] transition-colors hidden sm:inline-block">
                    Services & Pricing
                </a>
                <a href="#how-it-works" class="text-xs font-bold text-slate-700 hover:text-[#0B3FA8] transition-colors hidden md:inline-block">
                    How It Works
                </a>
                <a 
                    href="https://wa.me/254708374149?text=Hello%20Nyota%20Dry%20Cleaners%2C%20I%20would%20like%20to%20book%20a%20laundry%20pickup." 
                    target="_blank" 
                    class="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-2.5 rounded-xl shadow-sm flex items-center space-x-1.5 transition-all"
                >
                    <span>WhatsApp Us</span>
                </a>
                <a 
                    href="/admin" 
                    class="text-xs font-bold text-[#0B3FA8] bg-[#EAF3FF] hover:bg-[#0B3FA8] hover:text-white px-4 py-2.5 rounded-xl border border-[#0B3FA8]/20 transition-all"
                >
                    Admin ERP
                </a>
            </nav>
        </div>
    </header>

    <!-- HERO SECTION -->
    <section class="hero-gradient py-12 lg:py-20 border-b border-[#0B3FA8]/10 overflow-hidden relative">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                
                <!-- LEFT HERO TEXT & CTAS -->
                <div class="lg:col-span-7 space-y-6">
                    <div class="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#EAF3FF] border border-[#0B3FA8]/20 text-[#0B3FA8] text-xs font-bold uppercase tracking-wider">
                        <span class="w-2 h-2 rounded-full bg-[#0B3FA8]"></span>
                        <span>Nairobi's Premier Garment & Dry Cleaning Care</span>
                    </div>

                    <h1 class="text-4xl sm:text-5xl lg:text-6xl font-black text-[#062B73] tracking-tight leading-[1.1]">
                        Clean Clothes.<br/>
                        <span class="text-[#0B3FA8] bg-clip-text text-transparent bg-gradient-to-r from-[#0B3FA8] to-[#062B73]">
                            Effortless Perfection.
                        </span>
                    </h1>

                    <p class="text-base sm:text-lg text-slate-600 font-medium leading-relaxed max-w-xl">
                        Experience immaculate garment care with Nyota Dry Cleaners. Book online in seconds, pay securely with <strong class="text-emerald-700">M-Pesa STK Push</strong>, and enjoy scheduled doorstep pickup & delivery.
                    </p>

                    <div class="flex flex-wrap items-center gap-4 pt-2">
                        <a 
                            href="#services-booking" 
                            class="bg-[#0B3FA8] hover:bg-[#062B73] text-white px-8 py-4 rounded-xl font-bold text-sm transition-all blue-glow flex items-center space-x-2"
                        >
                            <span>BOOK A SERVICE NOW</span>
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                        </a>
                        <a 
                            href="https://wa.me/254708374149?text=Hi%20Nyota%20Dry%20Cleaners" 
                            target="_blank"
                            class="bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 px-6 py-4 rounded-xl font-bold text-sm transition-all"
                        >
                            WHATSAPP US
                        </a>
                    </div>

                    <!-- TRUST STATS -->
                    <div class="grid grid-cols-3 gap-4 pt-8 border-t border-slate-200/80 max-w-lg">
                        <div>
                            <div class="text-2xl font-black text-[#062B73]">12,500+</div>
                            <div class="text-xs font-semibold text-slate-500">Garments Cleaned</div>
                        </div>
                        <div>
                            <div class="text-2xl font-black text-emerald-600">100%</div>
                            <div class="text-xs font-semibold text-slate-500">M-Pesa Instant Pay</div>
                        </div>
                        <div>
                            <div class="text-2xl font-black text-[#0B3FA8]">4.9 / 5.0</div>
                            <div class="text-xs font-semibold text-slate-500">Customer Rating</div>
                        </div>
                    </div>
                </div>

                <!-- RIGHT HERO IMAGE FRAME & OVERLAY BADGES -->
                <div class="lg:col-span-5 relative">
                    <div class="relative mx-auto max-w-md lg:max-w-none">
                        <!-- DECORATIVE GLOW BACKGROUND -->
                        <div class="absolute -inset-4 bg-gradient-to-r from-[#0B3FA8]/20 to-sky-300/30 rounded-3xl blur-2xl opacity-70"></div>
                        
                        <!-- MAIN HERO IMAGE -->
                        <div class="relative rounded-3xl overflow-hidden border-4 border-white shadow-2xl">
                            <img 
                                src="/images/nyota_hero.png" 
                                alt="Nyota Dry Cleaners Studio" 
                                class="w-full h-[460px] object-cover"
                            />
                        </div>

                        <!-- FLOATING BADGE 1: M-PESA STK PUSH -->
                        <div class="absolute -bottom-6 -left-6 glass-card p-4 rounded-2xl shadow-xl flex items-center space-x-3 animate-float">
                            <div class="w-11 h-11 rounded-xl bg-emerald-600 text-white font-black flex items-center justify-center text-lg">
                                M
                            </div>
                            <div>
                                <div class="text-xs font-extrabold text-slate-900">M-Pesa STK Push</div>
                                <div class="text-[11px] text-slate-500 font-medium">Instant Payment Prompt</div>
                            </div>
                        </div>

                        <!-- FLOATING BADGE 2: DOORSTEP PICKUP -->
                        <div class="absolute -top-6 -right-6 glass-card p-4 rounded-2xl shadow-xl flex items-center space-x-3">
                            <div class="w-11 h-11 rounded-xl bg-[#0B3FA8] text-white flex items-center justify-center">
                                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                            </div>
                            <div>
                                <div class="text-xs font-extrabold text-[#062B73]">Fresh & Clean Guaranteed</div>
                                <div class="text-[11px] text-[#0B3FA8] font-bold uppercase tracking-wider">Fresh. Clean. Perfect.</div>
                            </div>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    </section>

    <!-- HOW IT WORKS SECTION -->
    <section id="how-it-works" class="py-16 bg-white border-b border-slate-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center max-w-2xl mx-auto mb-12">
                <span class="text-xs font-extrabold text-[#0B3FA8] uppercase tracking-widest block mb-1">
                    Simple 3-Step Process
                </span>
                <h2 class="text-3xl font-black text-[#062B73]">How Nyota Dry Cleaners Works</h2>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                <!-- STEP 1 -->
                <div class="bg-[#F4F8FF] p-8 rounded-2xl border border-[#0B3FA8]/10 text-center space-y-4 hover:shadow-lg transition-all">
                    <div class="w-14 h-14 rounded-2xl bg-[#0B3FA8] text-white font-black text-xl flex items-center justify-center mx-auto shadow-md">
                        1
                    </div>
                    <h3 class="text-lg font-bold text-[#062B73]">Select Services</h3>
                    <p class="text-xs text-slate-600 leading-relaxed font-medium">
                        Choose your suits, dresses, everyday wash & fold, duvets, or curtains from our interactive menu below.
                    </p>
                </div>

                <!-- STEP 2 -->
                <div class="bg-[#F4F8FF] p-8 rounded-2xl border border-[#0B3FA8]/10 text-center space-y-4 hover:shadow-lg transition-all">
                    <div class="w-14 h-14 rounded-2xl bg-emerald-600 text-white font-black text-xl flex items-center justify-center mx-auto shadow-md">
                        2
                    </div>
                    <h3 class="text-lg font-bold text-[#062B73]">Pay via M-Pesa STK Push</h3>
                    <p class="text-xs text-slate-600 leading-relaxed font-medium">
                        Enter your phone number. Safaricom sends an instant STK prompt to your phone. Enter PIN to confirm.
                    </p>
                </div>

                <!-- STEP 3 -->
                <div class="bg-[#F4F8FF] p-8 rounded-2xl border border-[#0B3FA8]/10 text-center space-y-4 hover:shadow-lg transition-all">
                    <div class="w-14 h-14 rounded-2xl bg-[#062B73] text-white font-black text-xl flex items-center justify-center mx-auto shadow-md">
                        3
                    </div>
                    <h3 class="text-lg font-bold text-[#062B73]">Pickup & Fresh Delivery</h3>
                    <p class="text-xs text-slate-600 leading-relaxed font-medium">
                        Our professional valets pick up your garments and return them fresh, clean, and perfectly pressed.
                    </p>
                </div>
            </div>
        </div>
    </section>

    <!-- MAIN INTERACTIVE BOOKING APPLICATION CONTAINER -->
    <main id="services-booking" class="flex-grow py-12">
        <div id="nyota-booking-app"></div>
    </main>

    <!-- FOOTER -->
    <footer class="bg-[#062B73] text-white pt-12 pb-8 border-t border-[#0B3FA8]">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-white/10 text-xs">
                
                <div class="space-y-3">
                    <div class="flex items-center space-x-2">
                        <div class="w-8 h-8 rounded-lg bg-white text-[#062B73] font-black flex items-center justify-center">
                            N
                        </div>
                        <span class="text-base font-black">NYOTA DRY CLEANERS</span>
                    </div>
                    <p class="text-xs text-[#EAF3FF] font-bold uppercase tracking-wider">
                        "Fresh. Clean. Perfect."
                    </p>
                    <p class="text-slate-300 leading-relaxed">
                        Nairobi's trusted dry cleaning and fabric care specialists. Quality service, eco-friendly detergents, and instant M-Pesa checkout.
                    </p>
                </div>

                <div>
                    <h4 class="font-bold text-sm text-white mb-3 uppercase tracking-wider">Services</h4>
                    <ul class="space-y-2 text-slate-300">
                        <li>Wash, Dry & Fold</li>
                        <li>Executive Suit Cleaning</li>
                        <li>Designer Gown Care</li>
                        <li>Duvet & Bedding Wash</li>
                        <li>Curtains & Drapery Cleaning</li>
                        <li>Leather & Suede Care</li>
                    </ul>
                </div>

                <div>
                    <h4 class="font-bold text-sm text-white mb-3 uppercase tracking-wider">Store Hours & Location</h4>
                    <ul class="space-y-2 text-slate-300">
                        <li>Mon - Sat: 7:00 AM - 8:00 PM</li>
                        <li>Sunday: 9:00 AM - 5:00 PM</li>
                        <li>Location: Nairobi, Kenya</li>
                        <li>Phone: +254 708 374 149</li>
                        <li>Email: support@nyotacleaners.co.ke</li>
                    </ul>
                </div>

                <div>
                    <h4 class="font-bold text-sm text-white mb-3 uppercase tracking-wider">Secure Payment</h4>
                    <p class="text-slate-300 leading-relaxed mb-3">
                        Integrated with Safaricom Daraja M-Pesa STK Push for real-time transaction verification.
                    </p>
                    <div class="inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-white/10 text-emerald-400 font-bold">
                        <span>🔒 Safaricom M-Pesa Secured</span>
                    </div>
                </div>

            </div>

            <div class="pt-6 text-center text-xs text-slate-400">
                &copy; {{ date('Y') }} Nyota Dry Cleaners. All Rights Reserved. Slogan: "Fresh. Clean. Perfect."
            </div>
        </div>
    </footer>
</body>
</html>
