
const { DB_URL: url = 'mongodb://localhost:27017/databank_dev' } = process.env;


const config = {
  production: {
    db: {
      url,
    },
    hashingSecret: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmb28iOiJiYXIiLCJpYXQiOjE1MzQwMzU2NDF9.B20KQXUv3hP873OEbb0lTbb63HrkDjsHNQkRHAHkGJE',
    managementHashingSecret: 'eyJhbGcxxxxxxxxxxxxxxxI6IkpXVCJ9.eyJmb28iOiJiYXIiLCJpYXQiOjE1MzQwMzU2NDF9.B20KQXUv3hP873OEbb0lTbb63HrkDjsHNQkRHAHkGJE',
  },
  test: {
    db: {
      url,
    },
    hashingSecret: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
    managementHashingSecret: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
  },
  development: {
    db: {
      url,
    },
    hashingSecret: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
    managementHashingSecret: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
  },
  staging: {
    db: {
      name: 'databank_staging',
      url,
    },
    hashingSecret: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
    managementHashingSecret: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
  },
};

export default config;
