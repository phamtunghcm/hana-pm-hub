export const scheduled = async (event: any, env: any, ctx: any) => {
  ctx.waitUntil((async () => {
    try {
      if (!env.HANA_CONFIG) {
        console.error("Missing HANA_CONFIG KV binding");
        return;
      }
      
      const stored = await env.HANA_CONFIG.get('HANA_PROJECT_DATA', 'json');
      if (!stored) {
        console.error("No HANA_PROJECT_DATA found in KV");
        return;
      }
      
      const data = stored as any;
      const tasks = data.tasks || [];
      const docs = data.docs || [];
      const legal = data.legal || [];
      const capex = data.capex || [];
      const settings = data.settings || {};
      
      const recipientRaw = settings.reportEmail || "phamtunghcm@gmail.com";
      const toList = recipientRaw.split(',').map((e: string) => e.trim()).filter(Boolean);
      const resendApiKey = (settings.resendApiKey || "").trim();
      
      if (!resendApiKey) {
        console.error("Missing resendApiKey in settings");
        return;
      }
      
      // Compute stats
      const docTasks = docs.map((d: any) => ({
        id: `doc_${d.id}`,
        title: `[Văn bản] ${d.title}`,
        pic: d.department || "Pháp chế / HR",
        dueDate: d.deadline || "Đang cập nhật",
        status: d.status || "Chưa bắt đầu",
        daysLeft: d.status === "Hoàn thành" ? 0 : 10,
        workstream: `Văn bản nội bộ: ${d.group || 'Quy chuẩn'}`
      }));
      
      const allTasks = [...tasks, ...docTasks];
      const completedList = allTasks.filter(t => ["Hoàn thành", "Đã hoàn thành", "Đã ban hành"].includes(t.status));
      const completed = completedList.length;
      const totalTasks = allTasks.length;
      const pct = totalTasks ? Math.round((completed / totalTasks) * 100) : 0;
      
      const overdueList = allTasks.filter(t => t.status !== "Hoàn thành" && (parseInt(t.daysLeft) < 0));
      const urgentList = allTasks.filter(t => t.status !== "Hoàn thành" && (parseInt(t.daysLeft) >= 0 && parseInt(t.daysLeft) <= 15));
      
      let totalCapex = 0;
      for (const c of capex) {
        if (c.totalPrice) {
          totalCapex += parseFloat(c.totalPrice.toString().replace(/,/g, '')) || 0;
        }
      }
      
      const targetDate = new Date("2026-11-02T00:00:00Z");
      const today = new Date();
      const daysLeft = Math.max(0, Math.floor((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
      
      const siteUrl = "https://hana-pm-hub.pages.dev";
      
      // Build HTML
      const formatCurrency = (val: number) => new Intl.NumberFormat('en-US').format(val);
      const formatDate = (date: Date) => {
        const d = date.getDate().toString().padStart(2, '0');
        const m = (date.getMonth() + 1).toString().padStart(2, '0');
        return `${d}/${m}/${date.getFullYear()}`;
      };
      
      let overdueRows = "";
      for (const t of overdueList) {
        overdueRows += `
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px 12px;"><strong>${t.title}</strong></td>
            <td style="padding: 10px 12px; text-align: center;"><span style="background-color: #fee2e2; color: #b91c1c; padding: 4px 8px; border-radius: 4px; font-weight: 700;">${t.status}</span></td>
            <td style="padding: 10px 12px; font-weight: 600; color: #475569;">${t.pic}</td>
            <td style="padding: 10px 12px; text-align: right; color: #b91c1c; font-weight: 700;">${t.dueDate}</td>
          </tr>
        `;
      }
      
      let urgentRows = "";
      for (const t of urgentList) {
        urgentRows += `
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px 12px;"><strong>${t.title}</strong></td>
            <td style="padding: 10px 12px; text-align: center;"><span style="background-color: #fef3c7; color: #d97706; padding: 4px 8px; border-radius: 4px; font-weight: 700;">${t.status}</span></td>
            <td style="padding: 10px 12px; font-weight: 600; color: #475569;">${t.pic}</td>
            <td style="padding: 10px 12px; text-align: right; color: #d97706; font-weight: 700;">${t.dueDate}</td>
          </tr>
        `;
      }
      
      const html = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 20px;">
              <tr>
                  <td align="center">
                      <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
                          <tr>
                              <td style="background-color: #2c1a0e; padding: 30px; text-align: center;">
                                  <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 0.5px;">HANA WELLNESS</h1>
                                  <p style="color: #d4af37; margin: 8px 0 0 0; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Báo Cáo Điều Hành Dự Án</p>
                              </td>
                          </tr>
                          <tr>
                              <td style="padding: 30px 40px;">
                                  <div style="background-color: #f8fafc; border-left: 4px solid #d4af37; padding: 16px; margin-bottom: 24px; border-radius: 0 8px 8px 0;">
                                      <div style="font-size: 11px; font-weight: 800; color: #d4af37; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 4px;">Executive Briefing • 08:00 AM</div>
                                      <div style="font-size: 14px; color: #334155; line-height: 1.6;">
                                          <strong>Kính gửi Ban Giám Đốc,</strong><br/>
                                          Dưới đây là tóm tắt tiến độ dự án tự động trích xuất từ hệ thống HANA PM Hub lúc 08:00 sáng nay.
                                      </div>
                                  </div>
                                  <div style="margin-bottom: 24px;">
                                      <div style="font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px;">📊 1. Tổng quan Dự án:</div>
                                      <table width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 12px;">
                                          <tr>
                                              <td style="padding-bottom: 8px;"><span style="color: #64748b; font-size: 13px;">Đếm ngược khai trương:</span></td>
                                              <td align="right" style="padding-bottom: 8px; font-size: 14px; font-weight: 800; color: #b91c1c;">Còn ${daysLeft} ngày</td>
                                          </tr>
                                          <tr>
                                              <td style="padding-bottom: 8px;"><span style="color: #64748b; font-size: 13px;">Ngân sách CAPEX:</span></td>
                                              <td align="right" style="padding-bottom: 8px; font-size: 14px; font-weight: 800; color: #0f172a;">${formatCurrency(totalCapex)} VNĐ</td>
                                          </tr>
                                          <tr>
                                              <td style="padding-bottom: 4px;"><span style="color: #64748b; font-size: 13px;">Tỷ lệ hoàn thành:</span></td>
                                              <td align="right" style="font-size: 13px; font-weight: 800; color: #16a34a;">${pct}% (${completed}/${totalTasks} tasks)</td>
                                          </tr>
                                      </table>
                                      <div style="background-color: #e2e8f0; border-radius: 8px; height: 10px; overflow: hidden;">
                                          <div style="background-color: #16a34a; width: ${pct}%; height: 10px; border-radius: 8px;"></div>
                                      </div>
                                  </div>
                                  <div style="margin-bottom: 24px;">
                                      <div style="font-size: 12px; font-weight: 700; color: #dc2626; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px;">🚨 2. Hạng mục Cần Giám đốc Xử lý & Đôn đốc:</div>
                                      <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; font-size: 13px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                                          <thead>
                                              <tr style="background-color: #f1f5f9; color: #475569; font-size: 11px; text-transform: uppercase; font-weight: 700;">
                                                  <th style="padding: 8px 12px; text-align: left;">Công việc</th>
                                                  <th style="padding: 8px 12px; text-align: center;">Trạng thái</th>
                                                  <th style="padding: 8px 12px; text-align: left;">Phụ trách</th>
                                                  <th style="padding: 8px 12px; text-align: right;">Hạn chót</th>
                                              </tr>
                                          </thead>
                                          <tbody>
                                              ${overdueRows}
                                              ${urgentRows}
                                          </tbody>
                                      </table>
                                  </div>
                                  <div style="text-align: center; padding-top: 8px;">
                                      <a href="${siteUrl}" target="_blank" style="display: inline-block; background-color: #2c1a0e; color: #ffffff; font-size: 13px; font-weight: 700; text-decoration: none; padding: 12px 28px; border-radius: 10px;">Truy cập Hệ thống HANA PM Hub →</a>
                                  </div>
                              </td>
                          </tr>
                          <tr>
                              <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 24px; text-align: center; font-size: 11px; color: #94a3b8;">
                                  © 2026 HANA Wellness Vietnam • Báo cáo tự động hóa dành riêng cho Ban Giám Đốc.
                              </td>
                          </tr>
                      </table>
                  </td>
              </tr>
          </table>
      </body>
      </html>
      `;
      
      const plainText = `📌 BÁO CÁO TIẾN ĐỘ DỰ ÁN HANA WELLNESS PM HUB
⏰ Thời gian: 08:00 AM Hàng Ngày (${formatDate(today)})
🔗 Truy cập: ${siteUrl}

📊 1. TỔNG QUAN TIẾN ĐỘ:
• Tỷ lệ hoàn thành: ${pct}% (${completed}/${totalTasks} công việc)
• Đếm ngược khai trương (02-11-2026): còn ${daysLeft} ngày
• Ngân sách CAPEX: ${formatCurrency(totalCapex)} VNĐ

👉 Xem chi tiết tại: ${siteUrl}`;

      const subject = `📌 [HANA PM Hub] Báo cáo Điều hành Dự án - 08:00 AM (${formatDate(today)})`;

      const resendResp = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'HANA PM Hub <onboarding@resend.dev>',
          to: toList,
          subject: subject,
          html: html,
          text: plainText
        })
      });

      if (!resendResp.ok) {
        console.error("Resend API failed:", await resendResp.text());
      } else {
        console.log("Successfully sent 8:00 AM report to", toList);
      }
      
    } catch (e) {
      console.error("Error in cron task:", e);
    }
  })());
};
