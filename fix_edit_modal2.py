with open("src/components/EditModal.tsx", "r") as f:
    code = f.read()

# Update drive links section in EditModal.tsx to show:
# 1. Nút "Mở File Văn Bản Thật (Google Docs/Word)"
# 2. Nút "Mở Bảng Quản Lý (Google Sheets)"
# 3. Nút "Mở Thư Mục Chứa (Drive Folder)"

old_drive_block = """          {/* Drive & Sheets Direct Links */}
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

new_drive_block = """          {/* Direct File, Sheets & Folder Links */}
          <div className="bg-[#FAF8F5] border border-amber-200 rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#5D4037] flex items-center gap-1.5">
                <span>📄 Hồ sơ & File Gốc Trực Tiếp</span>
              </span>
              <span className="text-[10px] text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full font-bold">
                Mở đúng file thật
              </span>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <a 
                href={fileDirectLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-bold bg-[#3D2B1A] text-white px-3.5 py-2 rounded-lg hover:bg-[#2C1F13] shadow-xs transition-colors"
                title="Mở trực tiếp file Word / Google Docs của văn bản này"
              >
                <ExternalLink size={13} className="text-amber-300" /> Mở File Gốc ({item.type === 'doc' ? 'Google Docs' : 'Hồ sơ thật'})
              </a>
              <a 
                href={sheetDirectLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-bold bg-white text-[#155724] px-3.5 py-2 rounded-lg border border-emerald-300 hover:bg-emerald-50 shadow-xs transition-colors"
                title="Mở bảng Google Sheets theo dõi quản lý"
              >
                <ExternalLink size={13} className="text-emerald-600" /> Bảng Quản Lý (Sheets)
              </a>
            </div>
          </div>"""

code = code.replace(old_drive_block, new_drive_block)

with open("src/components/EditModal.tsx", "w") as f:
    f.write(code)

print("EditModal.tsx updated with direct file opener button!")
