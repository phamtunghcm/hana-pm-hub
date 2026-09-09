import pandas as pd
import json
import numpy as np

def clean_price(val):
    if pd.isna(val): return 0
    val_str = str(val).replace(',', '').strip()
    if not val_str: return 0
    try:
        return float(val_str) * 1000
    except:
        return 0

try:
    xls = pd.ExcelFile('capex.xlsx')
    capex_data = []
    
    # 1. Fixed costs
    capex_data.append({
        "id": "capex_0_1",
        "group": "Chi phí Cố định Ban đầu",
        "title": "Thi công thô & Sửa chữa cơ sở",
        "qty": 1,
        "unitPrice": 110000000,
        "totalPrice": 110000000,
        "status": "Đã chi / Đang thi công",
        "note": "Hạng mục cố định ngoài Google Sheets",
        "zone": "Toàn bộ cơ sở"
    })
    capex_data.append({
        "id": "capex_0_2",
        "group": "Chi phí Cố định Ban đầu",
        "title": "Đặt cọc thuê mặt bằng",
        "qty": 1,
        "unitPrice": 100000000,
        "totalPrice": 100000000,
        "status": "Đã hoàn thành",
        "note": "Hạng mục cố định ngoài Google Sheets",
        "zone": "Toàn bộ cơ sở"
    })
    
    id_counter = 1
    
    for sheet in ['Setup Spa', 'Setup Lễ tân']:
        df = pd.read_excel(xls, sheet_name=sheet)
        
        # Find header row
        header_idx = -1
        for i, row in df.iterrows():
            if 'Tên vật dụng' in row.astype(str).values:
                header_idx = i
                break
                
        if header_idx == -1:
            print(f"Could not find header in {sheet}")
            continue
            
        # Set column names
        df.columns = df.iloc[header_idx]
        df = df.iloc[header_idx + 1:].reset_index(drop=True)
        
        # Clean column names (strip whitespace)
        df.columns = [str(c).strip() if pd.notna(c) else f"unnamed_{i}" for i, c in enumerate(df.columns)]
        
        # Check available columns
        # Setup Spa: Khu vực, Phân loại, Tần suất, Tên vật dụng, SL/giường, Tổng SL, Đơn vị, Đơn giá, Thành tiền, Trạng thái
        # Setup Lễ tân: Mã tài sản, Khu vực, Phân loại, Tần suất, Tên vật dụng, Kích thước, Tổng SL, Đơn giá, Thành tiền, Trạng thái
        
        for _, row in df.iterrows():
            ten_vat_dung = row.get('Tên vật dụng', np.nan)
            if pd.isna(ten_vat_dung) or str(ten_vat_dung).strip() == "":
                continue
                
            khu_vuc = row.get('Khu vực', "")
            if pd.isna(khu_vuc): khu_vuc = ""
            
            phan_loai = row.get('Phân loại', "")
            if pd.isna(phan_loai): phan_loai = ""
            
            tan_suat = row.get('Tần suất', "")
            if pd.isna(tan_suat): tan_suat = ""
            
            sl = row.get('Tổng SL', 1)
            if pd.isna(sl): sl = 1
            try:
                qty = int(float(sl))
            except:
                qty = 1
                
            don_gia = clean_price(row.get('Đơn giá', 0))
            thanh_tien = clean_price(row.get('Thành tiền', 0))
            if thanh_tien == 0 and don_gia > 0:
                thanh_tien = don_gia * qty
                
            trang_thai = row.get('Trạng thái', "Cần mua")
            if pd.isna(trang_thai) or str(trang_thai).strip() == "":
                trang_thai = "Cần mua"
                
            group = "Thiết bị chuyên môn"
            ts = str(tan_suat).strip()
            pl = str(phan_loai).strip().lower()
            if ts == "Thường xuyên":
                group = "Đồ tiêu hao & Vật tư"
            elif "máy móc" in pl:
                group = "Thiết bị chuyên môn"
            elif "nội thất" in pl:
                group = "Nội thất & Vật tư cơ bản"
            elif pl:
                group = str(phan_loai).strip()
                
            capex_data.append({
                "id": f"capex_1_{id_counter}",
                "zone": str(khu_vuc).strip(),
                "group": group,
                "title": str(ten_vat_dung).strip(),
                "qty": qty,
                "unitPrice": int(don_gia),
                "totalPrice": int(thanh_tien),
                "status": str(trang_thai).strip(),
                "note": ""
            })
            id_counter += 1
            
    # Add manual push chairs
    capex_data.append({
        "id": f"capex_1_{id_counter}",
        "zone": "Phòng trị liệu chung",
        "group": "Theo giường",
        "title": "Ghế đẩy cho KTV",
        "qty": 5,
        "unitPrice": 500000,
        "totalPrice": 2500000,
        "status": "Cần mua",
        "note": "Theo yêu cầu bổ sung"
    })

    with open('full_capex_correct.json', 'w', encoding='utf-8') as f:
        json.dump(capex_data, f, ensure_ascii=False, indent=2)

    print(f"Parsed {len(capex_data)} items.")
except Exception as e:
    import traceback
    traceback.print_exc()
