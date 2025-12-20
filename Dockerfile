# Build stage
FROM node:20-slim AS build

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Build-time argument for Gemini API Key
ARG GEMINI_API_KEY
ENV GEMINI_API_KEY=$GEMINI_API_KEY

RUN npm run build

# Production stage
FROM node:20-slim

WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/package*.json ./
# Install only production dependencies if needed (for a simple static server)
RUN npm install pnpm -g && npm install -g serve

EXPOSE 8080

# Serve the static files on port 8080 (Cloud Run's default)
CMD ["serve", "-s", "dist", "-l", "8080"]
