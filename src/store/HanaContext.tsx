import React, { createContext, useContext, useState, useEffect } from "react";
import tasksData from "../data/tasks36.json";
import legalData from "../data/legal5.json";
import docsData from "../data/docs9.json";
import capexData from "../data/capex30.json";
import type { TaskItem, LegalItem, DocItem, CapexItem, AnyItem, UserPermission } from "../types";
import { upsertItem } from "../lib/supabase";

export const DRIVE_LINKS = {
  tasks: "https://docs.google.com/spreadsheets/d/1TxIBBRPTftXJP4oqmyDXidr-8mDFoybQZFpo6NBJsm8/edit?pli=1#gid=139259394",
  legal: "https://docs.google.com/spreadsheets/d/1IGiSUoDnTDN_IFtqGDm_e5PWxMfPPN42/edit?usp=sharing",
  docs: "https://docs.google.com/spreadsheets/d/1aUNfIF5RdsDqawlxR42ycqUK1CPh5L-v1J11V6i3n78/edit?pli=1#gid=220737849",
  capex: "https://docs.google.com/spreadsheets/d/1TxIBBRPTftXJP4oqmyDXidr-8mDFoybQZFpo6NBJsm8/edit?pli=1#gid=139259394"
};

export interface ProjectSettings {
  brandName: string;
  subTitle: string;
  logoText: string;
  targetDate: string;
}

const DEFAULT_USERS: UserPermission[] = [
  { email: "phamtunghcm@gmail.com", name: "Phạm Tùng (Owner)", role: "admin", status: "active" },
  { email: "admin@hanawellness.vn", name: "Quản trị viên", role: "admin", status: "active" },
  { email: "ceo@hanawellness.vn", name: "Ban Giám đốc", role: "admin", status: "active" },
  { email: "staff@hanawellness.vn", name: "Nhân viên xem", role: "user", status: "active" }
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
    targetDate: "2026-11-02"
  });

  const [currentUser, setCurrentUser] = useState<UserPermission | null>(null);
  const [userPermissions, setUserPermissions] = useState<UserPermission[]>(DEFAULT_USERS);

  useEffect(() => {
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

  const updateItem = (type: string, id: string | number, updatedFields: Partial<AnyItem>) => {
    const editKey = type + "_" + id;
    const savedEdits = JSON.parse(localStorage.getItem("hana_item_edits") || "{}");
    savedEdits[editKey] = { ...(savedEdits[editKey] || {}), ...updatedFields };
    localStorage.setItem("hana_item_edits", JSON.stringify(savedEdits));

    if (type === "task") setTasks(prev => prev.map(t => t.id === id ? ({ ...t, ...updatedFields } as any) : t));
    else if (type === "legal") setLegal(prev => prev.map(t => t.id === id ? ({ ...t, ...updatedFields } as any) : t));
    else if (type === "doc") setDocs(prev => prev.map(t => t.id === id ? ({ ...t, ...updatedFields } as any) : t));
    else if (type === "capex") setCapex(prev => prev.map(t => t.id === id ? ({ ...t, ...updatedFields } as any) : t));
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
