import re
with open("src/components/DashboardView.tsx", "r") as f:
    content = f.read()

# Fix completed list
content = re.sub(r'completedList\.map\(t => <p key=\{t\.id\} className="text-green-100 truncate">• \{t\.title\}</p>\)',
                 'completedList.map(t => <p key={t.id} onClick={() => setSelectedItemForEdit(t)} className="text-green-100 truncate cursor-pointer hover:text-white hover:underline">• {t.title}</p>)',
                 content)

# Fix doing list
content = re.sub(r'doingList\.slice\(0, 5\)\.map\(t => \(\s*<p key=\{t\.id\} className="text-amber-100 truncate">• \{t\.title\}</p>\s*\)\)',
                 'doingList.slice(0, 5).map(t => (\\n                    <p key={t.id} onClick={() => setSelectedItemForEdit(t)} className="text-amber-100 truncate cursor-pointer hover:text-white hover:underline">• {t.title}</p>\\n                  ))',
                 content)

# Fix overdue list
content = re.sub(r'overdueList\.map\(t => \(\s*<p key=\{t\.id\} className="text-red-200 truncate">• \{t\.title\} \(\{t\.dueDate\}\)</p>\s*\)\)',
                 'overdueList.map(t => (\\n                      <p key={t.id} onClick={() => setSelectedItemForEdit(t)} className="text-red-200 truncate cursor-pointer hover:text-white hover:underline">• {t.title} ({t.dueDate})</p>\\n                    ))',
                 content)

with open("src/components/DashboardView.tsx", "w") as f:
    f.write(content)
