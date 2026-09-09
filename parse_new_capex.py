import csv
import json

capex_data = [
  {
    "id": "capex_0_1",
    "group": "Chi phí Cố định Ban đầu",
    "title": "Thi công thô & Sửa chữa cơ sở",
    "qty": 1,
    "unitPrice": 110000000,
    "totalPrice": 110000000,
    "status": "Đã chi / Đang thi công",
    "note": "Hạng mục cố định ngoài Google Sheets",
    "zone": "Toàn bộ cơ sở"
  },
  {
    "id": "capex_0_2",
    "group": "Chi phí Cố định Ban đầu",
    "title": "Đặt cọc thuê mặt bằng",
    "qty": 1,
    "unitPrice": 100000000,
    "totalPrice": 100000000,
    "status": "Đã hoàn thành",
    "note": "Hạng mục cố định ngoài Google Sheets",
    "zone": "Toàn bộ cơ sở"
  }
]

with open('new_capex.csv', 'r', encoding='utf-8') as f:
    reader = csv.reader(f)
    lines = list(reader)

# The header is at line 7 (index 6) or 8
header_idx = 0
for i, row in enumerate(lines):
    if len(row) > 2 and row[1].strip() == "Khu vực":
        header_idx = i
        break

id_counter = 1
for i in range(header_idx + 1, len(lines)):
    row = lines[i]
    if len(row) < 12:
        continue
    khu_vuc = row[1].strip()
    if not khu_vuc:
        continue
        
    # Nếu khu_vuc bị gộp dòng (vd trống)
    phan_loai = row[2].strip()
    tan_suat = row[3].strip()
    ten_vat_dung = row[4].strip()
    sl = row[6].strip()
    don_gia_str = row[8].strip().replace(',', '')
    thanh_tien_str = row[9].strip().replace(',', '')
    nha_cung_cap = row[10].strip()
    trang_thai = row[11].strip()
    
    if not ten_vat_dung:
        continue
        
    try:
        qty = int(sl) if sl else 1
    except:
        qty = 1
        
    try:
        unit_price = float(don_gia_str) * 1000 if don_gia_str else 0
    except:
        unit_price = 0
        
    try:
        total_price = float(thanh_tien_str) * 1000 if thanh_tien_str else (unit_price * qty)
    except:
        total_price = unit_price * qty
        
    if not trang_thai:
        trang_thai = "Cần mua"
        
    # Map frequency + category to Group
    group = "Thiết bị chuyên môn"
    if tan_suat == "Thường xuyên":
        group = "Đồ tiêu hao & Vật tư"
    elif "máy móc" in phan_loai.lower():
        group = "Thiết bị chuyên môn"
    elif "nội thất" in phan_loai.lower():
        group = "Nội thất & Vật tư cơ bản"
    elif phan_loai:
        group = phan_loai # fallback to the original spreadsheet category
        
    item = {
        "id": f"capex_1_{id_counter}",
        "zone": khu_vuc,
        "group": group,
        "title": ten_vat_dung,
        "qty": qty,
        "unitPrice": int(unit_price),
        "totalPrice": int(total_price),
        "status": trang_thai,
        "note": nha_cung_cap
    }
    capex_data.append(item)
    id_counter += 1

with open('src/data/capex30.json', 'w', encoding='utf-8') as f:
    json.dump(capex_data, f, ensure_ascii=False, indent=2)

print(f"Parsed {len(capex_data)} items successfully.")
