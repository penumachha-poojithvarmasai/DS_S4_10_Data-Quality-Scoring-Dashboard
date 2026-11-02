const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const FRAMES_DIR = path.join(__dirname, 'frames');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

(async () => {
  if (!fs.existsSync(FRAMES_DIR)) {
    fs.mkdirSync(FRAMES_DIR, { recursive: true });
  }

  // Clear older frames
  const files = fs.readdirSync(FRAMES_DIR);
  for (const file of files) {
    fs.unlinkSync(path.join(FRAMES_DIR, file));
  }

  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--window-size=1600,1000', '--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1000 });

  let frameCount = 0;
  async function recordStep(durationMs = 800, fps = 4) {
    const totalFrames = Math.max(1, Math.round((durationMs / 1000) * fps));
    const delay = Math.round(durationMs / totalFrames);
    for (let i = 0; i < totalFrames; i++) {
      const buffer = await page.screenshot({ type: 'jpeg', quality: 90 });
      const filename = path.join(FRAMES_DIR, `frame_${String(frameCount).padStart(5, '0')}.jpg`);
      fs.writeFileSync(filename, buffer);
      frameCount++;
      await sleep(delay);
    }
  }

  console.log('Navigating to dashboard...');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });
  await sleep(1500);

  // 1. Overview tab & Initial Score
  console.log('Recording: Initial Overview...');
  await recordStep(2500, 4);

  // Smooth scroll down to charts
  console.log('Recording: Scrolling through Analytics...');
  await page.evaluate(() => window.scrollBy({ top: 400, behavior: 'smooth' }));
  await recordStep(2000, 4);
  await page.evaluate(() => window.scrollBy({ top: 400, behavior: 'smooth' }));
  await recordStep(2000, 4);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  await recordStep(1500, 4);

  // 2. Change Domain preset to Healthcare
  console.log('Recording: Changing domain preset...');
  const domainButtons = await page.$$('button');
  for (const btn of domainButtons) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text && text.toLowerCase().includes('healthcare')) {
      await btn.click();
      break;
    }
  }
  await recordStep(2500, 4);

  // 3. Switch to Remediation Tab
  console.log('Recording: Remediation Tab...');
  for (const btn of domainButtons) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text && (text.includes('Remediation') || text.includes('Clean'))) {
      await btn.click();
      break;
    }
  }
  await sleep(1000);
  await recordStep(3000, 4);

  // Scroll in remediation
  await page.evaluate(() => window.scrollBy({ top: 350, behavior: 'smooth' }));
  await recordStep(2000, 4);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  await recordStep(1000, 4);

  // 4. Switch to Comparison Tab
  console.log('Recording: Comparison Tab...');
  const navButtons = await page.$$('button');
  for (const btn of navButtons) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text && text.includes('Compare')) {
      await btn.click();
      break;
    }
  }
  await sleep(1000);
  await recordStep(3000, 4);

  // 5. Switch to Data Explorer
  console.log('Recording: Data Explorer...');
  const navButtons2 = await page.$$('button');
  for (const btn of navButtons2) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text && (text.includes('Explorer') || text.includes('Preview') || text.includes('Table'))) {
      await btn.click();
      break;
    }
  }
  await sleep(1000);
  await recordStep(2500, 4);

  // 6. Back to Overview
  const navButtons3 = await page.$$('button');
  for (const btn of navButtons3) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text && (text.includes('Overview') || text.includes('Dashboard'))) {
      await btn.click();
      break;
    }
  }
  await sleep(1000);
  await recordStep(2500, 4);

  console.log(`Finished recording ${frameCount} frames.`);
  await browser.close();
})();

