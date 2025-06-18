const express = require('express');
const chromium = require('chrome-aws-lambda');
const GIFEncoder = require('gifencoder');
const { createCanvas, loadImage } = require('canvas');

const app = express();
const PORT = process.env.PORT || 10000;
const WIDTH = 500;
const HEIGHT = 150;

app.get('/countdown.gif', async (req, res) => {
  const encoder = new GIFEncoder(WIDTH, HEIGHT);
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');

  const chunks = [];

  const browser = await chromium.puppeteer.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath,
    headless: chromium.headless,
    defaultViewport: { width: WIDTH, height: HEIGHT }
  });

  const page = await browser.newPage();

  encoder.start();
  encoder.setRepeat(0); // infinite loop
  encoder.setDelay(1000); // 1 second/frame
  encoder.setQuality(10);

  for (let i = 0; i < 10; i++) {
    const targetDate = new Date('2025-11-04T05:00:00Z');
    const now = new Date();
    const diff = Math.max(0, targetDate - now);

    const days = String(Math.floor(diff / (1000 * 60 * 60 * 24))).padStart(2, '0');
    const hours = String(Math.floor((diff / (1000 * 60 * 60)) % 24)).padStart(2, '0');
    const minutes = String(Math.floor((diff / (1000 * 60)) % 60)).padStart(2, '0');
    const seconds = String(Math.floor((diff / 1000) % 60)).padStart(2, '0');

    await page.setContent(`
      <html>
        <body style="margin:0;background:black;color:white;font-size:40px;display:flex;justify-content:center;align-items:center;height:100%;width:100%;font-family:sans-serif;">
          ${days} | ${hours} | ${minutes} | ${seconds}
        </body>
      </html>
    `);

    const screenshot = await page.screenshot({ encoding: 'base64' });
    const image = await loadImage(Buffer.from(screenshot, 'base64'));

    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    ctx.drawImage(image, 0, 0, WIDTH, HEIGHT);
    encoder.addFrame(ctx);
  }

  await browser.close();
  encoder.finish();

  encoder.createReadStream()
    .on('data', chunk => chunks.push(chunk))
    .on('end', () => {
      res.setHeader('Content-Type', 'image/gif');
      res.send(Buffer.concat(chunks));
    });
});

app.get('/', (req, res) => {
  res.send('Visit <code>/countdown.gif</code> to see the dynamic countdown.');
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
