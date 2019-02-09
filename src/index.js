import 'babel-polyfill';
import 'source-map-support/register';
import http from 'http';
import { ifError } from 'assert';

import server from './graphql';
import app from './app';
import config from './config';

const {
  PORT = 4000,
  HOST = '0.0.0.0',
  NODE_ENV = 'development',
  LOG_LEVEL,
} = process.env;

const httpServer = http.createServer(app);

server.applyMiddleware({ app, path: ['/graphql', '/'] });
server.installSubscriptionHandlers(httpServer);

if (NODE_ENV !== 'test') {
  httpServer.listen(PORT, HOST, (err) => {
    ifError(err);
    // eslint-disable-next-line no-console
    console.log(`
    🔧  Configured for ${NODE_ENV}.
      => address: ${HOST}
      => port: ${PORT}
      => log: ${LOG_LEVEL}
      => DB_URL: ${config[NODE_ENV].db.url}
  
    🚀  "graph.braiven.io" has launched on http://${HOST}:${PORT}
    `);
  });
}

export {
  httpServer,
  config,
};
