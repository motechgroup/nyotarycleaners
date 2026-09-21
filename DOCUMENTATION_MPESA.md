# Nyota Dry Cleaners — Safaricom M-Pesa STK Push Integration & ERP Manual

This document provides step-by-step instructions for configuring, deploying, testing, and troubleshooting the **M-Pesa Daraja STK Push** payment integration for Nyota Dry Cleaners.

---

## 1. M-Pesa Environment Configuration

All M-Pesa credentials and callback URLs are managed securely through environment variables in `.env`. **Credentials must NEVER be hardcoded into JavaScript, React components, HTML, or committed to Git.**

### Required Environment Variables in `.env`:

```env
# Operating Environment: 'sandbox' for testing, 'production' for live payments
MPESA_ENVIRONMENT=sandbox

# Daraja Developer Portal App Credentials (from https://developer.safaricom.co.ke)
MPESA_CONSUMER_KEY=your_daraja_consumer_key_here
MPESA_CONSUMER_SECRET=your_daraja_consumer_secret_here

# PayBill or Till ShortCode (Default Sandbox PayBill: 174379)
MPESA_SHORTCODE=174379

# Online PassKey (Lipa Na M-Pesa Online PassKey)
MPESA_PASSKEY=bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919

# Publicly Accessible HTTPS Callback Endpoint
MPESA_CALLBACK_URL=https://yourdomain.co.ke/api/v1/payments/mpesa/callback

# Transaction Type: CustomerPayBillOnline or CustomerBuyGoodsOnline
MPESA_TRANSACTION_TYPE=CustomerPayBillOnline

# Default Business Identifiers
MPESA_ACCOUNT_REFERENCE=NYOTA
MPESA_TRANSACTION_DESC="Nyota Laundry Payment"
```

---

## 2. Callback URL Setup & Testing

Safaricom Daraja API sends an HTTP `POST` callback notification to `MPESA_CALLBACK_URL` when a customer completes or cancels an STK payment prompt on their phone.

### A. Local Development (using ngrok)
In local development (`localhost`), Safaricom cannot reach `http://localhost:8000`. Use **ngrok** or **localtunnel** to expose your local port:

1. Start ngrok in your terminal:
   ```bash
   ngrok http 8000
   ```
2. Copy the HTTPS URL (e.g. `https://a1b2-105-163-1-1.ngrok-free.app`).
3. Set `MPESA_CALLBACK_URL` in `.env`:
   ```env
   MPESA_CALLBACK_URL=https://a1b2-105-163-1-1.ngrok-free.app/api/v1/payments/mpesa/callback
   ```
4. Clear config cache:
   ```bash
   php artisan config:clear
   ```

### B. Shared Hosting / Production
Ensure your domain uses a valid SSL certificate (`https://`). Set `MPESA_CALLBACK_URL`:
```env
MPESA_CALLBACK_URL=https://nyotacleaners.co.ke/api/v1/payments/mpesa/callback
```
Note: Laravel automatically excludes `api/v1/payments/mpesa/callback` from CSRF token verification in `bootstrap/app.php`.

---

## 3. Switching Between Sandbox & Production

### Sandbox Mode:
1. Log into [Safaricom Developer Portal](https://developer.safaricom.co.ke).
2. Create an App under Sandbox to get your Test **Consumer Key** and **Consumer Secret**.
3. Use test shortcode `174379` and default test passkey `bfb279f9aa...`.
4. Set `MPESA_ENVIRONMENT=sandbox`.

### Production Launch:
1. Complete Go-Live process on Safaricom's portal to obtain production credentials, PayBill/Till Shortcode, and Live Passkey.
2. Update `.env` with live credentials:
   ```env
   MPESA_ENVIRONMENT=production
   MPESA_CONSUMER_KEY=live_consumer_key
   MPESA_CONSUMER_SECRET=live_consumer_secret
   MPESA_SHORTCODE=your_production_shortcode
   MPESA_PASSKEY=your_production_passkey
   MPESA_CALLBACK_URL=https://yourdomain.co.ke/api/v1/payments/mpesa/callback
   ```
3. Run `php artisan config:cache` to optimize performance.

---

## 4. How to Test STK Push Payments

### Testing with Real Phone Prompt (Sandbox Test Numbers)
Safaricom Sandbox routes STK prompts to registered test phone numbers:
1. Enter test phone number e.g. `254708374149` or `254712345678` in the booking payment screen.
2. Click **PAY WITH M-PESA**.
3. Safaricom triggers the PIN prompt on the test handset.
4. Enter test PIN `1234` or confirm transaction.
5. The React booking app automatically polls `/api/v1/payments/status/{checkoutRequestId}` and updates UI status upon completion.

---

## 5. Verifying Callbacks & Logs

Payment attempts and callbacks are logged to `storage/logs/laravel.log`.

- **Sanitized Logging**: API request logs filter out passkeys, consumer secrets, and access tokens. Phone numbers are masked for privacy.
- To inspect callback logs in real time:
  ```bash
  tail -f storage/logs/laravel.log | grep M-Pesa
  ```

---

## 6. Troubleshooting Common Daraja Result Codes

| Result Code | Description | Cause / Action Required |
|---|---|---|
| **0** | Success | Payment processed successfully and linked to order. |
| **1** | Insufficient Funds | Customer's M-Pesa balance is less than required amount. |
| **1032** | Cancelled by User | Customer pressed 'Cancel' on STK prompt. |
| **1037** | Timeout | Customer took longer than 60 seconds to enter PIN or phone was off/out of service. |
| **2001** | Invalid Initiator / Password | Check `MPESA_SHORTCODE` and `MPESA_PASSKEY` in `.env`. |
| **404.001.03** | Invalid Access Token | Consumer Key or Consumer Secret is invalid or expired. |

---

## 7. Shared Hosting Deployment Checklist

Nyota Dry Cleaners is fully compatible with standard PHP 8.4+ shared hosting environments (cPanel, Plesk, DirectAdmin):

- [x] Standard HTTPS HTTP requests via Guzzle (`Http::post()`).
- [x] No Redis, Docker, WebSockets, or Node.js background daemons required.
- [x] Database transactions handle race conditions and prevent duplicate callback processing.
