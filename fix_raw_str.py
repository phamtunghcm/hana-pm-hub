with open("scripts/send_daily_report.py", "r") as f:
    text = f.read()

# Replace the loop formatting with normal string concat
old_chunk = """    for t in (data["overdue_list"] + data["urgent_list"])[:6]:
        plain_text += f"• {t.get('title')} | Phụ trách: {t.get('pic')} | Hạn: {t.get('dueDate')} ({t.get('status')})\n" """

new_chunk = """    for t in (data["overdue_list"] + data["urgent_list"])[:6]:
        t_title = t.get("title", "")
        t_pic = t.get("pic", "")
        t_due = t.get("dueDate", "")
        t_status = t.get("status", "")
        plain_text += f"• {t_title} | Phụ trách: {t_pic} | Hạn: {t_due} ({t_status})\\n" """

# Also find and replace any multiline f-string with simple string format
text = text.replace('plain_text += f"• {t.get(\'title\')} | Phụ trách: {t.get(\'pic\')} | Hạn: {t.get(\'dueDate\')} ({t.get(\'status\')})\n"',
                    't_title = t.get("title", "")\n        t_pic = t.get("pic", "")\n        t_due = t.get("dueDate", "")\n        t_status = t.get("status", "")\n        plain_text += "• " + str(t_title) + " | Phụ trách: " + str(t_pic) + " | Hạn: " + str(t_due) + " (" + str(t_status) + ")\\n"')

with open("scripts/send_daily_report.py", "w") as f:
    f.write(text)
