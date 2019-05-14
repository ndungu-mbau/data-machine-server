FROM node:latest
COPY . .
RUN yarn
RUN yarn global add migrate-mongo
RUN yarn build
