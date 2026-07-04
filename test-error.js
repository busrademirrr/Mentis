const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));
  
  try {
    await page.goto('http://localhost:8081/profile', { waitUntil: 'networkidle0', timeout: 15000 });
    console.log("Navigation finished");
  } catch (e) {
    console.log('Navigation error:', e.message);
  }
  
  await browser.close();
})();
