<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Admin ERP — Nyota Dry Cleaners</title>
    @vite(['resources/css/app.css', 'resources/js/app.jsx'])
</head>
<body class="bg-[#F4F8FF] text-slate-800 antialiased min-h-screen">
    <!-- ADMIN HEADER NAVBAR -->
    <header class="bg-[#062B73] text-white py-4 px-6 flex items-center justify-between shadow-md">
        <div class="flex items-center space-x-3">
            <div class="w-9 h-9 rounded-xl bg-[#0B3FA8] flex items-center justify-center font-black text-white">
                N
            </div>
            <div>
                <span className="font-extrabold text-base tracking-tight block">NYOTA DRY CLEANERS</span>
                <span className="text-[10px] text-[#EAF3FF] uppercase font-bold tracking-wider">Admin Management Portal</span>
            </div>
        </div>

        <a href="/" class="text-xs font-bold text-white bg-[#0B3FA8] hover:bg-[#0B3FA8]/80 px-4 py-2 rounded-xl border border-white/20 transition-all">
            &larr; Customer Website & Booking
        </a>
    </header>

    <main class="py-6">
        <div id="nyota-admin-erp"></div>
    </main>
</body>
</html>
