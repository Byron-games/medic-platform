# M.E.D.I.C. — Medical Emergency & Disease Interoperability Cloud

> Healthcare Interoperability Hub for Sub-Saharan Africa

[![CI](https://github.com/Byron-games/medic-platform/actions/workflows/ci.yml/badge.svg)](https://github.com/Byron-games/medic-platform/actions)

## Architecture

11 independent microservices behind a Spring Cloud Gateway:

| Service | Port | Purpose |
|---|---|---|
| API Gateway | 8080 | JWT auth, routing, rate limiting |
| Auth Service | 8087 | Login, registration, token management |
| Patient Identity | 8081 | Master Patient Index (MPI) |
| EMR Service | 8082 | Electronic Medical Records |
| Appointment Service | 8083 | Scheduling & telemedicine bookings |
| Telemedicine Service | 8084 | Jitsi video sessions |
| Pharmacy Service | 8085 | e-Prescriptions, drug interactions |
| Analytics Service | 8086 | Disease surveillance, AI triage |
| Notification Service | 8088 | SMS via Twilio / Africa's Talking |
| USSD Service | 8089 | Feature phone access via USSD |
| Frontend | 3001 | React 18 + TypeScript + Tailwind |

## Quick Start (Local Development)

```bash
# 1. Clone
git clone https://github.com/Byron-games/medic-platform.git
cd medic-platform

# 2. Configure
cp .env.example .env
# Edit .env with your values

# 3. Build & run
docker compose up -d --build

# 4. Open
open http://localhost:3001
# Login: admin / Admin@123
```

## Tech Stack

- **Backend:** Java 21 + Spring Boot 3.2.5 + Spring Cloud 2023.0.3
- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS + Zustand
- **Database:** PostgreSQL 15 (one DB per service)
- **Cache:** Redis 7
- **Gateway:** Spring Cloud Gateway (WebFlux/reactive)
- **Auth:** JWT (HS384) + BCrypt-12
- **Monitoring:** Prometheus + Grafana
- **CI/CD:** GitHub Actions

## Development

```bash
# Build all Java services
mvn clean package -DskipTests

# Run tests
mvn test

# Frontend dev server (with hot reload)
cd medic-frontend && npm install && npm run dev
```

## Deployment (VPS)

```bash
DOMAIN=medic.health EMAIL=admin@medic.health bash vps/scripts/setup.sh
```

## Default Credentials

| User | Password | Role |
|---|---|---|
| admin | Admin@123 | ADMIN |

**Change these immediately after first login.**

---

© 2026 M.E.D.I.C. Healthcare Technologies — Proprietary
