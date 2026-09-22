import React from 'react';
import { createRoot } from 'react-dom/client';
import BookingApp from './components/BookingApp';
import AdminERP from './components/AdminERP';
import AdminPOS from './components/AdminPOS';

document.addEventListener('DOMContentLoaded', () => {
  const bookingEl = document.getElementById('nyota-booking-app');
  if (bookingEl) {
    const root = createRoot(bookingEl);
    root.render(<BookingApp />);
  }

  const adminEl = document.getElementById('nyota-admin-erp');
  if (adminEl) {
    const root = createRoot(adminEl);
    root.render(<AdminERP />);
  }

  const posEl = document.getElementById('nyota-admin-pos');
  if (posEl) {
    const root = createRoot(posEl);
    root.render(<AdminPOS />);
  }
});

