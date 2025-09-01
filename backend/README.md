# Backend (Spring Boot) v0.2.0
Quick start (dev):
1) Install JDK 17 and Maven.
2) `cd backend`
3) `mvn spring-boot:run`

Endpoints (demo):
- GET  /api/categories
- GET  /api/products
- GET  /api/products/{id}
- GET  /api/stores
- GET  /api/home
- GET  /api/config/rates
- POST /api/config/rates
- GET  /api/config/shipping
- POST /api/config/shipping
- GET  /api/orders
- POST /api/orders/{id}/status
- POST /api/coupon/validate

> Enable CORS: allowed for all origins in dev (see CorsConfig).
> Next steps: add DB (PostgreSQL), JWT security, payments webhooks, analytics.
