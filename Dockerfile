FROM node:latest
WORKDIR /usr/src/app
RUN yarn global add nodemon
COPY . .
RUN rm -rf ~/.node-gyp
RUN rm  ~/.npmrc
RUN npm i
RUN npm run build
