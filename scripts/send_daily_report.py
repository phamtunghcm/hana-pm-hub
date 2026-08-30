# Thư viện gửi báo cáo tự động HANA PM Hub (Gmail SMTP, Resend.com & Zalo)
import json
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import urllib.request
from datetime import datetime

def load_live_data():
    url = "https://hana-pm-hub.pages.dev/api/data"
    try:
        req = urllib.request.Request(
            url, 
            headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Content-Type": "application/json"
            }
        )
        with urllib.request.urlopen(req, timeout=15) as resp:
            resp_data = json.loads(resp.read().decode('utf-8'))
            if resp_data.get('success') and resp_data.get('data'):
                print("✅ Đã lấy dữ liệu live từ Cloudflare KV thành công!")
                return resp_data['data']
    except Exception as e:
        print("⚠️ Failed to fetch live data from KV over HTTP:", e)
        
    # Fallback to local backup files if available
    for fallback_file in ["live_final.json", "live_data.json", "full_capex_correct.json"]:
        if os.path.exists(fallback_file):
            try:
                with open(fallback_file, "r", encoding="utf-8") as f:
                    local_data = json.load(f)
                    print(f"✅ Đã tải dữ liệu dự phòng từ file cục bộ: {fallback_file}")
                    return local_data
            except Exception as fe:
                pass
    return None

def generate_report_data(live_data):
    if not live_data:
        print("Using empty data due to fetch error.")
        return None

    tasks = live_data.get('tasks', [])
    docs = live_data.get('docs', [])
    legal = live_data.get('legal', [])
    capex = live_data.get('capex', [])
    settings = live_data.get('settings', {})

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

    completed_list = [t for t in all_tasks if t.get("status") in ["Hoàn thành", "Đã hoàn thành", "Đã ban hành"]]
    completed = len(completed_list)
    total_tasks = len(all_tasks)
    pct = round((completed / total_tasks * 100)) if total_tasks else 0

    doing_list = [t for t in all_tasks if t.get("status") in ["Đang thực hiện", "Đang soạn thảo"]]
    in_progress = len(doing_list)

    overdue_list = [t for t in all_tasks if t.get("status") != "Hoàn thành" and int(t.get("daysLeft", 0)) < 0]
    urgent_list = [t for t in all_tasks if t.get("status") != "Hoàn thành" and 0 <= int(t.get("daysLeft", 0)) <= 15]

    total_capex = 0
    for c in capex:
        if c.get("totalPrice"):
            try:
                total_capex += float(str(c.get("totalPrice", 0)).replace(",", ""))
            except:
                pass

    target_date = datetime(2026, 11, 2)
    today = datetime.now()
    days_left = max(0, (target_date - today).days)

    site_url = "https://hana-pm-hub.pages.dev"
    
    # Lay danh sach email tu KV settings
    recipient = settings.get("reportEmail", "phamtunghcm@gmail.com")

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
        "date_str": today.strftime("%d/%m/%Y"),
        "recipient": recipient
    }

