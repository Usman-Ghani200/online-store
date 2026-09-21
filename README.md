# Webstore

A full storefront and admin panel built with React, TypeScript, Tailwind CSS v4, and Vite. Design language
(announcement bar, category rail, product grid with sale badges, promo banner, About/Location/Contact footer)
is modeled on a reference beauty-retail layout, restyled with original colors, type, and generic placeholder
products — no third-party brand names or imagery are used.

## Setup

```bash
npm install
npm run dev       # start local dev server
npm run build     # production build
npm run test      # run the vitest suite
```

## Default admin credentials

Visit `/admin/login` and use password `admin123` (or `admin`).

## Promo codes

`WELCOME10` — 10% off orders over Rs 1,500 (seeded by default, editable in the admin panel).

## Features

- Storefront: home, product listing with filters/sort, product detail with variants & reviews, cart with
  promo codes and free-shipping progress, Pakistani checkout (COD / JazzCash / Easypaisa), order confirmation
  receipt, order tracking, and a lightweight account/order-history lookup.
- Admin panel: revenue/orders/customers overview with low-stock alerts, product manager (multi-image via URL
  or local upload), order manager (status + payment status), review moderation, promo code manager, and store
  settings (shipping fee, free-shipping threshold, hero banner copy, announcement bar).
- State is held in React context and persisted to `localStorage`, so data survives a page refresh without a
  backend.

## Notes on the design

Colors, typography (Fraunces + Work Sans), copy, and product data are original — built to match the *structure*
of the reference site (not its brand assets). Swap `src/data/mockData.ts` with real inventory before launch.
