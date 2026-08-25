import urllib.request
import json

url = 'https://hana-pm-hub.pages.dev/api/data'

try:
    with urllib.request.urlopen(url) as response:
        print("GET Data from Cloudflare KV:")
        print(response.status)
        data = json.loads(response.read().decode())
        if data.get('data'):
            tasks = data['data'].get('tasks', [])
            print(f"Total tasks in KV: {len(tasks)}")
            completed = [t for t in tasks if t.get('status') == 'Hoàn thành']
            print(f"Completed tasks: {len(completed)}")
        else:
            print("No data in KV yet.")
except Exception as e:
    print(e)
