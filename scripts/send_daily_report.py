# Thư viện gửi báo cáo tự động HANA PM Hub (Resend.com API & Zalo Webhook)
import json
import os
import urllib.request
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "src", "data")

def load_json(filename):
    path = os.path.join(DATA_DIR, filename)
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    return []

def generate_report_data():
    tasks = load_json("tasks36.json")
    docs = load_json("docs9.json")
    capex = load_json("capex30.json")

    doc_tasks = [
        {
            "id": f"doc_{d.get('id')}",
            "title": f"[Văn bản] {d.get('title')}",
            "pic": d.get("department", "Pháp chế / HR"),
            "dueDate": d.get("deadline", "Đang cập nhật"),
            "status": d.get("status", "Chưa bắt đầu"),
            "daysLeft": 0 if d.get("status") == "Hoàn thành" else 10,
            "workstream": f"Văn bản nội bộ: {d.get('group', 'Quy chuẩn')}"
        }
        for d in docs
    ]
    all_tasks = tasks + doc_tasks

    completed_list = [t for t in all_tasks if t.get("status") == "Hoàn thành"]
    completed = len(completed_list)
    total_tasks = len(all_tasks)
    pct = round((completed / total_tasks * 100)) if total_tasks else 0

    doing_list = [t for t in all_tasks if t.get("status") in ["Đang thực hiện", "Đang soạn thảo"]]
    in_progress = len(doing_list)

    overdue_list = [t for t in all_tasks if t.get("status") != "Hoàn thành" and int(t.get("daysLeft", 0)) < 0]
    urgent_list = [t for t in all_tasks if t.get("status") != "Hoàn thành" and 0 <= int(t.get("daysLeft", 0)) <= 15]

    total_capex = sum(float(str(c.get("totalPrice", 0)).replace(",", "")) for c in capex)

    target_date = datetime(2026, 11, 2)
    today = datetime.now()
    days_left = max(0, (target_date - today).days)

    site_url = os.getenv("PM_HUB_SITE_URL", "https://hana-pm-hub.pages.dev")

    return {
        "total_tasks": total_tasks,
        "completed": completed,
        "in_progress": in_progress,
        "overdue_list": overdue_list,
        "urgent_list": urgent_list,
        "pct": pct,
        "total_capex": total_capex,
        "days_left": days_left,
        "site_url": site_url,
        "date_str": today.strftime("%d/%m/%Y")
    }