def generate_html_email(data):
    overdue_rows = ""
    if data["overdue_list"]:
        for t in data["overdue_list"]:
            title = t.get("title", "")
            pic = t.get("pic", "")
            due = t.get("dueDate", "")
            status = t.get("status", "")
            overdue_rows += f'''
            <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 10px 12px;"><strong>{title}</strong></td>
                <td style="padding: 10px 12px; text-align: center;"><span style="background-color: #fee2e2; color: #b91c1c; padding: 4px 8px; border-radius: 4px; font-weight: 700;">{status}</span></td>
                <td style="padding: 10px 12px; font-weight: 600; color: #475569;">{pic}</td>
                <td style="padding: 10px 12px; text-align: right; color: #b91c1c; font-weight: 700;">{due}</td>
            </tr>'''
    else:
        overdue_rows = '<tr><td colspan="4" style="padding: 10px; text-align: center; color: #64748b;">Tuyệt vời! Không có công việc nào quá hạn.</td></tr>'

    urgent_rows = ""
    if data["urgent_list"]:
        for t in data["urgent_list"]:
            title = t.get("title", "")
            pic = t.get("pic", "")
            due = t.get("dueDate", "")
            status = t.get("status", "")
            urgent_rows += f'''
            <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 10px 12px;"><strong>{title}</strong></td>
                <td style="padding: 10px 12px; text-align: center;"><span style="background-color: #fef3c7; color: #d97706; padding: 4px 8px; border-radius: 4px; font-weight: 700;">{status}</span></td>
                <td style="padding: 10px 12px; font-weight: 600; color: #475569;">{pic}</td>
                <td style="padding: 10px 12px; text-align: right; color: #d97706; font-weight: 700;">{due}</td>
            </tr>'''

    html = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 20px;">
        <tr>
            <td align="center">
                <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
                    <!-- Header -->
                    <tr>
                        <td style="background-color: #2c1a0e; padding: 30px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 0.5px;">HANA WELLNESS</h1>
                            <p style="color: #d4af37; margin: 8px 0 0 0; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Báo Cáo Điều Hành Dự Án</p>
                        </td>
                    </tr>
                    
                    <!-- Body -->
                    <tr>
                        <td style="padding: 30px 40px;">
                            <!-- Intro -->
                            <div style="background-color: #f8fafc; border-left: 4px solid #d4af37; padding: 16px; margin-bottom: 24px; border-radius: 0 8px 8px 0;">
                                <div style="font-size: 11px; font-weight: 800; color: #d4af37; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 4px;">Executive Briefing • 08:00 AM</div>
                                <div style="font-size: 14px; color: #334155; line-height: 1.6;">
                                    <strong>Kính gửi Ban Giám Đốc,</strong><br/>
                                    Dưới đây là tóm tắt tiến độ dự án tự động trích xuất từ hệ thống HANA PM Hub lúc 08:00 sáng nay.
                                </div>
                            </div>

                            <!-- Overview Section -->
                            <div style="margin-bottom: 24px;">
                                <div style="font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px;">
                                    📊 1. Tổng quan Dự án:
                                </div>
                                <table width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 12px;">
                                    <tr>
                                        <td style="padding-bottom: 8px;"><span style="color: #64748b; font-size: 13px;">Đếm ngược khai trương:</span></td>
                                        <td align="right" style="padding-bottom: 8px; font-size: 14px; font-weight: 800; color: #b91c1c;">Còn {data['days_left']} ngày</td>
                                    </tr>
                                    <tr>
                                        <td style="padding-bottom: 8px;"><span style="color: #64748b; font-size: 13px;">Ngân sách CAPEX:</span></td>
                                        <td align="right" style="padding-bottom: 8px; font-size: 14px; font-weight: 800; color: #0f172a;">{data['total_capex']:,.0f} VNĐ</td>
                                    </tr>
                                    <tr>
                                        <td style="padding-bottom: 4px;"><span style="color: #64748b; font-size: 13px;">Tỷ lệ hoàn thành:</span></td>
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

def send_smtp_email(user, password, recipient, subject, html_content, text_content):
    if not user or not password:
        return False
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"HANA Wellness PM Hub <{user}>"
        msg["To"] = recipient

        part1 = MIMEText(text_content, "plain", "utf-8")
        part2 = MIMEText(html_content, "html", "utf-8")
        msg.attach(part1)
        msg.attach(part2)

        to_list = [r.strip() for r in recipient.split(",") if r.strip()]
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(user, password)
            server.sendmail(user, to_list, msg.as_string())
        print(f"[Gmail SMTP] Gửi email thành công đến {recipient} qua {user}!")
        return True
    except Exception as e:
        print("[Gmail SMTP Error]:", e)
        return False

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

if __name__ == "__main__":
    live_data = load_live_data()
    if not live_data:
        print("Không thể lấy dữ liệu live từ hệ thống. Dừng script.")
        exit(1)
        
    data = generate_report_data(live_data)
    if not data:
        exit(1)
        
    html_report = generate_html_email(data)
    
    plain_text = f"""📌 BÁO CÁO TIẾN ĐỘ DỰ ÁN HANA WELLNESS PM Hub
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
        plain_text += f"• {t_title} | Phụ trách: {t_pic} | Hạn: {t_due} ({t_status})\n"
    
    plain_text += f"\n👉 Xem chi tiết tại: {data['site_url']}\n"

    smtp_user = os.getenv("SMTP_USER", "hanawellness.official@gmail.com")
    smtp_pass = os.getenv("SMTP_PASS", "vykfjngcvcwwmbjl")
    resend_key = os.getenv("RESEND_API_KEY", "")
    
    # Lấy recipient TỪ TRONG DỮ LIỆU LIVE (do user cấu hình trên web UI)
    recipient = data["recipient"]
    if not recipient:
        recipient = "phamtunghcm@gmail.com, hanawellness.official@gmail.com"

    subject = f"📌 [HANA PM Hub] Báo cáo Điều hành Dự án - 08:00 AM ({data['date_str']})"

    print("=== BÁO CÁO KẾT NỐI EMAIL ===")
    print(plain_text)
    
    email_sent = False
    if smtp_user and smtp_pass:
        email_sent = send_smtp_email(smtp_user, smtp_pass, recipient, subject, html_report, plain_text)

    if not email_sent and resend_key:
        email_sent = send_resend_email(resend_key, recipient, subject, html_report, plain_text)
    
    if not email_sent:
        print("⚠️ Chưa thể gửi email (Kiểm tra lại cấu hình SMTP hoặc Resend).")
