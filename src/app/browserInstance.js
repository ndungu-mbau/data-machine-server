const fs = require('fs')
const rimraf = require('rimraf')

const clearTmp = () => {
    const dirPath = "/tmp/"
    fs.readdir(dirPath, function (err, files) {
        if (err) return console.log(err);
        console.log("tmp has ", files.length, "files")
        if (files.length > 0) {
            files.forEach(function (file) {
                var filePath = dirPath + file;
                fs.stat(filePath, function (err, stat) {
                    if (err) return console.log(err);
                    console.log("unlinking", filePath)
                    fs.unlink(filePath, function (err) {
                        if (err) {
                            rimraf(filePath, function () {
                                // console.log("unlinked dir", filePath)
                            });
                        }
                    });


                    // var livesUntil = new Date();
                    // livesUntil.setHours(livesUntil.getHours() - 1);
                    // if (stat.ctime < livesUntil) {

                    // }
                });
            });
        }
    });
}

const pptr = require('puppeteer');
let instance = null;
const launchOptions = {
    headless: true,
    devTooks: false,
    args: [
        '--headless',
        '--full-memory-crash-report',
        '--no-sandbox',
        '--disk-cache-size=0'
    ],
}

const {CHROME_WS} = process.env

module.exports.getBrowserInstance = async function () {
    if (!instance) {
        clearTmp()
        
        instance = await pptr.connect({ browserWSEndpoint: CHROME_WS });
    }
    return instance;
}