import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const artifactDir = '/Users/tungpv/.gemini/antigravity-ide/brain/f573ecdf-b7d7-4cd0-a4d0-61fb2ab6f75d';

async function runVerification() {
  console.log('Khởi động Google Chrome thật...');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  console.log('Mở trang https://hana-pm-hub.pages.dev/ ...');
  await page.goto('https://hana-pm-hub.pages.dev/', { waitUntil: 'networkidle2', timeout: 30000 });

  // Kiểm tra màn hình đăng nhập nếu có
  const loginBtn = await page.$('button');
  if (loginBtn) {
    const btnText = await page.evaluate(el => el.textContent, loginBtn);
    if (btnText && (btnText.includes('Đăng nhập') || btnText.includes('Truy cập'))) {
      console.log('Phát hiện màn hình đăng nhập, thực hiện đăng nhập...');
      await loginBtn.click();
      await page.waitForTimeout(1000);
    }
  }

  // Chờ trang tải và click vào menu Nhân sự hoặc Bảng lương
  console.log('Tìm kiếm menu Bảng Lương hoặc Nhân sự...');
  await page.waitForSelector('body');

  // Tìm nút tab/menu Bảng lương
  const buttons = await page.$$('button, a');
  for (const btn of buttons) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text && (text.includes('Bảng lương') || text.includes('Lương') || text.includes('Nhân sự'))) {
      console.log('Click vào menu:', text.trim());
      await btn.click();
      break;
    }
  }

  await new Promise(r => setTimeout(r, 1500));

  // Kiểm tra số lượng nhân viên trong bảng lương
  const employeeRows = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('table tbody tr'));
    return rows.map(r => {
      const text = r.textContent || '';
      return text.trim();
    }).filter(t => t.length > 0 && !t.includes('Không tìm thấy'));
  });

  console.log(`Tìm thấy ${employeeRows.length} dòng nhân viên trong bảng lương:`);
  employeeRows.forEach((r, idx) => console.log(`  [${idx + 1}] ${r.slice(0, 100)}...`));

  // Chụp ảnh tổng quan bảng lương
  const payrollTableScreenshot = path.join(artifactDir, 'verify_payroll_table_live.png');
  await page.screenshot({ path: payrollTableScreenshot, fullPage: false });
  console.log('Đã chụp ảnh bảng lương:', payrollTableScreenshot);

  // Tìm và click nút "Chỉnh sửa" (pencil icon) của nhân viên đầu tiên
  console.log('Mở modal chỉnh sửa lương nhân viên...');
  const editButtons = await page.$$('button[title*="Chỉnh sửa"]');
  if (editButtons.length > 0) {
    await editButtons[0].click();
    console.log('Đã click nút Chỉnh sửa');
  } else {
    // Thử click vào nút có text hoặc SVG Edit
    const allBtns = await page.$$('table button');
    for (const b of allBtns) {
      const title = await page.evaluate(el => el.getAttribute('title') || '', b);
      if (title.includes('Chỉnh sửa') || title.includes('sửa')) {
        await b.click();
        break;
      }
    }
  }

  await new Promise(r => setTimeout(r, 1000));

  // Kiểm tra các trường trong Modal
  const modalInfo = await page.evaluate(() => {
    const modal = document.querySelector('form');
    if (!modal) return { found: false };

    // Kiểm tra các tiêu đề khối
    const headers = Array.from(modal.querySelectorAll('h4')).map(h => h.textContent?.trim());

    // Kiểm tra ô phụ cấp xăng
    const xangInput = modal.querySelector('input[type="number"][placeholder*="192308"], input[type="number"][placeholder*="500000"], input[type="number"]');
    
    // Tìm tất cả các input
    const inputs = Array.from(modal.querySelectorAll('input')).map(i => ({
      type: i.type,
      value: i.value,
      placeholder: i.placeholder,
    }));

    return {
      found: true,
      headers,
      inputsCount: inputs.length,
      sampleInputs: inputs.slice(0, 8),
    };
  });

  console.log('Thông tin Modal chỉnh sửa lương:', JSON.stringify(modalInfo, null, 2));

  // Chụp ảnh Modal chỉnh sửa lương
  const modalScreenshot = path.join(artifactDir, 'verify_payroll_modal_editable.png');
  await page.screenshot({ path: modalScreenshot, fullPage: false });
  console.log('Đã chụp ảnh modal chỉnh sửa lương:', modalScreenshot);

  await browser.close();
  console.log('Hoàn thành kiểm tra Chrome thật thành công!');
}

runVerification().catch(err => {
  console.error('Lỗi kiểm tra:', err);
  process.exit(1);
});
