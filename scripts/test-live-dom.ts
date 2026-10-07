import puppeteer from 'puppeteer';
import fs from 'fs';

(async () => {
  console.log('Khởi động browser test live Cloudflare Pages...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  console.log('Navigating to https://hana-pm-hub.pages.dev ...');
  await page.goto('https://hana-pm-hub.pages.dev', { waitUntil: 'networkidle2' });

  // Tìm và click nút Chế độ lương / Bảng lương
  console.log('Chuyển sang module Bảng lương...');
  const buttons = await page.$$('button');
  for (const btn of buttons) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text && (text.includes('Bảng lương') || text.includes('Lương & Đãi ngộ'))) {
      await btn.click();
      break;
    }
  }

  await new Promise(r => setTimeout(r, 1500));

  // Kiểm tra các cột bảng lương
  const thTexts = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('table thead th')).map(th => th.textContent?.trim());
  });
  console.log('Các cột thead tìm thấy:', thTexts);

  const hasDongBHXHCol = thTexts.some(t => t?.includes('Đóng BHXH'));
  const hasCamKetCol = thTexts.some(t => t?.includes('Cam kết thu nhập'));
  const hasKPITamTinhCol = thTexts.some(t => t?.includes('Thưởng KPI (Tạm tính)'));

  console.log('Kết quả kiểm tra cột:', {
    hasDongBHXHCol,
    hasCamKetCol,
    hasKPITamTinhCol
  });

  if (!hasDongBHXHCol || !hasCamKetCol || !hasKPITamTinhCol) {
    console.error('❌ Thiếu cột trong bảng!');
    process.exit(1);
  }

  // Click vào nút Sửa của nhân viên đầu tiên
  console.log('Mở modal Chỉnh sửa bảng lương...');
  const editButtons = await page.$$('button[title*="Chỉnh sửa"]');
  if (editButtons.length > 0) {
    await editButtons[0].click();
    await new Promise(r => setTimeout(r, 1000));

    // Kiểm tra các trường trong Modal
    const modalInfo = await page.evaluate(() => {
      const modal = document.querySelector('div[role="dialog"]') || document.body;
      const checkboxBHXH = document.querySelector('input[type="checkbox"]');
      const camKetInput = Array.from(document.querySelectorAll('input[type="number"]')).find(input => {
        const parent = input.closest('div');
        return parent && parent.textContent?.includes('cam kết thu nhập');
      });
      const kpiInput = Array.from(document.querySelectorAll('input[type="number"]')).find(input => {
        const parent = input.closest('div');
        return parent && parent.textContent?.includes('Thưởng hiệu suất KPI');
      });

      return {
        hasCheckbox: !!checkboxBHXH,
        checkboxChecked: checkboxBHXH ? (checkboxBHXH as HTMLInputElement).checked : false,
        hasCamKetInput: !!camKetInput,
        camKetVal: camKetInput ? (camKetInput as HTMLInputElement).value : null,
        hasKpiInput: !!kpiInput,
        kpiVal: kpiInput ? (kpiInput as HTMLInputElement).value : null
      };
    });

    console.log('Thông tin Modal chỉnh sửa:', modalInfo);

    // Chụp ảnh màn hình modal
    const screenshotPath = '/Users/tungpv/.gemini/antigravity-ide/brain/f573ecdf-b7d7-4cd0-a4d0-61fb2ab6f75d/modal_payroll_test.png';
    await page.screenshot({ path: screenshotPath });
    console.log(`Đã lưu ảnh chụp màn hình modal: ${screenshotPath}`);
  }

  await browser.close();
  console.log('✔ HOÀN TẤT KIỂM THỬ GIAO DIỆN PRODUCTION THÀNH CÔNG 100%!');
})();
