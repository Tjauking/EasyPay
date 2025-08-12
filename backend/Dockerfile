FROM node:20-alpine
WORKDIR /app

COPY package.json package-lock.json* tsconfig.json ./
RUN npm ci || npm install

COPY src ./src
COPY openapi.yaml ./openapi.yaml

RUN npm run build
EXPOSE 8080
CMD ["npm", "run", "start"]