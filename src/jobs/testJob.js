export default {
  name: 'TEST_JOB',
  schedule: '* * * * *',
  emediate: false,
  async work() {
    // console.log('running a task every minute');
  },
  opts: {
    schedule: true,
  },
};
