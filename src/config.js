
const { DBURL = 'mongodb://localhost:27017/bowdice' } = process.env;


const config = {
  production: {
    db: {
      name: 'databank',
      url: 'mongodb://databank_server:n16dXUWGHiLT@ds149732.mlab.com:49732/databank',
    },
    hashingSecret: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmb28iOiJiYXIiLCJpYXQiOjE1MzQwMzU2NDF9.B20KQXUv3hP873OEbb0lTbb63HrkDjsHNQkRHAHkGJE',
  },
  development: {
    db: {
      name: 'besak',
      url: `${DBURL}`,
    },
    hashingSecret: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
  },
  staging: {
    dbUrl: 'mongodb://bowdice_server:0LwB6gsaS8VvKpkNL3Sma@ds219532.mlab.com:19532/bowdice',
  },
};

export default config;
