# chaipalaka.com — local deploy targets
#
# Deployment is local-only for v1 (no CI). Run from this directory.
# Requires SSH access to the Hetzner box configured in `~/.ssh/config`
# under the host alias `chaipalaka` (recommended) — or override SSH_HOST below.

SSH_HOST       ?= chaipalaka
WEB_REMOTE_DIR ?= /var/www/chaipalaka
ASSETS_REMOTE_DIR ?= /var/www/chaipalaka/assets
API_SERVICE    ?= chaipalaka-api

WEB_DIR    := web
API_DIR    := api
ASSETS_DIR := assets

.PHONY: help deploy deploy-web deploy-api assets-sync web-install web-build web-dev web-test api-install api-test api-typecheck api-dev clean

help:
	@echo "Targets:"
	@echo "  deploy        — deploy-web + deploy-api"
	@echo "  deploy-web    — build web/ and rsync dist/ to $(SSH_HOST):$(WEB_REMOTE_DIR)"
	@echo "  deploy-api    — build api/ (bake BUILD_SHA), rsync, restart $(API_SERVICE)"
	@echo "  assets-sync   — rsync local assets/ to $(SSH_HOST):$(ASSETS_REMOTE_DIR)"
	@echo "  web-install   — npm install inside web/"
	@echo "  web-build     — build web/ locally (dist/ output)"
	@echo "  web-dev       — run vite dev server"
	@echo "  web-test      — run vitest in web/"
	@echo "  api-install   — bun install inside api/"
	@echo "  api-test      — run vitest in api/"
	@echo "  api-typecheck — tsc --noEmit in api/"
	@echo "  api-dev       — run the Bun API in watch mode locally"
	@echo "  clean         — remove web/dist, web/node_modules, api/dist, api/node_modules"

deploy: deploy-web deploy-api

deploy-web:
	cd $(WEB_DIR) && npm ci && npm run build
	rsync -avz --delete \
		--exclude='assets/' \
		$(WEB_DIR)/dist/ \
		$(SSH_HOST):$(WEB_REMOTE_DIR)/
	@echo "deploy-web complete → https://www.chaipalaka.com"

deploy-api:
	@BUILD_SHA=$$(git rev-parse --short HEAD); \
	echo "Building api/ (BUILD_SHA=$$BUILD_SHA)..."; \
	cd $(API_DIR) && bun install --frozen-lockfile && \
	bun build --compile --target=bun-linux-x64 --outfile dist/server src/server.ts \
		--define "process.env.BUILD_SHA=\"$$BUILD_SHA\""
	rsync -avz --delete $(API_DIR)/dist/ $(SSH_HOST):/opt/chaipalaka-api/
	ssh $(SSH_HOST) "sudo systemctl restart $(API_SERVICE)"
	@echo "deploy-api complete"

assets-sync:
	@if [ ! -d $(ASSETS_DIR) ]; then \
		echo "assets-sync: $(ASSETS_DIR)/ does not exist — nothing to sync"; \
		exit 0; \
	fi
	rsync -avz --delete \
		$(ASSETS_DIR)/ \
		$(SSH_HOST):$(ASSETS_REMOTE_DIR)/

web-install:
	cd $(WEB_DIR) && npm install

web-build:
	cd $(WEB_DIR) && npm run build

web-dev:
	cd $(WEB_DIR) && npm run dev

web-test:
	cd $(WEB_DIR) && npm run test

api-install:
	cd $(API_DIR) && bun install

api-test:
	cd $(API_DIR) && bun run test

api-typecheck:
	cd $(API_DIR) && bun run typecheck

api-dev:
	cd $(API_DIR) && bun run dev

clean:
	rm -rf $(WEB_DIR)/dist $(WEB_DIR)/node_modules $(API_DIR)/dist $(API_DIR)/node_modules
