import React, { createContext, useContext, useState, useEffect } from "react";
import tasksData from "../data/tasks36.json";
import legalData from "../data/legal5.json";
import docsData from "../data/docs9.json";
import capexData from "../data/capex30.json";
import type { TaskItem, LegalItem, DocItem, CapexItem, AnyItem, UserPermission } from "../types";
import { upsertItem } from "../lib/supabase";

export const DRIVE_LINKS = {
  tasks: "https://docs.google.com/spreadsheets/d/1TxIBBRPTftXJP4oqmyDXidr-8mDFoybQZFpo6NBJsm8/edit?pli=1#gid=139259394",
  // Bảng quản lý chung ANTT, PCCC
  legalSheet: "https://docs.google.com/spreadsheets/d/1lUWL9RtJeCllRgMQDUpSfPVQHmdrd38i/edit?usp=sharing&ouid=112807505253419172495&rtpof=true&sd=true",
  // Folder hồ sơ ANTT
  legalAnttFolder: "https://drive.google.com/drive/folders/1v-OwDDMRek50o6RVcz9QISUtc4wMKghm?usp=drive_link",
  // Folder hồ sơ PCCC (>100m2)
  legalPcccFolder: "https://drive.google.com/drive/folders/1RNDnyFSPis2NGIpEtSOsHvq5IZrwY4dV?usp=drive_link",
  // Bảng theo dõi văn bản nội bộ
  docsSheet: "https://docs.google.com/spreadsheets/d/1Qq3a6LjbvcF3SrVmodCRGGBNQ2vFyMlQ/edit?usp=drive_link&ouid=112807505253419172495&rtpof=true&sd=true",
  // Folder của nhóm văn bản nội bộ
  docsFolder: "https://drive.google.com/drive/folders/1prdsSerfEfqjU0fzfa-__eRphpJhoS6p?usp=drive_link",
  // Bảng tính mua sắm & CAPEX
  capex: "https://docs.google.com/spreadsheets/d/1TxIBBRPTftXJP4oqmyDXidr-8mDFoybQZFpo6NBJsm8/edit?pli=1#gid=139259394"
};

export interface ProjectSettings {
  brandName: string;
  subTitle: string;
  logoText: string;
  targetDate: string;
  reportEmail?: string;
  zaloWebhook?: string;
  resendApiKey?: string;
}

const DEFAULT_USERS: UserPermission[] = [
  { email: "phamtunghcm@gmail.com", name: "Phạm Tùng (Owner)", role: "admin", status: "active" },
  { email: "admin@hanawellness-project.com", name: "Quản trị viên", role: "admin", status: "active" },
  { email: "ceo@hanawellness-project.com", name: "Ban Giám đốc", role: "admin", status: "active" },
  { email: "staff@hanawellness-project.com", name: "Nhân viên xem", role: "user", status: "active" }
];

interface HanaContextType {
  tasks: TaskItem[];
  legal: LegalItem[];
  docs: DocItem[];
  capex: CapexItem[];
  settings: ProjectSettings;
  currentUser: UserPermission | null;
  userPermissions: UserPermission[];
  updateItemStatus: (type: string, id: string | number, newStatus: string) => void;
  updateItem: (type: string, id: string | number, updatedFields: Partial<AnyItem>) => void;
  addItem: (item: AnyItem) => void;
  updateSettings: (newSettings: Partial<ProjectSettings>) => void;
  login: (email: string) => { success: boolean; message?: string };
  logout: () => void;
  addUserPermission: (email: string, role: "admin" | "user", name?: string) => void;
  removeUserPermission: (email: string) => void;
  updateUserRole: (email: string, role: "admin" | "user") => void;
}

const HanaContext = createContext<HanaContextType | undefined>(undefined);

