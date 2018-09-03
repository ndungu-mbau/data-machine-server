FROM node:latest
WORKDIR /usr/src/app
RUN apk update && apk upgrade && \
apk add --no-cache python make g++

RUN yarn global add nodemon
COPY . .
RUN npm i
RUN npm run build
