# M.E.D.I.C. — Windows Development Guide

Step-by-step guide to run M.E.D.I.C. locally on Windows with VS Code.

---

## Prerequisites

Install these before starting:

| Tool | Version | Download |
|---|---|---|
| Docker Desktop | Latest | https://docker.com/products/docker-desktop |
| Java (Temurin) | 21 | https://adoptium.net |
| Maven | 3.9+ | https://maven.apache.org/download.cgi |
| Node.js | 20+ | https://nodejs.org |
| VS Code | Latest | https://code.visualstudio.com |

After installing Maven, add it to PATH:
1. Search "Environment Variables" in Start Menu
2. Under System Variables → Path → Add `C:\Program Files\Apache\maven\bin`
3. Open a new PowerShell and verify: `mvn --version`

---

## One-time setup

### 1. Configure your `.env`

```powershell
cd C:\Users\hp\Desktop\medic-platform
Copy-Item .env.example .env
```

Your `.env` is already correct. The key values are:
```
DB_PASSWORD=medic-db-password
REDIS_PASSWORD=medic-redis-password
JWT_SECRET=c00b3fc873a07ca2173c5e3f630eb9e1811650f8c45de769c659ac0cdfca8430
```

### 2. Install VS Code extensions

Open VS Code, press `Ctrl+Shift+X`, install:
- **Extension Pack for Java** (Microsoft)
- **Spring Boot Extension Pack** (VMware)

Or accept the prompt when VS Code asks to install recommended extensions.

---

## Daily development workflow

### Option A — VS Code Tasks (recommended)

Press `Ctrl+Shift+P` → `Tasks: Run Task` and choose:

- **Docker: Start infra (Postgres + Redis)** — start this first, every time
- **Run: auth-service (port 8087)** — starts the service after infra is ready
- **Run: frontend dev server (port 5173)** — React hot-reload

### Option B — PowerShell terminal (manual)

Open a PowerShell terminal in VS Code (`Ctrl+\``):

**Step 1: Start Postgres and Redis**
```powershell
docker compose up -d postgres redis
```

**Step 2: Wait ~10 seconds, then verify Postgres is ready**
```powershell
docker exec medic-postgres pg_isready -U medic -d medic_auth
# Should print: /var/run/postgresql:5432 - accepting connections
```

**Step 3: Use the dev script (loads .env automatically)**
```powershell
powershell -ExecutionPolicy Bypass -File dev\Start-Service.ps1 auth-service
```

**OR** — load `.env` manually then run Maven:
```powershell
. .\dev\Load-Env.ps1           # dot-source to export variables
cd auth-service
mvn spring-boot:run
```

---

## Running multiple services

Each service needs its own terminal tab. In VS Code, click the `+` button in the terminal panel.

**Recommended startup order:**
```
Tab 1:  . .\dev\Load-Env.ps1 — then docker compose up -d postgres redis
Tab 2:  . .\dev\Load-Env.ps1 — then cd auth-service && mvn spring-boot:run
Tab 3:  . .\dev\Load-Env.ps1 — then cd patient-identity-service && mvn spring-boot:run
Tab 4:  cd medic-frontend && npm install && npm run dev
```

The gateway (`api-gateway`) is only needed when testing routes. For development, hit each service directly on its port.

---

## Service ports (local)

| Service | URL | Swagger |
|---|---|---|
| Auth Service | http://localhost:8087 | http://localhost:8087/swagger-ui.html |
| Patient Identity | http://localhost:8081 | http://localhost:8081/swagger-ui.html |
| EMR Service | http://localhost:8082 | http://localhost:8082/swagger-ui.html |
| Appointment | http://localhost:8083 | http://localhost:8083/swagger-ui.html |
| Telemedicine | http://localhost:8084 | http://localhost:8084/swagger-ui.html |
| Pharmacy | http://localhost:8085 | http://localhost:8085/swagger-ui.html |
| Analytics | http://localhost:8086 | http://localhost:8086/swagger-ui.html |
| Notification | http://localhost:8088 | http://localhost:8088/swagger-ui.html |
| USSD | http://localhost:8089 | http://localhost:8089/swagger-ui.html |
| Frontend | http://localhost:5173 | — |

---

## Test auth-service is working

Once it starts, test login:
```powershell
curl -Method POST http://localhost:8087/api/v1/auth/login `
  -ContentType "application/json" `
  -Body '{"username":"admin","password":"Admin@123"}'
```

Expected response:
```json
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "expiresIn": 900,
  "user": { "username": "admin", "role": "ADMIN", ... }
}
```

---

## Common errors and fixes

### "password authentication failed for user medic"

The Postgres container was started with a different password than what your service is using.

**Fix:** Recreate the database with the correct password:
```powershell
docker compose down -v          # removes volumes (wipes DB data)
docker compose up -d postgres redis
# Wait 10 seconds
# Then restart your service
```

### "Could not resolve placeholder 'jwt.secret'"

Your `.env` variables are not loaded into the shell.

**Fix:** Use the dev script instead of running Maven directly:
```powershell
powershell -ExecutionPolicy Bypass -File dev\Start-Service.ps1 auth-service
```

Or dot-source the loader first:
```powershell
. .\dev\Load-Env.ps1
mvn spring-boot:run
```

### "Connection refused" to Postgres

Postgres isn't ready yet after starting.

**Fix:** Wait 10–15 seconds after `docker compose up -d` and check:
```powershell
docker exec medic-postgres pg_isready -U medic
```

### "Multiple Spring Data modules found" (INFO log)

This is just an INFO message, not an error. Spring is auto-detecting both JPA and Redis and correctly choosing JPA for your repositories. **Ignore it.**

### Port already in use

Another process is using the port.

**Fix:**
```powershell
# Find what's using port 8087 (or whichever port)
netstat -ano | findstr :8087
# Kill it (replace PID with the actual number)
taskkill /PID 12345 /F
```

---

## Resetting the database

If you need a completely clean slate:
```powershell
docker compose down -v    # -v removes all volumes (deletes all DB data)
docker compose up -d postgres redis
```

Flyway migrations will re-run automatically on next service start, recreating all tables and the default admin user.

---

## Run tests

```powershell
# All services
mvn test

# Single service
cd auth-service
mvn test
```

Tests use H2 in-memory database — no Docker required for testing.
