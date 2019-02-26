import { ApolloServer, gql } from 'apollo-server-express';
import jwt from 'jsonwebtoken';
import { MongoClient, ObjectId } from 'mongodb';

import { typeQueries, queryRoot } from './queries';
import { typeMutations, mutationRoot } from './mutations';
import { graphql, buildSchema } from 'graphql';


import config from '../config';

const {
  NODE_ENV = 'development',
} = process.env;

// const { graph: queriesGraph, root: queriesRoot } = queries
// const { graph: mutationsGraph, root: mutationsRoot } = mutations
// const { graph: subscriptionsGraph, root: subscriptionsRoot } = subscriptions

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

const myAuthenticationLookup = req => jwt.verify(req.headers.auth, config[NODE_ENV].hashingSecret);

const context = ({ req }) => {
  if (req.headers.auth) {
    const user = myAuthenticationLookup(req);

    if (!user) {
      throw new Error('Authentification failed, please log in');
    }

    return {
      user,
      db,
      ObjectId,
    };
  }

  throw new Error('Please provide auth headers');
};

// --------------------------native graphql js-------for internal use
var schema = buildSchema(`
  ${typeQueries},
  ${typeMutations}
`);

var root = {
  Query: {
    hello: () => {
      return 'Hello world!';
    },
  },
  Mutation: {
    honk: () => {
      return 'honk!';
    },
  },
  // bellow works
  // hello: () => {
  //   return 'Hello world!';
  // },
};

// console.log(resolvers)

graphql(schema, `query{
  hello
}`, root).then((response) => {
  console.log(response);
  // { data: { hello: null } }
});

// ----------------------------------------------------------------------

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context,
  formatError(error) {
    if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
      // logging the errors can help in development
      console.error(error);
    }
    return error;
  },
});

export default server;
