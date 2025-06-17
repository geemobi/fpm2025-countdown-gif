const express = require('express');
const puppeteer = require('puppeteer');
const app = express();
const PORT = process.env.PORT || 3000;
const GIFEncoder = require('gifencoder'); // updated dependency
const { createCanvas, loadImage } = require('canvas');

app.use(express.static('public'));

app.get('/countdown.gif', async (req, res) => {
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.goto('http://localhost:' + PORT + '/index.html', { waitUntil: 'networkidle0' });

    const width = 500;
    const height = 200;
    const encoder = new GIFEncoder(width, height);
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    const streamChunks = [];

    encoder.createReadStream().on('data', chunk => streamChunks.push(chunk));
    encoder.createReadStream().on('end', () => {
        res.set('Content-Type', 'image/gif');
        res.send(Buffer.concat(streamChunks));
        browser.close();
    });

    encoder.start();
    encoder.setRepeat(0); // 0 = repeat forever
    encoder.setDelay(1000); // 1 second per frame
    encoder.setQuality(10);

    for (let i = 0; i < 10; i++) {
        await page.evaluate(() => updateCountdown());
        const screenshot = await page.screenshot({ encoding: 'base64' });
        const img = await loadImage(Buffer.from(screenshot, 'base64'));

        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        encoder.addFrame(ctx);

        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    encoder.finish();
});

app.listen(PORT, () => {
    console.log('Server running on port', PORT);
});
