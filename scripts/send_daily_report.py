# Thư viện gửi báo cáo tự động HANA PM Hub (Resend.com API, Email SMTP & Zalo)
import json
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import urllib.request

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "src", "data")

def load_json(filename):
    path = os.path.join(DATA_DIR, filename)
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    return []

def generate_report():
    tasks = load_json("tasks36.json")
    capex = load_json("capex30.json")

    completed = sum(1 for t in tasks if t.get("status") == "Hoàn thành")
    total_tasks = len(tasks)
    pct = round((completed / total_tasks * 100)) if total_tasks else 0

    urgent = [t for t in tasks if t.get("status") != "Hoàn thành" and t.get("daysLeft", 0) < 15]
    total_capex = sum(float(c.get("totalPrice", 0)) for c in capex)

    site_url = os.getenv("PM_HUB_SITE_URL", "http://localhost:5175/")

    report_lines = [
        "📌 BÁO CÁO TIẾN ĐỘ DỰ ÁN HANA WELLNESS PM HUB",
        "⏰ Thời gian: 08:00 AM Hàng Ngày",
        f"🔗 Truy cập PM Hub: {site_url}",
        "",
        "📊 1. TỔNG QUAN TIẾN ĐỘ:",
        f"• Tỷ lệ hoàn thành: {pct}% ({completed}/{total_tasks} công việc)",
        "• Ngày mục tiêu khai trương: 02-11-2026",
        f"• Ngân sách CAPEX: {total_capex:,.0f} VNĐ (gồm 110tr thi công + 100tr đặt cọc + mua sắm)",
        "",
        f"🚨 2. CÔNG VIỆC CẦN XỬ LÝ GẤP ({len(urgent)} việc):"
    ]

    for u in urgent[:5]:
        title = u.get("title")
        pic = u.get("pic")
        dueDate = u.get("dueDate")
        report_lines.append(f"• {title} | Phụ trách: {pic} | Hạn: {dueDate}")

    report_lines.extend([
        "",
        f"👉 Bấm vào liên kết để xem chi tiết & cập nhật: {site_url}"
    ])

    return "\n".join(report_lines)

def send_resend_email(resend_api_key, recipient_email, subject, text_content):
    if not resend_api_key:
        print("[Resend] Chưa cấu hình RESEND_API_KEY.")
        return False
    try:
        url = "https://api.resend.com/emails"
        payload = json.dumps({
            "from": "HANA PM Hub <onboarding@resend.dev>",
            "to": [recipient_email],
            "subject": subject,
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
    content = generate_report()
    resend_key = os.getenv("RESEND_API_KEY", "")
    recipient = os.getenv("REPORT_RECIPIENT_EMAIL", "")
    zalo_url = os.getenv("ZALO_WEBHOOK_URL", "")

    print("=== BÁO CÁO KẾT NỐI RESEND.COM & ZALO ===")
    print(content)
    
    if resend_key and recipient:
        send_resend_email(resend_key, recipient, "📌 Báo cáo Tiến độ HANA PM Hub - 08:00 AM", content)
    if zalo_url:
        send_zalo_webhook(zalo_url, content)
