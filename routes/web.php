<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/services', function () {
    return view('services');
});

Route::get('/about', function () {
    return view('about');
});

Route::get('/admin', function () {
    return view('admin.dashboard');
});

Route::get('/admin/pos', function () {
    return view('admin.pos');
});