export const HanaProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [legal, setLegal] = useState<LegalItem[]>([]);
  const [docs, setDocs] = useState<DocItem[]>([]);
  const [capex, setCapex] = useState<CapexItem[]>([]);
  const [settings, setSettings] = useState<ProjectSettings>({
    brandName: "HANA Wellness",
    subTitle: "PM HUB",
    logoText: "H",
    targetDate: "2026-11-02",
    reportEmail: "phamtunghcm@gmail.com",
    zaloWebhook: "",
    resendApiKey: ""
  });

  const [currentUser, setCurrentUser] = useState<UserPermission | null>(null);
  const [userPermissions, setUserPermissions] = useState<UserPermission[]>(DEFAULT_USERS);

  useEffect(() => {
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
  }, []);

  const login = (email: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const foundUser = userPermissions.find(u => u.email.toLowerCase() === cleanEmail && u.status === "active");

    if (foundUser) {
      setCurrentUser(foundUser);
      localStorage.setItem("hana_current_user", JSON.stringify(foundUser));
      return { success: true };
    }
    
    return { 
      success: false, 
      message: "Email này chưa được cấp quyền truy cập. Vui lòng liên hệ Admin để thêm vào danh sách!" 
    };
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem("hana_current_user");
  };

  const addUserPermission = (email: string, role: "admin" | "user", name?: string) => {
    const cleanEmail = email.trim().toLowerCase();
    setUserPermissions(prev => {
      const exists = prev.some(u => u.email.toLowerCase() === cleanEmail);
      if (exists) return prev;
      const newUser: UserPermission = {
        email: cleanEmail,
        name: name || cleanEmail.split("@")[0],
        role,
        status: "active"
      };
      const updated = [...prev, newUser];
      localStorage.setItem("hana_user_permissions", JSON.stringify(updated));
      upsertItem("user_permissions", newUser);
      return updated;
    });
  };

  const removeUserPermission = (email: string) => {
    const cleanEmail = email.trim().toLowerCase();
    setUserPermissions(prev => {
      const updated = prev.filter(u => u.email.toLowerCase() !== cleanEmail);
      localStorage.setItem("hana_user_permissions", JSON.stringify(updated));
      return updated;
    });
  };

  const updateUserRole = (email: string, role: "admin" | "user") => {
    const cleanEmail = email.trim().toLowerCase();
    setUserPermissions(prev => {
      const updated = prev.map(u => u.email.toLowerCase() === cleanEmail ? { ...u, role } : u);
      localStorage.setItem("hana_user_permissions", JSON.stringify(updated));
      return updated;
    });
  };

  const updateItemStatus = (type: string, id: string | number, newStatus: string) => {
    updateItem(type, id, { status: newStatus });
  };

  const syncToCloudDB = (newTasks: any, newLegal: any, newDocs: any, newCapex: any, newSettings: any) => {
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
  };

  const addItem = (item: AnyItem) => {
    const savedNewItems = JSON.parse(localStorage.getItem("hana_new_items") || "[]");
    savedNewItems.push(item);
    localStorage.setItem("hana_new_items", JSON.stringify(savedNewItems));

    if (item.type === "task") setTasks(prev => [...prev, item as TaskItem]);
    else if (item.type === "legal") setLegal(prev => [...prev, item as LegalItem]);
    else if (item.type === "doc") setDocs(prev => [...prev, item as DocItem]);
    else if (item.type === "capex") setCapex(prev => [...prev, item as CapexItem]);
  };

  const updateSettings = (newSettings: Partial<ProjectSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem("hana_settings", JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <HanaContext.Provider value={{ 
      tasks, 
      legal, 
      docs, 
      capex, 
      settings, 
      currentUser, 
      userPermissions,
      updateItemStatus, 
      updateItem, 
      addItem, 
      updateSettings,
      login,
      logout,
      addUserPermission,
      removeUserPermission,
      updateUserRole
    }}>
      {children}
    </HanaContext.Provider>
  );
};

export const useHana = () => {
  const context = useContext(HanaContext);
  if (!context) throw new Error("useHana must be used within a HanaProvider");
  return context;
};
