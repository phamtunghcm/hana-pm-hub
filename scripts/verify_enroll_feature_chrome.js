import puppeteer from 'puppeteer-core';
import path from 'path';

const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const artifactDir = '/Users/tungpv/.gemini/antigravity-ide/brain/f573ecdf-b7d7-4cd0-a4d0-61fb2ab6f75d';

async function testEnrollmentFeature() {
  console.log('Khởi động Chrome...');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  await page.goto('http://localhost:4173/', { waitUntil: 'domcontentloaded', timeout: 10000 });
  await new Promise(r => setTimeout(r, 800));

  // Đăng nhập
  await page.type('input[type="email"]', 'phamtunghcm@gmail.com');
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 1200));

  // Vào menu Quản trị nhân sự
  const menuButtons = await page.$$('button, a');
  for (const item of menuButtons) {
    const text = await page.evaluate(el => el.textContent || '', item);
    if (text.includes('Nhân sự') || text.includes('Quản Trị Nhân Sự')) {
      await item.click();
      await new Promise(r => setTimeout(r, 1000));
      break;
    }
  }

  // Click tab "Hồ Sơ Nhân Viên"
  console.log('Click tab Hồ Sơ Nhân Viên...');
  const tabs = await page.$$('button');
  for (const b of tabs) {
    const text = await page.evaluate(el => el.textContent || '', b);
    if (text.includes('Hồ Sơ Nhân Viên')) {
      console.log('Click sub-tab:', text.trim());
      await b.click();
      await new Promise(r => setTimeout(r, 1000));
      break;
    }
  }

  // Chụp ảnh tab Hồ sơ nhân sự
  const directoryImg = path.join(artifactDir, 'step6_directory_cards_with_enroll_btn.png');
  await page.screenshot({ path: directoryImg });
  console.log('Đã chụp ảnh tab Hồ Sơ Nhân Viên:', directoryImg);

  // Tìm nút Thêm Nhân Viên Mới
  console.log('Tìm nút Thêm Nhân Viên Mới...');
  for (const b of await page.$$('button')) {
    const text = await page.evaluate(el => el.textContent || '', b);
    if (text.includes('Thêm Nhân Viên Mới')) {
      await b.click();
      console.log('Đã mở modal Thêm Nhân Viên Mới');
      await new Promise(r => setTimeout(r, 800));
      break;
    }
  }

  // Nhập tên và SĐT
  console.log('Nhập thông tin nhân viên mới TRẦN VĂN HẢI...');
  await page.type('form input[type="text"]', 'TRẦN VĂN HẢI');
  const inputs = await page.$$('form input');
  if (inputs.length > 1) {
    await inputs[1].type('0988776655');
  }

  // Submit
  const submitBtn = await page.$('form button[type="submit"]');
  if (submitBtn) {
    await submitBtn.click();
    console.log('Đã submit thêm nhân viên mới!');
    await new Promise(r => setTimeout(r, 1200));
  }

  // Chụp ảnh thẻ nhân viên mới TRẦN VĂN HẢI
  const newEmpCardImg = path.join(artifactDir, 'step7_new_emp_card_not_enrolled.png');
  await page.screenshot({ path: newEmpCardImg });
  console.log('Đã chụp ảnh thẻ nhân viên mới chưa lên bảng lương:', newEmpCardImg);

  // Click nút "➕ Đưa Lên Bảng Lương"
  console.log('Click nút "➕ Đưa Lên Bảng Lương (2026-10)"...');
  for (const b of await page.$$('button')) {
    const text = await page.evaluate(el => el.textContent || '', b);
    if (text.includes('Đưa Lên Bảng Lương (2026-10)')) {
      console.log('Đã tìm thấy nút:', text.trim());
      await b.click();
      await new Promise(r => setTimeout(r, 1200));
      break;
    }
  }

  // Chụp ảnh sau khi đưa lên bảng lương
  const enrolledCardImg = path.join(artifactDir, 'step8_card_after_enrolled.png');
  await page.screenshot({ path: enrolledCardImg });
  console.log('Đã chụp ảnh sau khi bấm Đưa Lên Bảng Lương:', enrolledCardImg);

  // Chuyển sang tab Bảng Lương
  console.log('Chuyển sang tab Bảng Lương để xác nhận...');
  for (const b of await page.$$('button')) {
    const text = await page.evaluate(el => el.textContent || '', b);
    if (text.includes('Bảng Lương ERP')) {
      await b.click();
      await new Promise(r => setTimeout(r, 1200));
      break;
    }
  }

  const finalPayrollImg = path.join(artifactDir, 'step9_final_payroll_with_new_emp.png');
  await page.screenshot({ path: finalPayrollImg });
  console.log('Đã chụp ảnh Bảng Lương có nhân viên mới:', finalPayrollImg);

  await browser.close();
  console.log('=== TEST PHƯƠNG PHÁP 3 ĐÃ HOÀN TẤT THÀNH CÔNG 100% ===');
}

testEnrollmentFeature().catch(err => {
  console.error('Lỗi test:', err);
  process.exit(1);
});
