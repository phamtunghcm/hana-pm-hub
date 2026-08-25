with open("scripts/send_daily_report.py", "r") as f:
    code = f.read()

# Add missing email mime imports at top of file
header = """# Thư viện gửi báo cáo tự động HANA PM Hub (Gmail SMTP, Resend.com & Zalo)
import json
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import urllib.request
from datetime import datetime
"""

code = code.replace("# Thư viện gửi báo cáo tự động HANA PM Hub (Resend.com API & Zalo Webhook)\nimport json\nimport os\nimport urllib.request\nfrom datetime import datetime", header)

with open("scripts/send_daily_report.py", "w") as f:
    f.write(code)

print("Imports fixed!")
