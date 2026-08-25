with open("scripts/send_daily_report.py", "r") as f:
    code = f.read()

# Update generate_report_data() in send_daily_report.py to include tasks, docs, and legal properly
old_gen = """def generate_report_data():
    tasks = load_json("tasks36.json")
    docs = load_json("docs9.json")
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

    completed_list = [t for t in all_tasks if t.get("status") == "Hoàn thành"]
    completed = len(completed_list)
    total_tasks = len(all_tasks)
    pct = round((completed / total_tasks * 100)) if total_tasks else 0"""

new_gen = """def generate_report_data():
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

code = code.replace(old_gen, new_gen)

with open("scripts/send_daily_report.py", "w") as f:
    f.write(code)

print("Updated send_daily_report.py status matching!")
