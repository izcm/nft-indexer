FROM node:22

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 5000
EXPOSE 5001

CMD ["npm", "start"]