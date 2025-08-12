# Remittance Platform (Scaffold)

Backend: TypeScript + Express + Postgres + Redis. Includes auth, wallets, transfers, QR withdrawals, and Swagger docs.

## Prerequisites
- Docker + Docker Compose

## Run locally

```bash
cd /workspace
docker compose up -d --build
```

API: http://localhost:8080/v1
Docs: http://localhost:8080/docs

### Sample workflow
- Register: POST /v1/auth/register { email, password }
- Login: POST /v1/auth/login { email, password } -> accessToken
- Get wallet: GET /v1/wallets/me (Authorization: Bearer <token>)
- Quote: POST /v1/transfers/quote (Authorization)
- Initiate: POST /v1/transfers/initiate (Authorization)
- Generate QR: POST /v1/withdrawals/qr (Authorization)

This is a minimal scaffold. Production features (KYC, AML, EcoCash/PhonePe connectors, admin/agent apps) to be added next.