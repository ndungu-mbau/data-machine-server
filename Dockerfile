FROM node:latest
COPY . .
RUN yarn
RUN yarn build
