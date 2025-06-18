const express = require('express');
const chromium = require('chrome-aws-lambda');
const { readFileSync } = require('fs');
const { join } = require('path');

const app = express();
const port = process.env.PORT || 10000;

app.get('/', async (req, res) => {
  const targetDate = new Date('2025-11-04T05:00:00Z'); // 12AM EST
  const now = new Date();
  const diff = Math.max(0, targetDate - now);

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  const browser = await chromium.puppeteer.launch({
    args: chromium.args,
    defaultViewport: { width: 300, height: 100 },
    executablePath: await chromium.executablePath,
    headless: chromium.headless,
  });

  const page = await browser.newPage();

  await page.setContent(`
    <html>
      <body style="margin:0; background:black; color:white; font-family: sans-serif; font-size: 28px; display: flex; align-items:center; justify-content:center; width: 100%; height: 100%;">
        ${days} | ${hours} | ${minutes} | ${seconds}
      </body>
    </html>
  `);

  const buffer = await page.screenshot({ type: 'png' });

  await browser.close();

  res.setHeader('Content-Type', 'image/png');
  res.send(buffer);
});

app.listen(port, () => {
  console.log(`✅ Server running on port ${port}`);
});
