with open("src/store/HanaContext.tsx", "r") as f:
    code = f.read()

# Update HanaContext to load and sync with Cloudflare KV Database (/api/data)
old_use_effect = """  useEffect(() => {
    // Load overrides and settings from localStorage
    const savedOverrides = JSON.parse(localStorage.getItem("hana_status_overrides") || "{}");
    const savedItemEdits = JSON.parse(localStorage.getItem("hana_item_edits") || "{}");
    const savedNewItems = JSON.parse(localStorage.getItem("hana_new_items") || "[]");
    const savedSettings = JSON.parse(localStorage.getItem("hana_settings") || "null");
    const savedUser = JSON.parse(localStorage.getItem("hana_current_user") || "null");
    const savedPerms = JSON.parse(localStorage.getItem("hana_user_permissions") || "null");

    if (savedSettings) setSettings(savedSettings);
    if (savedUser) setCurrentUser(savedUser);
    if (savedPerms && savedPerms.length > 0) setUserPermissions(savedPerms);

    const mapData = (data: any[], type: string) => data.map(item => {
      const editKey = type + "_" + item.id;
      const edits = savedItemEdits[editKey] || {};
      return {
        ...item,
        type,
        ...edits,
        status: edits.status || savedOverrides[editKey] || item.status
      };
    });

    const initialTasks = mapData(tasksData, "task");
    const initialLegal = mapData(legalData, "legal");
    const initialDocs = mapData(docsData, "doc");
    const initialCapex = mapData(capexData, "capex");

    savedNewItems.forEach((newItem: AnyItem) => {
      if (newItem.type === "task") initialTasks.push(newItem as TaskItem);
      else if (newItem.type === "legal") initialLegal.push(newItem as LegalItem);
      else if (newItem.type === "doc") initialDocs.push(newItem as DocItem);
      else if (newItem.type === "capex") initialCapex.push(newItem as CapexItem);
    });

    setTasks(initialTasks);
    setLegal(initialLegal);
    setDocs(initialDocs);
    setCapex(initialCapex);
  }, []);"""

new_use_effect = """  useEffect(() => {
    // 1. Khởi tạo dữ liệu cơ bản
    const savedOverrides = JSON.parse(localStorage.getItem("hana_status_overrides") || "{}");
    const savedItemEdits = JSON.parse(localStorage.getItem("hana_item_edits") || "{}");
    const savedNewItems = JSON.parse(localStorage.getItem("hana_new_items") || "[]");
    const savedSettings = JSON.parse(localStorage.getItem("hana_settings") || "null");
    const savedUser = JSON.parse(localStorage.getItem("hana_current_user") || "null");
    const savedPerms = JSON.parse(localStorage.getItem("hana_user_permissions") || "null");

    if (savedSettings) setSettings(savedSettings);
    if (savedUser) setCurrentUser(savedUser);
    if (savedPerms && savedPerms.length > 0) setUserPermissions(savedPerms);

    const mapData = (data: any[], type: string, serverEdits: any = {}) => data.map(item => {
      const editKey = type + "_" + item.id;
      const edits = serverEdits[editKey] || savedItemEdits[editKey] || {};
      return {
        ...item,
        type,
        ...edits,
        status: edits.status || savedOverrides[editKey] || item.status
      };
    });

    const initialTasks = mapData(tasksData, "task");
    const initialLegal = mapData(legalData, "legal");
    const initialDocs = mapData(docsData, "doc");
    const initialCapex = mapData(capexData, "capex");

    savedNewItems.forEach((newItem: AnyItem) => {
      if (newItem.type === "task") initialTasks.push(newItem as TaskItem);
      else if (newItem.type === "legal") initialLegal.push(newItem as LegalItem);
      else if (newItem.type === "doc") initialDocs.push(newItem as DocItem);
      else if (newItem.type === "capex") initialCapex.push(newItem as CapexItem);
    });

    setTasks(initialTasks);
    setLegal(initialLegal);
    setDocs(initialDocs);
    setCapex(initialCapex);

    // 2. Tự động đồng bộ với Cloud Database (/api/data)
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
      .catch(err => console.log("[Cloud DB Sync Info]:", err));
  }, []);"""

code = code.replace(old_use_effect, new_use_effect)

# Update updateItem and addItem to also persist to Cloud DB asynchronously
old_update_item = """  const updateItem = (type: string, id: string | number, updatedFields: Partial<AnyItem>) => {
    const editKey = type + "_" + id;
    const savedEdits = JSON.parse(localStorage.getItem("hana_item_edits") || "{}");
    savedEdits[editKey] = { ...(savedEdits[editKey] || {}), ...updatedFields };
    localStorage.setItem("hana_item_edits", JSON.stringify(savedEdits));

    if (type === "task") setTasks(prev => prev.map(t => t.id === id ? ({ ...t, ...updatedFields } as any) : t));
    else if (type === "legal") setLegal(prev => prev.map(t => t.id === id ? ({ ...t, ...updatedFields } as any) : t));
    else if (type === "doc") setDocs(prev => prev.map(t => t.id === id ? ({ ...t, ...updatedFields } as any) : t));
    else if (type === "capex") setCapex(prev => prev.map(t => t.id === id ? ({ ...t, ...updatedFields } as any) : t));
  };"""

new_update_item = """  const syncToCloudDB = (newTasks: any, newLegal: any, newDocs: any, newCapex: any, newSettings: any) => {
    try {
      fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tasks: newTasks,
          legal: newLegal,
          docs: newDocs,
          capex: newCapex,
          settings: newSettings,
          userPermissions
        })
      }).catch(() => {});
    } catch (_) {}
  };

  const updateItem = (type: string, id: string | number, updatedFields: Partial<AnyItem>) => {
    const editKey = type + "_" + id;
    const savedEdits = JSON.parse(localStorage.getItem("hana_item_edits") || "{}");
    savedEdits[editKey] = { ...(savedEdits[editKey] || {}), ...updatedFields };
    localStorage.setItem("hana_item_edits", JSON.stringify(savedEdits));

    let updatedTasks = tasks;
    let updatedLegal = legal;
    let updatedDocs = docs;
    let updatedCapex = capex;

    if (type === "task") {
      updatedTasks = tasks.map(t => t.id === id ? ({ ...t, ...updatedFields } as any) : t);
      setTasks(updatedTasks);
    } else if (type === "legal") {
      updatedLegal = legal.map(t => t.id === id ? ({ ...t, ...updatedFields } as any) : t);
      setLegal(updatedLegal);
    } else if (type === "doc") {
      updatedDocs = docs.map(t => t.id === id ? ({ ...t, ...updatedFields } as any) : t);
      setDocs(updatedDocs);
    } else if (type === "capex") {
      updatedCapex = capex.map(t => t.id === id ? ({ ...t, ...updatedFields } as any) : t);
      setCapex(updatedCapex);
    }

    syncToCloudDB(updatedTasks, updatedLegal, updatedDocs, updatedCapex, settings);
  };"""

code = code.replace(old_update_item, new_update_item)

with open("src/store/HanaContext.tsx", "w") as f:
    f.write(code)

print("HanaContext.tsx updated with Cloudflare KV Database real-time sync!")
