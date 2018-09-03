FROM node:latest
WORKDIR /usr/src/app
RUN yarn global add parcel nodemon
COPY . .
RUN yarn
RUN yarn build
