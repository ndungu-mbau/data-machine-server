import cron from 'node-cron';
import config from '../config'

export default {
    name: "TEST_JOB",
    schedule: '* * * * *',
    async work({ db }) {
        console.log('running a task every minute');
        // const col = db.collection('user');
        // Show that duplicate records got dropped
        // const users = await col.find({}).toArray();
        // console.log({ users: users.length })
    },
    opts: {
        schedule: true
    }
}