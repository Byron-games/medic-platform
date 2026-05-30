# M.E.D.I.C. Platform Makefile
# Usage: make <target>
# Requires: Docker, Maven 3.9+, Node.js 20+

.PHONY: help up down build test clean logs ps frontend dev-auth dev-patient

# ── Default ─────────────────────────────────────────────
help:
	@echo "M.E.D.I.C. Platform — Available commands:"
	@echo ""
	@echo "  make up          Start all 13 containers (builds if needed)"
	@echo "  make down        Stop and remove containers"
	@echo "  make restart     Down then up"
	@echo "  make build       Build all Java services (skip tests)"
	@echo "  make test        Run all unit tests"
	@echo "  make clean       Remove build artifacts"
	@echo "  make logs        Tail logs from all services"
	@echo "  make ps          Show running containers and their health"
	@echo ""
	@echo "  make infra       Start only Postgres + Redis"
	@echo "  make frontend    Start frontend dev server (hot reload)"
	@echo "  make dev-auth    Run auth-service locally (infra must be up)"
	@echo "  make dev-patient Run patient-identity-service locally"
	@echo "  make dev-emr     Run emr-service locally"
	@echo ""
	@echo "  make db-connect  Open psql to the medic_auth database"
	@echo "  make redis-cli   Open redis-cli"
	@echo "  make swagger     Open all Swagger UIs in browser"
	@echo ""

# ── Docker ──────────────────────────────────────────────
up:
	docker compose up -d --build

down:
	docker compose down

restart: down up

infra:
	docker compose up -d postgres redis
	@echo "Waiting for Postgres..."
	@sleep 5
	@docker compose exec postgres pg_isready -U medic && echo "Postgres ready"

ps:
	docker compose ps

logs:
	docker compose logs -f --tail=50

logs-%:
	docker compose logs -f --tail=100 $*

# ── Build ────────────────────────────────────────────────
build:
	mvn clean package -DskipTests -q
	@echo "Build complete"

build-%:
	mvn clean package -DskipTests -q -pl $* -am
	@echo "$* build complete"

test:
	mvn test -q

test-%:
	mvn test -q -pl $*

clean:
	mvn clean -q
	@echo "Clean complete"

# ── Individual service dev mode ──────────────────────────
dev-auth:
	cd auth-service && mvn spring-boot:run

dev-patient:
	cd patient-identity-service && mvn spring-boot:run

dev-emr:
	cd emr-service && mvn spring-boot:run

dev-appt:
	cd appointment-service && mvn spring-boot:run

dev-tele:
	cd telemedicine-service && mvn spring-boot:run

dev-pharmacy:
	cd pharmacy-service && mvn spring-boot:run

dev-analytics:
	cd analytics-service && mvn spring-boot:run

dev-notif:
	cd notification-service && mvn spring-boot:run

dev-ussd:
	cd ussd-service && mvn spring-boot:run

# ── Frontend ─────────────────────────────────────────────
frontend:
	cd medic-frontend && npm install && npm run dev

frontend-build:
	cd medic-frontend && npm run build
	@echo "Frontend built to medic-frontend/dist/"

# ── Database ─────────────────────────────────────────────
db-connect:
	docker compose exec postgres psql -U medic -d medic_auth

db-connect-%:
	docker compose exec postgres psql -U medic -d medic_$*

redis-cli:
	docker compose exec redis redis-cli -a $$(grep REDIS_PASSWORD .env | cut -d= -f2)

# ── USSD Testing ─────────────────────────────────────────
ussd-test:
	@echo "USSD main menu:"
	curl -s "http://localhost:8089/api/v1/ussd/test" && echo ""

ussd-test-%:
	@echo "USSD input: $*"
	curl -s "http://localhost:8089/api/v1/ussd/test?text=$*" && echo ""

# ── Swagger ──────────────────────────────────────────────
swagger:
	@for port in 8087 8081 8082 8083 8084 8085 8086 8088 8089; do \
		xdg-open "http://localhost:$$port/swagger-ui.html" 2>/dev/null || \
		open "http://localhost:$$port/swagger-ui.html" 2>/dev/null || true; \
	done

# ── Monitoring ───────────────────────────────────────────
prometheus:
	open http://localhost:9090 || xdg-open http://localhost:9090

grafana:
	open http://localhost:3000 || xdg-open http://localhost:3000

# ── Health check ─────────────────────────────────────────
health:
	@echo "Gateway:   $$(curl -sf http://localhost:8080/actuator/health 2>/dev/null | python3 -c 'import sys,json; print(json.load(sys.stdin)[\"status\"])' 2>/dev/null || echo 'DOWN')"
	@echo "Auth:      $$(curl -sf http://localhost:8087/actuator/health 2>/dev/null | python3 -c 'import sys,json; print(json.load(sys.stdin)[\"status\"])' 2>/dev/null || echo 'DOWN')"
	@echo "Patient:   $$(curl -sf http://localhost:8081/actuator/health 2>/dev/null | python3 -c 'import sys,json; print(json.load(sys.stdin)[\"status\"])' 2>/dev/null || echo 'DOWN')"
	@echo "EMR:       $$(curl -sf http://localhost:8082/actuator/health 2>/dev/null | python3 -c 'import sys,json; print(json.load(sys.stdin)[\"status\"])' 2>/dev/null || echo 'DOWN')"
	@echo "Pharmacy:  $$(curl -sf http://localhost:8085/actuator/health 2>/dev/null | python3 -c 'import sys,json; print(json.load(sys.stdin)[\"status\"])' 2>/dev/null || echo 'DOWN')"
	@echo "Analytics: $$(curl -sf http://localhost:8086/actuator/health 2>/dev/null | python3 -c 'import sys,json; print(json.load(sys.stdin)[\"status\"])' 2>/dev/null || echo 'DOWN')"
	@echo "USSD:      $$(curl -sf http://localhost:8089/actuator/health 2>/dev/null | python3 -c 'import sys,json; print(json.load(sys.stdin)[\"status\"])' 2>/dev/null || echo 'DOWN')"
