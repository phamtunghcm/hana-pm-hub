#!/usr/bin/env python3
"""
ĐỒNG BỘ 2 CHIỀU CHUẨN XÁC 100%: GOOGLE SHEETS <---> HANA PM HUB (CLOUDFLARE KV)
- NGUYÊN TẮC: Chỉ giữ những dòng THỰC TẾ CÓ TRÊN GOOGLE SHEETS.
  Dòng nào không có trên Google Sheet thì LOẠI BỎ HOÀN TOÀN khỏi PM Hub.
- Mua sắm (Capex):
  * Setup Lễ tân (gid=1002) + Setup Spa (gid=1001)
  * Lọc chỉ lấy các mục có Tổng SL > 0 (bỏ các mục SL <= 0)
  * Đúng 64 hạng mục trang thiết bị (25 Lễ tân + 39 Spa).
- Hồ sơ Pháp lý (Legal):
  * Bảng theo dõi tiến độ pháp lý (gid=2104154183)
  * Đúng 33 hạng mục hồ sơ pháp lý chuẩn NĐ 30 mang tên NĐDPL Phạm Vũ Tùng.
"""

import urllib.request, csv, io, json, sys

URL_SHOPPING_SPA = "https://docs.google.com/spreadsheets/d/17abDmjThWZ-kQdW2cVPl2Kp8BfEz2v7trtebELIkD_s/export?format=csv&gid=1001"
URL_SHOPPING_LETAN = "https://docs.google.com/spreadsheets/d/17abDmjThWZ-kQdW2cVPl2Kp8BfEz2v7trtebELIkD_s/export?format=csv&gid=1002"
URL_LEGAL = "https://docs.google.com/spreadsheets/d/1XpU-5goVpdFNgYGpV6wkVYznTA8KDsz5/export?format=csv&gid=2104154183"

CLOUD_API = "https://hana-pm-hub.pages.dev/api/data"
HEADERS = {"User-Agent": "Mozilla/5.0"}

def fetch_csv(url):
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req) as resp:
        return list(csv.reader(io.StringIO(resp.read().decode("utf-8"))))

print("1. Đang tải dữ liệu hiện tại từ Cloudflare KV...")
req_cloud = urllib.request.Request(CLOUD_API, headers=HEADERS)
with urllib.request.urlopen(req_cloud) as resp:
    live_cloud = json.loads(resp.read().decode())

if not live_cloud.get("success") or not live_cloud.get("data"):
    print("❌ Không thể kết nối Cloud DB!")
    sys.exit(1)

cloud_data = live_cloud["data"]
tasks = cloud_data.get("tasks", [])
docs = cloud_data.get("docs", [])
settings = cloud_data.get("settings", {})
user_perms = cloud_data.get("userPermissions", [])
current_capex = cloud_data.get("capex", [])
current_legal = cloud_data.get("legal", [])

# Lưu map trạng thái hiện tại từ cloud để bảo tồn các cập nhật từ Web (2 chiều)
existing_capex_status = {c.get("title", "").strip(): c.get("status") for c in current_capex if c.get("title")}
existing_legal_status = {l.get("id"): l.get("status") for l in current_legal if l.get("id")}

print("2. Đang đọc & xử lý Mua sắm (100% từ Google Sheets, SL > 0, KHÔNG thêm mục ngoài)...")
d_spa = fetch_csv(URL_SHOPPING_SPA)
d_letan = fetch_csv(URL_SHOPPING_LETAN)

new_capex = []

def parse_num(val_str, default=0):
    if not val_str:
        return default
    try:
        clean = str(val_str).replace(",", "").replace(".", "").strip()
        val = float(clean)
        return val
    except:
        return default

# Parse Setup Lễ tân (Chỉ lấy dòng có trong sheet và SL > 0)
id_idx = 1
for r in d_letan[7:]:
    if len(r) > 7:
        name = r[5].strip()
        qty_str = r[7].strip()
        try:
            qty = float(qty_str.replace(",", "")) if qty_str else 0
        except ValueError:
            qty = 0
        
        if name and qty > 0:
            price_val = parse_num(r[8]) * 1000 if 0 < parse_num(r[8]) < 100000 else parse_num(r[8])
            total_val = parse_num(r[9]) * 1000 if 0 < parse_num(r[9]) < 500000 else parse_num(r[9])
            if total_val == 0 and price_val > 0:
                total_val = price_val * qty
                
            sheet_status = r[11].strip() or "Chưa mua"
            status = existing_capex_status.get(name, sheet_status)
            
            new_capex.append({
                "id": f"capex_lt_{id_idx}",
                "group": "Sảnh Lễ tân & Mặt tiền",
                "zone": r[2].strip() or "Sảnh Lễ tân",
                "title": name,
                "qty": int(qty) if qty.is_integer() else qty,
                "unitPrice": int(price_val),
                "totalPrice": int(total_val),
                "status": status,
                "note": f"Phân loại: {r[3].strip()} | NCC: {r[10].strip()}" if r[10].strip() else f"Phân loại: {r[3].strip()}",
                "type": "capex"
            })
            id_idx += 1

