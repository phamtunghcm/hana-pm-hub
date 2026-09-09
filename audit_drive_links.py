import os, subprocess, json, openpyxl, re

print("1. Đang quét toàn bộ file thực tế trong thư mục Google Drive...")
drive_root = "/Users/tungpv/Library/CloudStorage/GoogleDrive-phamtunghcm@gmail.com/My Drive/1 Hana Wellness Project/01 Kinh doanh Vận hành/02 SOP & Vận hành"

drive_files_by_id = {}
drive_files_by_name = {}

for root, dirs, files in os.walk(drive_root):
    for f in files:
        full_p = os.path.join(root, f)
        try:
            res = subprocess.run(["xattr", "-p", "com.google.drivefs.item-id#S", full_p], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            item_id = res.stdout.strip()
            if item_id:
                drive_files_by_id[item_id] = {
                    "filename": f,
                    "path": full_p,
                    "relpath": os.path.relpath(full_p, drive_root)
                }
                drive_files_by_name[f] = item_id
        except Exception:
            pass

    for d in dirs:
        full_d = os.path.join(root, d)
        try:
            res = subprocess.run(["xattr", "-p", "com.google.drivefs.item-id#S", full_d], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            item_id = res.stdout.strip()
            if item_id:
                drive_files_by_id[item_id] = {
                    "filename": d + " (Folder)",
                    "path": full_d,
                    "relpath": os.path.relpath(full_d, drive_root)
                }
                drive_files_by_name[d] = item_id
        except Exception:
            pass

print(f"-> Đã quét {len(drive_files_by_id)} file & folder có Drive ID thực tế.")

print("\n2. Đang kiểm tra 33 mục pháp lý từ Cloud DB và đối chiếu...")
with open("src/data/legal5.json", "r", encoding="utf-8") as f:
    legal_items = json.load(f)

report = []
for it in legal_items:
    stt = it["id"]
    title = it["title"]
    file_link = it.get("fileLink", "")
    file_label = it.get("fileLabel", "")
    
    # Extract ID from link
    # https://drive.google.com/file/d/<id>/view or https://drive.google.com/drive/folders/<id>
    matched_id = ""
    m_file = re.search(r"/file/d/([a-zA-Z0-9_-]+)", file_link)
    m_folder = re.search(r"/folders/([a-zA-Z0-9_-]+)", file_link)
    if m_file:
        matched_id = m_file.group(1)
    elif m_folder:
        matched_id = m_folder.group(1)
        
    actual_file_info = drive_files_by_id.get(matched_id)
    
    report.append({
        "stt": stt,
        "title": title,
        "file_label": file_label,
        "file_link": file_link,
        "matched_id": matched_id,
        "actual_filename": actual_file_info["filename"] if actual_file_info else "KHÔNG TÌM THẤY ID TRÊN DRIVE HOẶC LINK NGOÀI",
        "actual_path": actual_file_info["relpath"] if actual_file_info else None
    })

print("\n=== KẾT QUẢ ĐỐI CHIẾU TIÊU ĐỀ, TÊN FILE & LINK ===")
for r in report:
    print(f"[{r['stt']:02d}] {r['title']}")
    print(f"     Label trên PM:  {r['file_label']}")
    print(f"     Tên file Drive: {r['actual_filename']}")
    print(f"     Link Drive:     {r['file_link']}")
    print(f"     Đường dẫn file: {r['actual_path']}\n")