def generate_html_email(data):
    overdue_rows = ""
    if data["overdue_list"]:
        for t in data["overdue_list"]:
            title = t.get("title", "")
            pic = t.get("pic", "")
            due = t.get("dueDate", "")
            overdue_rows += f"""
            <tr style="border-bottom: 1px solid #fee2e2; background-color: #fff5f5;">
                <td style="padding: 10px 12px; font-weight: 600; color: #991b1b;">{title}</td>
                <td style="padding: 10px 12px; color: #7f1d1d; text-align: center;"><span style="background: #fecaca; color: #991b1b; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: bold;">Quá hạn</span></td>
                <td style="padding: 10px 12px; color: #4b5563; font-size: 12px;">{pic}</td>
                <td style="padding: 10px 12px; color: #dc2626; font-weight: bold; font-size: 12px; text-align: right;">{due}</td>
            </tr>"""
    else:
        overdue_rows = '<tr><td colspan="4" style="padding: 12px; text-align: center; color: #16a34a; font-weight: 500;">✓ Không có công việc nào bị quá hạn</td></tr>'

    urgent_rows = ""
    for t in data["urgent_list"][:5]:
        title = t.get("title", "")
        pic = t.get("pic", "")
        due = t.get("dueDate", "")
        st = t.get("status", "")
        urgent_rows += f"""
        <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 10px 12px; font-weight: 500; color: #1f2937;">{title}</td>
            <td style="padding: 10px 12px; color: #d97706; text-align: center;"><span style="background: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: bold;">{st}</span></td>
            <td style="padding: 10px 12px; color: #4b5563; font-size: 12px;">{pic}</td>
            <td style="padding: 10px 12px; color: #d97706; font-weight: 600; font-size: 12px; text-align: right;">{due}</td>
        </tr>"""

    html = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Báo cáo Tiến độ HANA Wellness PM Hub</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 24px 12px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" style="max-width: 620px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
                    
                    <!-- Header -->
                    <tr>
                        <td style="background-color: #2c1a0e; padding: 28px 24px; text-align: left;">
                            <table width="100%">
                                <tr>
                                    <td>
                                        <div style="font-size: 11px; font-weight: 800; color: #d4af37; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 4px;">Executive Briefing • 08:00 AM</div>
                                        <h1 style="margin: 0; font-size: 20px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">HANA WELLNESS PM HUB</h1>
                                        <p style="margin: 4px 0 0 0; font-size: 13px; color: #cbd5e1;">Bản tin tiến độ dự án ngày {data['date_str']}</p>
                                    </td>
                                    <td align="right" style="vertical-align: middle;">
                                        <div style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 10px; padding: 8px 14px; text-align: center;">
                                            <span style="display: block; font-size: 10px; color: #cbd5e1; font-weight: 600; text-transform: uppercase;">Khai trương</span>
                                            <span style="font-size: 18px; font-weight: 900; color: #fde047;">{data['days_left']} ngày</span>
                                        </div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                        <td style="padding: 24px;">
                            
                            <!-- KPI Summary Cards -->
                            <div style="margin-bottom: 24px;">
                                <div style="font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">1. Chỉ số Tổng quan Dự án</div>
                                <table width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 8px;">
                                    <tr>
                                        <td width="32%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; text-align: center;">
                                            <span style="font-size: 11px; color: #64748b; display: block; font-weight: 600; margin-bottom: 4px;">Tổng công việc</span>
                                            <span style="font-size: 22px; font-weight: 900; color: #0284c7;">{data['total_tasks']}</span>
                                            <span style="font-size: 10px; color: #94a3b8; display: block; margin-top: 2px;">(37 việc + 9 văn bản)</span>
                                        </td>
                                        <td width="2%"></td>
                                        <td width="32%" style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 14px; text-align: center;">
                                            <span style="font-size: 11px; color: #166534; display: block; font-weight: 600; margin-bottom: 4px;">Đã hoàn thành</span>
                                            <span style="font-size: 22px; font-weight: 900; color: #16a34a;">{data['completed']}</span>
                                            <span style="font-size: 10px; color: #15803d; display: block; margin-top: 2px; font-weight: bold;">Tỷ lệ: {data['pct']}%</span>
                                        </td>
                                        <td width="2%"></td>
                                        <td width="32%" style="background-color: #fff7ed; border: 1px solid #fed7aa; border-radius: 12px; padding: 14px; text-align: center;">
                                            <span style="font-size: 11px; color: #9a3412; display: block; font-weight: 600; margin-bottom: 4px;">Ngân sách CAPEX</span>
                                            <span style="font-size: 17px; font-weight: 900; color: #c2410c;">{data['total_capex']/1000000:,.1f} tr</span>
                                            <span style="font-size: 10px; color: #ea580c; display: block; margin-top: 2px;">29 hạng mục</span>
                                        </td>
                                    </tr>
                                </table>
                            </div>

                            <!-- Progress Bar -->
                            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; margin-bottom: 24px;">
                                <table width="100%" style="margin-bottom: 6px;">
                                    <tr>
                                        <td style="font-size: 12px; font-weight: 700; color: #334155;">Tiến độ thực tế toàn dự án:</td>
                                        <td align="right" style="font-size: 13px; font-weight: 800; color: #16a34a;">{data['pct']}% ({data['completed']}/{data['total_tasks']} tasks)</td>
                                    </tr>
                                </table>
                                <div style="background-color: #e2e8f0; border-radius: 8px; height: 10px; overflow: hidden;">
                                    <div style="background-color: #16a34a; width: {data['pct']}%; height: 10px; border-radius: 8px;"></div>
                                </div>
                            </div>

                            <!-- Overdue & Urgent Section -->
                            <div style="margin-bottom: 24px;">
                                <div style="font-size: 12px; font-weight: 700; color: #dc2626; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px;">
                                    🚨 2. Hạng mục Cần Giám đốc Xử lý & Đôn đốc:
                                </div>
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
                                        {overdue_rows}
                                        {urgent_rows}
                                    </tbody>
                                </table>
                            </div>

                            <!-- Action Button -->
                            <div style="text-align: center; padding-top: 8px;">
                                <a href="{data['site_url']}" target="_blank" style="display: inline-block; background-color: #2c1a0e; color: #ffffff; font-size: 13px; font-weight: 700; text-decoration: none; padding: 12px 28px; border-radius: 10px; box-shadow: 0 2px 8px rgba(44,26,14,0.3);">
                                    Truy cập Hệ thống HANA PM Hub →
                                </a>
                                <p style="font-size: 11px; color: #94a3b8; margin-top: 10px;">Bấm để xem danh sách chi tiết, đổi trạng thái hoặc điều chỉnh ngân sách.</p>
                            </div>

                        </td>
                    </tr>

                    <!-- Footer -->
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
</html>"""
    return html

def send_resend_email(resend_api_key, recipient_email, subject, html_content, text_content):
    if not resend_api_key:
        print("[Resend] Chưa cấu hình RESEND_API_KEY.")
        return False
    try:
        url = "https://api.resend.com/emails"
        payload = json.dumps({
            "from": "HANA PM Hub <onboarding@resend.dev>",
            "to": [r.strip() for r in recipient_email.split(",") if r.strip()],
            "subject": subject,
            "html": html_content,
            "text": text_content
        }).encode("utf-8")

        req = urllib.request.Request(
            url, 
            data=payload, 
            headers={
                "Authorization": f"Bearer {resend_api_key}",
                "Content-Type": "application/json"
            }
        )
        with urllib.request.urlopen(req) as resp:
            print("[Resend.com] Gửi email báo cáo thành công:", resp.status)
            return True
    except Exception as e:
        print("[Resend Error]:", e)
        return False

def send_zalo_webhook(webhook_url, text):
    if not webhook_url:
        print("[Zalo] Chưa cấu hình Zalo Webhook URL.")
        return False
    try:
        payload = json.dumps({"text": text}).encode("utf-8")
        req = urllib.request.Request(webhook_url, data=payload, headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req) as resp:
            print("[Zalo] Gửi tin nhắn thành công:", resp.status)
            return True
    except Exception as e:
        print("[Zalo Error]:", e)
        return False

if __name__ == "__main__":
    data = generate_report_data()
    html_report = generate_html_email(data)
    
    plain_text = f"""📌 BÁO CÁO TIẾN ĐỘ DỰ ÁN HANA WELLNESS PM HUB
