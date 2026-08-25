import json

# 1. Precise mappings for Internal Documents (Văn bản nội bộ)
# 01 Điều lệ Công ty -> 1E9xBiJWe4aS_Vn8G76DdELlo0xY3LcHR
# 02 SỔ QUẢN LÝ LAO ĐỘNG.docx -> 1UWKh0zSfN4WN9jjPL7mtHIE4SzaCbnTe
# 03 NỘI QUY LAO ĐỘNG.docx -> 1PbmqeGeRJFgJFQx8k1ftpJXOOQS2pe5-
# 05 QUY CHẾ DÂN CHỦ Ở CƠ SỞ.docx -> 11fwGH3wd5oHAX23k57I4JUbc7IKQ3WwD
# 06 QUY CHẾ LƯƠNG THƯỞNG PHÚC LỢI VÀ THANG BẢNG LƯƠNG.docx -> 19x5PZ0ZgdPKtfpdhDL_YgguPJ9Ibs_cN
# 07 QUY CHẾ TÀI CHÍNH & CHI TIÊU NỘI BỘ.docx -> 1--1ZphbDy52JkxIdKNbXJxpkOfQ-jdK7
# 08 QUY ĐỊNH BẢO MẬT THÔNG TIN (NDA).docx -> 1MEZj0LhAYIhXBZpX90cuO04m4dwHGEBW
# 09 SƠ ĐỒ TỔ CHỨC & MÔ TẢ CÔNG VIỆC (JD).docx -> 1KFGrIqzpjagkyzaaBdXBRXflg42ccPYY

docs_file_links = {
    1: "https://docs.google.com/document/d/1E9xBiJWe4aS_Vn8G76DdELlo0xY3LcHR/edit?usp=drivesdk", # Điều lệ
    2: "https://docs.google.com/document/d/1UWKh0zSfN4WN9jjPL7mtHIE4SzaCbnTe/edit?usp=drivesdk", # Sổ quản lý lao động
    3: "https://docs.google.com/document/d/1PbmqeGeRJFgJFQx8k1ftpJXOOQS2pe5-/edit?usp=drivesdk", # Nội quy lao động
    4: "https://docs.google.com/document/d/19x5PZ0ZgdPKtfpdhDL_YgguPJ9Ibs_cN/edit?usp=drivesdk", # Thang bảng lương (nằm chung trong file 06)
    5: "https://docs.google.com/document/d/11fwGH3wd5oHAX23k57I4JUbc7IKQ3WwD/edit?usp=drivesdk", # Quy chế dân chủ ở cơ sở
    6: "https://docs.google.com/document/d/19x5PZ0ZgdPKtfpdhDL_YgguPJ9Ibs_cN/edit?usp=drivesdk", # Quy chế Lương, Thưởng, Phúc lợi
    7: "https://docs.google.com/document/d/1--1ZphbDy52JkxIdKNbXJxpkOfQ-jdK7/edit?usp=drivesdk", # Quy chế Tài chính / Chi tiêu nội bộ
    8: "https://docs.google.com/document/d/1MEZj0LhAYIhXBZpX90cuO04m4dwHGEBW/edit?usp=drivesdk", # Quy định Bảo mật thông tin (NDA)
    9: "https://docs.google.com/document/d/1KFGrIqzpjagkyzaaBdXBRXflg42ccPYY/edit?usp=drivesdk", # Sơ đồ tổ chức & JD
}

# 2. Precise mappings for Legal (Hồ sơ pháp lý)
# 1: PCCC cơ sở -> Folder PCCC hoặc File PCCC-01 / PC01
# 2: Chứng chỉ xoa bóp
# 3: Khám sức khỏe -> ANTT - 04 - Mẫu Giấy khám sức khỏe.docx (1-eNoxj3KXhzdlICsfjf57PdvS70OIbAb)
# 4: Đơn ANTT -> ANTT - 01 - Mẫu số 03 - Đơn đề nghị cấp GCN ANTT.docx (1S4UQ1Nkq9ejjF31v1W_oIyekzpMQqRcM)
# 5: Khai báo lưu trú -> Folder ANTT (1v-OwDDMRek50o6RVcz9QISUtc4wMKghm)

legal_file_links = {
    1: "https://drive.google.com/drive/folders/1RNDnyFSPis2NGIpEtSOsHvq5IZrwY4dV?usp=drive_link", # Hồ sơ PCCC (>100m2)
    2: "https://docs.google.com/spreadsheets/d/1lUWL9RtJeCllRgMQDUpSfPVQHmdrd38i/edit?usp=sharing", # Bảng quản lý đào tạo & chứng chỉ
    3: "https://docs.google.com/document/d/1-eNoxj3KXhzdlICsfjf57PdvS70OIbAb/edit?usp=drivesdk", # Mẫu giấy khám sức khỏe
    4: "https://docs.google.com/document/d/1S4UQ1Nkq9ejjF31v1W_oIyekzpMQqRcM/edit?usp=drivesdk", # Mẫu đơn xin cấp GCN ANTT
    5: "https://drive.google.com/drive/folders/1v-OwDDMRek50o6RVcz9QISUtc4wMKghm?usp=drive_link", # Thư mục khai báo ANTT & Lưu trú
}

# Update src/data/docs9.json
with open("src/data/docs9.json", "r") as f:
    docs = json.load(f)

for d in docs:
    d_id = d.get("id")
    if d_id in docs_file_links:
        d["fileLink"] = docs_file_links[d_id]
        d["folderLink"] = "https://drive.google.com/drive/folders/1prdsSerfEfqjU0fzfa-__eRphpJhoS6p?usp=drive_link"
        d["sheetLink"] = "https://docs.google.com/spreadsheets/d/1Qq3a6LjbvcF3SrVmodCRGGBNQ2vFyMlQ/edit?usp=drive_link"

with open("src/data/docs9.json", "w") as f:
    json.dump(docs, f, indent=2, ensure_ascii=False)

# Update src/data/legal5.json
with open("src/data/legal5.json", "r") as f:
    legals = json.load(f)

for l in legals:
    l_id = l.get("id")
    if l_id in legal_file_links:
        l["fileLink"] = legal_file_links[l_id]
        l["folderLink"] = "https://drive.google.com/drive/folders/1v-OwDDMRek50o6RVcz9QISUtc4wMKghm?usp=drive_link" if l_id != 1 else "https://drive.google.com/drive/folders/1RNDnyFSPis2NGIpEtSOsHvq5IZrwY4dV?usp=drive_link"
        l["sheetLink"] = "https://docs.google.com/spreadsheets/d/1lUWL9RtJeCllRgMQDUpSfPVQHmdrd38i/edit?usp=sharing"

with open("src/data/legal5.json", "w") as f:
    json.dump(legals, f, indent=2, ensure_ascii=False)

print("Direct individual file links written to docs9.json and legal5.json!")
