import json

with open('full_capex_correct.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

for item in data:
    title = item['title'].lower()
    
    if item['group'] == "Chi phí Cố định Ban đầu":
        continue
        
    group = "Khác"
    
    # 1. PCCC
    if "bình chữa cháy" in title or "pccc" in title or "tiêu lệnh" in title:
        group = "Thiết bị PCCC"
    
    # 2. Máy móc / Thiết bị chuyên môn (Spa specific)
    elif "máy dds" in title or "máy bio" in title or "vòm xông" in title or "đá nóng" in title or "tinh dầu" in title or "massage" in title or "nồi đá" in title or "kẹp massage" in title:
        group = "Thiết bị chuyên môn"
        
    # 3. Điện máy & Văn phòng
    elif "máy lạnh" in title or "máy giặt" in title or "máy sấy" in title or "tủ lạnh" in title or "quạt" in title or "cây nước" in title or "máy in" in title or "loa" in title or "camera" in title or "ipad" in title or "wifi" in title or "máy xông" in title:
        group = "Thiết bị điện máy & Văn phòng"
        
    # 4. Marketing / In ấn
    elif "bảng hiệu" in title or "băng rôn" in title or "poster" in title or "voucher" in title or "standee" in title or "card" in title or "form" in title or "hộp mica" in title or "đồng phục" in title or "bảng tên" in title:
        group = "Marketing & In ấn"
        
    # 5. Nội thất (Bàn, ghế, tủ, kệ, giường, rèm)
    elif "bàn" in title or "ghế" in title or "tủ" in title or "kệ" in title or "giường" in title or "rèm" in title or "sofa" in title or "thảm" in title or "sọt rác" in title or "khay" in title or "rổ" in title or "xe đẩy" in title or "gối" in title or "kính" in title or "chậu" in title or "khung" in title:
        group = "Nội thất & Vật tư cơ bản"
        
    # 6. Đồ tiêu hao / Phụ kiện (Khăn, drap, áo, lược, mút, cọ, xịt, nước rửa, bông, cồn, dầu, tăm...)
    elif "khăn" in title or "drap" in title or "áo" in title or "quần" in title or "lược" in title or "chén" in title or "ly" in title or "dĩa" in title or "muỗng" in title or "đũa" in title or "dao" in title or "bình" in title or "nước" in title or "giấy" in title or "xịt" in title or "cồn" in title or "tăm" in title or "bông" in title or "băng" in title or "hộp đựng" in title or "móc" in title or "hoa" in title or "dép" in title or "túi" in title:
        group = "Đồ tiêu hao & Phụ kiện"
    
    else:
        # fallback based on old frequency if nothing matches
        if item.get('qty', 1) > 10:
            group = "Đồ tiêu hao & Phụ kiện"
        else:
            group = "Nội thất & Vật tư cơ bản"
            
    # Fix some manual edge cases
    if "xe đẩy spa" in title:
        group = "Nội thất & Vật tư cơ bản"
    if "bình xông tinh dầu" in title:
        group = "Thiết bị điện máy & Văn phòng" # Usually electric
        
    item['group'] = group

with open('full_capex_grouped.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("Done. Groups:")
from collections import Counter
groups = Counter(i['group'] for i in data)
for k, v in groups.items():
    print(f"- {k}: {v}")
