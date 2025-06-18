const express = require('express');
const puppeteer = require('puppeteer');
const GIFEncoder = require('gifencoder');
const { createCanvas, loadImage } = require('canvas');

const app = express();
const PORT = process.env.PORT || 3000;
const width = 500;
const height = 200;

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.get('/countdown.gif', async (req, res) => {
  const encoder = new GIFEncoder(width, height);
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  const chunks = [];

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.goto(`http://localhost:${PORT}`, { waitUntil: 'networkidle0' });

    const gifStream = encoder.createReadStream();
    gifStream.on('data', chunk => chunks.push(chunk));
    gifStream.on('end', () => {
      res.setHeader('Content-Type', 'image/gif');
      res.send(Buffer.concat(chunks));
    });

    encoder.start();
    encoder.setRepeat(0);
    encoder.setDelay(1000);
    encoder.setQuality(10);

    for (let i = 0; i < 10; i++) {
      await page.evaluate(() => {
        if (typeof updateCountdown === 'function') updateCountdown();
      });

      const screenshot = await page.screenshot({ encoding: 'base64' });
      const image = await loadImage(Buffer.from(screenshot, 'base64'));

      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(image, 0, 0, width, height);
      encoder.addFrame(ctx);

      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    encoder.finish();
  } catch (err) {
    console.error('GIF generation error:', err);
    res.status(500).send('Error generating GIF');
  } finally {
    await browser.close();
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
