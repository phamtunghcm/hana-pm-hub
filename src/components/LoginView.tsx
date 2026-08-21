import React, { useState } from "react";
import { useHana } from "../store/HanaContext";
import { Mail, ArrowRight, Lock, UserCheck, AlertCircle } from "lucide-react";

export const LoginView: React.FC = () => {
  const { login, settings, userPermissions } = useHana();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Vui lòng nhập địa chỉ Email!");
      return;
    }

    const res = login(email);
    if (!res.success) {
      setError(res.message || "Email không có quyền truy cập!");
    } else {
      setError(null);
    }
  };

  const handleQuickLogin = (targetEmail: string) => {
    setEmail(targetEmail);
    const res = login(targetEmail);
    if (!res.success) {
      setError(res.message || "Lỗi đăng nhập!");
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-[#EFEBE6] overflow-hidden">
        {/* Header */}
        <div className="bg-[#3D2B1A] p-8 text-center text-[#FDFBF7]">
          <div className="w-16 h-16 bg-[#8D6E63] text-white text-2xl font-bold rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-md border-2 border-[#D7CCC8]">
            {settings.logoText || "H"}
          </div>
          <h1 className="text-2xl font-extrabold tracking-wide uppercase">{settings.brandName}</h1>
          <p className="text-sm text-[#D7CCC8] mt-1 font-medium">{settings.subTitle} — Đăng nhập Hệ thống</p>
        </div>

        {/* Body */}
        <div className="p-8">
          {error && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#5D4037] mb-1.5 uppercase tracking-wider">
                Địa chỉ Email của bạn
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(null); }}
                  placeholder="nhanvien@hanawellness.vn"
                  className="w-full pl-11 pr-4 py-3 bg-[#FAF8F5] border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#8D6E63] text-[#3D2B1A]"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#3D2B1A] hover:bg-[#2C1F13] text-[#FDFBF7] font-semibold rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-md cursor-pointer"
            >
              <span>Vào Hệ Thống PM Hub</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Login Accounts Demo */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <p className="text-xs font-medium text-[#8D6E63] mb-3 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5" />
              <span>Chọn nhanh tài khoản thử nghiệm:</span>
            </p>
            <div className="space-y-2">
              {userPermissions.slice(0, 4).map((user) => (
                <button
                  key={user.email}
                  onClick={() => handleQuickLogin(user.email)}
                  className="w-full text-left p-2.5 bg-[#FAF8F5] hover:bg-[#F5F0E6] border border-gray-200 rounded-lg text-xs flex items-center justify-between text-[#3D2B1A] transition cursor-pointer"
                >
                  <div className="truncate">
                    <span className="font-medium">{user.name || user.email}</span>
                    <span className="block text-[11px] text-gray-500 truncate">{user.email}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    user.role === "admin" ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"
                  }`}>
                    {user.role === "admin" ? "ADMIN" : "USER"}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#FAF8F5] p-4 text-center text-xs text-gray-500 border-t border-gray-100 flex items-center justify-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-[#8D6E63]" />
          <span>Hệ thống bảo mật xác thực Email Whitelist</span>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
