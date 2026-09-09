import json, urllib.request

# Load current legal items
with open("src/data/legal5.json", "r", encoding="utf-8") as f:
    legal = json.load(f)

# Audit mapping: Match exact drive file names
with open("audit_report.json", "w", encoding="utf-8") as f:
    pass

CLOUD_API = "https://hana-pm-hub.pages.dev/api/data"
HEADERS = {"User-Agent": "Mozilla/5.0"}

req = urllib.request.Request(CLOUD_API, headers=HEADERS)
live_data = json.loads(urllib.request.urlopen(req).read().decode())["data"]

# Map exact drive filename from audit
import audit_drive_links

for item in live_data["legal"]:
    stt = item["id"]
    # Check if there is a real drive filename
    matched_info = None
    for r in audit_drive_links.report:
        if r["stt"] == stt:
            matched_info = r
            break
            
    if matched_info and matched_info["actual_filename"] and "KHÔNG TÌM THẤY" not in matched_info["actual_filename"]:
        real_name = matched_info["actual_filename"]
        # If it's a folder, e.g. "Thay đổi ĐDPL (Folder)"
        if real_name.endswith(" (Folder)"):
            item["fileLabel"] = f"📁 Thư mục: {real_name.replace(' (Folder)', '')}"
        else:
            # Clean extension .docx or .xlsx for display if helpful, or keep full
            item["fileLabel"] = f"📄 {real_name}"

# Save back to Cloud KV
post_req = urllib.request.Request(
    CLOUD_API,
    headers={"Content-Type": "application/json", "User-Agent": "Mozilla/5.0"},
    data=json.dumps(live_data).encode("utf-8"),
    method="POST"
)
post_resp = urllib.request.urlopen(post_req)
print("Cloud KV response:", post_resp.read().decode())

with open("src/data/legal5.json", "w", encoding="utf-8") as f:
    json.dump(live_data["legal"], f, ensure_ascii=False, indent=2)

print("Đã cập nhật nhãn file hiển thị chuẩn 100% theo đúng tên file trên Google Drive!")
