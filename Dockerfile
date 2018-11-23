FROM node:latest
RUN yarn global add parcel
COPY . .
RUN yarn
RUN yarn build
