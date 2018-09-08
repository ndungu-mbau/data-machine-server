import "babel-polyfill"

const {
    NODE_ENV = 'development',
    PORT = 4000,
    HOST = '0.0.0.0'
} = process.env

import app from './app';
import http from 'http'

import { ifError } from 'assert'
import server from './graphql';

const start = async () => {
    const httpServer = http.createServer(app);
    server.applyMiddleware({ app });
    server.installSubscriptionHandlers(httpServer);
    httpServer.listen(PORT, HOST, (err) => {
        ifError(err)
        console.log(`Server ${HOST}:${PORT}${server.graphqlPath}`)
    })
}

start().catch(console.log)