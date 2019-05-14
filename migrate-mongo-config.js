const config = require('./src/config');

const { NODE_ENV = 'development' } = process.env;

module.exports = {
  mongodb: {
    // TODO Change (or review) the url to your MongoDB:
    url: config[NODE_ENV].db.url,

    // TODO Change this to your database name:
    databaseName: config[NODE_ENV].db.name,

    options: {
      useNewUrlParser: true, // removes a deprecation warning when connecting
      //   connectTimeoutMS: 3600000, // increase connection timeout to 1 hour
      //   socketTimeoutMS: 3600000, // increase socket timeout to 1 hour
    },
  },

  // The migrations dir, can be an relative or absolute path. Only edit this when really necessary.
  migrationsDir: 'migrations',

  // The mongodb collection where the applied changes are stored. Only edit this when really necessary.
  changelogCollectionName: 'changelog',
};
