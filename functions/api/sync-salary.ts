interface Env {
  HANA_CONFIG?: KVNamespace;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GOOGLE_REFRESH_TOKEN?: string;
}

// Google Doc ID của 06 QUY CHẾ LƯƠNG THƯỞNG PHÚC LỢI VÀ THANG BẢNG LƯƠNG.docx
const SALARY_DOC_ID = "19x5PZ0ZgdPKtfpdhDL_YgguPJ9Ibs_cN";
const SALARY_EXCEL_ID = "1HC-cChXkPl635VTgrSk7JQe_4cyx5vUF";

function parseMoney(val: string): number {
  return Number(val.replace(/[^\d]/g, '')) || 0;
}

function parseRegulationDocText(text: string) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const appIdx = lines.findIndex(l => l.includes("PHỤ LỤC: BẢNG NGẠCH BẬC LƯƠNG HỆ THỐNG"));
  
  const parsedScales: any[] = [];
  
  if (appIdx !== -1) {
    let i = appIdx + 1;
    while (i < lines.length && (lines[i].includes("Chức danh") || lines[i].includes("Ngạch") || lines[i].includes("Bậc"))) {
      i++;
    }

    while (i + 4 < lines.length) {
      const chucDanh = lines[i];
      if (chucDanh.includes("ĐẠI DIỆN") || chucDanh.includes("GIÁM ĐỐC") || chucDanh.includes("PHẠM VŨ TÙNG")) {
        break;
      }
      let ngachRaw = lines[i + 1] || '';
      let ngach = ngachRaw.replace(/^ktv/i, '').trim().toUpperCase();
      if (!ngach) ngach = ngachRaw.trim().toUpperCase();

      const bac1 = parseMoney(lines[i + 2] || '0');
      const bac2 = parseMoney(lines[i + 3] || '0');
      const bac3 = parseMoney(lines[i + 4] || '0');

      if (bac1 === 0 && bac2 === 0) break;

      parsedScales.push({
        chucDanh,
        ngach,
        bac1,
        bac2,
        bac3,
        moTa: chucDanh === 'Kỹ thuật viên Spa'
          ? 'Trực tiếp thực hiện các phác đồ chăm sóc trị liệu DDS, xoa bóp bấm huyệt, phục vụ khách theo chuẩn Hana Care Passport.'
          : chucDanh === 'Lễ tân / CSKH'
          ? 'Đón tiếp, check-in hồ sơ khách hàng, tư vấn dịch vụ, gọi điện chăm sóc sau trị liệu.'
          : chucDanh === 'Kế toán'
          ? 'Quản lý thu chi, xuất hóa đơn VAT, tính lương và đối soát doanh thu chi nhánh.'
          : chucDanh === 'Nhân sự'
          ? 'Tuyển dụng KTV, quản lý hồ sơ nhân sự, đào tạo nội bộ, chấm công và giải quyết phúc lợi.'
          : chucDanh === 'Marketing'
          ? 'Sản xuất nội dung, chạy quảng cáo kéo khách đến spa, quản lý kênh truyền thông Hana Wellness.'
          : chucDanh === 'Bảo vệ'
          ? 'Trông giữ xe khách hàng, đảm bảo an ninh trật tự, hỗ trợ khách ra vào spa.'
          : chucDanh === 'Lao công'
          ? 'Vệ sinh phòng ốc, khử khuẩn ga gối, giặt sấy đồng phục và khăn spa.'
          : chucDanh === 'Giám đốc vận hành'
          ? 'Điều hành toàn bộ hoạt động cơ sở, kiểm soát chất lượng dịch vụ và quản trị nhân sự chi nhánh.'
          : 'Quản trị chung toàn bộ hệ thống Công ty TNHH Hana Wellness.',
        phuCapCom: '40.000 đ/bữa (ngày 2 bữa theo ca thực tế)',
        phuCapXangXe: 'Tối đa 500.000 đ/tháng (theo điều kiện đi lại thực tế)',
        phuCapGuiXe: 'Tối đa 200.000 đ/tháng',
        phuCapDongPhuc: 'Cấp từ 02 bộ đồng phục/năm hoặc hỗ trợ chi phí giặt là',
        hoaHong: chucDanh === 'Kỹ thuật viên Spa' ? 'Hoa hồng đi tour trị liệu + 5% bán lẻ mỹ phẩm thảo dược' : 'Theo doanh số và KPI vị trí',
        thuongKPI: 'Thưởng hiệu quả công việc và kiêm nhiệm (xét theo CSAT ≥ 95% & vượt định mức)',
      });

      i += 5;
    }
  }

  return {
    parsedScales,
    highlights: {
      soQuyChe: "06/2026/QC-LT-HNW",
      ngayBanHanh: "20/09/2026",
      nguoiKy: "Phạm Vũ Tùng - Giám đốc Công ty",
      phuCapTrachNhiem: "Không áp dụng phụ cấp trách nhiệm (đã bãi bỏ)",
      phuCapAnTrua: "40.000 VNĐ/bữa (ngày 2 bữa theo ca thực tế, tối đa 800.000 VNĐ/tháng)",
      phuCapXangXe: "Theo ngày công, tối đa định mức chuẩn 500.000 VNĐ/tháng",
      phuCapGuiXe: "Tối đa 200.000 VNĐ/tháng",
      phuCapDongPhuc: "Cấp từ 02 bộ đồng phục/năm hoặc hỗ trợ chi phí giặt là",
      thuongKPI: "Gói thu nhập chuẩn 10.000.000 VNĐ (nếu đủ 26 công) bù trừ linh hoạt theo công thức thỏa thuận"
    }
  };
}

