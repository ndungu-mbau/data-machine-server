import 'babel-polyfill';
import 'source-map-support/register'
import http from 'http';
import { ifError } from 'assert';

import server from './graphql';
import app from './app';

const {
  PORT = 4000,
  HOST = '0.0.0.0',
} = process.env;

const httpServer = http.createServer(app);

server.applyMiddleware({ app });
server.installSubscriptionHandlers(httpServer);
httpServer.listen(PORT, HOST, (err) => {
  ifError(err);
  console.log(`Server ${HOST}:${PORT}${server.graphqlPath}`);
});

export default httpServer
