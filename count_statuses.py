import json

with open("src/data/tasks36.json", "r") as f:
    tasks = json.load(f)
with open("src/data/docs9.json", "r") as f:
    docs = json.load(f)
with open("src/data/legal5.json", "r") as f:
    legal = json.load(f)

print("tasks36.json statuses:")
for t in tasks:
    print(f"  ID {t.get('id')}: {t.get('title')} -> {t.get('status')}")

print("\ndocs9.json statuses:")
for d in docs:
    print(f"  ID {d.get('id')}: {d.get('title')} -> {d.get('status')}")

completed_tasks = [t for t in tasks if t.get("status") in ["Hoàn thành", "Đã hoàn thành"]]
completed_docs = [d for d in docs if d.get("status") in ["Hoàn thành", "Đã hoàn thành", "Đã ban hành"]]
completed_legal = [l for l in legal if l.get("status") in ["Hoàn thành", "Đã hoàn thành"]]

print(f"\nTotal tasks completed in JSON: {len(completed_tasks)}")
print(f"Total docs completed in JSON: {len(completed_docs)}")
print(f"Total legal completed in JSON: {len(completed_legal)}")
