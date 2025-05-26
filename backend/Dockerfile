# Backend Dockerfile
FROM node:18

WORKDIR /app

ENV NODE_ENV=development

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5000

CMD ["sh", "-c", "npx nodemon server.js || node server.js"]


