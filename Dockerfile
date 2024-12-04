# Wir wählen eine spezifische Node-Version statt 'lts'
FROM node:18-alpine AS base

# Setzen des Arbeitsverzeichnisses
WORKDIR /app

# Kopieren der Package-Dateien
COPY package*.json ./

# Entwicklungsabhängigkeiten Installation
FROM base AS build-deps
RUN npm ci

# Quellcode kopieren und Build durchführen
FROM build-deps AS build
COPY . .
RUN npm run build

# Produktions-Image
FROM base AS runtime

# Nur die notwendigen Build-Artefakte kopieren
COPY --from=build /app/dist ./dist
COPY --from=build /app/package*.json ./

# Produktionsabhängigkeiten installieren
RUN npm ci --omit=dev

# Konfiguration für den Server
ENV HOST=0.0.0.0
ENV PORT=4321
EXPOSE 4321

# Anwendung starten
CMD ["node", "./dist/server/entry.mjs"]