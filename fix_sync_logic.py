with open("src/store/HanaContext.tsx", "r") as f:
    code = f.read()

old_fetch = """    // 2. Tự động đồng bộ với Cloud Database (/api/data)
    fetch('/api/data')
      .then(res => res.json())
      .then(resData => {
        if (resData.success && resData.data) {
          const cloud = resData.data;
          if (cloud.tasks) setTasks(cloud.tasks);
          if (cloud.legal) setLegal(cloud.legal);
          if (cloud.docs) setDocs(cloud.docs);
          if (cloud.capex) setCapex(cloud.capex);
          if (cloud.settings) setSettings(cloud.settings);
          if (cloud.userPermissions) setUserPermissions(cloud.userPermissions);
        }
      })
      .catch(err => console.log("[Cloud DB Sync Info]:", err));"""

new_fetch = """    // 2. Tự động đồng bộ với Cloud Database (/api/data)
    fetch('/api/data')
      .then(res => res.json())
      .then(resData => {
        if (resData.success && resData.data) {
          const cloud = resData.data;
          
          // Trộn dữ liệu từ Cloud với Local Storage (ưu tiên Local nếu có thay đổi chưa đẩy lên mây)
          const mergeData = (cloudData: any[], localData: any[], type: string) => {
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
          };

          const mergedTasks = mergeData(cloud.tasks, initialTasks, "task");
          const mergedLegal = mergeData(cloud.legal, initialLegal, "legal");
          const mergedDocs = mergeData(cloud.docs, initialDocs, "doc");
          const mergedCapex = mergeData(cloud.capex, initialCapex, "capex");

          setTasks(mergedTasks);
          setLegal(mergedLegal);
          setDocs(mergedDocs);
          setCapex(mergedCapex);

          if (cloud.settings) setSettings(cloud.settings);
          if (cloud.userPermissions && cloud.userPermissions.length > 0) setUserPermissions(cloud.userPermissions);

          // Force push merged data back to cloud to ensure it matches browser state
          try {
            fetch('/api/data', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                tasks: mergedTasks,
                legal: mergedLegal,
                docs: mergedDocs,
                capex: mergedCapex,
                settings: cloud.settings || savedSettings || settings,
                userPermissions: cloud.userPermissions || savedPerms || []
              })
            }).catch(() => {});
          } catch (_) {}
        }
      })
      .catch(err => console.log("[Cloud DB Sync Info]:", err));"""

code = code.replace(old_fetch, new_fetch)

with open("src/store/HanaContext.tsx", "w") as f:
    f.write(code)

print("HanaContext.tsx sync logic updated!")
