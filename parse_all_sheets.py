import pandas as pd
import json

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
        for _, row in df.iterrows():
            row_str = row.astype(str)
            # basic filtering
            if len(row_str) < 10:
                continue
                
            khu_vuc = row_str.iloc[1] if pd.notna(row.iloc[1]) else ""
            if "Khu vực" in khu_vuc or khu_vuc == "nan":
                continue
                
            phan_loai = row_str.iloc[2] if len(row_str)>2 and pd.notna(row.iloc[2]) else ""
            tan_suat = row_str.iloc[3] if len(row_str)>3 and pd.notna(row.iloc[3]) else ""
            ten_vat_dung = row_str.iloc[4] if len(row_str)>4 and pd.notna(row.iloc[4]) else ""
            
            if ten_vat_dung == "nan" or not ten_vat_dung.strip():
                continue
                
            sl = row_str.iloc[6] if len(row_str)>6 else "1"
            don_gia_str = row_str.iloc[8] if len(row_str)>8 else "0"
            thanh_tien_str = row_str.iloc[9] if len(row_str)>9 else "0"
            trang_thai = row_str.iloc[11] if len(row_str)>11 else "Cần mua"
            
            # For Setup Lễ tân, the columns might be slightly shifted, let's print the headers
            
            try:
                qty = int(float(sl)) if sl != "nan" else 1
            except:
                qty = 1
                
            try:
                unit_price = float(don_gia_str.replace(',', '')) * 1000 if don_gia_str != "nan" else 0
            except:
                unit_price = 0
                
            try:
                total_price = float(thanh_tien_str.replace(',', '')) * 1000 if thanh_tien_str != "nan" else (unit_price * qty)
            except:
                total_price = unit_price * qty
                
            if trang_thai == "nan":
                trang_thai = "Cần mua"
                
            group = "Thiết bị chuyên môn"
            if tan_suat == "Thường xuyên":
                group = "Đồ tiêu hao & Vật tư"
            elif "máy móc" in phan_loai.lower():
                group = "Thiết bị chuyên môn"
            elif "nội thất" in phan_loai.lower():
                group = "Nội thất & Vật tư cơ bản"
            elif phan_loai != "nan":
                group = phan_loai 
                
            capex_data.append({
                "id": f"capex_1_{id_counter}",
                "zone": khu_vuc,
                "group": group,
                "title": ten_vat_dung,
                "qty": qty,
                "unitPrice": int(unit_price),
                "totalPrice": int(total_price),
                "status": trang_thai,
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

    with open('full_capex.json', 'w', encoding='utf-8') as f:
        json.dump(capex_data, f, ensure_ascii=False, indent=2)

    print(f"Parsed {len(capex_data)} items.")
except Exception as e:
    print("Error:", e)
