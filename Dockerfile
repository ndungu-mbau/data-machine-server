FROM node:latest
WORKDIR /usr/src/app
ENV NODE_TLS_REJECT_UNAUTHORIZED=0
RUN yarn global add nodemon
COPY . .
RUN npm i
RUN npm run build
