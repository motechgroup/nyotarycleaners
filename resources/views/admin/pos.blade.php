<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>In-Store POS Register — Nyota Dry Cleaners</title>
    @vite(['resources/css/app.css', 'resources/js/app.jsx'])
</head>
<body class="bg-[#F4F8FF] text-slate-800 antialiased min-h-screen">
    <!-- POS HEADER NAVBAR -->
    <header class="bg-[#062B73] text-white py-3.5 px-6 flex items-center justify-between shadow-md">
        <div class="flex items-center space-x-3">
            <div class="w-9 h-9 rounded-xl bg-[#0B3FA8] flex items-center justify-center font-black text-white">
                N
            </div>
            <div>
                <span class="font-extrabold text-base tracking-tight block">NYOTA DRY CLEANERS</span>
                <span class="text-[10px] text-[#EAF3FF] uppercase font-bold tracking-wider">In-Store Counter POS Register</span>
            </div>
        </div>

        <div class="flex items-center space-x-3 text-xs font-bold">
            <a href="/admin" class="text-white hover:underline">
                ERP Dashboard
            </a>
            <a href="/" class="text-xs font-bold text-white bg-[#0B3FA8] hover:bg-[#0B3FA8]/80 px-4 py-2 rounded-xl border border-white/20 transition-all">
                Customer Website &rarr;
            </a>
        </div>
    </header>

    <main class="py-4">
        <div id="nyota-admin-pos"></div>
    </main>
</body>
</html>
