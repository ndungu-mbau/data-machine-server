
const { DBURL = "mongodb://localhost:27017/bowdice" } = process.env


const config = {
    production: {
        dbUrl: `mongodb://bowdice_server:0LwB6gsaS8VvKpkNL3Sma@ds219532.mlab.com:19532/bowdice`,
        hashingSecret: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmb28iOiJiYXIiLCJpYXQiOjE1MzQwMzU2NDF9.B20KQXUv3hP873OEbb0lTbb63HrkDjsHNQkRHAHkGJE",
    },
    development: {
        dbUrl: `${DBURL}`,
        hashingSecret: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
    },
    staging: {
        dbUrl: `mongodb://bowdice_server:0LwB6gsaS8VvKpkNL3Sma@ds219532.mlab.com:19532/bowdice`
    }
}



export default config