FROM node:latest

WORKDIR /app/server

COPY package.json .

RUN npm install

COPY . .

EXPOSE 8001

CMD [ "npm","start" ]