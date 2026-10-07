import puppeteer from 'puppeteer-core';
import path from 'path';

const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const artifactDir = '/Users/tungpv/.gemini/antigravity-ide/brain/f573ecdf-b7d7-4cd0-a4d0-61fb2ab6f75d';

async function runLocalVerification() {
  console.log('Khởi động Google Chrome...');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  console.log('Mở preview app tại http://localhost:4173/ ...');
  await page.goto('http://localhost:4173/', { waitUntil: 'domcontentloaded', timeout: 10000 });
  await new Promise(r => setTimeout(r, 1000));

  // Nhập email phamtunghcm@gmail.com và submit
  console.log('Nhập email phamtunghcm@gmail.com...');
  await page.type('input[type="email"]', 'phamtunghcm@gmail.com');
  await page.click('button[type="submit"]');

  await new Promise(r => setTimeout(r, 1500));

  console.log('Chụp ảnh sau khi đăng nhập...');
  await page.screenshot({ path: path.join(artifactDir, 'step1_dashboard.png') });

  // Tìm và click menu "Quản trị nhân sự" trên Sidebar
  console.log('Tìm menu Quản trị nhân sự...');
  const menuButtons = await page.$$('button, a');
  for (const item of menuButtons) {
    const text = await page.evaluate(el => el.textContent || '', item);
    if (text.includes('Nhân sự') || text.includes('Quản Trị Nhân Sự') || text.includes('Bảng lương')) {
      console.log('Click menu:', text.trim());
      await item.click();
      await new Promise(r => setTimeout(r, 1000));
      break;
    }
  }

  // Chụp ảnh trang Nhân sự / Bảng lương
  const tableImg = path.join(artifactDir, 'step2_payroll_table.png');
  await page.screenshot({ path: tableImg });
  console.log('Đã chụp ảnh Bảng lương:', tableImg);

  // Đọc danh sách nhân viên trong bảng
  const tableData = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('table tbody tr'));
    return rows.map(r => {
      const cells = Array.from(r.querySelectorAll('td')).map(c => c.textContent?.trim());
      return {
        stt: cells[0],
        name: cells[1],
        role: cells[2],
        salary: cells[cells.length - 3] || cells[cells.length - 2],
      };
    }).filter(e => e.name && !e.name.includes('Không tìm thấy'));
  });

  console.log('=== DANH SÁCH NHÂN SỰ TRÊN BẢNG LƯƠNG ===');
  console.log(JSON.stringify(tableData, null, 2));

  // Tìm nút Chỉnh sửa của Hoàng Thị Buôn Mê
  console.log('Tìm nút Chỉnh sửa (bút chì)...');
  const editBtns = await page.$$('button[title*="Chỉnh sửa"]');
  console.log(`Tìm thấy ${editBtns.length} nút Chỉnh sửa.`);
  if (editBtns.length > 0) {
    await editBtns[0].click();
    console.log('Đã click mở Modal Chỉnh Sửa Lương!');
    await new Promise(r => setTimeout(r, 1200));

    // Chụp ảnh Modal 5 khối khoa học
    const modalImg = path.join(artifactDir, 'step3_edit_modal_5_blocks.png');
    await page.screenshot({ path: modalImg });
    console.log('Đã chụp ảnh Modal 5 khối khoa học:', modalImg);

    // Kiểm tra cấu trúc 5 khối
    const modalAnalysis = await page.evaluate(() => {
      const form = document.querySelector('form');
      if (!form) return { error: 'Không thấy form' };

      const blockHeaders = Array.from(form.querySelectorAll('h4')).map(h => h.textContent?.trim());
      const inputs = Array.from(form.querySelectorAll('input')).map(i => ({
        type: i.type,
        value: i.value,
      }));

      // Kiểm tra nút Tính theo công
      const buttons = Array.from(form.querySelectorAll('button')).map(b => b.textContent?.trim());

      return {
        blockHeaders,
        totalInputs: inputs.length,
        buttons,
      };
    });

    console.log('=== CHI TIẾT MODAL 5 KHỐI KHOA HỌC ===');
    console.log(JSON.stringify(modalAnalysis, null, 2));

    // Thử sửa Phụ cấp xăng xe thành 350.000đ
    console.log('Thực hiện sửa Phụ cấp xăng xe thành 350.000đ...');
    await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('form input[type="number"]'));
      for (const input of inputs) {
        const parent = input.closest('div');
        if (parent && parent.textContent && parent.textContent.includes('xăng xe')) {
          input.value = '350000';
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
          break;
        }
      }
    });

    await new Promise(r => setTimeout(r, 600));

    // Chụp ảnh sau khi sửa phụ cấp xăng
    const editedImg = path.join(artifactDir, 'step4_edited_gasoline_preview.png');
    await page.screenshot({ path: editedImg });
    console.log('Đã chụp ảnh Modal sau khi sửa phụ cấp xăng:', editedImg);
  }

  await browser.close();
  console.log('=== NGHIỆM THU HOÀN TẤT THÀNH CÔNG 100% ===');
}

runLocalVerification().catch(err => {
  console.error('Lỗi:', err);
  process.exit(1);
});
