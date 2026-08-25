with open("src/store/HanaContext.tsx", "r") as f:
    code = f.read()

old_merge = """          const mergeData = (cloudData: any[], localData: any[], type: string) => {
             if (!cloudData || cloudData.length === 0) return localData;
             return cloudData.map(cItem => {
                const editKey = type + "_" + cItem.id;
                const localEdits = savedItemEdits[editKey] || {};
                const localStatusOverride = savedOverrides[editKey];
                
                return {
                   ...cItem,
                   ...localEdits,
                   status: localEdits.status || localStatusOverride || cItem.status
                };
             });
          };"""

new_merge = """          const mergeData = (cloudData: any[], localData: any[], type: string) => {
             if (!cloudData || cloudData.length === 0) return localData;
             
             // Xử lý các task từ Cloud (cập nhật với localEdits nếu có)
             const merged = cloudData.map(cItem => {
                const editKey = type + "_" + cItem.id;
                const localEdits = savedItemEdits[editKey] || {};
                const localStatusOverride = savedOverrides[editKey];
                
                return {
                   ...cItem,
                   ...localEdits,
                   status: localEdits.status || localStatusOverride || cItem.status
                };
             });

             // Thêm các task cục bộ (được tạo mới - nằm trong localData nhưng chưa có trên Cloud)
             localData.forEach(lItem => {
                if (!merged.find(m => m.id === lItem.id)) {
                   merged.push(lItem);
                }
             });

             return merged;
          };"""

code = code.replace(old_merge, new_merge)

with open("src/store/HanaContext.tsx", "w") as f:
    f.write(code)

print("HanaContext.tsx merge missing items logic updated!")
