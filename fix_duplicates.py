import json

with open('live_data.json', 'r') as f:
    live_data = json.load(f)

capex = live_data['data']['capex']

def tokenize(text):
    return set(text.lower().replace("(", " ").replace(")", " ").split())

deduped = []
# We want to keep the NEW items (which have the 'zone' field from the CSV)
# BUT we want to preserve the 'status' or 'note' from the OLD items (which have ID starting with something else, or no 'zone' field).
# The new items have IDs like "capex_1_x". The old items have IDs like "capex_0_x" or integers.

new_items = [item for item in capex if str(item.get('id', '')).startswith('capex_1_')]
old_items = [item for item in capex if not str(item.get('id', '')).startswith('capex_1_')]

# For fixed items:
fixed_items = [item for item in old_items if "Thi công thô" in item.get('title', '') or "Đặt cọc" in item.get('title', '')]
old_items = [item for item in old_items if item not in fixed_items]

final_capex = []
# Add fixed items first
for item in fixed_items:
    # Ensure they have zone if missing
    if not item.get('zone'):
        item['zone'] = "Toàn bộ cơ sở"
    final_capex.append(item)

for new_item in new_items:
    new_name = new_item.get('title', '')
    new_tokens = tokenize(new_name)
    
    # Find matching old item
    best_match = None
    best_score = 0
    for old_item in old_items:
        old_name = old_item.get('title', '')
        old_tokens = tokenize(old_name)
        if not old_tokens or not new_tokens: continue
        overlap = len(new_tokens.intersection(old_tokens))
        score = overlap / max(len(new_tokens), len(old_tokens))
        if score > best_score:
            best_score = score
            best_match = old_item
            
    if best_score > 0.4 and best_match:
        # We found a duplicate!
        print(f"MERGING: '{new_name}' with '{best_match.get('title', '')}' (Score: {best_score:.2f})")
        # Preserve status from old item if it was updated (not "Chưa mua", not "Cần mua")
        old_status = best_match.get('status', '')
        if old_status and old_status not in ["Chưa mua", "Cần mua", ""]:
            new_item['status'] = old_status
            print(f"  -> Kept old status: {old_status}")
            
        # Preserve note from old item if it has one and new doesn't
        old_note = best_match.get('note', '')
        new_note = new_item.get('note', '')
        if old_note and not new_note:
            new_item['note'] = old_note
            
        # Mark as merged so we don't add the old item
        old_items.remove(best_match)
        
    final_capex.append(new_item)

# Add remaining old items that didn't match anything in the new CSV (maybe they were manually added)
for old_item in old_items:
    print(f"KEEPING UNMATCHED OLD ITEM: '{old_item.get('title', '')}'")
    if not old_item.get('zone'):
        old_item['zone'] = "Khác"
    final_capex.append(old_item)

live_data['data']['capex'] = final_capex
print(f"Final capex list length: {len(final_capex)}")

with open('deduped_live_data.json', 'w', encoding='utf-8') as f:
    json.dump(live_data['data'], f, ensure_ascii=False, indent=2)
