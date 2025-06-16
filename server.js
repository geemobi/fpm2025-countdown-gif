const express = require('express');
const puppeteer = require('puppeteer');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

app.get('/countdown.gif', async (req, res) => {
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.goto('http://localhost:' + PORT + '/index.html', { waitUntil: 'networkidle0' });

    const frames = [];
    for (let i = 0; i < 10; i++) {
        await page.evaluate(() => updateCountdown());
        const screenshot = await page.screenshot({ type: 'png' });
        frames.push(screenshot);
        await new Promise(r => setTimeout(r, 1000));
    }

    const { GifEncoder } = await import('gif-encoder-2');
    const encoder = new GifEncoder(500, 200);
    const chunks = [];
    encoder.on('data', chunk => chunks.push(chunk));
    encoder.on('end', () => {
        res.set('Content-Type', 'image/gif');
        res.send(Buffer.concat(chunks));
        browser.close();
    });

    encoder.start();
    encoder.setRepeat(0);
    encoder.setDelay(1000);
    encoder.setQuality(10);

    for (const frame of frames) {
        encoder.addFrame(frame);
    }

    encoder.finish();
});

app.listen(PORT, () => {
    console.log('Server running on port', PORT);
});
