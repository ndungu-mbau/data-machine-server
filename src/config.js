
const { DBURL = 'mongodb://localhost:27017' } = process.env;


const config = {
  production: {
    db: {
      name: 'boowdice',
      url: 'mongodb://databank_server:n16dXUWGHiLT@ds149732.mlab.com:49732',
    },
    hashingSecret: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmb28iOiJiYXIiLCJpYXQiOjE1MzQwMzU2NDF9.B20KQXUv3hP873OEbb0lTbb63HrkDjsHNQkRHAHkGJE',
  },
  test: {
    db: {
      name: 'databank_test',
      url: `${DBURL}`,
    },
    hashingSecret: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
  },
  development: {
    db: {
      name: 'databank_dev',
      url: `${DBURL}`,
    },
    hashingSecret: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
  },
  staging: {
    name: 'databank_staging',
    dbUrl: 'mongodb://bowdice_server:0LwB6gsaS8VvKpkNL3Sma@ds219532.mlab.com:19532',
  },
};

export default config;
