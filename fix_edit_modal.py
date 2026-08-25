with open("src/components/EditModal.tsx", "r") as f:
    code = f.read()

# Replace driveLink logic in EditModal
old_link_calc = "const driveLink = DRIVE_LINKS[item.type as keyof typeof DRIVE_LINKS] || DRIVE_LINKS.tasks;"

new_link_calc = """  // Lấy link file gốc trực tiếp từ item nếu có, hoặc fallback theo phân hệ
  const fileDirectLink = item.fileLink || (
    item.type === 'doc' ? DRIVE_LINKS.docsFolder :
    item.type === 'legal' ? (item.title.includes('PCCC') ? DRIVE_LINKS.legalPcccFolder : DRIVE_LINKS.legalAnttFolder) :
    DRIVE_LINKS.tasks
  );

  const sheetDirectLink = item.sheetLink || (
    item.type === 'doc' ? DRIVE_LINKS.docsSheet :
    item.type === 'legal' ? DRIVE_LINKS.legalSheet :
    DRIVE_LINKS.tasks
  );"""

code = code.replace(old_link_calc, new_link_calc)

# Replace the single Drive button block with 2 precise buttons: File Gốc & Bảng Sheets Quản Lý
old_drive_block = """          {/* Drive Link Button */}
          <div className="bg-amber-50/70 border border-amber-200/70 rounded-xl p-3 flex items-center justify-between">
            <div className="text-xs text-[#5D4037]">
              <span className="font-bold block">Dữ liệu gốc Google Drive</span>
              <span>Xem trang tính nguồn trên Drive</span>
            </div>
            <a 
              href={driveLink} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-bold bg-white text-[#3D2B1A] px-3 py-1.5 rounded-lg border border-amber-300 shadow-sm hover:bg-amber-100 transition-colors"
            >
              <ExternalLink size={14} /> Mở File Gốc
            </a>
          </div>"""

new_drive_block = """          {/* Drive & Sheets Direct Links */}
          <div className="bg-[#FAF8F5] border border-amber-200 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#5D4037]">📁 Dữ liệu & Hồ sơ gốc (Google Drive)</span>
              <span className="text-[10px] text-amber-800 bg-amber-100 px-2 py-0.5 rounded font-semibold">Đồng bộ 2 chiều</span>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <a 
                href={fileDirectLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-1.5 text-xs font-bold bg-white text-[#3D2B1A] px-3 py-2 rounded-lg border border-amber-300 shadow-xs hover:bg-amber-50 transition-colors"
                title="Mở thư mục/tập tin tài liệu gốc"
              >
                <ExternalLink size={13} className="text-amber-800" /> Mở Thư Mục / File Gốc
              </a>
              <a 
                href={sheetDirectLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-1.5 text-xs font-bold bg-emerald-50 text-emerald-900 px-3 py-2 rounded-lg border border-emerald-300 shadow-xs hover:bg-emerald-100 transition-colors"
                title="Mở bảng tính Google Sheets quản lý chung"
              >
                <ExternalLink size={13} className="text-emerald-700" /> Mở Bảng Quản Lý (Sheets)
              </a>
            </div>
          </div>"""

code = code.replace(old_drive_block, new_drive_block)

with open("src/components/EditModal.tsx", "w") as f:
    f.write(code)

print("EditModal.tsx updated with direct file and sheet links!")
