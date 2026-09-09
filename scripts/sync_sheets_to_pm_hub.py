#!/usr/bin/env python3
"""
ĐỒNG BỘ 2 CHIỀU GIỮA GOOGLE SHEETS VÀ HANA PM HUB (CLOUDFLARE KV)
1. Mua sắm (Capex):
   - Nguồn: https://docs.google.com/spreadsheets/d/17abDmjThWZ-kQdW2cVPl2Kp8BfEz2v7trtebELIkD_s/edit
   - Sheet 'Setup Lễ tân' (gid=1002) + 'Setup Spa' (gid=1001)
   - Lọc chỉ lấy các mục có Tổng SL (qty) > 0 (bỏ các mục qty <= 0)
   - Giữ lại 2 khoản cố định ban đầu (Thuê nhà 100tr, Thi công thô 110tr)
2. Hồ sơ Pháp lý (Legal):
   - Nguồn: https://docs.google.com/spreadsheets/d/1XpU-5goVpdFNgYGpV6wkVYznTA8KDsz5/edit?gid=2104154183
   - Sheet 'Chi tiết tiến độ' (33 mục chuẩn NĐ 30 mang tên NĐDPL Phạm Vũ Tùng)
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

# Map existing status from cloud to respect 2-way edits from web
existing_capex_status = {c.get("title", "").strip(): c.get("status") for c in current_capex if c.get("title")}
existing_legal_status = {l.get("title", "").strip(): l.get("status") for l in current_legal if l.get("title")}

print("2. Đang đọc & xử lý Mua sắm (Chỉ lấy SL > 0)...")
d_spa = fetch_csv(URL_SHOPPING_SPA)
d_letan = fetch_csv(URL_SHOPPING_LETAN)

new_capex = [
    {
        "id": "capex_0_1",
        "group": "Chi phí Cố định Ban đầu",
        "title": "Thi công thô & Sửa chữa cơ sở",
        "qty": 1,
        "unitPrice": 110000000,
        "totalPrice": 110000000,
        "status": existing_capex_status.get("Thi công thô & Sửa chữa cơ sở", "Đã chi / Đang thi công"),
        "note": "Hạng mục cố định ngoài Google Sheets",
        "zone": "Toàn bộ cơ sở",
        "type": "capex"
    },
    {
        "id": "capex_0_2",
        "group": "Chi phí Cố định Ban đầu",
        "title": "Đặt cọc thuê mặt bằng",
        "qty": 1,
        "unitPrice": 100000000,
        "totalPrice": 100000000,
        "status": existing_capex_status.get("Đặt cọc thuê mặt bằng", "Đã hoàn thành"),
        "note": "Hạng mục cố định ngoài Google Sheets",
        "zone": "Toàn bộ cơ sở",
        "type": "capex"
    }
]

def parse_num(val_str, default=0):
    if not val_str:
        return default
    try:
        clean = str(val_str).replace(",", "").replace(".", "").strip()
        # In this sheet, prices are often written in 1,000s e.g. 4,500 means 4,500,000
        # If value is in thousands (e.g. <= 100000), multiply by 1000 for VND display if needed
        val = float(clean)
        return val
    except:
        return default

# Parse Setup Lễ tân
id_idx = 1
for r in d_letan[7:]:
    if len(r) > 7:
        name = r[5].strip()
        qty_str = r[7].strip()
        try:
            qty = float(qty_str.replace(",", "")) if qty_str else 0
        except ValueError:
            qty = 0
        
        # Chỉ lấy số lượng > 0
        if name and qty > 0:
            price_val = parse_num(r[8]) * 1000 if parse_num(r[8]) < 100000 and parse_num(r[8]) > 0 else parse_num(r[8])
            total_val = parse_num(r[9]) * 1000 if parse_num(r[9]) < 500000 and parse_num(r[9]) > 0 else parse_num(r[9])
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

# Parse Setup Spa
id_spa_idx = 1
for r in d_spa[7:]:
    if len(r) > 6:
        name = r[4].strip()
        qty_str = r[6].strip()
        try:
            qty = float(qty_str.replace(",", "")) if qty_str else 0
        except ValueError:
            qty = 0
            
        # Chỉ lấy số lượng > 0
        if name and qty > 0:
            price_val = parse_num(r[8]) * 1000 if parse_num(r[8]) < 100000 and parse_num(r[8]) > 0 else parse_num(r[8])
            total_val = parse_num(r[9]) * 1000 if parse_num(r[9]) < 500000 and parse_num(r[9]) > 0 else parse_num(r[9])
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

print(f"-> Tổng hạng mục Mua sắm (SL > 0): {len(new_capex)} hạng mục (bao gồm 2 cố định + {len(new_capex)-2} trang thiết bị).")

print("3. Đang đọc & xử lý Hồ sơ Pháp lý (33 mục)...")
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
        
        status = existing_legal_status.get(title, sheet_status)
        
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

print(f"-> Tổng hạng mục Pháp lý: {len(new_legal)} mục.")

print("4. Cập nhật dữ liệu lên Cloudflare KV Database...")
payload = {
    "tasks": tasks,
    "legal": new_legal,
    "docs": docs,
    "capex": new_capex,
    "settings": settings,
    "userPermissions": user_perms
}

req_post = urllib.request.Request(
    CLOUD_API,
    headers={"Content-Type": "application/json", "User-Agent": "Mozilla/5.0"},
    data=json.dumps(payload).encode("utf-8"),
    method="POST"
)

with urllib.request.urlopen(req_post) as post_resp:
    res_json = json.loads(post_resp.read().decode())
    print("Cloud response:", res_json)

# Also update local fallback files in repo
with open("src/data/capex30.json", "w", encoding="utf-8") as f:
    json.dump(new_capex, f, ensure_ascii=False, indent=2)

with open("src/data/legal5.json", "w", encoding="utf-8") as f:
    json.dump(new_legal, f, ensure_ascii=False, indent=2)

print("✅ ĐÃ HOÀN TẤT ĐỒNG BỘ CẢ TIẾN ĐỘ MUA SẮM VÀ HỒ SƠ PHÁP LÝ!")
