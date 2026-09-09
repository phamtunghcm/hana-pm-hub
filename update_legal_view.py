with open("src/components/LegalView.tsx", "r", encoding="utf-8") as f:
    text = f.read()

# Replace header buttons: Only keep Bảng Quản Lý Tiến Độ Pháp Lý (Mới), remove old folder buttons as requested
old_header_btns = """        <div className="flex flex-wrap items-center gap-2.5">
          <a
            href={DRIVE_LINKS.legalSheet}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 bg-[#F5F0E6] text-[#3D2B1A] font-bold px-3.5 py-2 rounded-xl border border-[#E7E0D6] hover:bg-amber-100 transition-colors text-xs shadow-xs"
            title="Bảng quản lý chung ANTT, PCCC"
          >
            <ExternalLink size={14} className="text-emerald-700" /> Bảng Quản Lý ANTT & PCCC
          </a>
          <a
            href={DRIVE_LINKS.legalPcccFolder}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 bg-[#F5F0E6] text-[#3D2B1A] font-bold px-3.5 py-2 rounded-xl border border-[#E7E0D6] hover:bg-amber-100 transition-colors text-xs shadow-xs"
            title="Folder hồ sơ PCCC (>100m2)"
          >
            <ExternalLink size={14} className="text-red-600" /> Folder Hồ Sơ PCCC
          </a>
          <a
            href={DRIVE_LINKS.legalAnttFolder}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 bg-[#F5F0E6] text-[#3D2B1A] font-bold px-3.5 py-2 rounded-xl border border-[#E7E0D6] hover:bg-amber-100 transition-colors text-xs shadow-xs"
            title="Folder hồ sơ ANTT"
          >
            <ExternalLink size={14} className="text-blue-600" /> Folder Hồ Sơ ANTT
          </a>
        </div>"""

new_header_btns = """        <div className="flex flex-wrap items-center gap-2.5">
          <a
            href={DRIVE_LINKS.legalSheet}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#F5F0E6] text-[#3D2B1A] font-bold px-4 py-2.5 rounded-xl border border-[#E7E0D6] hover:bg-amber-200 transition-colors text-sm shadow-sm"
            title="Bảng theo dõi tiến độ pháp lý & mở cửa Hana Wellness"
          >
            <ExternalLink size={16} className="text-emerald-700" /> Bảng Tiến Độ Pháp Lý (Google Sheets)
          </a>
        </div>"""

if old_header_btns in text:
    text = text.replace(old_header_btns, new_header_btns)
    print("Replaced header buttons in LegalView.tsx")
else:
    print("Could not find exact old_header_btns")

# In the legal card, add a direct file link button if item.fileLink exists
card_sub = """              {item.note && (
                <div className="pt-2 text-xs text-[#8D6E63] italic bg-amber-50/50 p-2.5 rounded-lg border border-amber-100/50">
                  "{item.note}"
                </div>
              )}"""

card_sub_with_link = """              {item.note && (
                <div className="pt-2 text-xs text-[#8D6E63] italic bg-amber-50/50 p-2.5 rounded-lg border border-amber-100/50">
                  "{item.note}"
                </div>
              )}
              {(item as any).fileLink && (
                <div className="pt-2 flex justify-end" onClick={(e) => e.stopPropagation()}>
                  <a
                    href={(item as any).fileLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-900 bg-amber-100/80 hover:bg-amber-200 px-3 py-1.5 rounded-lg border border-amber-300 transition-colors shadow-xs"
                    title="Mở trực tiếp tài liệu này trên Google Drive"
                  >
                    <ExternalLink size={13} className="text-amber-700" /> {(item as any).fileLabel || "Mở tài liệu chi tiết"}
                  </a>
                </div>
              )}"""

if card_sub in text:
    text = text.replace(card_sub, card_sub_with_link)
    print("Added direct file link button on Legal card")

with open("src/components/LegalView.tsx", "w", encoding="utf-8") as f:
    f.write(text)

print("Saved LegalView.tsx")
