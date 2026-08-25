# Update LegalView.tsx
with open("src/components/LegalView.tsx", "r") as f:
    legal_code = f.read()

old_legal_header = """        <div className="flex items-center gap-3">
          <a
            href={DRIVE_LINKS.legal}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#F5F0E6] text-[#3D2B1A] font-bold px-4 py-2 rounded-xl border border-[#E7E0D6] hover:bg-amber-200 transition-colors text-sm shadow-sm"
          >
            <ExternalLink size={16} /> File Gốc Google Sheets
          </a>
        </div>"""

new_legal_header = """        <div className="flex flex-wrap items-center gap-2.5">
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

legal_code = legal_code.replace(old_legal_header, new_legal_header)

with open("src/components/LegalView.tsx", "w") as f:
    f.write(legal_code)

# Update DocsView.tsx
with open("src/components/DocsView.tsx", "r") as f:
    docs_code = f.read()

old_docs_header = """        <a
          href={DRIVE_LINKS.docs}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-[#F5F0E6] text-[#3D2B1A] font-bold px-4 py-2 rounded-xl border border-[#E7E0D6] hover:bg-amber-200 transition-colors text-sm shadow-sm"
        >
          <ExternalLink size={16} /> File Gốc Google Sheets
        </a>"""

new_docs_header = """        <div className="flex flex-wrap items-center gap-2.5">
          <a
            href={DRIVE_LINKS.docsSheet}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 bg-[#F5F0E6] text-[#3D2B1A] font-bold px-3.5 py-2 rounded-xl border border-[#E7E0D6] hover:bg-amber-100 transition-colors text-xs shadow-xs"
            title="Bảng theo dõi văn bản nội bộ"
          >
            <ExternalLink size={14} className="text-emerald-700" /> Bảng Theo Dõi Văn Bản
          </a>
          <a
            href={DRIVE_LINKS.docsFolder}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 bg-[#F5F0E6] text-[#3D2B1A] font-bold px-3.5 py-2 rounded-xl border border-[#E7E0D6] hover:bg-amber-100 transition-colors text-xs shadow-xs"
            title="Folder của nhóm văn bản nội bộ"
          >
            <ExternalLink size={14} className="text-amber-700" /> Folder Văn Bản Gốc
          </a>
        </div>"""

docs_code = docs_code.replace(old_docs_header, new_docs_header)

with open("src/components/DocsView.tsx", "w") as f:
    f.write(docs_code)

print("LegalView and DocsView updated with precise Google Drive & Sheets links!")
