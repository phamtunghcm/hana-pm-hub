with open("scripts/send_daily_report.py", "r") as f:
    content = f.read()

# Fix newline escaping inside f-string
content = content.replace('plain_text += f"• {t.get(\'title\')} | Phụ trách: {t.get(\'pic\')} | Hạn: {t.get(\'dueDate\')} ({t.get(\'status\')})\\n"',
                          'title = t.get("title", "")\n        pic = t.get("pic", "")\n        due = t.get("dueDate", "")\n        st = t.get("status", "")\n        plain_text += f"• {title} | Phụ trách: {pic} | Hạn: {due} ({st})\\n"')

with open("scripts/send_daily_report.py", "w") as f:
    f.write(content)
