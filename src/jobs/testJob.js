export default {
  name: 'TEST_JOB',
  schedule: '* * * * *',
  emediate: false,
  async work({ log }) {
    log.info('running a task every minute');
  },
  opts: {
    schedule: true,
  },
};
