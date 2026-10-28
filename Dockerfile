# syntax=docker/dockerfile:1

# Build the static bundle. Debian (glibc) base: the native toolchain binaries
# (rolldown, lightningcss, typescript 7) are published for linux-x64-gnu.
FROM node:24-slim AS build
WORKDIR /app
# No git checkout in the image, so skip installing the husky hooks.
ENV HUSKY=0
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci
COPY . .
RUN npm run build

# Serve the bundle; no Node at runtime.
FROM nginx:stable-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
