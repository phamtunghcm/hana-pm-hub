import json

# Full breakdown of all 9 legal and PCCC files:
# 1. PCCC - 01 - Quyết định thành lập Đội PCCC cơ sở
# 2. PCCC - 02 - Mẫu số PC01 - Quyết định ban hành nội quy an toàn PCCC
# 3. PCCC - 03 - Sổ theo dõi phương tiện PCCC
# 4. PCCC - 04 - Mẫu số PC02 - Biên bản tự kiểm tra an toàn PCCC
# 5. PCCC - 05 - Mẫu số PC06 - Phương án chữa cháy của cơ sở
# 6. PCCC - 06 - Mẫu số PC04 - Báo cáo kết quả thực hiện công tác PCCC
# 7. ANTT - 01 - Mẫu số 03 - Đơn đề nghị cấp Giấy chứng nhận đủ ĐK ANTT
# 8. ANTT - 02 & 03 - Bản khai lý lịch & Tờ khai lý lịch tư pháp
# 9. ANTT - 04 - Mẫu Giấy khám sức khỏe
# 10. Chứng chỉ xoa bóp & đào tạo KTV
# 11. Khai báo hoạt động & Lưu trú nhân viên

all_legal_items = [
  {
    "id": 1,
    "group": "PCCC",
    "title": "PCCC-01: Quyết định thành lập Đội PCCC cơ sở",
    "agency": "Ban Giám Đốc cơ sở",
    "timeEstimate": "1 ngày",
    "status": "Đã hoàn thành",
    "note": "Quyết định thành lập đội PCCC cơ sở (>100m2) phân công rõ đội trưởng, đội phó và các đội viên.",
    "fileLink": "https://docs.google.com/document/d/1TdsbWhNy5JIvfKU5x4_UfH0Z3KaHMMLT/edit?usp=drivesdk",
    "sheetLink": "https://docs.google.com/spreadsheets/d/1lUWL9RtJeCllRgMQDUpSfPVQHmdrd38i/edit?usp=sharing",
    "folderLink": "https://drive.google.com/drive/folders/1RNDnyFSPis2NGIpEtSOsHvq5IZrwY4dV?usp=drive_link"
  },
  {
    "id": 2,
    "group": "PCCC",
    "title": "PCCC-02: Quyết định ban hành nội quy an toàn PCCC (PC01)",
    "agency": "Công an PCCC & CNCH",
    "timeEstimate": "1 ngày",
    "status": "Đã chuẩn bị",
    "note": "Mẫu số PC01 ban hành nội quy phòng cháy, chữa cháy và cứu nạn cứu hộ niêm yết tại cơ sở.",
    "fileLink": "https://docs.google.com/document/d/1n-9Gk3cuSUrz2ujI5jxkdlS7HcIg6rVW/edit?usp=drivesdk",
    "sheetLink": "https://docs.google.com/spreadsheets/d/1lUWL9RtJeCllRgMQDUpSfPVQHmdrd38i/edit?usp=sharing",
    "folderLink": "https://drive.google.com/drive/folders/1RNDnyFSPis2NGIpEtSOsHvq5IZrwY4dV?usp=drive_link"
  },
  {
    "id": 3,
    "group": "PCCC",
    "title": "PCCC-03: Sổ theo dõi phương tiện PCCC & cứu nạn",
    "agency": "Cơ sở lưu trữ",
    "timeEstimate": "Liên tục",
    "status": "Đã chuẩn bị",
    "note": "Sổ ghi chép kiểm tra định kỳ bình chữa cháy, đèn chiếu sáng sự cố, hệ thống báo cháy tự động.",
    "fileLink": "https://docs.google.com/document/d/18GGEKm4t4KgGj7XqdfP9J_MZGkA4skHQ/edit?usp=drivesdk",
    "sheetLink": "https://docs.google.com/spreadsheets/d/1lUWL9RtJeCllRgMQDUpSfPVQHmdrd38i/edit?usp=sharing",
    "folderLink": "https://drive.google.com/drive/folders/1RNDnyFSPis2NGIpEtSOsHvq5IZrwY4dV?usp=drive_link"
  },
  {
    "id": 4,
    "group": "PCCC",
    "title": "PCCC-04: Biên bản tự kiểm tra an toàn PCCC (PC02)",
    "agency": "Đội PCCC cơ sở",
    "timeEstimate": "Hàng quý",
    "status": "Đã chuẩn bị",
    "note": "Biên bản tự kiểm tra định kỳ công tác PCCC tại spa theo mẫu chuẩn PC02.",
    "fileLink": "https://docs.google.com/document/d/1XM0huCw0wsg4wz2MZo53ArV--iSPXJqa/edit?usp=drivesdk",
    "sheetLink": "https://docs.google.com/spreadsheets/d/1lUWL9RtJeCllRgMQDUpSfPVQHmdrd38i/edit?usp=sharing",
    "folderLink": "https://drive.google.com/drive/folders/1RNDnyFSPis2NGIpEtSOsHvq5IZrwY4dV?usp=drive_link"
  },
  {
    "id": 5,
    "group": "PCCC",
    "title": "PCCC-05: Phương án chữa cháy của cơ sở (PC06)",
    "agency": "Công an PCCC duyệt",
    "timeEstimate": "3 - 5 ngày",
    "status": "Đang soạn thảo",
    "note": "Bản phương án chi tiết tình huống giả định cháy, sơ đồ thoát nạn và phối hợp lực lượng chữa cháy.",
    "fileLink": "https://docs.google.com/document/d/1RfdP1wrbaGWbRTKkRsWHnxFjOdKAww15/edit?usp=drivesdk",
    "sheetLink": "https://docs.google.com/spreadsheets/d/1lUWL9RtJeCllRgMQDUpSfPVQHmdrd38i/edit?usp=sharing",
    "folderLink": "https://drive.google.com/drive/folders/1RNDnyFSPis2NGIpEtSOsHvq5IZrwY4dV?usp=drive_link"
  },
  {
    "id": 6,
    "group": "PCCC",
    "title": "PCCC-06: Báo cáo kết quả thực hiện công tác PCCC (PC04)",
    "agency": "Công an PCCC & CNCH",
    "timeEstimate": "Hàng năm",
    "status": "Đã chuẩn bị",
    "note": "Báo cáo tổng kết công tác an toàn phòng cháy chữa cháy nộp cơ quan công an theo định kỳ.",
    "fileLink": "https://docs.google.com/document/d/1G5mCcRUc9tP7Li0IYibpMmQMa-frRR2F/edit?usp=drivesdk",
    "sheetLink": "https://docs.google.com/spreadsheets/d/1lUWL9RtJeCllRgMQDUpSfPVQHmdrd38i/edit?usp=sharing",
    "folderLink": "https://drive.google.com/drive/folders/1RNDnyFSPis2NGIpEtSOsHvq5IZrwY4dV?usp=drive_link"
  },
  {
    "id": 7,
    "group": "ANTT",
    "title": "ANTT-01: Đơn đề nghị cấp Giấy chứng nhận đủ ĐK ANTT (Mẫu 03)",
    "agency": "Công an Quận/Huyện",
    "timeEstimate": "5 ngày làm việc",
    "status": "Đã chuẩn bị",
    "note": "Đơn xin cấp GCN đủ điều kiện về An ninh trật tự cho cơ sở kinh doanh dịch vụ xoa bóp.",
    "fileLink": "https://docs.google.com/document/d/1S4UQ1Nkq9ejjF31v1W_oIyekzpMQqRcM/edit?usp=drivesdk",
    "sheetLink": "https://docs.google.com/spreadsheets/d/1lUWL9RtJeCllRgMQDUpSfPVQHmdrd38i/edit?usp=sharing",
    "folderLink": "https://drive.google.com/drive/folders/1v-OwDDMRek50o6RVcz9QISUtc4wMKghm?usp=drive_link"
  },
  {
    "id": 8,
    "group": "ANTT",
    "title": "ANTT-02: Bản khai lý lịch của người đứng đầu cơ sở (Mẫu 02)",
    "agency": "Công an Phường xác nhận",
    "timeEstimate": "1 - 2 ngày",
    "status": "Đã chuẩn bị",
    "note": "Bản khai lý lịch của người đại diện pháp luật / chủ cơ sở có dán ảnh 4x6 và xác nhận.",
    "fileLink": "https://docs.google.com/document/d/15HTkaeov6Bp745Co53odz5Xm26dcUGNh/edit?usp=drivesdk",
    "sheetLink": "https://docs.google.com/spreadsheets/d/1lUWL9RtJeCllRgMQDUpSfPVQHmdrd38i/edit?usp=sharing",
    "folderLink": "https://drive.google.com/drive/folders/1v-OwDDMRek50o6RVcz9QISUtc4wMKghm?usp=drive_link"
  },
  {
    "id": 9,
    "group": "ANTT",
    "title": "ANTT-03: Tờ khai yêu cầu cấp Phiếu Lý lịch tư pháp số 2",
    "agency": "Sở Tư pháp",
    "timeEstimate": "10 - 15 ngày",
    "status": "Chưa bắt đầu",
    "note": "Phiếu lý lịch tư pháp của người đại diện pháp luật để hoàn tất hồ sơ ANTT.",
    "fileLink": "https://docs.google.com/document/d/1uiD-HDAr_OI5RVJ4rqKC6acURO9bbdIL/edit?usp=drivesdk",
    "sheetLink": "https://docs.google.com/spreadsheets/d/1lUWL9RtJeCllRgMQDUpSfPVQHmdrd38i/edit?usp=sharing",
    "folderLink": "https://drive.google.com/drive/folders/1v-OwDDMRek50o6RVcz9QISUtc4wMKghm?usp=drive_link"
  },
  {
    "id": 10,
    "group": "ANTT",
    "title": "ANTT-04: Mẫu Giấy khám sức khỏe nhân viên",
    "agency": "Bệnh viện / Phòng khám đa khoa",
    "timeEstimate": "1 ngày",
    "status": "Đã hoàn thành",
    "note": "Giấy khám sức khỏe định kỳ của toàn bộ nhân viên và kỹ thuật viên theo thông tư y tế.",
    "fileLink": "https://docs.google.com/document/d/1-eNoxj3KXhzdlICsfjf57PdvS70OIbAb/edit?usp=drivesdk",
    "sheetLink": "https://docs.google.com/spreadsheets/d/1lUWL9RtJeCllRgMQDUpSfPVQHmdrd38i/edit?usp=sharing",
    "folderLink": "https://drive.google.com/drive/folders/1v-OwDDMRek50o6RVcz9QISUtc4wMKghm?usp=drive_link"
  },
  {
    "id": 11,
    "group": "Chứng chỉ",
    "title": "Đăng ký khóa học & Thi Chứng chỉ xoa bóp",
    "agency": "Trường CĐ nghề / Cơ sở đào tạo",
    "timeEstimate": "1 - 3 tháng",
    "status": "Đang thực hiện",
    "note": "Chứng chỉ kỹ thuật viên xoa bóp bắt buộc đối với nhân sự trực tiếp phục vụ trị liệu.",
    "fileLink": "https://docs.google.com/spreadsheets/d/1lUWL9RtJeCllRgMQDUpSfPVQHmdrd38i/edit?usp=sharing",
    "sheetLink": "https://docs.google.com/spreadsheets/d/1lUWL9RtJeCllRgMQDUpSfPVQHmdrd38i/edit?usp=sharing",
    "folderLink": "https://drive.google.com/drive/folders/1v-OwDDMRek50o6RVcz9QISUtc4wMKghm?usp=drive_link"
  },
  {
    "id": 12,
    "group": "Vận hành",
    "title": "Khai báo hoạt động & Lưu trú nhân viên",
    "agency": "Công an Phường/Xã",
    "timeEstimate": "Ngay sau khi có giấy ANTT",
    "status": "Chưa bắt đầu",
    "note": "Khai báo lưu trú nhân sự và thông báo hoạt động kinh doanh đến công an địa phương.",
    "fileLink": "https://drive.google.com/drive/folders/1v-OwDDMRek50o6RVcz9QISUtc4wMKghm?usp=drive_link",
    "sheetLink": "https://docs.google.com/spreadsheets/d/1lUWL9RtJeCllRgMQDUpSfPVQHmdrd38i/edit?usp=sharing",
    "folderLink": "https://drive.google.com/drive/folders/1v-OwDDMRek50o6RVcz9QISUtc4wMKghm?usp=drive_link"
  }
]

with open("src/data/legal5.json", "w", encoding="utf-8") as f:
    json.dump(all_legal_items, f, indent=2, ensure_ascii=False)

print(f"Updated legal5.json with {len(all_legal_items)} detailed PCCC & ANTT file items!")
