FROM node:latest
WORKDIR /usr/src/app
RUN yarn global add nodemon
COPY . .
RUN npm i
RUN npm run build
