with open("src/components/DashboardView.tsx", "r") as f:
    code = f.read()

old_dash_links = """        <div className="flex flex-wrap gap-2">
          <a href={DRIVE_LINKS.tasks} target="_blank" rel="noreferrer" className="text-xs font-bold bg-[#F5F0E6] text-[#3D2B1A] hover:bg-amber-200 px-3 py-2 rounded-lg border border-[#E7E0D6] flex items-center gap-1.5">
            <FileText size={14} /> Sheets Tasks
          </a>
          <a href={DRIVE_LINKS.legal} target="_blank" rel="noreferrer" className="text-xs font-bold bg-[#F5F0E6] text-[#3D2B1A] hover:bg-amber-200 px-3 py-2 rounded-lg border border-[#E7E0D6] flex items-center gap-1.5">
            <Scale size={14} /> Sheets Pháp lý
          </a>
          <a href={DRIVE_LINKS.docs} target="_blank" rel="noreferrer" className="text-xs font-bold bg-[#F5F0E6] text-[#3D2B1A] hover:bg-amber-200 px-3 py-2 rounded-lg border border-[#E7E0D6] flex items-center gap-1.5">
            <FileText size={14} /> Sheets Văn bản
          </a>
        </div>"""

new_dash_links = """        <div className="flex flex-wrap gap-2">
          <a href={DRIVE_LINKS.tasks} target="_blank" rel="noreferrer" className="text-xs font-bold bg-[#F5F0E6] text-[#3D2B1A] hover:bg-amber-200 px-3 py-2 rounded-lg border border-[#E7E0D6] flex items-center gap-1.5" title="Bảng tính 46 Tasks & Mua sắm">
            <FileText size={14} /> Sheets Tasks
          </a>
          <a href={DRIVE_LINKS.legalSheet} target="_blank" rel="noreferrer" className="text-xs font-bold bg-[#F5F0E6] text-[#3D2B1A] hover:bg-amber-200 px-3 py-2 rounded-lg border border-[#E7E0D6] flex items-center gap-1.5" title="Bảng quản lý chung ANTT & PCCC">
            <Scale size={14} /> Sheets Quản Lý ANTT & PCCC
          </a>
          <a href={DRIVE_LINKS.docsSheet} target="_blank" rel="noreferrer" className="text-xs font-bold bg-[#F5F0E6] text-[#3D2B1A] hover:bg-amber-200 px-3 py-2 rounded-lg border border-[#E7E0D6] flex items-center gap-1.5" title="Bảng theo dõi văn bản nội bộ">
            <FileText size={14} /> Sheets Theo Dõi Văn Bản
          </a>
        </div>"""

code = code.replace(old_dash_links, new_dash_links)

with open("src/components/DashboardView.tsx", "w") as f:
    f.write(code)

print("DashboardView.tsx links updated!")
