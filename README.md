# Ease Commerce

A courier-agnostic backend service for shipping request orchestration and tracking.

## Stack

- Node.js 20
- TypeScript 5
- Express 4
- Zod 3
- Prisma 5
- PostgreSQL 15
- Axios + axios-retry
- Jest + Supertest

## Setup

1. Copy `.env.example` to `.env`.
2. Set values for `DATABASE_URL`, `URBANEBOLT_BASE_URL`, `URBANEBOLT_API_KEY`, and other optional values.
3. Install dependencies:
   `npm install`
4. Push schema to database:
   `npx prisma db push`
5. Start the app:
   `npm start`

## API

- POST /api/v1/orders
- GET /api/v1/orders/:order_id/track
- POST /api/v1/orders/:order_id/cancel
- POST /api/v1/orders/bulk
- GET /health

## Notes

- The app is designed to support a registry-driven adapter model where new couriers can be added without changing existing code paths.
- The current mock courier implementation is used for local and test flows without hitting a live external API.
