import { useState } from "react";
import { LayoutDashboard, ListTodo, Scale, FileText, ShoppingCart, UserCircle, Settings, LogOut } from "lucide-react";
import DashboardView from "./components/DashboardView";
import TaskListView from "./components/TaskListView";
import LegalView from "./components/LegalView";
import DocsView from "./components/DocsView";
import CapexView from "./components/CapexView";
import AdminView from "./components/AdminView";
import SettingsModal from "./components/SettingsModal";
import LoginView from "./components/LoginView";
import AICopilotDrawer from "./components/AICopilotDrawer";
import { useHana } from "./store/HanaContext";

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showSettings, setShowSettings] = useState(false);
  const { settings, currentUser, logout } = useHana();

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
      case "admin": return isAdmin ? <AdminView /> : <DashboardView onNavigate={setActiveTab} />;
      default: return <DashboardView onNavigate={setActiveTab} />;
    }
  };

  const navItems = [
    { id: "dashboard", label: "Tổng quan", icon: LayoutDashboard },
    { id: "tasks", label: "Bảng Công việc", icon: ListTodo },
    { id: "legal", label: "Hồ sơ Pháp lý", icon: Scale },
    { id: "docs", label: "Văn bản Nội bộ", icon: FileText },
    { id: "capex", label: "Mua sắm CAPEX", icon: ShoppingCart },
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
