const puppeteer = require('puppeteer');

let bookingUrl = `http://localhost:3000/printable/questionnnaire/5c7d3c51602576311060601c/answer/5c7d4e19a6fca965df916b01`

const start = async () => {
    const browser = await puppeteer.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
        ]
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 926 });
    await page.goto(bookingUrl, { waitUntil: 'networkidle0' });

    await page.pdf({ path: 'pupeteerDoc.pdf', format: 'A4' })
    await browser.close()
}

start().catch(console.log)