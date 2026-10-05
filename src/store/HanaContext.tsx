import React, { createContext, useContext, useState, useEffect } from "react";
import tasksData from "../data/tasks36.json";
import legalData from "../data/legal5.json";
import docsData from "../data/docs9.json";
import capexData from "../data/capex30.json";
import invoicesSeedData from "../data/invoices.json";
import type { TaskItem, LegalItem, DocItem, CapexItem, AnyItem, UserPermission, InvoiceItem, NonInvoiceExpenseItem, InvoiceSummaryMonth, InvoiceSettings } from "../types";
import { upsertItem } from "../lib/supabase";

export const DRIVE_LINKS = {
  tasks: "https://docs.google.com/spreadsheets/d/1TxIBBRPTftXJP4oqmyDXidr-8mDFoybQZFpo6NBJsm8/edit?pli=1#gid=139259394",
  // Bảng quản lý chung ANTT, PCCC
  legalSheet: "https://docs.google.com/spreadsheets/d/1XpU-5goVpdFNgYGpV6wkVYznTA8KDsz5/edit?gid=2104154183#gid=2104154183",
  // Folder hồ sơ ANTT
  legalAnttFolder: "https://drive.google.com/drive/folders/1v-OwDDMRek50o6RVcz9QISUtc4wMKghm?usp=drive_link",
  // Folder hồ sơ PCCC (>100m2)
  legalPcccFolder: "https://drive.google.com/drive/folders/1RNDnyFSPis2NGIpEtSOsHvq5IZrwY4dV?usp=drive_link",
  // Bảng theo dõi văn bản nội bộ
  docsSheet: "https://docs.google.com/spreadsheets/d/1Qq3a6LjbvcF3SrVmodCRGGBNQ2vFyMlQ/edit?usp=drive_link&ouid=112807505253419172495&rtpof=true&sd=true",
  // Folder của nhóm văn bản nội bộ
  docsFolder: "https://drive.google.com/drive/folders/1prdsSerfEfqjU0fzfa-__eRphpJhoS6p?usp=drive_link",
  // Bảng tính mua sắm & CAPEX
  capex: "https://docs.google.com/spreadsheets/d/17abDmjThWZ-kQdW2cVPl2Kp8BfEz2v7trtebELIkD_s/edit?gid=1002#gid=1002",
  // Thư mục Dữ liệu kế toán & Hóa đơn chi phí
  invoicesFolder: "https://drive.google.com/drive/folders/1sO3ev6apoDAINQRR1d5bQ1WHDaIA09lu"
};

export const DEFAULT_INVOICE_SETTINGS: InvoiceSettings = {
  driveFolderUrl: "https://drive.google.com/drive/folders/1sO3ev6apoDAINQRR1d5bQ1WHDaIA09lu",
  driveRemotePath: "hanawellness:Dữ liệu kế toán",
  localFolderPath: "/Users/tungpv/.gemini/antigravity/scratch/Dữ liệu kế toán",
  reportFileName: "Báo cáo hoá đơn tổng hợp.xlsx",
  emailUser: "hanawellness.official@gmail.com",
  emailPass: "",
  searchKeywords: "hóa đơn, hoá đơn, invoice, hd",
  scanLimit: 100,
  notificationEmail: "phamtunghcm@gmail.com",
  autoMarkSeen: true
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
  invoices: InvoiceItem[];
  nonInvoices: NonInvoiceExpenseItem[];
  invoiceSummary: InvoiceSummaryMonth[];
  invoiceSettings: InvoiceSettings;
  settings: ProjectSettings;
  currentUser: UserPermission | null;
  userPermissions: UserPermission[];
  updateItemStatus: (type: string, id: string | number, newStatus: string) => void;
  updateItem: (type: string, id: string | number, updatedFields: Partial<AnyItem>) => void;
  addItem: (item: AnyItem) => void;
  updateSettings: (newSettings: Partial<ProjectSettings>) => void;
  updateInvoiceSettings: (newSettings: Partial<InvoiceSettings>) => void;
  login: (email: string) => { success: boolean; message?: string };
  logout: () => void;
  addUserPermission: (email: string, role: "admin" | "user", name?: string) => void;
  removeUserPermission: (email: string) => void;
  updateUserRole: (email: string, role: "admin" | "user") => void;
  syncGoogleSheets: () => Promise<{ success: boolean; message: string }>;
  refreshData: () => Promise<void>;
}

const HanaContext = createContext<HanaContextType | undefined>(undefined);