⏰ Thời gian: 08:00 AM Hàng Ngày ({data['date_str']})
🔗 Truy cập: {data['site_url']}

📊 1. TỔNG QUAN TIẾN ĐỘ:
• Tỷ lệ hoàn thành: {data['pct']}% ({data['completed']}/{data['total_tasks']} công việc)
• Đếm ngược khai trương (02-11-2026): còn {data['days_left']} ngày
• Ngân sách CAPEX: {data['total_capex']:,.0f} VNĐ

🚨 2. CÔNG VIỆC CẦN XỬ LÝ GẤP:
"""
    for t in (data["overdue_list"] + data["urgent_list"])[:6]:
        t_title = t.get("title", "")
        t_pic = t.get("pic", "")
        t_due = t.get("dueDate", "")
        t_status = t.get("status", "")
        plain_text += "• " + str(t_title) + " | Phụ trách: " + str(t_pic) + " | Hạn: " + str(t_due) + " (" + str(t_status) + ")\n"
    
    plain_text += "\n👉 Xem chi tiết tại: " + str(data["site_url"]) + "\n"

    resend_key = os.getenv("RESEND_API_KEY", "")
    recipient = os.getenv("REPORT_RECIPIENT_EMAIL", "phamtunghcm@gmail.com")
    zalo_url = os.getenv("ZALO_WEBHOOK_URL", "")

    print("=== BÁO CÁO KẾT NỐI RESEND.COM & ZALO ===")
    print(plain_text)
    
    if resend_key and recipient:
        send_resend_email(resend_key, recipient, f"📌 [HANA PM Hub] Báo cáo Điều hành Dự án - 08:00 AM ({data['date_str']})", html_report, plain_text)
    else:
        print("💡 Lưu ý: Cần cấu hình RESEND_API_KEY trong GitHub Secrets để tự động gửi email.")
    
    if zalo_url:
        send_zalo_webhook(zalo_url, plain_text)
