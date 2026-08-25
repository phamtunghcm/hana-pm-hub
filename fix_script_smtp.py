with open("scripts/send_daily_report.py", "r") as f:
    code = f.read()

# Update send_daily_report.py to support direct Gmail SMTP as primary/fallback!
smtp_func = """def send_smtp_email(user, password, recipient, subject, html_content, text_content):
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
"""

# Replace in script
code = code.replace("def send_resend_email", smtp_func + "\ndef send_resend_email")

old_main = """    resend_key = os.getenv("RESEND_API_KEY", "")
    recipient = os.getenv("REPORT_RECIPIENT_EMAIL", "phamtunghcm@gmail.com")
    zalo_url = os.getenv("ZALO_WEBHOOK_URL", "")

    print("=== BÁO CÁO KẾT NỐI RESEND.COM & ZALO ===")
    print(plain_text)
    
    if resend_key and recipient:
        send_resend_email(resend_key, recipient, f"📌 [HANA PM Hub] Báo cáo Điều hành Dự án - 08:00 AM ({data['date_str']})", html_report, plain_text)
    else:
        print("💡 Lưu ý: Cần cấu hình RESEND_API_KEY trong GitHub Secrets để tự động gửi email.")
    
    if zalo_url:
        send_zalo_webhook(zalo_url, plain_text)"""

new_main = """    smtp_user = os.getenv("SMTP_USER", "hanawellness.official@gmail.com")
    smtp_pass = os.getenv("SMTP_PASS", "vykfjngcvcwwmbjl")
    resend_key = os.getenv("RESEND_API_KEY", "")
    recipient = os.getenv("REPORT_RECIPIENT_EMAIL", "phamtunghcm@gmail.com")
    zalo_url = os.getenv("ZALO_WEBHOOK_URL", "")

    subject = f"📌 [HANA PM Hub] Báo cáo Điều hành Dự án - 08:00 AM ({data['date_str']})"

    print("=== BÁO CÁO KẾT NỐI EMAIL & ZALO ===")
    print(plain_text)
    
    email_sent = False
    if smtp_user and smtp_pass:
        email_sent = send_smtp_email(smtp_user, smtp_pass, recipient, subject, html_report, plain_text)

    if not email_sent and resend_key:
        email_sent = send_resend_email(resend_key, recipient, subject, html_report, plain_text)
    
    if not email_sent:
        print("⚠️ Chưa thể gửi email (Kiểm tra lại cấu hình SMTP hoặc Resend).")

    if zalo_url:
        send_zalo_webhook(zalo_url, plain_text)"""

code = code.replace(old_main, new_main)

with open("scripts/send_daily_report.py", "w") as f:
    f.write(code)

print("send_daily_report.py updated with robust Gmail SMTP support!")
