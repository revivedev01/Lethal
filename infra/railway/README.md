# Railway notes

Relay Phase 1 deploys as four Railway services plus PostgreSQL:

- API service: `services/api`
- Gateway service: `services/gateway`
- Web app: `apps/web`
- Admin app: `apps/admin`
- Database: Railway PostgreSQL

Environment variables:

- `DATABASE_URL`
- `JWT_SECRET`
- `API_PORT`
- `GATEWAY_PORT`
- `VITE_RELAY_API_URL`
- `VITE_RELAY_GATEWAY_URL`
