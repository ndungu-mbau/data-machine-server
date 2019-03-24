const pptr = require('puppeteer');

let instance = null;

const { CHROME_WS } = process.env;

const connect = async () => {
  instance = await pptr.connect({
    browserWSEndpoint: CHROME_WS,
  });
  instance.on('disconnected', () => {
    connect();
  });
  return instance;
};

// eslint-disable-next-line func-names
module.exports.getBrowserInstance = async function () {
  if (!instance) {
    instance = await connect();
  }
  return instance;
};
