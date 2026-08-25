with open("src/store/HanaContext.tsx", "r") as f:
    code = f.read()

import re

# Insert a toast notification into useEffect after merge
toast_code = """
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
            }).then(() => {
                // Đánh dấu để Toast hiển thị một lần duy nhất
                if (!sessionStorage.getItem("sync_toast_shown")) {
                    alert("✅ Đã kết nối và đồng bộ hoàn tất dữ liệu từ thiết bị này lên Cloud Database!");
                    sessionStorage.setItem("sync_toast_shown", "true");
                }
            }).catch(() => {});
          } catch (_) {}
"""

# Replace the block
code = code.replace("""
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
""", toast_code)

with open("src/store/HanaContext.tsx", "w") as f:
    f.write(code)

print("Added version toast!")
