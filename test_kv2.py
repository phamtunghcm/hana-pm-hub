import urllib.request
import ssl
import json

url = 'https://hana-pm-hub.pages.dev/api/data'
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

try:
    with urllib.request.urlopen(url, context=ctx) as response:
        print("GET Data from Cloudflare KV:")
        print(response.status)
        data = json.loads(response.read().decode())
        if data.get('data'):
            tasks = data['data'].get('tasks', [])
            print(f"Total tasks in KV: {len(tasks)}")
            completed = [t for t in tasks if t.get('status') == 'Hoàn thành']
            print(f"Completed tasks: {len(completed)}")
            
            docs = data['data'].get('docs', [])
            legal = data['data'].get('legal', [])
            
            c_docs = [d for d in docs if d.get('status') == 'Hoàn thành']
            c_legal = [l for l in legal if l.get('status') == 'Đã hoàn thành' or l.get('status') == 'Hoàn thành']
            
            print(f"Total docs completed: {len(c_docs)}")
            print(f"Total legal completed: {len(c_legal)}")
            
        else:
            print("No data in KV yet.")
except Exception as e:
    print(e)
