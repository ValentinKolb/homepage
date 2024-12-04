FROM node:18-alpine AS base
WORKDIR /app

# Kopiere nur package.json und yarn.lock
COPY package*.json yarn.lock ./

# Produktionsabhängigkeiten installieren
FROM base AS prod-deps
RUN yarn install --frozen-lockfile --production

# Entwicklungsabhängigkeiten installieren
FROM base AS build-deps
RUN yarn install --frozen-lockfile

# Build des Projekts
FROM build-deps AS build
COPY . .
RUN yarn build

# Finales Image für Runtime
FROM base AS runtime
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

# Umgebungsvariablen setzen
ENV HOST="::"
ENV PORT=4321

EXPOSE 4321
CMD ["node", "./dist/server/entry.mjs"]