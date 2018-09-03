import { ApolloServer, gql } from 'apollo-server-express';
import { typeQueries, queryRoot } from "./queries"
import { typeMutations, mutationRoot } from "./mutations"
import jwt from 'jsonwebtoken';
import config from "../config";

const {
    NODE_ENV = 'development',
} = process.env

// const { graph: queriesGraph, root: queriesRoot } = queries
// const { graph: mutationsGraph, root: mutationsRoot } = mutations
// const { graph: subscriptionsGraph, root: subscriptionsRoot } = subscriptions

var typeDefs = gql`
    ${typeQueries},
    ${typeMutations}
`

const resolvers = Object.assign({}, queryRoot.Nested, {
    Query: queryRoot.Query,
    Mutation: mutationRoot
})

const datastore = config[NODE_ENV].datastore;

const myAuthenticationLookup = req => jwt.verify(req.headers.auth, config[NODE_ENV].hashingSecret);

const context = ({ req }) => {
    if(!req.headers.auth)
        throw new Error("Please provide auth headers");

    const user = myAuthenticationLookup(req);

    if (!user) {
        throw new Error("Authentification failed, please log in");
    }

    return {
        user,
        datastore
    }
};

const server = new ApolloServer({ typeDefs, resolvers, context });

export default server