require('dotenv').config()
import 'babel-polyfill';
import 'source-map-support/register'
import http from 'http';
import { ifError } from 'assert';


import server from './graphql';
import app from './app';
import config from "./config"

const {
  PORT = 4000,
  HOST = '0.0.0.0',
  NODE_ENV = 'development'
} = process.env;

const httpServer = http.createServer(app);

server.applyMiddleware({ app });
server.installSubscriptionHandlers(httpServer);

if (NODE_ENV !== 'test')
  httpServer.listen(PORT, HOST, (err) => {
    ifError(err);
    console.log(`Server ${HOST}:${PORT}${server.graphqlPath}`);
  });

export {
  httpServer,
  config
}
