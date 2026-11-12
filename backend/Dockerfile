FROM node:22-alpine

ENV NODE_ENV=production
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY config ./config
COPY routes ./routes
COPY services ./services
COPY templates ./templates
COPY server.js ./

USER node
EXPOSE 8080
CMD ["node", "server.js"]
