import puppeteer from 'puppeteer-core';
import path from 'path';

const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const artifactDir = '/Users/tungpv/.gemini/antigravity-ide/brain/f573ecdf-b7d7-4cd0-a4d0-61fb2ab6f75d';

async function captureModalBottom() {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  await page.goto('http://localhost:4173/', { waitUntil: 'domcontentloaded', timeout: 10000 });
  await new Promise(r => setTimeout(r, 800));

  await page.type('input[type="email"]', 'phamtunghcm@gmail.com');
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 1200));

  const menuButtons = await page.$$('button, a');
  for (const item of menuButtons) {
    const text = await page.evaluate(el => el.textContent || '', item);
    if (text.includes('Nhân sự') || text.includes('Quản Trị Nhân Sự')) {
      await item.click();
      await new Promise(r => setTimeout(r, 1000));
      break;
    }
  }

  const editBtns = await page.$$('button[title*="Chỉnh sửa"]');
  if (editBtns.length > 0) {
    await editBtns[0].click();
    await new Promise(r => setTimeout(r, 1000));

    // Cuộn form xuống dưới
    await page.evaluate(() => {
      const form = document.querySelector('form');
      if (form) {
        form.scrollTop = form.scrollHeight;
      }
    });

    await new Promise(r => setTimeout(r, 600));

    const bottomImg = path.join(artifactDir, 'step5_modal_bottom_kpi_preview.png');
    await page.screenshot({ path: bottomImg });
    console.log('Đã chụp ảnh phần dưới của Modal:', bottomImg);
  }

  await browser.close();
}

captureModalBottom().catch(console.error);
