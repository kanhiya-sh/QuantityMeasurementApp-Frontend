# Stage 1 — Build Angular app with production configuration
FROM node:20-alpine AS build
WORKDIR /app

# Copy package files first for layer caching
COPY package*.json ./
RUN npm ci

# Copy source and build with production config
# --configuration=production swaps environment.ts → environment.prod.ts
COPY . .
RUN npm run build -- --configuration=production

# Stage 2 — Serve with Nginx
FROM nginx:alpine
COPY --from=build /app/dist/quantify-x/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
