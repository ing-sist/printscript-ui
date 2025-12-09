# BUILD
FROM node:20-slim AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

# --- Inyección de Variables de Entorno ---
ARG VITE_FRONTEND_URL
ARG VITE_AUTH0_USERNAME
ARG VITE_AUTH0_PASSWORD

ENV VITE_FRONTEND_URL=$VITE_FRONTEND_URL
ENV VITE_AUTH0_USERNAME=$VITE_AUTH0_USERNAME
ENV VITE_AUTH0_PASSWORD=$VITE_AUTH0_PASSWORD

RUN npm run build

# SERVER
FROM nginx:stable-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=builder /app/dist /usr/share/nginx/html

# Exponemos el puerto 80 (el que Nginx usa)
EXPOSE 80

# Comando para correr Nginx
CMD ["nginx", "-g", "daemon off;"]