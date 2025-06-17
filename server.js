const express = require('express');
const puppeteer = require('puppeteer');
const app = express();
const PORT = process.env.PORT || 3000;
const GIFEncoder = require('gifencoder');
const { createCanvas, loadImage } = require('canvas');

app.use(express.static('public'));

app.get('/countdown.gif', async (req, res) => {
    const width = 500;
    const height = 200;
    const encoder = new GIFEncoder(width, height);
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    const streamChunks = [];

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();
        await page.goto(`http://localhost:${PORT}/index.html`, { waitUntil: 'networkidle0' });

        const gifStream = encoder.createReadStream();
        gifStream.on('data', chunk => streamChunks.push(chunk));
        gifStream.on('end', () => {
            res.set('Content-Type', 'image/gif');
            res.send(Buffer.concat(streamChunks));
        });

        encoder.start();
        encoder.setRepeat(0); // loop forever
        encoder.setDelay(1000); // 1 second per frame
        encoder.setQuality(10);

        for (let i = 0; i < 10; i++) {
            await page.evaluate(() => {
                if (typeof updateCountdown === 'function') {
                    updateCountdown();
                }
            });

            const screenshot = await page.screenshot({ encoding: 'base64' });
            const img = await loadImage(Buffer.from(screenshot, 'base64'));

            ctx.clearRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);

            encoder.addFrame(ctx);

            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        encoder.finish();
    } catch (err) {
        console.error('Error generating GIF:', err);
        res.status(500).send('Error generating countdown GIF');
    } finally {
        await browser.close();
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
