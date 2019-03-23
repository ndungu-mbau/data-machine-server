import { ApolloServer, gql } from 'apollo-server-express';
import jwt from 'jsonwebtoken';
import { MongoClient, ObjectId } from 'mongodb';
import bunyan from 'bunyan';

import { typeQueries, queryRoot } from './queries';
import { typeMutations, mutationRoot } from './mutations';

import config from '../config';

const log = bunyan.createLogger({ name: 'app' });

const {
  NODE_ENV = 'development',
} = process.env;

const typeDefs = gql`
    ${typeQueries},
    ${typeMutations}
`;

const resolvers = Object.assign({}, queryRoot.Nested, {
  Query: queryRoot.Query,
  Mutation: mutationRoot,
});

let db;

MongoClient.connect(config[NODE_ENV].db.url, { useNewUrlParser: true }, (err, client) => {
  if (err) throw err;
  db = client.db(config[NODE_ENV].db.name);
});

const myAuthenticationLookup = req => {
  try {
    return jwt.verify(req.headers.auth, config[NODE_ENV].hashingSecret)
  } catch (err) {

    try {
      return jwt.verify(req.headers.auth, config[NODE_ENV].managementHashingSecret)
    } catch (err) {
      throw err
    }
  }
};

const context = ({ req }) => {
  if (req.headers.auth) {
    const user = myAuthenticationLookup(req);

    if (!user) {
      throw new Error('Authentification failed, please log in');
    }

    return {
      user,
      db,
      log,
      ObjectId,
    };
  }

  throw new Error('Please provide auth headers');
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context,
  formatError(error) {
    if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
      log.error(error);
    }
    return error;
  },
});

export default server;