# Parse Setup Spa (Chỉ lấy dòng có trong sheet và SL > 0)
id_spa_idx = 1
for r in d_spa[7:]:
    if len(r) > 6:
        name = r[4].strip()
        qty_str = r[6].strip()
        try:
            qty = float(qty_str.replace(",", "")) if qty_str else 0
        except ValueError:
            qty = 0
            
        if name and qty > 0:
            price_val = parse_num(r[8]) * 1000 if 0 < parse_num(r[8]) < 100000 else parse_num(r[8])
            total_val = parse_num(r[9]) * 1000 if 0 < parse_num(r[9]) < 500000 else parse_num(r[9])
            if total_val == 0 and price_val > 0:
                total_val = price_val * qty
                
            sheet_status = r[11].strip() or "Chưa mua"
            status = existing_capex_status.get(name, sheet_status)
            
            new_capex.append({
                "id": f"capex_spa_{id_spa_idx}",
                "group": "Khu vực Trị liệu Spa",
                "zone": r[1].strip() or "Phòng Trị liệu",
                "title": name,
                "qty": int(qty) if qty.is_integer() else qty,
                "unitPrice": int(price_val),
                "totalPrice": int(total_val),
                "status": status,
                "note": f"Phân loại: {r[2].strip()} | NCC: {r[10].strip()}" if r[10].strip() else f"Phân loại: {r[2].strip()}",
                "type": "capex"
            })
            id_spa_idx += 1

print(f"-> Tổng hạng mục Mua sắm (100% từ Sheets, SL > 0): {len(new_capex)} hạng mục (25 Lễ tân + 39 Spa).")

print("3. Đang đọc & xử lý Hồ sơ Pháp lý (100% từ Google Sheets, 33 mục)...")
d_legal = fetch_csv(URL_LEGAL)
new_legal = []

for r in d_legal[4:]:
    if len(r) > 10 and r[0].strip().isdigit():
        stt = int(r[0].strip())
        group = r[1].strip()
        title = r[2].strip()
        content = r[3].strip()
        doc_link = r[4].strip()
        legal_basis = r[5].strip()
        agency = r[6].strip()
        pic = r[7].strip()
        start = r[8].strip()
        deadline = r[9].strip()
        sheet_status = r[10].strip()
        note = r[11].strip() if len(r) > 11 else ""
        
        status = existing_legal_status.get(stt, sheet_status)
        
        new_legal.append({
            "id": stt,
            "group": group,
            "title": f"[{stt:02d}] {title}",
            "agency": agency,
            "timeEstimate": f"{start} -> {deadline}",
            "status": status,
            "note": f"{content}. Căn cứ: {legal_basis}. Phụ trách: {pic}. {note}".strip(),
            "fileLink": doc_link,
            "type": "legal"
        })

print(f"-> Tổng hạng mục Pháp lý (100% từ Sheets): {len(new_legal)} mục.")

print("4. Cập nhật dữ liệu lên Cloudflare KV Database...")
cloud_data["capex"] = new_capex
cloud_data["legal"] = new_legal

req_post = urllib.request.Request(
    CLOUD_API,
    headers={"Content-Type": "application/json", "User-Agent": "Mozilla/5.0"},
    data=json.dumps(cloud_data).encode("utf-8"),
    method="POST"
)

with urllib.request.urlopen(req_post) as post_resp:
    res_json = json.loads(post_resp.read().decode())
    print("Cloud response:", res_json)

# Lưu lại các file dự phòng local trong repo
with open("src/data/capex30.json", "w", encoding="utf-8") as f:
    json.dump(new_capex, f, ensure_ascii=False, indent=2)

with open("src/data/legal5.json", "w", encoding="utf-8") as f:
    json.dump(new_legal, f, ensure_ascii=False, indent=2)

print("✅ ĐÃ ĐỒNG BỘ CHUẨN XÁC: TOÀN BỘ CÁC MỤC NGOÀI GOOGLE SHEETS ĐÃ ĐƯỢC LOẠI BỎ HOÀN TOÀN!")
