FROM node:20-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci --only=production

FROM node:20-alpine

WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY ./src ./src

EXPOSE 3000

CMD [ "node", "src/server.js" ]