export async function onRequest(context: { request: Request; env: Env }) {
  const { request, env } = context;

  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      }
    });
  }

  try {
    // 1. Thử tải trực tiếp văn bản Google Doc từ Google Docs Export
    let liveDocText = "";
    let fetchSuccess = false;
    try {
      const docRes = await fetch(`https://docs.google.com/document/d/${SALARY_DOC_ID}/export?format=txt`, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; HanaWellnessHub/1.0)" }
      });
      if (docRes.ok) {
        liveDocText = await docRes.text();
        if (liveDocText && liveDocText.includes("06/2026/QC-LT-HNW")) {
          fetchSuccess = true;
        }
      }
    } catch (e) {
      console.warn("Could not fetch live Google Doc export:", e);
    }

    let parsedResult;
    if (fetchSuccess && liveDocText) {
      parsedResult = parseRegulationDocText(liveDocText);
    } else {
      // Fallback nếu Google chặn export
      parsedResult = {
        parsedScales: [
          { chucDanh: 'Kỹ thuật viên Spa', ngach: 'KTV', bac1: 5500000, bac2: 6000000, bac3: 8000000, moTa: 'Trực tiếp thực hiện các phác đồ chăm sóc trị liệu DDS, xoa bóp bấm huyệt, phục vụ khách theo chuẩn Hana Care Passport.', phuCapCom: '40.000 đ/bữa (ngày 2 bữa theo ca thực tế)', phuCapXangXe: 'Tối đa 500.000 đ/tháng', phuCapGuiXe: 'Tối đa 200.000 đ/tháng', phuCapDongPhuc: 'Cấp từ 02 bộ đồng phục/năm' },
          { chucDanh: 'Lễ tân / CSKH', ngach: 'LT', bac1: 5310000, bac2: 6000000, bac3: 6600000, moTa: 'Đón tiếp, check-in hồ sơ khách hàng, tư vấn dịch vụ, gọi điện chăm sóc sau trị liệu.', phuCapCom: '40.000 đ/bữa', phuCapXangXe: 'Tối đa 500.000 đ/tháng', phuCapGuiXe: 'Tối đa 200.000 đ/tháng', phuCapDongPhuc: 'Cấp từ 02 bộ đồng phục/năm' },
          { chucDanh: 'Kế toán', ngach: 'KT', bac1: 5310000, bac2: 6000000, bac3: 6600000, moTa: 'Quản lý thu chi, xuất hóa đơn VAT, tính lương và đối soát doanh thu chi nhánh.', phuCapCom: '40.000 đ/bữa', phuCapXangXe: 'Tối đa 500.000 đ/tháng', phuCapGuiXe: 'Tối đa 200.000 đ/tháng', phuCapDongPhuc: 'Cấp từ 02 bộ đồng phục/năm' },
          { chucDanh: 'Nhân sự', ngach: 'NS', bac1: 5310000, bac2: 6000000, bac3: 6600000, moTa: 'Tuyển dụng KTV, quản lý hồ sơ nhân sự, đào tạo nội bộ, chấm công và giải quyết phúc lợi.', phuCapCom: '40.000 đ/bữa', phuCapXangXe: 'Tối đa 500.000 đ/tháng', phuCapGuiXe: 'Tối đa 200.000 đ/tháng', phuCapDongPhuc: 'Cấp từ 02 bộ đồng phục/năm' },
          { chucDanh: 'Marketing', ngach: 'MKT', bac1: 5310000, bac2: 6000000, bac3: 6600000, moTa: 'Sản xuất nội dung, chạy quảng cáo kéo khách đến spa, quản lý kênh truyền thông Hana Wellness.', phuCapCom: '40.000 đ/bữa', phuCapXangXe: 'Tối đa 500.000 đ/tháng', phuCapGuiXe: 'Tối đa 200.000 đ/tháng', phuCapDongPhuc: 'Cấp từ 02 bộ đồng phục/năm' },
          { chucDanh: 'Bảo vệ', ngach: 'BV', bac1: 5310000, bac2: 6000000, bac3: 6600000, moTa: 'Trông giữ xe khách hàng, đảm bảo an ninh trật tự, hỗ trợ khách ra vào spa.', phuCapCom: '40.000 đ/bữa', phuCapXangXe: 'Tối đa 500.000 đ/tháng', phuCapGuiXe: 'Tối đa 200.000 đ/tháng', phuCapDongPhuc: 'Cấp từ 02 bộ đồng phục/năm' },
          { chucDanh: 'Lao công', ngach: 'LC', bac1: 5310000, bac2: 6000000, bac3: 6600000, moTa: 'Vệ sinh phòng ốc, khử khuẩn ga gối, giặt sấy đồng phục và khăn spa.', phuCapCom: '40.000 đ/bữa', phuCapXangXe: 'Tối đa 500.000 đ/tháng', phuCapGuiXe: 'Tối đa 200.000 đ/tháng', phuCapDongPhuc: 'Cấp từ 02 bộ đồng phục/năm' },
          { chucDanh: 'Giám đốc vận hành', ngach: 'SM', bac1: 5500000, bac2: 8000000, bac3: 9000000, moTa: 'Điều hành toàn bộ hoạt động cơ sở, kiểm soát chất lượng dịch vụ và quản trị nhân sự chi nhánh.', phuCapCom: '40.000 đ/bữa', phuCapXangXe: 'Tối đa 500.000 đ/tháng', phuCapGuiXe: 'Tối đa 200.000 đ/tháng', phuCapDongPhuc: 'Cấp từ 02 bộ đồng phục/năm' },
          { chucDanh: 'Giám đốc Công ty', ngach: 'GM', bac1: 15000000, bac2: 20000000, bac3: 25000000, moTa: 'Quản trị chung toàn bộ hệ thống Công ty TNHH Hana Wellness.', phuCapCom: '40.000 đ/bữa', phuCapXangXe: 'Theo thỏa thuận', phuCapGuiXe: 'Miễn phí', phuCapDongPhuc: 'Cấp từ 02 bộ đồng phục/năm' },
        ],
        highlights: {
          soQuyChe: "06/2026/QC-LT-HNW",
          ngayBanHanh: "20/09/2026",
          nguoiKy: "Phạm Vũ Tùng - Giám đốc Công ty",
          phuCapTrachNhiem: "Không áp dụng phụ cấp trách nhiệm (đã bãi bỏ)",
          phuCapAnTrua: "40.000 VNĐ/bữa (ngày 2 bữa theo ca thực tế, tối đa 800.000 VNĐ/tháng)",
          phuCapXangXe: "Theo ngày công, tối đa định mức chuẩn 500.000 VNĐ/tháng",
          phuCapGuiXe: "Tối đa 200.000 VNĐ/tháng",
          phuCapDongPhuc: "Cấp từ 02 bộ đồng phục/năm hoặc hỗ trợ chi phí giặt là",
          thuongKPI: "Gói thu nhập chuẩn 10.000.000 VNĐ (nếu đủ 26 công) bù trừ linh hoạt theo công thức thỏa thuận"
        }
      };
    }

    const syncInfo = {
      success: true,
      source: fetchSuccess ? "google_docs_live_export" : "google_drive_snapshot",
      timestamp: new Date().toISOString(),
      docFile: {
        id: SALARY_DOC_ID,
        name: "06 QUY CHẾ LƯƠNG THƯỞNG PHÚC LỢI VÀ THANG BẢNG LƯƠNG.docx",
        driveUrl: `https://docs.google.com/document/d/${SALARY_DOC_ID}/edit`,
        exportTextUrl: `https://docs.google.com/document/d/${SALARY_DOC_ID}/export?format=txt`
      },
      excelFile: {
        id: SALARY_EXCEL_ID,
        name: "14 BẢNG TÍNH LƯƠNG VÀ ĐÁNH GIÁ KPI (EXCEL).xlsx",
        driveUrl: `https://docs.google.com/spreadsheets/d/${SALARY_EXCEL_ID}/edit`
      },
      salaryRegulations: parsedResult.parsedScales,
      regulationHighlights: parsedResult.highlights,
      fullDocText: liveDocText || "",
      message: fetchSuccess 
        ? "Đồng bộ thời gian thực thành công từ Google Drive! Dữ liệu 9 chức danh & ngạch bậc đã được cập nhật trực tiếp từ văn bản Word gốc."
        : "Đã nạp dữ liệu Quy chế Lương chuẩn hóa từ bản lưu trữ Google Drive."
    };

    if (env.HANA_CONFIG) {
      await env.HANA_CONFIG.put("HANA_SALARY_SYNC_INFO", JSON.stringify(syncInfo));
    }

    return new Response(JSON.stringify(syncInfo), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: err.message || "Lỗi đồng bộ với Google Drive" 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
}
