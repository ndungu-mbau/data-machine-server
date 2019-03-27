
const { NATS_URL, LOG_LEVEL = 'silent' } = process.env;

const Hemera = require('nats-hemera');
const nats = require('nats').connect({
  url: NATS_URL,
});

const hemera = new Hemera(nats, {
  logLevel: LOG_LEVEL,
  bloomrun: {
    indexing: 'insertion',
  },
});


export default function emit({ action, data }) {
  hemera.act({
    pubsub$: true,
    topic: 'ACTION_EMMISION',
    cmd: action,
    data,
  });
}
