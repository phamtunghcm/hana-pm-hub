import json
import urllib.request

with open('live_data.json', 'r') as f:
    live_data = json.load(f)

capex = live_data['data']['capex']

# 1. 2 Fixed costs (already handled correctly if they are 'capex_0_x')
fixed_items = [item for item in capex if item.get('id', '') in ('capex_0_1', 'capex_0_2')]

# 2. 41 New items from CSV (they have 'capex_1_x')
new_items = [item for item in capex if str(item.get('id', '')).startswith('capex_1_')]

# 3. Old items that are completely missing from the CSV but needed
missing_titles = [
    'Laptop', 'Tablet', 'Đồng phục nhân viên', 'Camera wifi', 'Loa âm trần giá rẻ',
    'Bình chữa cháy bột', 'Bình chữa cháy CO2', 'Đầu báo khói', 'Đèn Exit', 'Tiêu lệnh', 'Mặt nạ phòng độc'
]
old_items_to_keep = []
for item in capex:
    if not str(item.get('id', '')).startswith('capex_1_') and item.get('id') not in ('capex_0_1', 'capex_0_2'):
        if item.get('title') in missing_titles:
            # Check if we already have it in new_items? (No, we verified they are missing)
            item['zone'] = "Khu vực chung" # assign default zone
            old_items_to_keep.append(item)

final_capex = fixed_items + new_items + old_items_to_keep

# Avoid duplicate IDs just in case, though they should be distinct
seen_ids = set()
clean_capex = []
for item in final_capex:
    if item['id'] not in seen_ids:
        seen_ids.add(item['id'])
        clean_capex.append(item)

live_data['data']['capex'] = clean_capex

print(f"Cleaned Capex length: {len(clean_capex)}")

# Send back to KV
req = urllib.request.Request(
    'https://hana-pm-hub.pages.dev/api/data', 
    method='POST',
    headers={'Content-Type': 'application/json'},
    data=json.dumps(live_data['data']).encode('utf-8')
)
with urllib.request.urlopen(req) as response:
    print(response.read().decode('utf-8'))

