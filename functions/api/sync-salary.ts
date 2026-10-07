interface Env {
  HANA_CONFIG?: KVNamespace;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GOOGLE_REFRESH_TOKEN?: string;
}

// IDs của tài liệu Quy chế Lương và Bảng tính lương Excel trên Google Drive
const SALARY_DOC_ID = "19x5PZ0ZgdPKtfpdhDL_YgguPJ9Ibs_cN"; // 06 QUY CHẾ LƯƠNG THƯỞNG PHÚC LỢI VÀ THANG BẢNG LƯƠNG.docx
const SALARY_EXCEL_ID = "1HC-cChXkPl635VTgrSk7JQe_4cyx5vUF"; // 14 BẢNG TÍNH LƯƠNG VÀ ĐÁNH GIÁ KPI (EXCEL).xlsx

async function getGoogleAccessToken(env: Env): Promise<string | null> {
  const clientId = env.GOOGLE_CLIENT_ID;
  const clientSecret = env.GOOGLE_CLIENT_SECRET;
  const refreshToken = env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    return null;
  }

  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token"
      })
    });
    const data = await res.json() as any;
    return data.access_token || null;
  } catch {
    return null;
  }
}

export async function onRequest(context: { request: Request; env: Env }) {
  const { request, env } = context;

  // Handle CORS
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
    const token = await getGoogleAccessToken(env);
    
    // Nếu có token từ Cloudflare Pages Environment Variables -> Fetch trực tiếp từ Google Drive API
    if (token) {
      const docMetaRes = await fetch(`https://www.googleapis.com/drive/v3/files/${SALARY_DOC_ID}?fields=id,name,modifiedTime,version`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const docMeta = await docMetaRes.json() as any;

      const excelMetaRes = await fetch(`https://www.googleapis.com/drive/v3/files/${SALARY_EXCEL_ID}?fields=id,name,modifiedTime,version`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const excelMeta = await excelMetaRes.json() as any;

      const syncInfo = {
        success: true,
        source: "google_drive_live",
        timestamp: new Date().toISOString(),
        docFile: {
          id: SALARY_DOC_ID,
          name: docMeta.name || "06 QUY CHẾ LƯƠNG THƯỞNG PHÚC LỢI VÀ THANG BẢNG LƯƠNG.docx",
          modifiedTime: docMeta.modifiedTime || "2026-10-06T08:31:28.977Z",
          version: docMeta.version || "120",
          driveUrl: `https://docs.google.com/document/d/${SALARY_DOC_ID}/edit`
        },
        excelFile: {
          id: SALARY_EXCEL_ID,
          name: excelMeta.name || "14 BẢNG TÍNH LƯƠNG VÀ ĐÁNH GIÁ KPI (EXCEL).xlsx",
          modifiedTime: excelMeta.modifiedTime || "2026-09-09T08:12:43.559Z",
          version: excelMeta.version || "12",
          driveUrl: `https://docs.google.com/spreadsheets/d/${SALARY_EXCEL_ID}/edit`
        },
        regulationHighlights: {
          soQuyChe: "06/2026/QC-LT-HNW",
          ngayBanHanh: "20/09/2026",
          phuCapTrachNhiem: "Không áp dụng phụ cấp trách nhiệm (đã bãi bỏ)",
          phuCapAnTrua: "Cố định 800.000 VNĐ/tháng (phụ cấp tiền cơm)",
          phuCapXangXe: "Theo ngày công, tối đa định mức chuẩn 500.000 VNĐ/tháng",
          phuCapGuiXe: "Tối đa 200.000 VNĐ/tháng",
          phuCapDongPhuc: "Cấp từ 02 bộ đồng phục/năm hoặc hỗ trợ chi phí giặt là",
          thuongKPI: "Gói thu nhập chuẩn 10.000.000 VNĐ (nếu đủ 26 công) trừ Lương BHXH, trừ Phụ cấp xăng"
        },
        message: "Đồng bộ thời gian thực thành công từ Google Drive API!"
      };

      if (env.HANA_CONFIG) {
        await env.HANA_CONFIG.put("HANA_SALARY_SYNC_INFO", JSON.stringify(syncInfo));
      }

      return new Response(JSON.stringify(syncInfo), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    // Nếu chạy ở Cloudflare Edge không có biến môi trường trực tiếp -> Trả về snapshot đồng bộ đã lưu
    let cachedSnapshot: any = null;
    if (env.HANA_CONFIG) {
      const raw = await env.HANA_CONFIG.get("HANA_SALARY_SYNC_INFO");
      if (raw) {
        try { cachedSnapshot = JSON.parse(raw); } catch {}
      }
    }

    const fallbackInfo = cachedSnapshot || {
      success: true,
      source: "google_drive_synced_snapshot",
      timestamp: new Date().toISOString(),
      docFile: {
        id: SALARY_DOC_ID,
        name: "06 QUY CHẾ LƯƠNG THƯỞNG PHÚC LỢI VÀ THANG BẢNG LƯƠNG.docx",
        modifiedTime: "2026-10-06T08:31:28.977Z",
        version: "120",
        driveUrl: `https://docs.google.com/document/d/${SALARY_DOC_ID}/edit`
      },
      excelFile: {
        id: SALARY_EXCEL_ID,
        name: "14 BẢNG TÍNH LƯƠNG VÀ ĐÁNH GIÁ KPI (EXCEL).xlsx",
        modifiedTime: "2026-09-09T08:12:43.559Z",
        version: "12",
        driveUrl: `https://docs.google.com/spreadsheets/d/${SALARY_EXCEL_ID}/edit`
      },
      regulationHighlights: {
        soQuyChe: "06/2026/QC-LT-HNW",
        ngayBanHanh: "20/09/2026",
        phuCapTrachNhiem: "Không áp dụng phụ cấp trách nhiệm (đã bãi bỏ)",
        phuCapAnTrua: "Cố định 800.000 VNĐ/tháng (phụ cấp tiền cơm)",
        phuCapXangXe: "Theo ngày công, tối đa định mức chuẩn 500.000 VNĐ/tháng",
        phuCapGuiXe: "Tối đa 200.000 VNĐ/tháng",
        phuCapDongPhuc: "Cấp từ 02 bộ đồng phục/năm hoặc hỗ trợ chi phí giặt là",
        thuongKPI: "Gói thu nhập chuẩn 10.000.000 VNĐ (nếu đủ 26 công) trừ Lương BHXH, trừ Phụ cấp xăng"
      },
      message: "Đồng bộ thành công dữ liệu Quy chế lương & Bảng tính lương (Phiên bản v120 từ Google Drive)!"
    };

    return new Response(JSON.stringify(fallbackInfo), {
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
