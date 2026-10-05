import { useState } from "react";
import { LayoutDashboard, ListTodo, Scale, FileText, ShoppingCart, UserCircle, Settings, LogOut, RefreshCw, CheckCircle2, ExternalLink, Wallet, Receipt } from "lucide-react";
import DashboardView from "./components/DashboardView";
import TaskListView from "./components/TaskListView";
import LegalView from "./components/LegalView";
import DocsView from "./components/DocsView";
import CapexView from "./components/CapexView";
import InvoiceManagementView from "./components/InvoiceManagementView";
import AdminView from "./components/AdminView";
import PayrollView from "./components/PayrollView";
import SettingsModal from "./components/SettingsModal";
import LoginView from "./components/LoginView";
import AICopilotDrawer from "./components/AICopilotDrawer";
import { useHana, DRIVE_LINKS } from "./store/HanaContext";

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showSettings, setShowSettings] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncToast, setSyncToast] = useState<{ show: boolean; message: string; success: boolean }>({ show: false, message: "", success: true });
  const { settings, currentUser, logout, syncGoogleSheets } = useHana();

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      const res = await syncGoogleSheets();
      setSyncToast({ show: true, message: res.message, success: res.success });
    } catch (e: any) {
      setSyncToast({ show: true, message: e.message || "Lỗi đồng bộ", success: false });
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncToast(prev => ({ ...prev, show: false })), 4000);
    }
  };

  if (!currentUser) {
    return <LoginView />;
  }

  const isAdmin = currentUser.role === "admin";

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard": return <DashboardView onNavigate={setActiveTab} />;
      case "tasks": return <TaskListView />;
      case "legal": return <LegalView />;
      case "docs": return <DocsView />;
      case "capex": return <CapexView />;
      case "payroll": return <PayrollView />;
      case "invoices": return <InvoiceManagementView />;
      case "admin": return isAdmin ? <AdminView /> : <DashboardView onNavigate={setActiveTab} />;
      default: return <DashboardView onNavigate={setActiveTab} />;
    }
  };

  const navItems = [
    { id: "dashboard", label: "Tổng quan", icon: LayoutDashboard },
    { id: "payroll", label: "Bảng Lương ERP", icon: Wallet },
    { id: "tasks", label: "Bảng Công việc", icon: ListTodo },
    { id: "legal", label: "Hồ sơ Pháp lý", icon: Scale },
    { id: "docs", label: "Văn bản Nội bộ", icon: FileText },
    { id: "capex", label: "Mua sắm CAPEX", icon: ShoppingCart },
    { id: "invoices", label: "Hóa đơn & Chi phí", icon: Receipt },
  ];

  if (isAdmin) {
    navItems.push({ id: "admin", label: "Cấu hình Admin", icon: Settings });
  }

  return (
    <div className="flex h-screen bg-[#FDFBF7] overflow-hidden font-sans text-[#5D4037]">
      {/* Sidebar */}
      <aside className="w-72 bg-[#F5F0E6] flex flex-col border-r border-[#E7E0D6] z-20 hidden md:flex shadow-sm">
        <div className="h-[88px] flex items-center justify-between px-6 border-b border-[#E7E0D6] bg-[#F5F0E6]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#8D6E63] rounded-xl flex items-center justify-center font-black text-[#FDFBF7] text-xl shadow-sm uppercase">
              {settings.logoText || "H"}
            </div>
            <div>
              <h1 className="font-black text-lg text-[#4E342E] leading-tight uppercase tracking-tight">{settings.brandName}</h1>
              <p className="text-[#8D6E63] text-xs font-bold tracking-wider">{settings.subTitle}</p>
            </div>
          </div>
          {isAdmin && (
            <button 
              onClick={() => setShowSettings(true)}
              className="text-[#8D6E63] hover:text-[#4E342E] p-1.5 rounded-lg hover:bg-[#EFEBE0] transition-colors cursor-pointer"
              title="Cấu hình nhanh"
            >
              <Settings size={18} />
            </button>
          )}
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          <div className="text-xs font-bold text-[#A1887F] uppercase tracking-wider mb-4 px-2">Menu chính</div>
          {navItems.map(item => (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id)} 
              className={"w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group font-bold cursor-pointer " + (activeTab === item.id ? "bg-[#8D6E63] text-white shadow-md" : "text-[#6D4C41] hover:bg-[#EFEBE0] hover:text-[#4E342E]")}
            >
              <item.icon size={20} className={activeTab === item.id ? "text-white" : "text-[#8D6E63] group-hover:text-[#5D4037]"} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        
        {/* User Info & Logout */}
        <div className="p-4 border-t border-[#E7E0D6] bg-[#F5F0E6]">
          <div className="flex items-center justify-between px-2 py-1">
            <div className="flex items-center gap-2.5 truncate">
              <UserCircle size={32} className="text-[#8D6E63] shrink-0" />
              <div className="truncate">
                <p className="text-xs font-bold text-[#4E342E] truncate">{currentUser.name || currentUser.email}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                    isAdmin ? "bg-amber-100 text-amber-800 border border-amber-300" : "bg-blue-100 text-blue-800 border border-blue-200"
                  }`}>
                    {isAdmin ? "ADMIN" : "USER"}
                  </span>
                  <span className="text-[10px] text-[#8D6E63] truncate">{currentUser.email}</span>
                </div>
              </div>
            </div>
            <button
              onClick={logout}
              className="p-2 text-[#8D6E63] hover:text-red-700 hover:bg-[#EFEBE0] rounded-lg transition-colors cursor-pointer shrink-0"
              title="Đăng xuất"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Mobile Header */}
        <header className="h-16 bg-[#F5F0E6] border-b border-[#E7E0D6] flex items-center justify-between px-6 md:hidden">
          <h1 className="font-bold text-lg text-[#4E342E]">{settings.brandName}</h1>
          <button onClick={logout} className="text-[#8D6E63] flex items-center gap-1 text-xs font-bold">
            <LogOut size={16} />
            <span>Đăng xuất</span>
          </button>
        </header>

        {/* Top Sync & Status Bar */}
        <div className="bg-[#FAF7F0] border-b border-[#E7E0D6] px-6 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Đồng bộ 2 chiều Google Sheets & Drive: Đang bật
            </span>
            <span className="text-[#8D6E63] hidden xl:inline">
              (Cập nhật trên Site hoặc Google Sheets đều đồng bộ tự động cả 2 chiều)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <a 
              href={DRIVE_LINKS.tasks} 
              target="_blank" 
              rel="noreferrer"
              className="text-[#6D4C41] hover:text-[#3E2723] hover:underline flex items-center gap-1 font-medium px-2 py-1 rounded hover:bg-[#EFEBE0]"
              title="Mở Google Sheet Tasks"
            >
              <span>Sheet Tasks</span>
              <ExternalLink size={12} />
            </a>
            <a 
              href={DRIVE_LINKS.legalSheet} 
              target="_blank" 
              rel="noreferrer"
              className="text-[#6D4C41] hover:text-[#3E2723] hover:underline flex items-center gap-1 font-medium px-2 py-1 rounded hover:bg-[#EFEBE0]"
              title="Mở Google Sheet / File Pháp lý"
            >
              <span>File Pháp lý</span>
              <ExternalLink size={12} />
            </a>
            <a 
              href={DRIVE_LINKS.capex} 
              target="_blank" 
              rel="noreferrer"
              className="text-[#6D4C41] hover:text-[#3E2723] hover:underline flex items-center gap-1 font-medium px-2 py-1 rounded hover:bg-[#EFEBE0]"
              title="Mở Google Sheet Mua sắm"
            >
              <span>Sheet Mua sắm</span>
              <ExternalLink size={12} />
            </a>

            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              className="ml-1 bg-[#8D6E63] hover:bg-[#6D4C41] disabled:opacity-50 text-white font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              title="Nhấn để kiểm tra và đồng bộ ngay với Google Sheets"
            >
              <RefreshCw size={13} className={isSyncing ? "animate-spin" : ""} />
              <span>{isSyncing ? "Đang đồng bộ..." : "Đồng bộ ngay"}</span>
            </button>
          </div>
        </div>

        {/* Sync Toast Notification */}
        {syncToast.show && (
          <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg border text-sm font-bold animate-in fade-in slide-in-from-top-2 ${
            syncToast.success ? "bg-emerald-50 border-emerald-300 text-emerald-900" : "bg-red-50 border-red-300 text-red-900"
          }`}>
            <CheckCircle2 size={18} className={syncToast.success ? "text-emerald-600" : "text-red-600"} />
            <span>{syncToast.message}</span>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[#FDFBF7] p-6">
          <div className="w-full mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 h-full">
            {renderContent()}
          </div>
        </main>
      </div>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      <AICopilotDrawer />
    </div>
  );
}
