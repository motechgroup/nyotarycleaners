<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>About Us — Nyota Dry Cleaners</title>
    <meta name="description" content="Learn about Nyota Dry Cleaners, Nairobi & Kisii's leading dry cleaning and fabric care specialists. Committed to quality, eco-friendly washing, and instant M-Pesa convenience. Fresh. Clean. Perfect.">
    @vite(['resources/css/app.css', 'resources/js/app.jsx'])
</head>
<body class="bg-[#F4F8FF] text-slate-800 antialiased selection:bg-[#0B3FA8] selection:text-white min-h-screen flex flex-col justify-between">

    <!-- ANNOUNCEMENT BAR -->
    <div class="bg-[#062B73] text-white text-xs font-semibold py-2 px-4 text-center border-b border-[#0B3FA8]/30">
        <span>Nyota Dry Cleaners & Laundry • Professional Garment Care in Kenya</span>
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
                <a href="/services" class="text-xs font-bold text-slate-700 hover:text-[#0B3FA8] transition-colors">
                    Services
                </a>
                <a href="/about" class="text-xs font-bold text-[#0B3FA8] border-b-2 border-[#0B3FA8] pb-1">
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

    <!-- HERO SECTION -->
    <section class="hero-gradient py-14 border-b border-[#0B3FA8]/10 text-center">
        <div class="max-w-4xl mx-auto px-4">
            <span class="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#EAF3FF] border border-[#0B3FA8]/20 text-[#0B3FA8] text-xs font-bold uppercase tracking-wider mb-4">
                <span>Our Story & Commitment to Excellence</span>
            </span>
            <h1 class="text-4xl font-black text-[#062B73] tracking-tight mb-4">
                About Nyota Dry Cleaners
            </h1>
            <p class="text-slate-600 text-base font-medium max-w-2xl mx-auto leading-relaxed">
                Founded with a passion for immaculate fabric care, Nyota Dry Cleaners blends advanced eco-friendly dry cleaning technology with seamless digital convenience across Kenya.
            </p>
        </div>
    </section>

    <!-- CONTENT BODY -->
    <main class="flex-grow py-12">
        <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">

            <!-- GRID 1: OUR MISSION & VALUES -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div class="space-y-4">
                    <span class="text-xs font-extrabold text-[#0B3FA8] uppercase tracking-widest block">
                        Our Mission
                    </span>
                    <h2 class="text-2xl font-black text-[#062B73]">
                        Bringing Convenience & Crisp Excellence to Every Garment
                    </h2>
                    <p class="text-sm text-slate-600 leading-relaxed font-medium">
                        At Nyota Dry Cleaners, we believe your clothes deserve gentle care that restores their brightness and texture without harsh chemical smells or fabric fatigue.
                    </p>
                    <p class="text-sm text-slate-600 leading-relaxed font-medium">
                        Whether it’s executive suits, delicate designer gowns, everyday laundry, heavy duvets, or carpets, our team of trained fabric specialists handles each piece with meticulous attention.
                    </p>
                </div>

                <div class="bg-white p-8 rounded-3xl border border-[#0B3FA8]/15 shadow-md space-y-6">
                    <div class="flex items-start space-x-4">
                        <div class="w-10 h-10 rounded-xl bg-[#EAF3FF] text-[#0B3FA8] font-bold flex items-center justify-center shrink-0">
                            🌿
                        </div>
                        <div>
                            <h3 class="font-bold text-[#062B73] text-base">Eco-Friendly Cleaning</h3>
                            <p class="text-xs text-slate-500 mt-1">Biodegradable organic solvents that protect your fabrics and skin.</p>
                        </div>
                    </div>

                    <div class="flex items-start space-x-4">
                        <div class="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center shrink-0">
                            📱
                        </div>
                        <div>
                            <h3 class="font-bold text-slate-900 text-base">M-Pesa Instant Pay</h3>
                            <p class="text-xs text-slate-500 mt-1">Seamless STK Push payment integration directly from your phone prompt.</p>
                        </div>
                    </div>

                    <div class="flex items-start space-x-4">
                        <div class="w-10 h-10 rounded-xl bg-[#062B73] text-white font-bold flex items-center justify-center shrink-0">
                            🚚
                        </div>
                        <div>
                            <h3 class="font-bold text-slate-900 text-base">Doorstep Pickup & Delivery</h3>
                            <p class="text-xs text-slate-500 mt-1">Scheduled collection and return directly to your home or office.</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- SLOGAN BANNER -->
            <div class="bg-[#062B73] text-white rounded-3xl p-8 sm:p-10 text-center space-y-3 shadow-xl">
                <span class="text-xs font-bold text-[#EAF3FF] uppercase tracking-widest block">
                    The Official Business Motto
                </span>
                <h3 class="text-3xl sm:text-4xl font-black tracking-tight">
                    "Fresh. Clean. Perfect."
                </h3>
                <p class="text-xs text-slate-300 max-w-lg mx-auto font-medium">
                    Our guarantee to you: Every garment delivered back to you is spotless, fresh-smelling, and flawlessly prepared.
                </p>
            </div>

            <!-- LOCATION & CONTACT INFO -->
            <div class="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                <div>
                    <span class="font-extrabold text-[#062B73] text-sm block mb-1 uppercase tracking-wider">Store Location</span>
                    <p class="text-slate-600 font-medium">Nyanchwa / Nairobi Center, Kenya</p>
                    <p class="text-slate-500 mt-1">Available for drop-offs & pickup requests.</p>
                </div>

                <div>
                    <span class="font-extrabold text-[#062B73] text-sm block mb-1 uppercase tracking-wider">Customer Support</span>
                    <p class="text-slate-600 font-medium">Phone: +254 708 374 149</p>
                    <p class="text-slate-600 font-medium">Email: support@nyotacleaners.co.ke</p>
                </div>

                <div>
                    <span class="font-extrabold text-[#062B73] text-sm block mb-1 uppercase tracking-wider">Operating Hours</span>
                    <p class="text-slate-600 font-medium">Mon - Sat: 7:00 AM - 8:00 PM</p>
                    <p class="text-slate-600 font-medium">Sunday: 9:00 AM - 5:00 PM</p>
                </div>
            </div>

        </div>
    </main>

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
