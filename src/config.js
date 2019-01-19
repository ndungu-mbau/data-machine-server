
const { DB_URL: url = 'mongodb://localhost:27017' } = process.env;


const config = {
  production: {
    db: {
      name: 'boowdice',
      url,
    },
    hashingSecret: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmb28iOiJiYXIiLCJpYXQiOjE1MzQwMzU2NDF9.B20KQXUv3hP873OEbb0lTbb63HrkDjsHNQkRHAHkGJE',
  },
  test: {
    db: {
      name: 'databank_test',
      url,
    },
    hashingSecret: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
  },
  development: {
    db: {
      name: 'databank_dev',
      url,
    },
    hashingSecret: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
  },
  staging: {
    db: {
      name: 'databank_staging',
      url,
    },
    hashingSecret: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
  },
};

export default config;
