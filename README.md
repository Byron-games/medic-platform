# M.E.D.I.C. — Medical Emergency & Disease Interoperability Cloud

> Full-stack healthcare interoperability platform for Sub-Saharan Africa  
> Built for Cameroon · 11 microservices · React frontend · Docker ready

[![CI](https://github.com/Byron-games/medic-platform/actions/workflows/ci.yml/badge.svg)](https://github.com/Byron-games/medic-platform/actions)

---

## Architecture

```
                         ┌─────────────────────────┐
                         │   React Frontend (3001)  │
                         └────────────┬────────────┘
                                      │
                         ┌────────────▼────────────┐
                         │  Nginx Reverse Proxy    │
                         └────────────┬────────────┘
                                      │
                         ┌────────────▼────────────┐
                         │  API Gateway      :8080  │  ← JWT auth, routing
                         └──────────┬──────────────┘
                    ┌───────────────┼───────────────┐
          ┌─────────▼──┐  ┌────────▼──┐  ┌─────────▼──┐
          │Auth  :8087 │  │Patient:8081│  │EMR   :8082 │
          └────────────┘  └────────────┘  └────────────┘
          ┌─────────────┐  ┌────────────┐  ┌────────────┐
          │Appt  :8083  │  │Tele  :8084 │  │Pharma:8085 │
          └─────────────┘  └────────────┘  └────────────┘
          ┌─────────────┐  ┌────────────┐  ┌────────────┐
          │Analytics:8086│  │Notif :8088 │  │USSD  :8089 │
          └─────────────┘  └────────────┘  └────────────┘
                              │
                    ┌─────────▼──────────┐
                    │ PostgreSQL  Redis   │
                    └────────────────────┘
```

## Services

| Service | Port | Purpose |
|---|---|---|
| API Gateway | 8080 | JWT validation, routing, rate limiting |
| Auth Service | 8087 | Login, registration, BCrypt-12 + HS384 JWT |
| Patient Identity | 8081 | Master Patient Index (MPI), duplicate detection |
| EMR Service | 8082 | SOAP notes, vitals, ICD-10 coding |
| Appointment Service | 8083 | Scheduling, conflict detection, reschedule history |
| Telemedicine Service | 8084 | Jitsi sessions, low-bandwidth mode, patient SMS links |
| Pharmacy Service | 8085 | e-Prescriptions, drug interactions, dispensing workflow |
| Analytics Service | 8086 | Disease surveillance, outbreak detection, dashboard |
| Notification Service | 8088 | SMS via Africa's Talking (EN/FR templates, auto-retry) |
| USSD Service | 8089 | Feature-phone menus via Africa's Talking (*384#) |
| Frontend | 3001 | React 18 + TypeScript + Tailwind CSS + Recharts |

## Tech Stack

- **Backend** Java 21 · Spring Boot 3.2.5 · Spring Cloud 2023.0.3
- **Frontend** React 18 · TypeScript · Vite · Tailwind CSS · Zustand · Recharts
- **Database** PostgreSQL 15 (one schema per service) · Flyway migrations
- **Cache/Session** Redis 7
- **Auth** JWT (HS384) · BCrypt cost-12
- **SMS** Africa's Talking (primary for Cameroon) · Stub provider for dev
- **Video** Jitsi Meet (self-hosted or public meet.jit.si)
- **Monitoring** Prometheus + Grafana
- **CI/CD** GitHub Actions (build, test, OWASP scan, SSH deploy)

---

## Quick Start (Local Development)

### Prerequisites
- Docker Desktop 24+
- Java 21 (for local service development)
- Node.js 20+ (for frontend)

### 1. Clone and configure

```bash
git clone https://github.com/Byron-games/medic-platform.git
cd medic-platform
cp .env.example .env
```

Edit `.env` — at minimum set these three:
```bash
JWT_SECRET=$(openssl rand -hex 32)
DB_PASSWORD=your_db_password
REDIS_PASSWORD=your_redis_password
```

### 2. Start the full platform

```bash
docker compose up -d --build
```

This starts all 13 containers (11 services + Postgres + Redis).  
First build takes ~8 minutes. Subsequent starts take ~30 seconds.

### 3. Open the platform

| URL | What |
|---|---|
| http://localhost:3001 | React frontend |
| http://localhost:8080/actuator/health | Gateway health |
| http://localhost:8087/swagger-ui.html | Auth Service API docs |
| http://localhost:9090 | Prometheus |
| http://localhost:3000 | Grafana (admin/admin) |

### Default credentials

| Username | Password | Role |
|---|---|---|
| admin | Admin@123 | ADMIN |

**Change this immediately after first login.**

---

## Development

### Run a single service locally

```bash
# Start infrastructure only
docker compose up -d postgres redis

# Run auth service in IntelliJ or VS Code,
# or from the terminal:
cd auth-service
mvn spring-boot:run
```

### Frontend hot-reload dev server

```bash
cd medic-frontend
npm install
npm run dev
# Opens at http://localhost:5173
# API calls proxy to http://localhost:8080 (gateway)
```

### Run all tests

```bash
mvn test
```

### Run a specific service's tests

```bash
cd pharmacy-service
mvn test
```

---

## API Reference

Each service exposes a Swagger UI:

| Service | Swagger URL |
|---|---|
| Auth | http://localhost:8087/swagger-ui.html |
| Patient Identity | http://localhost:8081/swagger-ui.html |
| EMR | http://localhost:8082/swagger-ui.html |
| Appointments | http://localhost:8083/swagger-ui.html |
| Telemedicine | http://localhost:8084/swagger-ui.html |
| Pharmacy | http://localhost:8085/swagger-ui.html |
| Analytics | http://localhost:8086/swagger-ui.html |
| Notifications | http://localhost:8088/swagger-ui.html |
| USSD | http://localhost:8089/swagger-ui.html |

---

## USSD Menu (*384#)

Dial `*384#` on Africa's Talking sandbox to test the feature-phone interface.

**Menu tree:**
```
M.E.D.I.C. Health
1. My appointments
   1. Next appointment
   2. All appointments
   0. Back
2. My prescriptions
   1. Active prescriptions
   2. Collection reminder
   0. Back
3. Find a clinic
   1. Yaoundé Central Hospital
   2. Douala General Hospital
   3. CHUY Yaoundé
   0. Back
4. Language (English / Français)
0. Exit
```

**Test without the gateway:**
```bash
curl "http://localhost:8089/api/v1/ussd/test?text=1*1"
# → END Your next appointment: No upcoming appointments...
```

---

## Deployment (VPS)

### One-command setup (Ubuntu 22.04)

```bash
DOMAIN=medic.health EMAIL=admin@medic.health bash vps/scripts/setup.sh
```

### GitHub Actions deploy

1. Set repository secrets:
   ```
   VPS_HOST     your-vps-ip
   VPS_USER     deploy
   VPS_SSH_KEY  (contents of your private key)
   ```

2. Go to **Actions → Deploy to VPS → Run workflow**

### Manual deploy

```bash
ssh deploy@your-vps-ip
cd /opt/medic-platform
git pull origin main
docker compose up -d --build
```

---

## Security Notes

- All JWTs are validated at the **API Gateway** — downstream services trust gateway-injected headers
- BCrypt cost factor 12 — ~300ms hash time (slows brute force)
- Account lockout after 5 failed attempts (15-minute lockout)
- Prescription Rx codes expire in 30 days by default
- Drug interactions detected at prescription issue time — cannot be silently bypassed
- All secrets via environment variables — never hardcoded
- OWASP dependency scan runs on every CI push

---

## Project Structure

```
medic-platform/
├── api-gateway/                ← Spring Cloud Gateway
├── auth-service/               ← BCrypt + JWT
├── patient-identity-service/   ← Master Patient Index
├── emr-service/                ← SOAP notes + vitals
├── appointment-service/        ← Scheduling
├── telemedicine-service/       ← Jitsi video sessions
├── pharmacy-service/           ← e-Prescriptions
├── analytics-service/          ← Disease surveillance
├── notification-service/       ← Africa's Talking SMS
├── ussd-service/               ← Feature-phone menus
├── medic-frontend/             ← React 18 SPA
├── postgres/                   ← DB init scripts
├── nginx/                      ← Reverse proxy config
├── prometheus/                 ← Metrics scrape config
├── vps/                        ← Server setup scripts
└── .github/workflows/          ← CI/CD pipelines
```

---

© 2026 M.E.D.I.C. Healthcare Technologies · All rights reserved
