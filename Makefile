.PHONY: install dev build test lint clean db-start db-push db-reset db-types docker-build deploy

install:
	pnpm install

dev:
	pnpm dev

build:
	pnpm build

test:
	pnpm test

lint:
	pnpm lint

typecheck:
	pnpm typecheck

clean:
	pnpm clean

db-start:
	pnpm db:start

db-push:
	pnpm db:push

db-reset:
	pnpm db:reset

db-types:
	pnpm db:types

docker-build:
	docker build -f vps/Dockerfile -t flowfinance-web:local .

deploy:
	bash vps/scripts/deploy.sh
