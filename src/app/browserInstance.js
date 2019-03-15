const pptr = require('puppeteer');
let instance = null;
const launchOptions = {
    headless: true,
    pipe: true,
    devTooks:false,
    args: [
        '--headless',
        '--full-memory-crash-report',
        '--no-sandbox',
        '--disk-cache-size=0'
    ],
}
module.exports.getBrowserInstance = async function () {
    if (!instance)
        instance = await pptr.launch(launchOptions);
    return instance;
}