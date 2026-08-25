with open("scripts/send_daily_report.py", "r") as f:
    code = f.read()

import re

# Update generate_report_data() to fetch from API
old_gen = """def load_json(filename):
    filepath = os.path.join(os.path.dirname(__file__), "..", "src", "data", filename)
    if os.path.exists(filepath):
        with open(filepath, "r", encoding="utf-8") as f:
            return json.load(f)
    return []

def generate_report_data():
    tasks = load_json("tasks36.json")
    docs = load_json("docs9.json")
    legal = load_json("legal5.json")
    capex = load_json("capex30.json")

    doc_tasks = [
        {
            "id": f"doc_{d.get('id')}",
            "title": f"[Văn bản] {d.get('title')}",
            "pic": d.get("department", "Pháp chế / HR"),
            "dueDate": d.get("deadline", "Đang cập nhật"),
            "status": d.get("status", "Chưa bắt đầu"),
            "daysLeft": 0 if d.get("status") == "Hoàn thành" else 10,
            "workstream": f"Văn bản nội bộ: {d.get('group', 'Quy chuẩn')}"
        }
        for d in docs
    ]
    all_tasks = tasks + doc_tasks

    # Hoàn thành gồm: 'Hoàn thành', 'Đã hoàn thành', 'Đã ban hành'
    completed_list = [t for t in all_tasks if t.get("status") in ["Hoàn thành", "Đã hoàn thành", "Đã ban hành"]]
    completed = len(completed_list)
    total_tasks = len(all_tasks)
    pct = round((completed / total_tasks * 100)) if total_tasks else 0"""

new_gen = """def load_json(filename):
    pass

def generate_report_data():
    try:
        import ssl
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        req = urllib.request.Request('https://hana-pm-hub.pages.dev/api/data')
        with urllib.request.urlopen(req, context=ctx) as response:
            res_data = json.loads(response.read().decode('utf-8'))
            db = res_data.get('data', {})
            tasks = db.get('tasks', [])
            docs = db.get('docs', [])
            capex = db.get('capex', [])
    except Exception as e:
        print("Lỗi fetch Cloudflare KV, dùng data rỗng:", e)
        tasks, docs, capex = [], [], []

    doc_tasks = [
        {
            "id": f"doc_{d.get('id')}",
            "title": f"[Văn bản] {d.get('title')}",
            "pic": d.get("department", "Pháp chế / HR"),
            "dueDate": d.get("deadline", "Đang cập nhật"),
            "status": d.get("status", "Chưa bắt đầu"),
            "daysLeft": 0 if d.get("status") == "Hoàn thành" else 10,
            "workstream": f"Văn bản nội bộ: {d.get('group', 'Quy chuẩn')}"
        }
        for d in docs
    ]
    all_tasks = tasks + doc_tasks

    completed_list = [t for t in all_tasks if t.get("status") in ["Hoàn thành", "Đã hoàn thành", "Đã ban hành"]]
    completed = len(completed_list)
    total_tasks = len(all_tasks)
    pct = round((completed / total_tasks * 100)) if total_tasks else 0"""

code = code.replace(old_gen, new_gen)

with open("scripts/send_daily_report.py", "w") as f:
    f.write(code)

print("Updated send_daily_report.py to fetch from Cloudflare API!")
