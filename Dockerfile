# Frontend Alteha (Next.js) — imagen para el despliegue QA con Docker.
# El .env.local de QA vive en el worktree del servidor (no está en git) y se
# copia al build para que las variables NEXT_PUBLIC_* queden inline.

FROM node:20-alpine
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
# El backend QA usa un certificado que no valida por hostname (igual que el
# package.json: NODE_TLS_REJECT_UNAUTHORIZED=0 en build/start)
ENV NODE_TLS_REJECT_UNAUTHORIZED=0
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
ENV PORT=3100
EXPOSE 3100
CMD ["npx", "next", "start", "-p", "3100"]
