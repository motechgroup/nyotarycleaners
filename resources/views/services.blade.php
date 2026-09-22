<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Services & Pricing — Nyota Dry Cleaners</title>
    <meta name="description" content="Explore professional laundry, dry cleaning, ironing, carpet cleaning, shoe care, and deep cleaning services offered by Nyota Dry Cleaners. Fresh. Clean. Perfect.">
    @vite(['resources/css/app.css', 'resources/js/app.jsx'])
</head>
<body class="bg-[#F4F8FF] text-slate-800 antialiased selection:bg-[#0B3FA8] selection:text-white min-h-screen flex flex-col justify-between">

    <!-- ANNOUNCEMENT BAR -->
    <div class="bg-[#062B73] text-white text-xs font-semibold py-2 px-4 text-center border-b border-[#0B3FA8]/30 flex items-center justify-center space-x-2">
        <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span>Nyota Services & Pricing Catalog • M-Pesa STK Push Instant Checkout Available</span>
    </div>

    <!-- GLASS HEADER -->
    <header class="glass-header sticky top-0 z-50 transition-all">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
            <a href="/" class="flex items-center space-x-3">
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
            </a>

            <nav class="flex items-center space-x-5">
                <a href="/" class="text-xs font-bold text-slate-700 hover:text-[#0B3FA8] transition-colors">
                    Home
                </a>
                <a href="/services" class="text-xs font-bold text-[#0B3FA8] border-b-2 border-[#0B3FA8] pb-1">
                    Services
                </a>
                <a href="/about" class="text-xs font-bold text-slate-700 hover:text-[#0B3FA8] transition-colors">
                    About Us
                </a>
                <a href="/admin/pos" class="text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-600 hover:text-white px-3.5 py-2 rounded-xl transition-all border border-emerald-200 hidden sm:inline-block">
                    In-Store POS
                </a>
                <a href="/admin" class="text-xs font-bold text-[#0B3FA8] bg-[#EAF3FF] hover:bg-[#0B3FA8] hover:text-white px-4 py-2.5 rounded-xl border border-[#0B3FA8]/20 transition-all">
                    Admin ERP
                </a>
            </nav>
        </div>
    </header>

    <!-- PAGE HERO -->
    <section class="hero-gradient py-12 border-b border-[#0B3FA8]/10 text-center">
        <div class="max-w-4xl mx-auto px-4">
            <span class="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#EAF3FF] border border-[#0B3FA8]/20 text-[#0B3FA8] text-xs font-bold uppercase tracking-wider mb-4">
                <span>Tailored Fabric & Garment Care</span>
            </span>
            <h1 class="text-3xl sm:text-4xl font-black text-[#062B73] tracking-tight mb-3">
                Our Services & Official Pricing
            </h1>
            <p class="text-slate-600 text-sm font-medium max-w-xl mx-auto">
                Transparent pricing with zero hidden charges. Every item is treated with specialized eco-friendly care and crisp professional finishing.
            </p>
        </div>
    </section>

    <!-- SERVICES INTERACTIVE LISTING & BOOKING CONTAINER -->
    <main class="flex-grow py-10">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div id="nyota-booking-app"></div>
        </div>
    </section>

    <!-- FOOTER -->
    <footer class="bg-[#062B73] text-white pt-10 pb-6 border-t border-[#0B3FA8]">
        <div class="max-w-7xl mx-auto px-4 text-center space-y-3">
            <div class="flex items-center justify-center space-x-2">
                <div class="w-8 h-8 rounded-lg bg-white text-[#062B73] font-black flex items-center justify-center">
                    N
                </div>
                <span class="text-base font-bold">NYOTA DRY CLEANERS</span>
            </div>
            <p class="text-xs text-[#EAF3FF] font-bold uppercase tracking-wider">
                "Fresh. Clean. Perfect."
            </p>
            <p class="text-xs text-slate-400">
                &copy; {{ date('Y') }} Nyota Dry Cleaners. All Rights Reserved.
            </p>
        </div>
    </footer>
</body>
</html>
