# CineBook

A responsive cinema ticket booking experience built with Vite and React. Browse films, choose a cinema and showtime, select seats, simulate payment, and receive a booking confirmation.

## Architecture and booking behavior

The domain logic lives in `src/domain/bookingService.js`. It exposes a small repository/service boundary for movies, cinemas, showtimes, seats, customers, and bookings. Data is seeded on first use and persisted to `localStorage` under `cinebook-data-v1`; an in-memory fallback keeps the app usable when browser storage is unavailable.

The React booking flow uses the service for the catalog and current seat map. Payment calls `createBooking`, which rechecks the selected showtime's seats before saving the customer and booking. A seat cannot be booked twice for the same showtime, and each successful booking receives a unique reference such as `CB-AB12-X7QK`. Conflicts return a clear unavailable-seat error in the payment step instead of showing a false confirmation.

## Run locally

```bash
npm install
npm run dev
```

Then open the local URL printed by Vite (usually `http://localhost:5173`).

## Validate a production build

```bash
npm run build
```
