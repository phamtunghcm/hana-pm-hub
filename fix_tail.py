with open("scripts/send_daily_report.py", "r") as f:
    lines = f.readlines()

new_lines = []
skip = False
for line in lines:
    if "plain_text += f\"" in line and not "👉" in line:
        continue
    if "👉 Xem chi tiết tại:" in line:
        new_lines.append('    plain_text += "\\n👉 Xem chi tiết tại: " + str(data["site_url"]) + "\\n"\n')
        continue
    if line.strip() == '"' or line.strip() == '""' or line.strip() == '"""':
        # Check if dangling quote
        if len(new_lines) > 0 and 'plain_text += "\\n👉' in new_lines[-1]:
            continue
    new_lines.append(line)

with open("scripts/send_daily_report.py", "w") as f:
    f.writelines(new_lines)
