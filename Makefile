install:
	npm ci

develop:
	NODE_ENV=development npx webpack serve

lint:
	npx eslint

build:
	NODE_ENV=production npx webpack