export const HanaProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [legal, setLegal] = useState<LegalItem[]>([]);
  const [docs, setDocs] = useState<DocItem[]>([]);
  const [capex, setCapex] = useState<CapexItem[]>([]);
  const [invoices, setInvoices] = useState<InvoiceItem[]>(invoicesSeedData.invoices as InvoiceItem[]);
  const [nonInvoices, setNonInvoices] = useState<NonInvoiceExpenseItem[]>(invoicesSeedData.nonInvoices as NonInvoiceExpenseItem[]);
  const [invoiceSummary, setInvoiceSummary] = useState<InvoiceSummaryMonth[]>(invoicesSeedData.summary as InvoiceSummaryMonth[]);
  const [invoiceSettings, setInvoiceSettings] = useState<InvoiceSettings>(DEFAULT_INVOICE_SETTINGS);
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
    const savedInvoiceSettings = JSON.parse(localStorage.getItem("hana_invoice_settings") || "null");
    const savedInvoices = JSON.parse(localStorage.getItem("hana_invoices") || "null");
    const savedNonInvoices = JSON.parse(localStorage.getItem("hana_non_invoices") || "null");
    const savedInvoiceSummary = JSON.parse(localStorage.getItem("hana_invoice_summary") || "null");

    if (savedSettings) setSettings(savedSettings);
    if (savedUser) setCurrentUser(savedUser);
    if (savedPerms && savedPerms.length > 0) setUserPermissions(savedPerms);
    if (savedInvoiceSettings) setInvoiceSettings(savedInvoiceSettings);
    if (savedInvoices) setInvoices(savedInvoices);
    if (savedNonInvoices) setNonInvoices(savedNonInvoices);
    if (savedInvoiceSummary) setInvoiceSummary(savedInvoiceSummary);

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
          
          // Trộn dữ liệu từ Cloud với Local Storage (ưu tiên Local nếu có thay đổi chưa đẩy lên mây)
          const mergeData = (cloudData: any[], localData: any[], type: string) => {
             if (!cloudData || cloudData.length === 0) return localData;
             
             // Xử lý các task từ Cloud (cập nhật với localEdits nếu có)
             const merged = cloudData.map(cItem => {
                const editKey = type + "_" + cItem.id;
                const localEdits = savedItemEdits[editKey] || {};
                const localStatusOverride = savedOverrides[editKey];
                                return {
                    ...cItem,
                    type,
                    ...localEdits,
                    status: localEdits.status || localStatusOverride || cItem.status
                 };
             });

             return merged;
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
          if (cloud.invoiceSettings) {
            setInvoiceSettings(cloud.invoiceSettings);
            localStorage.setItem("hana_invoice_settings", JSON.stringify(cloud.invoiceSettings));
          }
          if (cloud.invoices && cloud.invoices.length >= (invoicesSeedData.invoices as InvoiceItem[]).length) {
            setInvoices(cloud.invoices);
            localStorage.setItem("hana_invoices", JSON.stringify(cloud.invoices));
          } else {
            setInvoices(invoicesSeedData.invoices as InvoiceItem[]);
            localStorage.setItem("hana_invoices", JSON.stringify(invoicesSeedData.invoices));
          }
          if (cloud.nonInvoices && cloud.nonInvoices.length >= (invoicesSeedData.nonInvoices as NonInvoiceExpenseItem[]).length) {
            setNonInvoices(cloud.nonInvoices);
            localStorage.setItem("hana_non_invoices", JSON.stringify(cloud.nonInvoices));
          } else {
            setNonInvoices(invoicesSeedData.nonInvoices as NonInvoiceExpenseItem[]);
            localStorage.setItem("hana_non_invoices", JSON.stringify(invoicesSeedData.nonInvoices));
          }
          if (cloud.invoiceSummary && cloud.invoiceSummary.length >= (invoicesSeedData.summary as InvoiceSummaryMonth[]).length) {
            setInvoiceSummary(cloud.invoiceSummary);
            localStorage.setItem("hana_invoice_summary", JSON.stringify(cloud.invoiceSummary));
          } else {
            setInvoiceSummary(invoicesSeedData.summary as InvoiceSummaryMonth[]);
            localStorage.setItem("hana_invoice_summary", JSON.stringify(invoicesSeedData.summary));
          }

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
                userPermissions: cloud.userPermissions || savedPerms || [],
                invoiceSettings: cloud.invoiceSettings || savedInvoiceSettings || DEFAULT_INVOICE_SETTINGS,
                invoices: cloud.invoices || savedInvoices || invoicesSeedData.invoices,
                nonInvoices: cloud.nonInvoices || savedNonInvoices || invoicesSeedData.nonInvoices,
                invoiceSummary: cloud.invoiceSummary || savedInvoiceSummary || invoicesSeedData.summary
              })
            }).then(() => {
                // Đánh dấu để Toast hiển thị một lần duy nhất
                if (!sessionStorage.getItem("sync_toast_shown")) {
                    alert("✅ Đã kết nối và đồng bộ hoàn tất dữ liệu từ thiết bị này lên Cloud Database!");
                    sessionStorage.setItem("sync_toast_shown", "true");
                }
            }).catch(() => {});
          } catch (_) {}
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

  const syncToCloudDB = (
    newTasks: any, 
    newLegal: any, 
    newDocs: any, 
    newCapex: any, 
    newSettings: any,
    newInvoiceSettings: any = invoiceSettings,
    newInvoices: any = invoices,
    newNonInvoices: any = nonInvoices,
    newInvoiceSummary: any = invoiceSummary
  ) => {
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
          userPermissions,
          invoiceSettings: newInvoiceSettings,
          invoices: newInvoices,
          nonInvoices: newNonInvoices,
          invoiceSummary: newInvoiceSummary
        })
      }).catch(() => {});
    } catch (_) {}
  };

  const updateItem = (rawType: string, id: string | number, updatedFields: Partial<AnyItem>) => {
    const type = (!rawType || rawType === 'undefined') ? 'task' : rawType;
    const editKey = type + "_" + id;
    const savedEdits = JSON.parse(localStorage.getItem("hana_item_edits") || "{}");
    savedEdits[editKey] = { ...(savedEdits[editKey] || {}), ...updatedFields };
    localStorage.setItem("hana_item_edits", JSON.stringify(savedEdits));

    if (updatedFields.status) {
      const savedOverrides = JSON.parse(localStorage.getItem("hana_status_overrides") || "{}");
      savedOverrides[editKey] = updatedFields.status;
      localStorage.setItem("hana_status_overrides", JSON.stringify(savedOverrides));
    }

    let updatedTasks = tasks;
    let updatedLegal = legal;
    let updatedDocs = docs;
    let updatedCapex = capex;

    if (type === "task") {
      updatedTasks = tasks.map(t => String(t.id) === String(id) ? ({ ...t, ...updatedFields, type: "task" } as any) : t);
      setTasks(updatedTasks);
    } else if (type === "legal") {
      updatedLegal = legal.map(t => String(t.id) === String(id) ? ({ ...t, ...updatedFields, type: "legal" } as any) : t);
      setLegal(updatedLegal);
    } else if (type === "doc") {
      updatedDocs = docs.map(t => String(t.id) === String(id) ? ({ ...t, ...updatedFields, type: "doc" } as any) : t);
      setDocs(updatedDocs);
    } else if (type === "capex") {
      updatedCapex = capex.map(t => String(t.id) === String(id) ? ({ ...t, ...updatedFields, type: "capex" } as any) : t);
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
      syncToCloudDB(tasks, legal, docs, capex, updated);
      return updated;
    });
  };

  const updateInvoiceSettings = (newSettings: Partial<InvoiceSettings>) => {
    setInvoiceSettings(prev => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem("hana_invoice_settings", JSON.stringify(updated));
      syncToCloudDB(tasks, legal, docs, capex, settings, updated);
      return updated;
    });
  };

  const refreshData = async () => {
    try {
      const res = await fetch('/api/data');
      const resData = await res.json();
      if (resData.success && resData.data) {
        const cloud = resData.data;
        if (cloud.tasks) setTasks(cloud.tasks);
        if (cloud.legal) setLegal(cloud.legal);
        if (cloud.docs) setDocs(cloud.docs);
        if (cloud.capex) setCapex(cloud.capex);
        if (cloud.settings) setSettings(cloud.settings);
      }
    } catch (e) {
      console.error("Error refreshing data:", e);
    }
  };

  const syncGoogleSheets = async (): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await fetch('/api/sync', { method: 'POST' });
      const resData = await res.json();
      await refreshData();
      return {
        success: resData.success,
        message: resData.message || (resData.success ? 'Đồng bộ thành công!' : 'Lỗi đồng bộ.')
      };
    } catch (e: any) {
      return { success: false, message: e.message || 'Lỗi kết nối máy chủ' };
    }
  };

  return (
    <HanaContext.Provider value={{ 
      tasks, 
      legal, 
      docs, 
      capex, 
      invoices,
      nonInvoices,
      invoiceSummary,
      invoiceSettings,
      settings, 
      currentUser, 
      userPermissions,
      updateItemStatus, 
      updateItem, 
      addItem, 
      updateSettings,
      updateInvoiceSettings,
      login,
      logout,
      addUserPermission,
      removeUserPermission,
      updateUserRole,
      syncGoogleSheets,
      refreshData
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
