.PHONY: help dev up down build restart migrate seed logs shell install

help:
	@echo ""
	@echo "  DEVELOPMENT (local, hot reload):"
	@echo "  make dev      — start DB in Docker, run backend + frontends locally"
	@echo "  make down     — stop DB container"
	@echo ""
	@echo "  PRODUCTION (full Docker):"
	@echo "  make up       — build and start all 4 services in Docker"
	@echo "  make restart  — rebuild and restart"
	@echo "  make down     — stop everything"
	@echo ""
	@echo "  DATABASE:"
	@echo "  make migrate  — run alembic migrations"
	@echo "  make seed     — seed admin + demo data"
	@echo ""
	@echo "  OTHER:"
	@echo "  make install  — install all dependencies locally"
	@echo "  make logs     — follow Docker logs"
	@echo "  make shell    — open shell inside backend container"
	@echo ""

# ── Local development ─────────────────────────────────────
# Starts only DB in Docker, runs backend and frontends as local processes with hot reload

dev:
	docker compose up -d db
	@echo "Starting backend on http://localhost:8870 ..."
	@start cmd /k "cd backend && uv run uvicorn app.main:app --reload --port 8870"
	@echo "Starting frontend on http://localhost:3180 ..."
	@start cmd /k "cd frontend && npm run dev"
	@echo "Starting admin on http://localhost:3181 ..."
	@start cmd /k "cd admin-frontend && npm run dev"
	@echo ""
	@echo "  Patient app:  http://localhost:3180"
	@echo "  Admin panel:  http://localhost:3181"
	@echo "  API docs:     http://localhost:8870/docs"
	@echo ""

# ── Full Docker stack ─────────────────────────────────────
up:
	docker compose up -d
	@echo ""
	@echo "  Patient app:  http://localhost:3180"
	@echo "  Admin panel:  http://localhost:3181"
	@echo "  API docs:     http://localhost:8870/docs"
	@echo ""

down:
	docker compose down

build:
	docker compose build

restart: down build up

# ── Database ──────────────────────────────────────────────
migrate:
	cd backend && uv run alembic upgrade head

seed:
	cd backend && uv run python scripts/seed_admin.py
	cd backend && uv run python scripts/seed_demo.py

# ── Other ─────────────────────────────────────────────────
logs:
	docker compose logs -f

shell:
	docker compose exec backend sh

install:
	cd backend && uv sync
	cd frontend && npm install
	cd admin-frontend && npm install
