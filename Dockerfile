# BUILD
FROM node:20-slim AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

# --- Inyección de Variables de Entorno ---
ARG VITE_AUTH0_DOMAIN
ARG VITE_AUTH0_CLIENT_ID
ARG VITE_AUTH0_AUDIENCE
ARG VITE_BACKEND_URL
ARG VITE_FRONTEND_URL
ARG USERNAME
ARG TOKEN

# Convertirlos en variables de entorno para el build
ENV VITE_AUTH0_DOMAIN=$VITE_AUTH0_DOMAIN
ENV VITE_AUTH0_CLIENT_ID=$VITE_AUTH0_CLIENT_ID
ENV VITE_AUTH0_AUDIENCE=$VITE_AUTH0_AUDIENCE
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL
ENV VITE_FRONTEND_URL=$VITE_FRONTEND_URL
ENV USERNAME=$USERNAME
ENV TOKEN=$TOKEN

RUN npm run build

# SERVER
FROM nginx:stable-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=builder /app/dist /usr/share/nginx/html

# Exponemos el puerto 80 (el que Nginx usa)
EXPOSE 80

# Comando para correr Nginx
CMD ["nginx", "-g", "daemon off;"]